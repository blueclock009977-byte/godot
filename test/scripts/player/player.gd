extends CharacterBody2D

# 移動パラメータ
const SPEED = 300.0
const JUMP_VELOCITY = -500.0
const GRAVITY = 1200.0

# 攻撃パラメータ
const SWORD_DAMAGE = 10
var can_attack := true
var is_attacking := false
var facing_right := true

# ダッシュパラメータ
const DASH_SPEED = 600.0
const DASH_DURATION = 0.15
const DASH_COOLDOWN = 0.5
var can_dash := true
var is_dashing := false

# ローリングパラメータ
const ROLL_SPEED = 400.0
const ROLL_DURATION = 0.4
const ROLL_COOLDOWN = 0.8
var can_roll := true
var is_rolling := false

# 無敵状態
var is_invincible := false

# 弓攻撃パラメータ
const MAX_ARROWS = 5
const ARROW_RELOAD_TIME = 2.0
var current_arrows := MAX_ARROWS
@export var arrow_scene: PackedScene

@onready var sword_hitbox: Area2D = $SwordHitbox

func _physics_process(delta: float) -> void:
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
	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = JUMP_VELOCITY

	# 左右移動
	var direction := Input.get_axis("ui_left", "ui_right")
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
	if Input.is_action_just_pressed("attack_sword") and can_attack:
		_sword_attack()

	# 弓攻撃
	if Input.is_action_just_pressed("attack_bow") and current_arrows > 0:
		_bow_attack()

	# ダッシュ
	if Input.is_action_just_pressed("dash") and can_dash:
		_dash()

	# ローリング
	if Input.is_action_just_pressed("roll") and can_roll and is_on_floor():
		_roll()

	move_and_slide()

func _sword_attack() -> void:
	is_attacking = true
	can_attack = false

	# ヒットボックスの位置を向きに合わせる
	sword_hitbox.position.x = 40 if facing_right else -40
	sword_hitbox.get_node("CollisionShape2D").disabled = false

	# ヒット判定
	for body in sword_hitbox.get_overlapping_bodies():
		if body.has_method("take_damage"):
			body.take_damage(SWORD_DAMAGE)

	# 攻撃終了タイマー
	await get_tree().create_timer(0.3).timeout
	sword_hitbox.get_node("CollisionShape2D").disabled = true
	is_attacking = false

	await get_tree().create_timer(0.2).timeout
	can_attack = true

func _bow_attack() -> void:
	current_arrows -= 1

	var arrow = arrow_scene.instantiate()
	arrow.global_position = global_position
	arrow.direction = 1 if facing_right else -1
	if not facing_right:
		arrow.scale.x = -1
	get_parent().add_child(arrow)

	# 矢の回復
	await get_tree().create_timer(ARROW_RELOAD_TIME).timeout
	current_arrows = min(current_arrows + 1, MAX_ARROWS)

func _dash() -> void:
	is_dashing = true
	can_dash = false
	is_invincible = true

	var dash_direction = 1 if facing_right else -1
	velocity.x = DASH_SPEED * dash_direction
	velocity.y = 0

	await get_tree().create_timer(DASH_DURATION).timeout
	is_dashing = false
	is_invincible = false

	await get_tree().create_timer(DASH_COOLDOWN).timeout
	can_dash = true

func _roll() -> void:
	is_rolling = true
	can_roll = false
	is_invincible = true

	var roll_direction = 1 if facing_right else -1
	velocity.x = ROLL_SPEED * roll_direction

	await get_tree().create_timer(ROLL_DURATION).timeout
	is_rolling = false
	is_invincible = false

	await get_tree().create_timer(ROLL_COOLDOWN).timeout
	can_roll = true
