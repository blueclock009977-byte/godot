extends CharacterBody3D
class_name Player

## Paper FPS Player Controller
## 横向き = 被弾判定小、正面向き = 被弾判定大

# Movement
const SPEED := 5.0
const JUMP_VELOCITY := 4.5
const MOUSE_SENSITIVITY := 0.003

# Physics
var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

# Camera
@onready var camera: Camera3D = $Camera3D
@onready var weapon_holder: Node3D = $Camera3D/WeaponHolder

# Hitbox (changes based on facing direction relative to enemies)
@onready var hitbox_front: CollisionShape3D = $HitboxFront  # 大きい当たり判定
@onready var hitbox_side: CollisionShape3D = $HitboxSide    # 小さい当たり判定

# Stats
var hp: int = 100
var max_hp: int = 100

# Weapons
var current_weapon: Node3D = null
var weapons: Array[Node3D] = []
var current_weapon_index: int = 0

signal hp_changed(new_hp: int, max_hp: int)
signal player_died

func _ready() -> void:
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	_setup_weapons()

func _setup_weapons() -> void:
	# 武器はWeaponHolderの子として追加される
	for child in weapon_holder.get_children():
		if child.has_method("shoot"):
			weapons.append(child)
			child.visible = false
	
	if weapons.size() > 0:
		_equip_weapon(0)

func _equip_weapon(index: int) -> void:
	if index < 0 or index >= weapons.size():
		return
	
	if current_weapon:
		current_weapon.visible = false
	
	current_weapon_index = index
	current_weapon = weapons[index]
	current_weapon.visible = true

func _input(event: InputEvent) -> void:
	# Mouse look
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_y(-event.relative.x * MOUSE_SENSITIVITY)
		camera.rotate_x(-event.relative.y * MOUSE_SENSITIVITY)
		camera.rotation.x = clamp(camera.rotation.x, -PI/2, PI/2)
	
	# Escape to release mouse
	if event.is_action_pressed("ui_cancel"):
		if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
		else:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	
	# Weapon switching
	if event.is_action_pressed("weapon_1"):
		_equip_weapon(0)
	elif event.is_action_pressed("weapon_2"):
		_equip_weapon(1)
	elif event.is_action_pressed("weapon_3"):
		_equip_weapon(2)
	elif event.is_action_pressed("weapon_4"):
		_equip_weapon(3)

func _physics_process(delta: float) -> void:
	# Gravity
	if not is_on_floor():
		velocity.y -= gravity * delta
	
	# Jump
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY
	
	# Movement
	var input_dir: Vector2 = Input.get_vector("move_left", "move_right", "move_forward", "move_backward")
	var direction: Vector3 = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
	
	if direction:
		velocity.x = direction.x * SPEED
		velocity.z = direction.z * SPEED
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)
		velocity.z = move_toward(velocity.z, 0, SPEED)
	
	move_and_slide()
	
	# Shooting
	if Input.is_action_pressed("shoot") and current_weapon:
		current_weapon.shoot()
	
	# Reload
	if Input.is_action_just_pressed("reload") and current_weapon:
		current_weapon.reload()

## プレイヤーの向きに応じた当たり判定の幅を取得
## 正面向き = 幅広い、横向き = 薄い
func get_hitbox_width() -> float:
	# カメラの向きから当たり判定の幅を計算
	# 正面（Z軸方向）= 幅0.8、横（X軸方向）= 幅0.1
	var forward: Vector3 = -global_transform.basis.z
	# 横向き度合い（0 = 正面/背面、1 = 完全に横）
	var sideways: float = abs(forward.x)
	return lerp(0.8, 0.1, sideways)

## 敵からの角度に基づいてダメージ倍率を計算
## 横向きの本当のメリットは当たり判定が小さくなること
## ダメージ軽減は微小（0.8〜1.0）
func get_hitbox_scale_for_enemy(enemy_position: Vector3) -> float:
	var to_enemy: Vector3 = (enemy_position - global_position).normalized()
	var forward: Vector3 = -global_transform.basis.z.normalized()
	
	# 内積で角度を計算（1 = 正面、0 = 横向き、-1 = 背後）
	var dot: float = forward.dot(to_enemy)
	var angle: float = acos(clamp(dot, -1.0, 1.0))
	
	# 0度 = 1.0（最大）、90度 = 0.8（最小）
	# 横向きの真のメリットは物理的に当たり判定が薄いこと
	var scale: float = lerp(1.0, 0.8, abs(sin(angle)))
	return scale

func take_damage(amount: int, from_position: Vector3) -> void:
	# 敵の位置に基づいてダメージを軽減
	var scale: float = get_hitbox_scale_for_enemy(from_position)
	var actual_damage: int = int(amount * scale)
	
	hp = max(0, hp - actual_damage)
	hp_changed.emit(hp, max_hp)
	
	if hp <= 0:
		_die()

func _die() -> void:
	player_died.emit()
	# TODO: Death handling

func heal(amount: int) -> void:
	hp = min(max_hp, hp + amount)
	hp_changed.emit(hp, max_hp)
