## 戦闘システム共通定数
## battle.gd と online_battle.gd で共有
class_name BattleConstants

# ─── Core Constants ───
const CARD_UI_SCENE_PATH := "res://scenes/battle/card_ui.tscn"
const FIELD_SLOT_SCENE_PATH := "res://scenes/battle/field_slot.tscn"
const MAX_HP := 20
const MAX_MANA_CAP := 5
const DEFAULT_STARTING_HAND := 4
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
