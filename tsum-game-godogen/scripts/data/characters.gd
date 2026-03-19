extends Node
## res://scripts/data/characters.gd: Character database with 10 characters (2 per color)

# Skill types for active skills
enum SkillType {
	CENTER_CLEAR,       # 中央消去
	HORIZONTAL_CLEAR,   # 横ライン消去
	VERTICAL_CLEAR,     # 縦ライン消去
	RANDOM_CLEAR,       # ランダム消去
	COLOR_CONVERT,      # 色変換
	TIME_STOP,          # 時間停止
	BIG_EXPLOSION,      # 大爆発
	SCORE_BURST,        # スコアバースト
	INSTANT_FEVER,      # 即フィーバー
	CHAIN_EXTEND,       # チェーン距離拡張
}

# Leader skill types
enum LeaderType {
	SCORE_BOOST,        # スコア倍率UP
	TIME_EXTEND,        # 制限時間延長
	FEVER_BOOST,        # フィーバー効果UP
	COMBO_BOOST,        # コンボ持続延長
	GAUGE_BOOST,        # ゲージ蓄積加速
}

# Passive skill types
enum PassiveType {
	SCORE_UP,           # スコアUP (+15%)
	GAUGE_ACCEL,        # ゲージ加速 (+20%)
	FEVER_EXTEND,       # フィーバー延長 (+3秒)
	COMBO_BONUS,        # コンボボーナス (+5%追加)
	DROP_LUCK,          # ドロップ運 (特定色出現率UP)
}

# Character data: id, name, color (0-4), leader_type, leader_value,
#   active_skill_type, active_skill_power, skill_gauge_max,
#   passive_type, passive_value, description
var _characters: Array[Dictionary] = []

func _ready() -> void:
	_init_characters()

func _init_characters() -> void:
	_characters = [
		# Red characters (color 0)
		{
			"id": 0,
			"name": "Blaze",
			"color": 0,
			"leader_type": LeaderType.SCORE_BOOST,
			"leader_value": 0.2,
			"active_type": SkillType.CENTER_CLEAR,
			"active_power": 12,
			"gauge_max": 80.0,
			"passive_type": PassiveType.SCORE_UP,
			"passive_value": 0.15,
			"desc": "中央のツムをまとめて消去！スコアブーストのリーダー",
		},
		{
			"id": 1,
			"name": "Ember",
			"color": 0,
			"leader_type": LeaderType.FEVER_BOOST,
			"leader_value": 0.5,
			"active_type": SkillType.BIG_EXPLOSION,
			"active_power": 18,
			"gauge_max": 120.0,
			"passive_type": PassiveType.FEVER_EXTEND,
			"passive_value": 3.0,
			"desc": "大爆発でツムを一掃！フィーバー効果もUP",
		},
		# Blue characters (color 1)
		{
			"id": 2,
			"name": "Aqua",
			"color": 1,
			"leader_type": LeaderType.TIME_EXTEND,
			"leader_value": 5.0,
			"active_type": SkillType.TIME_STOP,
			"active_power": 3,
			"gauge_max": 100.0,
			"passive_type": PassiveType.GAUGE_ACCEL,
			"passive_value": 0.2,
			"desc": "時間を止めてゆっくりチェーン！時間延長リーダー",
		},
		{
			"id": 3,
			"name": "Wave",
			"color": 1,
			"leader_type": LeaderType.COMBO_BOOST,
			"leader_value": 1.0,
			"active_type": SkillType.HORIZONTAL_CLEAR,
			"active_power": 10,
			"gauge_max": 70.0,
			"passive_type": PassiveType.COMBO_BONUS,
			"passive_value": 0.05,
			"desc": "横ラインをスッキリ消去！コンボ持続延長リーダー",
		},
		# Green characters (color 2)
		{
			"id": 4,
			"name": "Leaf",
			"color": 2,
			"leader_type": LeaderType.GAUGE_BOOST,
			"leader_value": 0.3,
			"active_type": SkillType.COLOR_CONVERT,
			"active_power": 8,
			"gauge_max": 60.0,
			"passive_type": PassiveType.GAUGE_ACCEL,
			"passive_value": 0.2,
			"desc": "ツムの色を変換！ゲージ蓄積加速リーダー",
		},
		{
			"id": 5,
			"name": "Forest",
			"color": 2,
			"leader_type": LeaderType.SCORE_BOOST,
			"leader_value": 0.15,
			"active_type": SkillType.VERTICAL_CLEAR,
			"active_power": 10,
			"gauge_max": 75.0,
			"passive_type": PassiveType.SCORE_UP,
			"passive_value": 0.15,
			"desc": "縦ラインを一気に消去！スコアブーストリーダー",
		},
		# Yellow characters (color 3)
		{
			"id": 6,
			"name": "Spark",
			"color": 3,
			"leader_type": LeaderType.COMBO_BOOST,
			"leader_value": 0.5,
			"active_type": SkillType.SCORE_BURST,
			"active_power": 2000,
			"gauge_max": 90.0,
			"passive_type": PassiveType.COMBO_BONUS,
			"passive_value": 0.05,
			"desc": "即座にスコアを大量獲得！コンボ持続リーダー",
		},
		{
			"id": 7,
			"name": "Flash",
			"color": 3,
			"leader_type": LeaderType.FEVER_BOOST,
			"leader_value": 0.3,
			"active_type": SkillType.INSTANT_FEVER,
			"active_power": 1,
			"gauge_max": 100.0,
			"passive_type": PassiveType.FEVER_EXTEND,
			"passive_value": 3.0,
			"desc": "即フィーバー突入！フィーバー効果UPリーダー",
		},
		# Purple characters (color 4)
		{
			"id": 8,
			"name": "Shadow",
			"color": 4,
			"leader_type": LeaderType.SCORE_BOOST,
			"leader_value": 0.25,
			"active_type": SkillType.RANDOM_CLEAR,
			"active_power": 15,
			"gauge_max": 85.0,
			"passive_type": PassiveType.DROP_LUCK,
			"passive_value": 0.1,
			"desc": "ランダムにツムを消去！高スコアブーストリーダー",
		},
		{
			"id": 9,
			"name": "Mystic",
			"color": 4,
			"leader_type": LeaderType.TIME_EXTEND,
			"leader_value": 3.0,
			"active_type": SkillType.CHAIN_EXTEND,
			"active_power": 50,
			"gauge_max": 70.0,
			"passive_type": PassiveType.GAUGE_ACCEL,
			"passive_value": 0.2,
			"desc": "チェーン距離を拡張！時間延長リーダー",
		},
	]

func get_character(id: int) -> Dictionary:
	for c in _characters:
		if c["id"] == id:
			return c
	return {}

func get_all_characters() -> Array:
	return _characters.duplicate()

func get_characters_by_color(color: int) -> Array:
	var result: Array = []
	for c in _characters:
		if c["color"] == color:
			result.append(c)
	return result

func get_character_count() -> int:
	return _characters.size()
