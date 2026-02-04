extends Node2D

@onready var game_over_ui: CanvasLayer = $GameOver
@onready var hud: CanvasLayer = $HUD

func _ready() -> void:
	var player = $Player
	var boss = $Boss

	# グループに追加
	player.add_to_group("player")
	boss.add_to_group("boss")

	# シグナル接続
	player.player_died.connect(_on_player_died)
	boss.boss_died.connect(_on_boss_died)

func _on_player_died() -> void:
	game_over_ui.show_game_over()

func _on_boss_died() -> void:
	game_over_ui.show_victory()
