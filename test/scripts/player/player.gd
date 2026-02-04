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

@onready var sword_hitbox: Area2D = $SwordHitbox

func _physics_process(delta: float) -> void:
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
