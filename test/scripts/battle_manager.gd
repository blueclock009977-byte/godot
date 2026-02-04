extends Node2D

@onready var game_over_ui: CanvasLayer = $GameOver
@onready var hud: CanvasLayer = $HUD

func _ready() -> void:
	var player = $Player
	var boss = $Boss

	# グループに追加
	player.add_to_group("player")
	boss.add_to_group("boss")

	# StageManagerからステージデータを取得してボスに適用
	var stage_data = StageManager.get_current_stage_data()
	boss.max_hp = stage_data.boss_hp
	boss.contact_damage = stage_data.boss_damage
	boss.charge_speed = float(stage_data.boss_speed)
	boss.vulnerable_duration = stage_data.vulnerable_duration
	boss.double_jump_enabled = stage_data.double_jump_enabled
	# HPを再初期化（max_hp変更後に必要）
	boss.current_hp = boss.max_hp

	print("[BattleManager] Stage ", StageManager.current_stage, " - Boss HP:", boss.max_hp, " Damage:", boss.contact_damage, " Speed:", boss.charge_speed)

	# シグナル接続
	player.player_died.connect(_on_player_died)
	boss.boss_died.connect(_on_boss_died)

func _on_player_died() -> void:
	game_over_ui.show_game_over()

func _on_boss_died() -> void:
	# ステージ進行
	StageManager.advance_stage()

	# Stage 10クリア後（current_stageは11になっている）はエンディング表示
	if StageManager.current_stage > 10:
		game_over_ui.show_ending()
	else:
		# 次のステージへ（ステージ選択画面へ遷移）
		game_over_ui.show_victory()
