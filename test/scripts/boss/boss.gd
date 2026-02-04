extends CharacterBody2D

signal health_changed(current_hp, max_hp)
signal boss_died

const MAX_HP = 500
const GRAVITY = 800.0

var current_hp := MAX_HP
var player: Node2D = null

# 攻撃パターン
enum State { IDLE, ATTACK_CHARGE, ATTACK_JUMP, COOLDOWN }
var current_state := State.IDLE
var state_timer := 0.0

func _ready() -> void:
	current_hp = MAX_HP
	# プレイヤーを探す
	await get_tree().process_frame
	player = get_tree().get_first_node_in_group("player")

func _physics_process(delta: float) -> void:
	# 重力
	if not is_on_floor():
		velocity.y += GRAVITY * delta

	# 状態管理
	state_timer -= delta
	match current_state:
		State.IDLE:
			_state_idle()
		State.ATTACK_CHARGE:
			_state_attack_charge()
		State.ATTACK_JUMP:
			_state_attack_jump()
		State.COOLDOWN:
			_state_cooldown()

	move_and_slide()

func _state_idle() -> void:
	if state_timer <= 0:
		_choose_attack()

func _choose_attack() -> void:
	if player == null:
		return
	# ランダムに攻撃を選択
	var attack = randi() % 2
	match attack:
		0:
			_start_charge_attack()
		1:
			_start_jump_attack()

func _start_charge_attack() -> void:
	current_state = State.ATTACK_CHARGE
	state_timer = 0.5  # 予備動作
	# 予備動作のビジュアル
	$Sprite2D.modulate = Color.YELLOW

func _state_attack_charge() -> void:
	if state_timer <= 0:
		$Sprite2D.modulate = Color.WHITE
		# 突進
		var direction = sign(player.global_position.x - global_position.x)
		velocity.x = direction * 400
		current_state = State.COOLDOWN
		state_timer = 1.0

func _start_jump_attack() -> void:
	current_state = State.ATTACK_JUMP
	velocity.y = -600
	var direction = sign(player.global_position.x - global_position.x)
	velocity.x = direction * 200
	state_timer = 0.5
	$Sprite2D.modulate = Color.ORANGE

func _state_attack_jump() -> void:
	if is_on_floor() and state_timer <= 0:
		$Sprite2D.modulate = Color.WHITE
		current_state = State.COOLDOWN
		state_timer = 1.5
		velocity.x = 0

func _state_cooldown() -> void:
	velocity.x = move_toward(velocity.x, 0, 300 * get_physics_process_delta_time())
	if state_timer <= 0:
		current_state = State.IDLE
		state_timer = 1.0

func take_damage(amount: int) -> void:
	current_hp -= amount
	health_changed.emit(current_hp, MAX_HP)

	# ダメージフラッシュ
	$Sprite2D.modulate = Color.RED
	await get_tree().create_timer(0.1).timeout
	$Sprite2D.modulate = Color.WHITE

	if current_hp <= 0:
		_die()

func _die() -> void:
	boss_died.emit()
	queue_free()
