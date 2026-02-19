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

# ═══════════════════════════════════════════
# INPUT ALLOWED
# ═══════════════════════════════════════════
func _is_my_input_allowed() -> bool:
	return is_player_turn and not is_animating and not game_over

# ═══════════════════════════════════════════
# HAND/DICE PREVIEW
# ═══════════════════════════════════════════
func _update_hand_highlights() -> void:
	var in_main_phase := current_phase == Phase.MAIN1 or current_phase == Phase.MAIN2
	for card_ui in player_hand:
		if card_ui is CardUI:
			var can_summon: bool = in_main_phase and is_player_turn and not is_animating and _get_effective_summon_cost(card_ui) <= player_mana and BattleUtils.has_empty_slot(player_slots)
			card_ui.set_summonable(can_summon)
	# Field cards: glow if movable (in main phase, has mana, has empty slot)
	var can_move: bool = in_main_phase and is_player_turn and not is_animating and player_mana >= MOVE_COST and BattleUtils.has_empty_slot(player_slots)
	for slot in player_slots:
		if slot and not slot.is_empty():
			slot.card_ui.set_movable(can_move)

func _update_dice_preview() -> void:
	dice_preview_panel.visible = not game_over
	if game_over:
		return
	var results := []
	for dice_val in range(1, 7):
		results.append(BattleUtils.simulate_battle(dice_val, player_slots, opponent_slots, is_player_turn))
	dice_preview_label.text = BattleUtils.build_dice_preview_text(results)

func _get_effective_summon_cost(card_ui: CardUI) -> int:
	var context := _get_effect_context()
	return BattleUtils.get_effective_summon_cost(card_ui, context)

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
# CARD DRAW
# ═══════════════════════════════════════════
func _player_draw_card() -> void:
	if player_deck.is_empty():
		return
	var card_data: CardData = player_deck.pop_front()
	var card_ui := CARD_UI_SCENE.instantiate() as CardUI
	player_hand_container.add_child(card_ui)
	card_ui.setup(card_data, 120)
	card_ui.card_clicked.connect(_on_hand_card_clicked)
	card_ui.card_drag_ended.connect(_on_hand_card_drag_ended)
	card_ui.card_long_pressed.connect(_on_hand_card_long_pressed)
	player_hand.append(card_ui)
	_update_all_ui()

# ═══════════════════════════════════════════
# DICE & ATTACK HELPERS
# ═══════════════════════════════════════════
func _get_effective_attack_dice(card_ui: CardUI, is_player: bool) -> Array:
	var context := _get_effect_context()
	return BattleUtils.get_effective_attack_dice(card_ui, is_player, context)

func _is_dice_blocked(dice_value: int, is_player: bool) -> bool:
	var context := _get_effect_context()
	return BattleUtils.is_dice_blocked(dice_value, is_player, context)

# ═══════════════════════════════════════════
# DICE & BATTLE PHASE
# ═══════════════════════════════════════════
func _do_dice_and_battle(dice_val: int = -1) -> void:
	is_animating = true
	current_dice = await BattleUtils.animate_dice_roll(self, dice_label, dice_val)
	_log("[color=yellow]ダイス: %d[/color]" % current_dice)

	# ダイスブロック効果をチェック
	if _is_dice_blocked(current_dice, is_player_turn):
		_log("[color=purple]ダイス%dは相手の効果でブロックされた！[/color]" % current_dice)
	if _is_dice_blocked(current_dice, not is_player_turn):
		_log("[color=purple]相手のダイス%dは自分の効果でブロックされた！[/color]" % current_dice)
	_update_all_ui()

	# Turn player's cards attack first
	var turn_slots: Array
	var def_slots: Array
	if is_player_turn:
		turn_slots = player_slots
		def_slots = opponent_slots
	else:
		turn_slots = opponent_slots
		def_slots = player_slots

	await _resolve_attacks(turn_slots, def_slots, is_player_turn)
	if game_over:
		is_animating = false
		return
	await _resolve_attacks(def_slots, turn_slots, not is_player_turn)
	if game_over:
		is_animating = false
		return
	is_animating = false

# ═══════════════════════════════════════════
# ATTACK RESOLUTION
# ═══════════════════════════════════════════
func _resolve_attacks(attacker_slots: Array, defender_slots: Array, attacker_is_player: bool) -> void:
	for i in range(6):
		var slot: FieldSlot = attacker_slots[i]
		if not slot or slot.is_empty():
			continue
		var card_ui: CardUI = slot.card_ui
		var effective_dice := _get_effective_attack_dice(card_ui, attacker_is_player)
		if _is_dice_blocked(current_dice, attacker_is_player):
			continue
		if current_dice not in effective_dice:
			continue

		var lane: int = slot.lane
		var is_front: bool = slot.is_front_row

		# Find target
		var target_slot: FieldSlot = null
		var target_is_player_hp := false

		if is_front:
			var enemy_front: FieldSlot = defender_slots[lane]
			var enemy_back: FieldSlot = defender_slots[lane + 3]
			if enemy_front and not enemy_front.is_empty():
				target_slot = enemy_front
			elif enemy_back and not enemy_back.is_empty():
				target_slot = enemy_back
			else:
				target_is_player_hp = true
		else:
			var enemy_front: FieldSlot = defender_slots[lane]
			var enemy_back: FieldSlot = defender_slots[lane + 3]
			if enemy_front and not enemy_front.is_empty():
				target_slot = enemy_front
			elif enemy_back and not enemy_back.is_empty():
				target_slot = enemy_back
			else:
				target_is_player_hp = true

		var atk_name := card_ui.card_data.card_name
		var damage: int = card_ui.current_atk
		# 常時効果によるATK修正
		var atk_mod := EffectManager.get_constant_atk_modifier(card_ui, attacker_is_player, _get_effect_context())
		damage += atk_mod
		var defender_ui = target_slot.card_ui if target_slot else null
		var atk_effect := _process_attack_effect(card_ui, defender_ui, attacker_is_player)
		if atk_effect.has("atk_bonus"):
			damage += atk_effect["atk_bonus"]

		# Highlight attacker briefly
		card_ui.modulate = Color(1.5, 1.2, 0.5)
		await get_tree().create_timer(0.2).timeout

		if target_is_player_hp:
			if attacker_is_player:
				_log("[color=lime]%s → 相手HPに%dダメージ！[/color]" % [atk_name, damage])
				await BattleUtils.animate_attack(self, card_ui, opponent_hp_label)
				BattleUtils.spawn_damage_popup(self, opponent_hp_label.global_position + Vector2(50, 0), damage)
				BattleUtils.shake_node(self, opponent_hp_label)
				opponent_hp -= damage
				if opponent_hp <= 0:
					_game_end(true)
					return
			else:
				_log("[color=red]%s → 自分HPに%dダメージ！[/color]" % [atk_name, damage])
				await BattleUtils.animate_attack(self, card_ui, player_hp_label)
				BattleUtils.spawn_damage_popup(self, player_hp_label.global_position + Vector2(50, 0), damage)
				BattleUtils.shake_node(self, player_hp_label)
				player_hp -= damage
				if player_hp <= 0:
					_game_end(false)
					return
		elif target_slot:
			var def_card: CardUI = target_slot.card_ui
			_log("%s → %sに%dダメージ" % [atk_name, def_card.card_data.card_name, damage])
			await BattleUtils.animate_attack(self, card_ui, def_card)
			def_card.play_damage_flash()
			BattleUtils.spawn_damage_popup(self, def_card.global_position + Vector2(40, 0), damage)
			var final_damage := _process_defense_effect(def_card, damage, not attacker_is_player)
			var remaining := def_card.take_damage(final_damage)
			if remaining <= 0:
				_log("[color=gray]%s 破壊！[/color]" % def_card.card_data.card_name)
				await def_card.play_destroy_animation()
				_process_death_effect(def_card, not attacker_is_player)
				target_slot.remove_card()
				def_card.queue_free()

		card_ui.modulate = Color.WHITE
		_update_all_ui()
		await get_tree().create_timer(0.3).timeout

# ═══════════════════════════════════════════
# TURN END (shared)
# ═══════════════════════════════════════════
func _end_turn() -> void:
	current_phase = Phase.END
	_clear_selection()
	_update_all_ui()
	await _show_phase_banner("ターン終了", Color(0.6, 0.6, 0.6), 0.5)
	_process_turn_end_effects(is_player_turn)
	is_player_turn = not is_player_turn
	_start_turn()

# ═══════════════════════════════════════════
# CARD PREVIEW (shared)
# ═══════════════════════════════════════════
func _show_card_preview(card_ui: CardUI) -> void:
	BattleUtils.show_card_preview(card_preview_container, card_preview_overlay, CARD_UI_SCENE, card_ui)

func _hide_card_preview() -> void:
	BattleUtils.hide_card_preview(card_preview_container, card_preview_overlay)

func _on_preview_overlay_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		_hide_card_preview()
	if event is InputEventScreenTouch and event.pressed:
		_hide_card_preview()

func _on_hand_card_long_pressed(card_ui: CardUI) -> void:
	_show_card_preview(card_ui)

# ═══════════════════════════════════════════
# HAND CARD INTERACTIONS
# ═══════════════════════════════════════════
func _on_hand_card_clicked(card_ui: CardUI) -> void:
	if not _is_my_input_allowed():
		return
	if current_phase != Phase.MAIN1 and current_phase != Phase.MAIN2:
		return
	if select_mode == SelectMode.SUMMON_SELECT_SLOT and selected_hand_card == card_ui:
		_clear_selection()
		return
	if _get_effective_summon_cost(card_ui) > player_mana:
		_log("マナが足りない！")
		return
	if not BattleUtils.has_empty_slot(player_slots):
		_log("空きスロットがない！")
		return
	_clear_selection()
	selected_hand_card = card_ui
	card_ui.set_selected(true)
	select_mode = SelectMode.SUMMON_SELECT_SLOT
	for slot in player_slots:
		if slot and slot.is_empty():
			slot.set_highlighted(true)

func _on_hand_card_drag_ended(card_ui: CardUI, drop_pos: Vector2) -> void:
	if not _is_my_input_allowed():
		card_ui.reset_position()
		return
	if current_phase != Phase.MAIN1 and current_phase != Phase.MAIN2:
		card_ui.reset_position()
		return
	if _get_effective_summon_cost(card_ui) > player_mana:
		card_ui.reset_position()
		return
	for slot in player_slots:
		if slot and slot.is_empty():
			var slot_rect := Rect2(slot.global_position, slot.size)
			if slot_rect.has_point(drop_pos):
				_summon_card_to_slot(card_ui, slot)
				return
	card_ui.reset_position()

# ═══════════════════════════════════════════
# PLAYER SLOT INTERACTIONS
# ═══════════════════════════════════════════
func _on_player_slot_clicked(slot: FieldSlot) -> void:
	if not _is_my_input_allowed():
		return
	if current_phase != Phase.MAIN1 and current_phase != Phase.MAIN2:
		return

	if select_mode == SelectMode.SUMMON_SELECT_SLOT:
		if slot.is_empty() and selected_hand_card:
			_summon_card_to_slot(selected_hand_card, slot)
		return

	if select_mode == SelectMode.MOVE_SELECT_SLOT:
		if slot.is_empty() and selected_field_slot:
			_move_card_to_slot(selected_field_slot, slot)
		else:
			_clear_selection()
		return

	if not slot.is_empty():
		if player_mana >= MOVE_COST:
			_clear_selection()
			selected_field_card = slot.card_ui
			selected_field_slot = slot
			slot.card_ui.set_selected(true)
			slot.card_ui.set_movable(true)
			select_mode = SelectMode.MOVE_SELECT_SLOT
			for s in player_slots:
				if s and s.is_empty():
					s.set_highlighted(true)
		else:
			_clear_selection()

func _on_opponent_slot_clicked(_slot: FieldSlot) -> void:
	pass

# ═══════════════════════════════════════════
# STUBS (override in subclasses)
# ═══════════════════════════════════════════
func _start_turn() -> void:
	pass

func _opponent_draw_card() -> void:
	pass

func _game_end(_win: bool) -> void:
	pass

func _update_all_ui() -> void:
	pass

func _summon_card_to_slot(_card_ui: CardUI, _slot: FieldSlot) -> void:
	pass

func _move_card_to_slot(_from_slot: FieldSlot, _to_slot: FieldSlot) -> void:
	pass
