extends CharacterBody2D

signal health_changed(current_hp, max_hp)
signal player_died
signal arrow_changed(current_arrows, max_arrows)
signal sword_cooldown(time_left, total_time)
signal dash_cooldown(time_left, total_time)
signal roll_cooldown(time_left, total_time)

# HPパラメータ
const MAX_HP = 100
var current_hp := MAX_HP

# 移動パラメータ
const SPEED = 300.0
const JUMP_VELOCITY = -800.0
const GRAVITY = 1200.0

# 攻撃パラメータ
const SWORD_DAMAGE = 25
const SWORD_COOLDOWN = 0.4
var can_attack := true
var is_attacking := false
var facing_right := true
var sword_cooldown_timer := 0.0

# ダッシュパラメータ
const DASH_SPEED = 600.0
const DASH_DURATION = 0.15
const DASH_COOLDOWN = 0.5
var can_dash := true
var is_dashing := false
var dash_cooldown_timer := 0.0

# ローリングパラメータ
const ROLL_SPEED = 400.0
const ROLL_DURATION = 0.4
const ROLL_COOLDOWN = 0.8
var can_roll := true
var is_rolling := false
var roll_cooldown_timer := 0.0

# 無敵状態
var is_invincible := false

# 弓攻撃パラメータ
const MAX_ARROWS = 5
const ARROW_RELOAD_TIME = 2.5
var current_arrows := MAX_ARROWS
@export var arrow_scene: PackedScene

@onready var sword_hitbox: Area2D = $SwordHitbox

func _ready() -> void:
	add_to_group("player")
	current_hp = MAX_HP
	print("[Player] Ready - HP:", current_hp, " Arrows:", current_arrows)
	print("[Player] Added to 'player' group")
	print("[Player] SwordHitbox position:", sword_hitbox.position)
	print("[Player] Controls: WASD/Arrow=Move, W/Up/L=Jump, J=Sword, K=Bow, Shift=Dash, Space=Roll")

func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		print("[Input] Key pressed - keycode:", event.keycode, " physical:", event.physical_keycode)

func _physics_process(delta: float) -> void:
	# クールダウンタイマー更新
	if sword_cooldown_timer > 0:
		sword_cooldown_timer = max(0, sword_cooldown_timer - delta)
	if dash_cooldown_timer > 0:
		dash_cooldown_timer = max(0, dash_cooldown_timer - delta)
	if roll_cooldown_timer > 0:
		roll_cooldown_timer = max(0, roll_cooldown_timer - delta)

	# ダッシュ・ローリング中は通常移動をスキップ
	if is_dashing or is_rolling:
		if not is_on_floor():
			velocity.y += GRAVITY * delta
		move_and_slide()
		return

	# 重力
	if not is_on_floor():
		velocity.y += GRAVITY * delta

	# ジャンプ
	if Input.is_action_just_pressed("jump") and is_on_floor():
		velocity.y = JUMP_VELOCITY

	# 左右移動
	var direction := Input.get_axis("move_left", "move_right")
	if direction:
		velocity.x = direction * SPEED
	else:
		velocity.x = move_toward(velocity.x, 0, SPEED)

	# 向きの更新
	if direction > 0:
		facing_right = true
		$Sprite2D.flip_h = false
	elif direction < 0:
		facing_right = false
		$Sprite2D.flip_h = true

	# 剣攻撃
	if Input.is_action_just_pressed("attack_sword"):
		print("[Input] attack_sword pressed! can_attack:", can_attack)
		if can_attack:
			_sword_attack()

	# 弓攻撃
	if Input.is_action_just_pressed("attack_bow"):
		print("[Input] attack_bow pressed! arrows:", current_arrows)
		if current_arrows > 0:
			_bow_attack()

	# ダッシュ
	if Input.is_action_just_pressed("dash"):
		print("[Input] dash pressed! can_dash:", can_dash)
		if can_dash:
			_dash()

	# ローリング
	if Input.is_action_just_pressed("roll"):
		print("[Input] roll pressed! can_roll:", can_roll, " on_floor:", is_on_floor())
		if can_roll and is_on_floor():
			_roll()

	move_and_slide()

func _sword_attack() -> void:
	print("[Player] SWORD ATTACK! facing_right:", facing_right)
	is_attacking = true
	can_attack = false
	sword_cooldown_timer = SWORD_COOLDOWN

	# ヒットボックスの位置を向きに合わせる
	sword_hitbox.position.x = 40 if facing_right else -40
	var collision_shape = sword_hitbox.get_node("CollisionShape2D")
	var sword_visual = sword_hitbox.get_node("SwordVisual")
	collision_shape.disabled = false
	sword_visual.visible = true

	# 剣振りアニメーション（回転）
	var start_angle = -45.0 if facing_right else 45.0
	var end_angle = 45.0 if facing_right else -45.0
	sword_visual.rotation_degrees = start_angle

	var tween = create_tween()
	tween.tween_property(sword_visual, "rotation_degrees", end_angle, 0.15)

	print("[Player] Sword hitbox enabled at position:", sword_hitbox.global_position)

	# 物理フレームを待ってからヒット判定（Area2Dが重なりを検出するため）
	await get_tree().physics_frame
	await get_tree().physics_frame

	# ヒット判定
	var overlapping = sword_hitbox.get_overlapping_bodies()
	print("[Player] Sword overlapping bodies:", overlapping.size())
	for body in overlapping:
		print("[Player] Hit body:", body.name)
		if body.has_method("take_damage"):
			print("[Player] Dealing", SWORD_DAMAGE, "damage to", body.name)
			body.take_damage(SWORD_DAMAGE)

	# 攻撃終了タイマー
	await get_tree().create_timer(0.2).timeout
	collision_shape.disabled = true
	sword_visual.visible = false
	sword_visual.rotation_degrees = 0
	is_attacking = false
	print("[Player] Sword attack finished")

	await get_tree().create_timer(0.2).timeout
	can_attack = true

func _bow_attack() -> void:
	print("[Player] BOW ATTACK! Arrows:", current_arrows, "->", current_arrows - 1)
	current_arrows -= 1
	arrow_changed.emit(current_arrows, MAX_ARROWS)

	if arrow_scene == null:
		print("[Player] ERROR: arrow_scene is null!")
		return

	var arrow = arrow_scene.instantiate()
	arrow.global_position = global_position + Vector2(0, -32)  # 矢を少し上から発射
	arrow.direction = 1 if facing_right else -1
	if not facing_right:
		arrow.scale.x = -1
	get_parent().add_child(arrow)
	print("[Player] Arrow spawned at:", arrow.global_position)

	# 矢の回復
	await get_tree().create_timer(ARROW_RELOAD_TIME).timeout
	current_arrows = min(current_arrows + 1, MAX_ARROWS)
	arrow_changed.emit(current_arrows, MAX_ARROWS)
	print("[Player] Arrow reloaded. Arrows:", current_arrows)

func _dash() -> void:
	print("[Player] DASH! direction:", "right" if facing_right else "left")
	is_dashing = true
	can_dash = false
	is_invincible = true
	modulate.a = 0.5
	dash_cooldown_timer = DASH_DURATION + DASH_COOLDOWN

	var dash_direction = 1 if facing_right else -1
	velocity.x = DASH_SPEED * dash_direction
	velocity.y = 0

	await get_tree().create_timer(DASH_DURATION).timeout
	is_dashing = false
	is_invincible = false
	modulate.a = 1.0
	print("[Player] Dash ended")

	await get_tree().create_timer(DASH_COOLDOWN).timeout
	can_dash = true
	print("[Player] Dash ready")

func _roll() -> void:
	print("[Player] ROLL! direction:", "right" if facing_right else "left")
	is_rolling = true
	can_roll = false
	is_invincible = true
	modulate.a = 0.5
	roll_cooldown_timer = ROLL_DURATION + ROLL_COOLDOWN

	var roll_direction = 1 if facing_right else -1
	velocity.x = ROLL_SPEED * roll_direction

	await get_tree().create_timer(ROLL_DURATION).timeout
	is_rolling = false
	is_invincible = false
	modulate.a = 1.0
	print("[Player] Roll ended")

	await get_tree().create_timer(ROLL_COOLDOWN).timeout
	can_roll = true
	print("[Player] Roll ready")

func take_damage(amount: int) -> void:
	print("[Player] TAKE DAMAGE:", amount, " invincible:", is_invincible)
	if is_invincible:
		print("[Player] Damage blocked (invincible)")
		return

	# 最初に無敵フラグを立てる（再入防止）
	is_invincible = true

	current_hp -= amount
	print("[Player] HP:", current_hp, "/", MAX_HP)
	health_changed.emit(current_hp, MAX_HP)

	if current_hp <= 0:
		print("[Player] DIED!")
		_die()
		return

	# 無敵中は点滅
	_hit_flash()

func _hit_flash() -> void:
	for i in range(5):
		modulate.a = 0.3
		await get_tree().create_timer(0.1).timeout
		modulate.a = 1.0
		await get_tree().create_timer(0.1).timeout
	is_invincible = false
	print("[Player] Invincibility ended")

func _die() -> void:
	player_died.emit()
	# 入力を無効化
	set_physics_process(false)
