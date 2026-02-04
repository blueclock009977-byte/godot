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
	boss.charge_speed = float(stage_data.boss_speed) * stage_data.get("speed_multiplier", 1.0)
	boss.vulnerable_duration = stage_data.vulnerable_duration
	boss.double_jump_enabled = stage_data.double_jump_enabled
	boss.triple_jump_enabled = stage_data.get("triple_jump_enabled", false)
	boss.combo_attack_enabled = stage_data.get("continuous_attack", false)
	boss.rage_mode_enabled = stage_data.get("rage_mode_enabled", false)
	boss.wall_bounce_enabled = stage_data.get("charge_reflects", false)
	# HPを再初期化（max_hp変更後に必要）
	boss.current_hp = boss.max_hp

	print("[BattleManager] Stage ", StageManager.current_stage, " - Boss HP:", boss.max_hp, " Damage:", boss.contact_damage, " Speed:", boss.charge_speed)
	print("[BattleManager] Abilities: DoubleJump=", boss.double_jump_enabled, " TripleJump=", boss.triple_jump_enabled, " Combo=", boss.combo_attack_enabled, " Rage=", boss.rage_mode_enabled, " WallBounce=", boss.wall_bounce_enabled)

	# シグナル接続
	player.player_died.connect(_on_player_died)
	boss.boss_died.connect(_on_boss_died)

func _on_player_died() -> void:
	game_over_ui.show_game_over()

func _on_boss_died() -> void:
	# 報酬G獲得
	var stage_data = StageManager.get_current_stage_data()
	var reward = stage_data.get("reward_gold", 100)
	PlayerDataManager.add_gold(reward)

	StageManager.advance_stage()

	if StageManager.current_stage > 10:
		game_over_ui.show_ending(reward)
	else:
		game_over_ui.show_victory(reward)
