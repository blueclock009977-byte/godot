extends CharacterBody2D

signal health_changed(current_hp, max_hp)
signal boss_died

const GRAVITY = 800.0

@export var max_hp := 300
@export var contact_damage := 15
@export var charge_speed := 400.0
@export var vulnerable_duration := 0.8
@export var double_jump_enabled := false
@export var triple_jump_enabled := false
@export var combo_attack_enabled := false  # Stage 5+: 連続攻撃
@export var rage_mode_enabled := false     # Stage 6+: 怒りモード
@export var wall_bounce_enabled := false   # Stage 8+: 壁反射突進

var current_hp := 0
var jump_count := 0
var player: Node2D = null
var _shake_tween: Tween = null

# 怒りモード
var is_enraged := false
var rage_speed_multiplier := 1.5

# 連続攻撃
var combo_count := 0
var max_combo := 3

# 壁反射
var bounce_count := 0
var max_bounces := 2

# 攻撃パターン
enum State { IDLE, TELEGRAPH, ATTACK_CHARGE, ATTACK_JUMP, VULNERABLE, COOLDOWN }
var current_state := State.IDLE
var state_timer := 0.0
var pending_attack := State.IDLE  # TELEGRAPHから遷移する攻撃を保持

func _ready() -> void:
	add_to_group("boss")
	current_hp = max_hp
	print("[Boss] Ready - HP:", current_hp)
	# Hitboxのシグナル接続
	$Hitbox.body_entered.connect(_on_hitbox_body_entered)
	# プレイヤーを探す
	await get_tree().process_frame
	player = get_tree().get_first_node_in_group("player")
	if player:
		print("[Boss] Found player:", player.name)
	else:
		print("[Boss] WARNING: Player not found in 'player' group!")

func _physics_process(delta: float) -> void:
	# 重力
	if not is_on_floor():
		velocity.y += GRAVITY * delta

	# 状態管理
	state_timer -= delta
	match current_state:
		State.IDLE:
			_state_idle()
		State.TELEGRAPH:
			_state_telegraph()
		State.ATTACK_CHARGE:
			_state_attack_charge()
		State.ATTACK_JUMP:
			_state_attack_jump()
		State.VULNERABLE:
			_state_vulnerable()
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
	current_state = State.TELEGRAPH
	pending_attack = State.ATTACK_CHARGE
	var telegraph_time = 0.3 / (rage_speed_multiplier if is_enraged else 1.0)
	state_timer = telegraph_time  # 攻撃予告
	# 予備動作のビジュアル（震え）
	_shake(5.0 * (1.5 if is_enraged else 1.0), telegraph_time)

func _state_telegraph() -> void:
	if state_timer <= 0:
		current_state = pending_attack
		if pending_attack == State.ATTACK_CHARGE:
			state_timer = 0.5  # 突進の予備動作
		elif pending_attack == State.ATTACK_JUMP:
			# ジャンプ攻撃を実行
			velocity.y = -600
			var direction = sign(player.global_position.x - global_position.x)
			velocity.x = direction * 200
			state_timer = 0.5
			jump_count = 1

func _state_attack_charge() -> void:
	if state_timer <= 0:
		# 突進
		var direction = sign(player.global_position.x - global_position.x)
		var actual_speed = charge_speed * (rage_speed_multiplier if is_enraged else 1.0)
		velocity.x = direction * actual_speed
		bounce_count = 0  # 壁反射カウントをリセット
		current_state = State.VULNERABLE
		state_timer = vulnerable_duration  # 攻撃後の隙

func _start_jump_attack() -> void:
	current_state = State.TELEGRAPH
	pending_attack = State.ATTACK_JUMP
	var telegraph_time = 0.3 / (rage_speed_multiplier if is_enraged else 1.0)
	state_timer = telegraph_time  # 攻撃予告
	# 予備動作のビジュアル（震え）
	_shake(3.0 * (1.5 if is_enraged else 1.0), telegraph_time)

func _state_attack_jump() -> void:
	# 多段ジャンプ処理
	if not is_on_floor() and velocity.y > 0:
		var can_jump = false
		if double_jump_enabled and jump_count < 2:
			can_jump = true
		elif triple_jump_enabled and jump_count < 3:
			can_jump = true

		if can_jump:
			velocity.y = -500 + (jump_count * 50)  # 後のジャンプは少し弱く
			if player:
				var direction = sign(player.global_position.x - global_position.x)
				velocity.x = direction * 200
			jump_count += 1

	if is_on_floor():
		jump_count = 0
		if state_timer <= 0:
			current_state = State.COOLDOWN
			state_timer = 1.5
			velocity.x = 0

func _state_vulnerable() -> void:
	# 壁反射チェック
	if wall_bounce_enabled and is_on_wall() and bounce_count < max_bounces:
		velocity.x = -velocity.x  # 反転
		bounce_count += 1
		print("[Boss] Wall bounce! Count:", bounce_count)
		state_timer = vulnerable_duration  # タイマーリセット
		return

	velocity.x = move_toward(velocity.x, 0, 300 * get_physics_process_delta_time())
	if state_timer <= 0:
		# 連続攻撃チェック
		if combo_attack_enabled and combo_count < max_combo - 1:
			combo_count += 1
			print("[Boss] Combo attack! Count:", combo_count + 1)
			_choose_attack()  # 次の攻撃を即座に開始
		else:
			combo_count = 0
			current_state = State.COOLDOWN
			var cooldown_time = 1.0 / (rage_speed_multiplier if is_enraged else 1.0)
			state_timer = cooldown_time

func _state_cooldown() -> void:
	velocity.x = move_toward(velocity.x, 0, 300 * get_physics_process_delta_time())
	if state_timer <= 0:
		current_state = State.IDLE
		var idle_time = 1.0 / (rage_speed_multiplier if is_enraged else 1.0)
		state_timer = idle_time

func _shake(intensity: float, duration: float) -> void:
	if _shake_tween:
		_shake_tween.kill()
		$Sprite2D.position = Vector2.ZERO  # 前のTweenをキャンセルしたらリセット
	var sprite = $Sprite2D
	_shake_tween = create_tween()
	var shake_count = int(duration / 0.05)
	for _i in range(shake_count):
		_shake_tween.tween_property(sprite, "position", Vector2(randf_range(-intensity, intensity), 0), 0.025)
		_shake_tween.tween_property(sprite, "position", Vector2.ZERO, 0.025)
	# Tween完了時に確実にリセット
	_shake_tween.tween_callback(func(): sprite.position = Vector2.ZERO)

func take_damage(amount: int) -> void:
	var actual_damage = amount
	# VULNERABLE状態中は1.5倍ダメージ
	if current_state == State.VULNERABLE:
		actual_damage = int(amount * 1.5)
		print("[Boss] VULNERABLE! Damage x1.5:", actual_damage)
	print("[Boss] TAKE DAMAGE:", actual_damage)
	current_hp -= actual_damage
	print("[Boss] HP:", current_hp, "/", max_hp)
	health_changed.emit(current_hp, max_hp)

	# 怒りモードチェック（HP50%以下で発動）
	if rage_mode_enabled and not is_enraged and current_hp <= max_hp * 0.5:
		_activate_rage_mode()

	# ダメージフラッシュ
	$Sprite2D.color = Color.WHITE
	await get_tree().create_timer(0.1).timeout
	if is_enraged:
		$Sprite2D.color = Color(1.0, 0.3, 0.0, 1)  # 怒りモードはオレンジ
	else:
		$Sprite2D.color = Color(0.8, 0.2, 0.2, 1)

	if current_hp <= 0:
		print("[Boss] DIED!")
		_die()

func _activate_rage_mode() -> void:
	is_enraged = true
	print("[Boss] RAGE MODE ACTIVATED!")
	# 怒りモードの視覚エフェクト
	$Sprite2D.color = Color(1.0, 0.3, 0.0, 1)  # オレンジに変更
	_shake(8.0, 0.5)

func _die() -> void:
	if _shake_tween:
		_shake_tween.kill()
	boss_died.emit()
	queue_free()

func _on_hitbox_body_entered(body: Node2D) -> void:
	print("[Boss] Hitbox touched by:", body.name, " in_player_group:", body.is_in_group("player"))
	if body.is_in_group("player") and body.has_method("take_damage"):
		print("[Boss] Dealing", contact_damage, "contact damage to player")
		body.take_damage(contact_damage)
