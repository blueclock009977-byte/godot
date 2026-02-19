extends Control
class_name BattleBase
## Base class for battle controllers.
## Contains shared state, constants, and common functionality.
## Subclasses: battle.gd (local AI), online_battle.gd (multiplayer)

# ─── Constants (from BattleConstants) ───
const CARD_UI_SCENE := preload(BattleConstants.CARD_UI_SCENE_PATH)
const FIELD_SLOT_SCENE := preload(BattleConstants.FIELD_SLOT_SCENE_PATH)
const MAX_HP := BattleConstants.MAX_HP
const MAX_MANA_CAP := BattleConstants.MAX_MANA_CAP
const DEFAULT_STARTING_HAND := BattleConstants.DEFAULT_STARTING_HAND
const MOVE_COST := BattleConstants.MOVE_COST

# ─── Enums ───
enum Phase { MAIN1, DICE, DRAW, MAIN2, END }
enum SelectMode { NONE, SUMMON_SELECT_SLOT, MOVE_SELECT_SLOT }

# ─── Game State ───
var player_hp: int = MAX_HP
var opponent_hp: int = MAX_HP
var player_mana: int = 0
var player_max_mana: int = 0
var opponent_mana: int = 0
var opponent_max_mana: int = 0
var player_deck: Array[CardData] = []
var opponent_deck: Array[CardData] = []
var player_hand: Array = []  # Array of CardUI
var current_dice: int = 0
var turn_number: int = 0
var is_player_turn: bool = true
var is_player_first: bool = true
var current_phase: Phase = Phase.MAIN1
var select_mode: SelectMode = SelectMode.NONE
var selected_hand_card: CardUI = null
var selected_field_card: CardUI = null
var selected_field_slot: FieldSlot = null
var is_animating: bool = false
var game_over: bool = false

# ─── UI References ───
var player_slots: Array = []  # FieldSlot[6]: 0-2 front, 3-5 back
var opponent_slots: Array = []
var player_hand_container: HBoxContainer
var opponent_hand_container: HBoxContainer
var player_hp_label: Label
var opponent_hp_label: Label
var mana_label: Label
var phase_label: Label
var dice_label: Label
var end_turn_btn: Button
var next_phase_btn: Button
var surrender_btn: Button
var log_label: RichTextLabel
var phase_overlay: ColorRect
var phase_overlay_label: Label
var turn_indicator_label: Label
var dice_preview_panel: PanelContainer
var dice_preview_label: RichTextLabel
var center_info: HBoxContainer
var card_preview_overlay: ColorRect
var card_preview_container: CenterContainer

# ═══════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════
func _log(msg: String) -> void:
	if log_label:
		log_label.append_text(msg + "\n")
		# Scroll to bottom
		await get_tree().process_frame
		if log_label:
			log_label.scroll_to_line(log_label.get_line_count() - 1)

# ═══════════════════════════════════════════
# SELECTION CLEARING
# ═══════════════════════════════════════════
func _clear_selection() -> void:
	if selected_hand_card and is_instance_valid(selected_hand_card):
		selected_hand_card.set_selected(false)
	if selected_field_card and is_instance_valid(selected_field_card):
		selected_field_card.set_selected(false)
	if selected_field_slot and is_instance_valid(selected_field_slot):
		selected_field_slot.set_highlighted(false)
	selected_hand_card = null
	selected_field_card = null
	selected_field_slot = null
	select_mode = SelectMode.NONE
	for slot in player_slots:
		if is_instance_valid(slot):
			slot.set_highlighted(false)
