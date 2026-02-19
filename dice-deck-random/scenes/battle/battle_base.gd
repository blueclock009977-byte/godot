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
		selected_hand_card = null
	if selected_field_card and is_instance_valid(selected_field_card):
		selected_field_card.set_selected(false)
		selected_field_card.set_movable(false)
		selected_field_card = null
		selected_field_slot = null
	select_mode = SelectMode.NONE
	for slot in player_slots:
		if is_instance_valid(slot):
			slot.set_highlighted(false)
	_update_hand_highlights()

# Override in subclasses to update hand card highlights
func _update_hand_highlights() -> void:
	pass

# ═══════════════════════════════════════════
# PHASE BANNER
# ═══════════════════════════════════════════
func _show_phase_banner(text: String, banner_color: Color = Color(1, 1, 1), duration: float = 0.8) -> void:
	await BattleUtils.show_phase_banner(self, phase_overlay, phase_overlay_label, text, banner_color, duration)

# ═══════════════════════════════════════════
# EFFECT CONTEXT
# ═══════════════════════════════════════════
func _get_effect_context() -> Dictionary:
	return {
		"player_slots": player_slots,
		"opponent_slots": opponent_slots,
		"current_dice": current_dice
	}

# ═══════════════════════════════════════════
# EFFECT PROCESSING
# ═══════════════════════════════════════════
func _process_summon_effect(card_ui: CardUI, is_player: bool) -> void:
	if not card_ui.card_data.has_effect():
		return
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_summon_effect(card_ui, is_player, context)
	_apply_effect_result(result, is_player)

func _process_attack_effect(attacker_ui: CardUI, defender_ui, is_player: bool) -> Dictionary:
	if not attacker_ui.card_data.has_effect():
		return {}
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_attack_effect(attacker_ui, defender_ui, is_player, context)
	_apply_effect_result(result, is_player)
	return result

func _process_death_effect(card_ui: CardUI, is_player: bool) -> Dictionary:
	if not card_ui.card_data.has_effect():
		return {}
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_death_effect(card_ui, is_player, context)
	_apply_effect_result(result, is_player)
	return result

func _process_defense_effect(defender_ui: CardUI, damage: int, is_player: bool) -> int:
	if not defender_ui.card_data.has_effect():
		return damage
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_defense_effect(defender_ui, damage, is_player, context)
	_apply_effect_result(result, is_player)
	return result.get("final_damage", damage)

func _process_turn_start_effects(is_player: bool) -> void:
	var context := _get_effect_context()
	var results: Array = EffectManager.process_turn_start_effects(is_player, context)
	for result in results:
		_apply_effect_result(result, is_player)

func _process_turn_end_effects(is_player: bool) -> void:
	var context := _get_effect_context()
	var results: Array = EffectManager.process_turn_end_effects(is_player, context)
	for result in results:
		_apply_effect_result(result, is_player)

func _apply_effect_result(result: Dictionary, is_player: bool) -> void:
	if result.is_empty():
		return

	if result.has("log"):
		_log(result["log"])

	if result.has("mana"):
		if is_player:
			player_mana = mini(player_mana + result["mana"], player_max_mana)
		else:
			opponent_mana = mini(opponent_mana + result["mana"], opponent_max_mana)

	if result.has("mana_full"):
		if is_player:
			player_mana = player_max_mana
		else:
			opponent_mana = opponent_max_mana

	if result.has("self_damage"):
		if is_player:
			player_hp -= result["self_damage"]
			if player_hp <= 0:
				_game_end(false)
		else:
			opponent_hp -= result["self_damage"]
			if opponent_hp <= 0:
				_game_end(true)

	if result.has("direct_damage"):
		if is_player:
			opponent_hp -= result["direct_damage"]
			if opponent_hp <= 0:
				_game_end(true)
		else:
			player_hp -= result["direct_damage"]
			if player_hp <= 0:
				_game_end(false)

	if result.has("draw"):
		for i in range(result["draw"]):
			if is_player:
				_player_draw_card()
			else:
				_opponent_draw_card()

	_update_all_ui()

# ═══════════════════════════════════════════
# STUBS (override in subclasses)
# ═══════════════════════════════════════════
func _player_draw_card() -> void:
	pass

func _opponent_draw_card() -> void:
	pass

func _game_end(_win: bool) -> void:
	pass

func _update_all_ui() -> void:
	pass
