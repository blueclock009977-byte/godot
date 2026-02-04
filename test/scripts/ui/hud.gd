extends CanvasLayer

@onready var player_hp_bar: ProgressBar = $PlayerHP
@onready var boss_hp_bar: ProgressBar = $BossHP
@onready var arrow_count: Label = $ArrowCount

func _ready() -> void:
	# プレイヤーとボスのシグナルに接続
	await get_tree().process_frame

	var player = get_tree().get_first_node_in_group("player")
	if player:
		player.health_changed.connect(_on_player_health_changed)

	var boss = get_tree().get_first_node_in_group("boss")
	if boss:
		boss.health_changed.connect(_on_boss_health_changed)

func _on_player_health_changed(current: int, max_hp: int) -> void:
	player_hp_bar.value = (float(current) / max_hp) * 100

func _on_boss_health_changed(current: int, max_hp: int) -> void:
	boss_hp_bar.value = (float(current) / max_hp) * 100

func update_arrow_count(current: int, max_arrows: int) -> void:
	arrow_count.text = "Arrows: %d/%d" % [current, max_arrows]
