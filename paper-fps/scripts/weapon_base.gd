extends Node3D
class_name WeaponBase

## 武器の基本クラス

@export var weapon_name: String = "Weapon"
@export var damage: int = 10
@export var fire_rate: float = 0.5  # 発射間隔（秒）
@export var magazine_size: int = 30
@export var reload_time: float = 2.0
@export var spread: float = 0.0  # 弾のばらつき（度）
@export var range_distance: float = 100.0
@export var bullets_per_shot: int = 1  # ショットガン用

var current_ammo: int = 0
var is_reloading: bool = false
var can_shoot: bool = true

signal ammo_changed(current: int, max_ammo: int)
signal reloading_started
signal reloading_finished

@onready var raycast: RayCast3D = $RayCast3D if has_node("RayCast3D") else null
@onready var muzzle: Node3D = $Muzzle if has_node("Muzzle") else null

func _ready() -> void:
	current_ammo = magazine_size
	if raycast:
		raycast.target_position = Vector3(0, 0, -range_distance)

func shoot() -> void:
	if not can_shoot or is_reloading or current_ammo <= 0:
		return
	
	can_shoot = false
	current_ammo -= 1
	ammo_changed.emit(current_ammo, magazine_size)
	
	# 複数弾発射（ショットガン用）
	for i in range(bullets_per_shot):
		_fire_bullet()
	
	# 発射レート制限
	await get_tree().create_timer(fire_rate).timeout
	can_shoot = true
	
	# 自動リロード
	if current_ammo <= 0:
		reload()

func _fire_bullet() -> void:
	if not raycast:
		return
	
	# スプレッド（ばらつき）を適用
	var spread_rad := deg_to_rad(spread)
	var random_spread := Vector3(
		randf_range(-spread_rad, spread_rad),
		randf_range(-spread_rad, spread_rad),
		0
	)
	raycast.rotation = random_spread
	raycast.force_raycast_update()
	
	if raycast.is_colliding():
		var collider := raycast.get_collider()
		var hit_point := raycast.get_collision_point()
		
		if collider.has_method("take_damage"):
			var shooter_pos := global_position
			collider.take_damage(damage, shooter_pos)
		
		# ヒットエフェクト（TODO）
		_spawn_hit_effect(hit_point)
	
	# マズルフラッシュ（TODO）
	_play_muzzle_flash()

func reload() -> void:
	if is_reloading or current_ammo == magazine_size:
		return
	
	is_reloading = true
	reloading_started.emit()
	
	await get_tree().create_timer(reload_time).timeout
	
	current_ammo = magazine_size
	is_reloading = false
	reloading_finished.emit()
	ammo_changed.emit(current_ammo, magazine_size)

func _spawn_hit_effect(_position: Vector3) -> void:
	# オーバーライドしてエフェクトを追加
	pass

func _play_muzzle_flash() -> void:
	# オーバーライドしてマズルフラッシュを追加
	pass
