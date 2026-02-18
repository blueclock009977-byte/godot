extends Node

## 効果管理システム
## 効果の定義と処理を一元管理

# 効果タイミング
enum Timing { ON_SUMMON, ON_ATTACK, ON_DEATH, ON_DEFENSE, CONSTANT, TURN_START, TURN_END }

# 効果定義データ
# effect_id -> {timing, description, process_func}
var effect_definitions: Dictionary = {}

func _ready() -> void:
	_register_all_effects()

func _register_all_effects() -> void:
	# ═══════════════════════════════════════════
	# 青カード効果
	# ═══════════════════════════════════════════

	# 登場時:敵1体ATK-1
	_register("blue_001", Timing.ON_SUMMON, "登場時:敵1体ATK-1")
	# 常時:ダイス追加
	_register("blue_002", Timing.CONSTANT, "ダイス3,4でも攻撃可")
	# 攻撃時:凍結
	_register("blue_003", Timing.ON_ATTACK, "攻撃時:対象を凍結(次ターン攻撃不可)")
	# 登場時:敵全体ATK-1
	_register("blue_004", Timing.ON_SUMMON, "登場時:敵全体ATK-1")
	# 常時:特定ダイスでATK+2
	_register("blue_005", Timing.CONSTANT, "ダイス5,6の時ATK+2")
	# 防御時:ダメージ半減
	_register("blue_006", Timing.ON_DEFENSE, "防御時:被ダメージ半減")
	# 登場時:敵全体ATK-2
	_register("blue_007", Timing.ON_SUMMON, "登場時:敵全体ATK-2")
	# 攻撃時:2ターン凍結
	_register("blue_008", Timing.ON_ATTACK, "攻撃時:対象を2ターン凍結")
	# 死亡時:敵1体ATK-1
	_register("blue_009", Timing.ON_DEATH, "死亡時:敵1体ATK-1")
	# 常時:毎ターンHP+1
	_register("blue_010", Timing.TURN_START, "ターン開始時:自身HP+1")
	# 登場時:ダイス+1
	_register("blue_011", Timing.ON_SUMMON, "登場時:次ダイス+1")
	# 攻撃時:相手HP-1追加
	_register("blue_012", Timing.ON_ATTACK, "攻撃時:追加で相手HP-1")
	# 常時:同列味方被ダメ-1
	_register("blue_013", Timing.CONSTANT, "同列の味方への被ダメ-1")
	# 登場時:手札+1
	_register("blue_014", Timing.ON_SUMMON, "登場時:カード1枚ドロー")
	# 常時:敵前列ATK-1
	_register("blue_015", Timing.CONSTANT, "敵前列のATK-1")
	# 常時:敵全体ATK-1
	_register("blue_016", Timing.CONSTANT, "敵全体のATK-1")
	# 攻撃時:HP5以下破壊
	_register("blue_017", Timing.ON_ATTACK, "攻撃時:HP5以下の対象を即破壊")
	# 登場時:敵全体1ターン凍結
	_register("blue_018", Timing.ON_SUMMON, "登場時:敵全体を1ターン凍結")

	# ═══════════════════════════════════════════
	# 緑カード効果
	# ═══════════════════════════════════════════

	# 登場時:マナ+1
	_register("green_001", Timing.ON_SUMMON, "登場時:マナ+1")
	# 死亡時:マナ+1
	_register("green_002", Timing.ON_DEATH, "死亡時:マナ+1")
	# 常時:ターン開始時HP+1
	_register("green_003", Timing.TURN_START, "ターン開始時:自身HP+1")
	# 登場時:マナ+2
	_register("green_004", Timing.ON_SUMMON, "登場時:マナ+2")
	# 死亡時:マナ+2
	_register("green_005", Timing.ON_DEATH, "死亡時:マナ+2")
	# 常時:召喚コスト-1
	_register("green_006", Timing.CONSTANT, "味方召喚コスト-1(最低1)")
	# 常時:味方全体HP+1
	_register("green_007", Timing.CONSTANT, "味方全体のHP+1")
	# 登場時:マナ+3
	_register("green_008", Timing.ON_SUMMON, "登場時:マナ+3")
	# 常時:ターン開始時マナ+1
	_register("green_009", Timing.TURN_START, "ターン開始時:マナ+1")
	# 常時:攻撃時マナ+1
	_register("green_010", Timing.ON_ATTACK, "攻撃時:マナ+1")
	# 登場時:味方1体HP+2
	_register("green_011", Timing.ON_SUMMON, "登場時:味方1体HP+2")
	# 常時:被ダメ時マナ+1
	_register("green_012", Timing.ON_DEFENSE, "被ダメージ時:マナ+1")
	# 登場時:マナ全回復
	_register("green_013", Timing.ON_SUMMON, "登場時:マナ全回復")
	# 常時:味方死亡時HP+2
	_register("green_014", Timing.ON_DEATH, "味方死亡時:自身HP+2")
	# 登場時:マナ+2,HP+2
	_register("green_015", Timing.ON_SUMMON, "登場時:マナ+2,自身HP+2")
	# 常時:ターン終了時味方全体HP+1
	_register("green_016", Timing.TURN_END, "ターン終了時:味方全体HP+1")
	# 登場時:味方全体HP+2
	_register("green_017", Timing.ON_SUMMON, "登場時:味方全体HP+2")

	# ═══════════════════════════════════════════
	# 黒カード効果
	# ═══════════════════════════════════════════

	# 登場時:自分HP-1(デメリット)
	_register("black_001", Timing.ON_SUMMON, "登場時:自分HP-1")
	# 死亡時:敵1体HP-2
	_register("black_002", Timing.ON_DEATH, "死亡時:敵1体HP-2")
	# 登場時:自分HP-2
	_register("black_003", Timing.ON_SUMMON, "登場時:自分HP-2")
	# 攻撃時:毒付与
	_register("black_004", Timing.ON_ATTACK, "攻撃時:対象に毒(毎ターンHP-1)")
	# 登場時:自分HP-3
	_register("black_005", Timing.ON_SUMMON, "登場時:自分HP-3")
	# 死亡時:トークン召喚
	_register("black_006", Timing.ON_DEATH, "死亡時:ATK2/HP2のトークン召喚")
	# 攻撃時:吸血
	_register("black_007", Timing.ON_ATTACK, "攻撃時:与ダメ分自身HP回復")
	# 登場時:自分HP-5
	_register("black_008", Timing.ON_SUMMON, "登場時:自分HP-5")
	# 常時:相手ダイス6無効
	_register("black_009", Timing.CONSTANT, "相手のダイス6を無効化")
	# 死亡時:敵全体HP-1
	_register("black_010", Timing.ON_DEATH, "死亡時:敵全体HP-1")
	# 死亡時:HP1で復活
	_register("black_011", Timing.ON_DEATH, "死亡時:HP1で1度だけ復活")
	# 常時:相手ダイス1無効
	_register("black_012", Timing.CONSTANT, "相手のダイス1を無効化")
	# 死亡時:敵1体ATK-2
	_register("black_013", Timing.ON_DEATH, "死亡時:敵1体ATK-2")
	# 登場時:自分HP-2,手札+1
	_register("black_014", Timing.ON_SUMMON, "登場時:自分HP-2,カード1枚ドロー")
	# 攻撃時:自分HP-1,ATK+2
	_register("black_015", Timing.ON_ATTACK, "攻撃時:自身HP-1,ATK+2")
	# 攻撃時:対象HP半減
	_register("black_016", Timing.ON_ATTACK, "攻撃時:対象の現HP半減")
	# 登場時:自分HP-4
	_register("black_017", Timing.ON_SUMMON, "登場時:自分HP-4")
	# 死亡時:敵全体HP-3
	_register("black_018", Timing.ON_DEATH, "死亡時:敵全体HP-3")
	# 常時:相手ダイス1,6無効
	_register("black_019", Timing.CONSTANT, "相手のダイス1,6を無効化")

func _register(effect_id: String, timing: Timing, description: String) -> void:
	effect_definitions[effect_id] = {
		"timing": timing,
		"description": description
	}

func get_effect_description(effect_id: String) -> String:
	if effect_definitions.has(effect_id):
		return effect_definitions[effect_id]["description"]
	return ""

func get_effect_timing(effect_id: String) -> Timing:
	if effect_definitions.has(effect_id):
		return effect_definitions[effect_id]["timing"]
	return Timing.ON_SUMMON

func has_timing(effect_id: String, timing: Timing) -> bool:
	return get_effect_timing(effect_id) == timing
