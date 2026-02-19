## 戦闘システム共通定数
## battle.gd と online_battle.gd で共有
class_name BattleConstants

# ─── Core Constants ───
const CARD_UI_SCENE_PATH := "res://scenes/battle/card_ui.tscn"
const FIELD_SLOT_SCENE_PATH := "res://scenes/battle/field_slot.tscn"
const MAX_HP := 20
const MAX_MANA_CAP := 5
const DEFAULT_STARTING_HAND := 4  # 0〜1色デッキ用
const MOVE_COST := 1

# ─── Card Sizes ───
const CARD_SIZE_HAND := 120
const CARD_SIZE_FIELD := 175
const CARD_SIZE_PREVIEW := 300

# ─── Enums ───
enum Phase { MAIN1, DICE, DRAW, MAIN2, END }
enum SelectMode { NONE, SUMMON_SELECT_SLOT, MOVE_SELECT_SLOT }

# ─── Phase Names ───
static func get_phase_name(phase: Phase) -> String:
	match phase:
		Phase.MAIN1: return "メイン1"
		Phase.DICE: return "ダイス"
		Phase.DRAW: return "ドロー&1マナ回復"
		Phase.MAIN2: return "メイン2"
		Phase.END: return "終了"
		_: return "?"

## 配列をArray[CardData]型に変換（battle/online_battle共通）
static func to_card_data_array(arr: Array) -> Array[CardData]:
	var result: Array[CardData] = []
	for item in arr:
		result.append(item)
	return result

## バトルシミュレーション用：攻撃対象を検索（battle/online_battle共通）
## attacker: {"lane": int, ...}, defenders: [{"hp": int, "lane": int, "is_front": bool, ...}, ...]
static func sim_find_target(attacker: Dictionary, defenders: Array):
	var lane: int = attacker["lane"]
	# 同レーン前列を優先
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and d["is_front"]:
			return d
	# 同レーン後列
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and not d["is_front"]:
			return d
	return null

## 相手手札表示用のカードバックを作成（battle/online_battle共通）
static func create_card_back() -> Panel:
	var card_back := Panel.new()
	card_back.custom_minimum_size = Vector2(40, 55)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.3, 0.3, 0.4)
	style.corner_radius_top_left = 4
	style.corner_radius_top_right = 4
	style.corner_radius_bottom_left = 4
	style.corner_radius_bottom_right = 4
	card_back.add_theme_stylebox_override("panel", style)
	return card_back
