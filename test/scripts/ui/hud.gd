extends CanvasLayer

@onready var player_hp_bar: ProgressBar = $PlayerHP
@onready var boss_hp_bar: ProgressBar = $BossHP
@onready var arrow_count: Label = $ArrowCount
@onready var sword_cooldown: ProgressBar = $ActionBar/SwordAction/Cooldown
@onready var bow_cooldown: ProgressBar = $ActionBar/BowAction/Cooldown
@onready var dash_cooldown: ProgressBar = $ActionBar/DashAction/Cooldown
@onready var roll_cooldown: ProgressBar = $ActionBar/RollAction/Cooldown
@onready var stage_label: Label = $StageLabel
@onready var boss_hp_label: Label = $BossHPLabel

var player: Node = null

func _ready() -> void:
	# ステージ番号を更新
	stage_label.text = "STAGE " + str(StageManager.current_stage)

	# ボス名を更新（ステージに応じた名前）
	boss_hp_label.text = "BOSS - Stage " + str(StageManager.current_stage)

	# プレイヤーとボスのシグナルに接続
	await get_tree().process_frame

	player = get_tree().get_first_node_in_group("player")
	if player:
		player.health_changed.connect(_on_player_health_changed)
		player.arrow_changed.connect(_on_arrow_changed)

	var boss = get_tree().get_first_node_in_group("boss")
	if boss:
		boss.health_changed.connect(_on_boss_health_changed)

func _process(_delta: float) -> void:
	if player == null:
		return

	# 剣クールダウン (0 = 使用可能, SWORD_COOLDOWN = クールダウン中)
	var sword_ratio = 1.0 - (player.sword_cooldown_timer / player.SWORD_COOLDOWN) if player.SWORD_COOLDOWN > 0 else 1.0
	sword_cooldown.value = clamp(sword_ratio, 0.0, 1.0)

	# 弓 (矢の数を表示)
	bow_cooldown.value = player.current_arrows

	# ダッシュクールダウン
	var dash_total = player.DASH_DURATION + player.DASH_COOLDOWN
	var dash_ratio = 1.0 - (player.dash_cooldown_timer / dash_total) if dash_total > 0 else 1.0
	dash_cooldown.value = clamp(dash_ratio, 0.0, 1.0)

	# ローリングクールダウン
	var roll_total = player.ROLL_DURATION + player.ROLL_COOLDOWN
	var roll_ratio = 1.0 - (player.roll_cooldown_timer / roll_total) if roll_total > 0 else 1.0
	roll_cooldown.value = clamp(roll_ratio, 0.0, 1.0)

func _on_player_health_changed(current: int, max_hp: int) -> void:
	player_hp_bar.value = (float(current) / max_hp) * 100

func _on_boss_health_changed(current: int, max_hp: int) -> void:
	boss_hp_bar.value = (float(current) / max_hp) * 100

func update_arrow_count(current: int, max_arrows: int) -> void:
	arrow_count.text = "Arrows: %d/%d" % [current, max_arrows]

func _on_arrow_changed(current: int, max_arrows: int) -> void:
	update_arrow_count(current, max_arrows)
