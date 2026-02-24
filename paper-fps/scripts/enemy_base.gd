extends CharacterBody3D
class_name EnemyBase

## 敵の基本クラス

@export var enemy_name: String = "Enemy"
@export var max_hp: int = 50
@export var damage: int = 10
@export var move_speed: float = 3.0
@export var attack_range: float = 15.0
@export var attack_rate: float = 1.0
@export var detection_range: float = 30.0

var hp: int = 0
var target: Node3D = null
var can_attack: bool = true
var is_dead: bool = false

var gravity: float = ProjectSettings.get_setting("physics/3d/default_gravity")

signal enemy_died(enemy: EnemyBase)
signal enemy_damaged(enemy: EnemyBase, damage: int)

func _ready() -> void:
	hp = max_hp
	add_to_group("enemies")
	_find_player()

func _find_player() -> void:
	# プレイヤーを探す
	var players := get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		target = players[0]

func _physics_process(delta: float) -> void:
	if is_dead:
		return
	
	# 重力
	if not is_on_floor():
		velocity.y -= gravity * delta
	
	if target and is_instance_valid(target):
		_update_ai(delta)
	
	move_and_slide()

func _update_ai(_delta: float) -> void:
	var distance := global_position.distance_to(target.global_position)
	
	# プレイヤーの方を向く
	var look_target := target.global_position
	look_target.y = global_position.y
	look_at(look_target)
	
	if distance <= attack_range:
		# 攻撃範囲内
		_try_attack()
	elif distance <= detection_range:
		# 追跡
		_move_toward_target()

func _move_toward_target() -> void:
	var direction := (target.global_position - global_position).normalized()
	direction.y = 0
	velocity.x = direction.x * move_speed
	velocity.z = direction.z * move_speed

func _try_attack() -> void:
	if not can_attack:
		return
	
	can_attack = false
	_perform_attack()
	
	await get_tree().create_timer(attack_rate).timeout
	can_attack = true

func _perform_attack() -> void:
	# オーバーライドして攻撃処理を実装
	if target and target.has_method("take_damage"):
		target.take_damage(damage, global_position)

func take_damage(amount: int, _from_position: Vector3) -> void:
	if is_dead:
		return
	
	hp = maxi(0, hp - amount)
	enemy_damaged.emit(self, amount)
	
	# ダメージエフェクト
	_on_damaged()
	
	if hp <= 0:
		_die()

func _on_damaged() -> void:
	# ダメージリアクション（オーバーライド可能）
	# 3Dではmodulateが使えないので、メッシュを探してマテリアルを変更
	var mesh := _find_mesh_instance()
	if mesh:
		var original_material: Material = mesh.get_surface_override_material(0)
		if original_material == null:
			original_material = mesh.mesh.surface_get_material(0) if mesh.mesh else null
		
		# フラッシュエフェクト（スケールで代用）
		var tween := create_tween()
		tween.tween_property(self, "scale", Vector3(1.1, 1.1, 1.1), 0.05)
		tween.tween_property(self, "scale", Vector3.ONE, 0.1)

func _find_mesh_instance() -> MeshInstance3D:
	for child in get_children():
		if child is MeshInstance3D:
			return child
	return null

func _die() -> void:
	is_dead = true
	enemy_died.emit(self)
	
	# 死亡アニメーション
	var tween := create_tween()
	tween.tween_property(self, "scale", Vector3(1, 0.1, 1), 0.3)
	tween.tween_callback(queue_free)
