extends CharacterBody2D

# 移動パラメータ
const SPEED = 300.0
const JUMP_VELOCITY = -500.0
const GRAVITY = 1200.0

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

	move_and_slide()
