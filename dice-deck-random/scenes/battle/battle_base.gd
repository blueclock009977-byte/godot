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
func _run_timing_event_with_context(timing: int, payload: Dictionary):
	var event_payload := payload.duplicate(true)
	event_payload["context"] = _get_effect_context()
	return EffectManager.process_timing_event(timing, event_payload)

func _process_single_card_timing_effect(timing: int, card_ui: CardUI, is_player: bool, payload: Dictionary, default_result: Dictionary = {}) -> Dictionary:
	if not card_ui or not card_ui.card_data or not card_ui.card_data.has_effect():
		return default_result.duplicate(true)
	var event_payload := payload.duplicate(true)
	event_payload["is_player"] = is_player
	var result: Dictionary = _run_timing_event_with_context(timing, event_payload)
	_apply_effect_result(result, is_player)
	return result

func _process_turn_timing_effects(timing: int, is_player: bool) -> void:
	var results: Array = _run_timing_event_with_context(timing, {
		"is_player": is_player
	})
	for result in results:
		_apply_effect_result(result, is_player)

func _process_summon_effect(card_ui: CardUI, is_player: bool) -> void:
	_process_single_card_timing_effect(EffectManager.Timing.ON_SUMMON, card_ui, is_player, {
		"card_ui": card_ui
	})

func _process_attack_effect(attacker_ui: CardUI, defender_ui, is_player: bool) -> Dictionary:
	return _process_single_card_timing_effect(EffectManager.Timing.ON_ATTACK, attacker_ui, is_player, {
		"attacker_ui": attacker_ui,
		"defender_ui": defender_ui
	})

func _process_death_effect(card_ui: CardUI, is_player: bool) -> Dictionary:
	return _process_single_card_timing_effect(EffectManager.Timing.ON_DEATH, card_ui, is_player, {
		"card_ui": card_ui
	})

func _process_defense_effect(defender_ui: CardUI, damage: int, is_player: bool) -> Dictionary:
	var result: Dictionary = _process_single_card_timing_effect(EffectManager.Timing.ON_DEFENSE, defender_ui, is_player, {
		"defender_ui": defender_ui,
		"damage": damage
	}, {"final_damage": damage})
	if not result.has("final_damage"):
		result["final_damage"] = damage
	return result

func _process_turn_start_effects(is_player: bool) -> void:
	_process_turn_timing_effects(EffectManager.Timing.TURN_START, is_player)

func _process_turn_end_effects(is_player: bool) -> void:
	_process_turn_timing_effects(EffectManager.Timing.TURN_END, is_player)

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
		_apply_hp_damage_to_owner(is_player, result["self_damage"])

	if result.has("direct_damage"):
		_apply_hp_damage_to_opponent(is_player, result["direct_damage"])

	if result.has("heal_player"):
		_apply_hp_heal_to_owner(is_player, result["heal_player"])

	if result.has("heal_player_full"):
		_restore_owner_hp_to_max(is_player)

	if result.has("draw"):
		for i in range(result["draw"]):
			if is_player:
				_player_draw_card()
			else:
				_opponent_draw_card()

	if result.has("destroy_targets"):
		for target in result["destroy_targets"]:
			_destroy_card_ui_immediate(target)

	_update_all_ui()

func _apply_hp_damage_to_owner(is_player: bool, amount: int) -> void:
	if amount <= 0:
		return
	if is_player:
		player_hp -= amount
		if player_hp <= 0:
			_game_end(false)
	else:
		opponent_hp -= amount
		if opponent_hp <= 0:
			_game_end(true)

func _apply_hp_damage_to_opponent(is_player: bool, amount: int) -> void:
	if amount <= 0:
		return
	if is_player:
		opponent_hp -= amount
		if opponent_hp <= 0:
			_game_end(true)
	else:
		player_hp -= amount
		if player_hp <= 0:
			_game_end(false)

func _apply_hp_heal_to_owner(is_player: bool, amount: int) -> void:
	if amount <= 0:
		return
	if is_player:
		player_hp = mini(MAX_HP, player_hp + amount)
	else:
		opponent_hp = mini(MAX_HP, opponent_hp + amount)

func _restore_owner_hp_to_max(is_player: bool) -> void:
	if is_player:
		player_hp = MAX_HP
	else:
		opponent_hp = MAX_HP

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
func _apply_attack_effect_pre_damage(atk_effect: Dictionary, target_slot, attacker_is_player: bool) -> bool:
	if not atk_effect.get("instant_kill", false):
		return false
	if not target_slot or target_slot.is_empty():
		return false
	await _destroy_card_in_slot(target_slot, not attacker_is_player)
	return true

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
		if await _apply_attack_effect_pre_damage(atk_effect, target_slot, attacker_is_player):
			card_ui.modulate = Color.WHITE
			_update_all_ui()
			await get_tree().create_timer(0.2).timeout
			continue
		if not is_instance_valid(card_ui) or card_ui.current_hp <= 0:
			continue
		if target_slot and not target_slot.is_empty() and target_slot.card_ui.current_hp <= 0:
			await _destroy_card_in_slot(target_slot, not attacker_is_player)
			card_ui.modulate = Color.WHITE
			_update_all_ui()
			await get_tree().create_timer(0.2).timeout
			continue

		# Highlight attacker briefly
		card_ui.modulate = Color(1.5, 1.2, 0.5)
		await get_tree().create_timer(0.2).timeout

		if target_is_player_hp:
			if attacker_is_player:
				_log("[color=lime]%s → 相手HPに%dダメージ！[/color]" % [atk_name, damage])
				await BattleUtils.animate_attack(self, card_ui, opponent_hp_label)
				BattleUtils.spawn_damage_popup(self, opponent_hp_label.global_position + Vector2(50, 0), damage)
				BattleUtils.shake_node(self, opponent_hp_label)
			else:
				_log("[color=red]%s → 自分HPに%dダメージ！[/color]" % [atk_name, damage])
				await BattleUtils.animate_attack(self, card_ui, player_hp_label)
				BattleUtils.spawn_damage_popup(self, player_hp_label.global_position + Vector2(50, 0), damage)
				BattleUtils.shake_node(self, player_hp_label)

			_apply_hp_damage_to_opponent(attacker_is_player, damage)
			if game_over:
				return
		elif target_slot and not target_slot.is_empty():
			var def_card: CardUI = target_slot.card_ui
			_log("%s → %sに%dダメージ" % [atk_name, def_card.card_data.card_name, damage])
			await BattleUtils.animate_attack(self, card_ui, def_card)
			def_card.play_damage_flash()
			BattleUtils.spawn_damage_popup(self, def_card.global_position + Vector2(40, 0), damage)
			var defense_result: Dictionary = _process_defense_effect(def_card, damage, not attacker_is_player)
			var final_damage: int = defense_result.get("final_damage", damage)
			await _apply_card_damage_and_handle_destroy(def_card, final_damage, not attacker_is_player)

			if defense_result.get("reflect", false):
				var reflected_damage: int = max(0, final_damage)
				if reflected_damage > 0 and card_ui and card_ui.current_hp > 0:
					_log("[color=yellow]%s の反射: %s に%dダメージ[/color]" % [def_card.card_data.card_name, atk_name, reflected_damage])
					await _apply_card_damage_and_handle_destroy(card_ui, reflected_damage, attacker_is_player)

		card_ui.modulate = Color.WHITE
		_update_all_ui()
		await get_tree().create_timer(0.3).timeout

func _apply_card_damage_and_handle_destroy(card_ui, damage: int, is_player_owner: bool) -> bool:
	if not card_ui or damage <= 0:
		return false
	var remaining_hp: int = card_ui.take_damage(damage)
	if remaining_hp > 0:
		return false
	var owner_slot = null
	if card_ui is CardUI:
		owner_slot = _find_slot_by_card_ui(card_ui)
	if owner_slot and not owner_slot.is_empty():
		await _destroy_card_in_slot(owner_slot, is_player_owner)
	elif card_ui is CardUI:
		_destroy_card_ui_immediate(card_ui)
	return true

func _destroy_card_in_slot(target_slot: FieldSlot, is_player_owner: bool) -> void:
	if not target_slot or target_slot.is_empty():
		return
	var card_ui: CardUI = target_slot.card_ui
	_log("[color=gray]%s 破壊！[/color]" % card_ui.card_data.card_name)
	await card_ui.play_destroy_animation()
	_process_death_effect(card_ui, is_player_owner)
	_process_ally_death_reactions(card_ui, is_player_owner)
	target_slot.remove_card()
	card_ui.queue_free()

func _destroy_card_ui_immediate(card_ui: CardUI) -> void:
	if not card_ui:
		return
	var owner_slot := _find_slot_by_card_ui(card_ui)
	if owner_slot == null:
		return
	if owner_slot in player_slots:
		_process_death_effect(card_ui, true)
		_process_ally_death_reactions(card_ui, true)
	else:
		_process_death_effect(card_ui, false)
		_process_ally_death_reactions(card_ui, false)
	owner_slot.remove_card()
	card_ui.queue_free()

func _process_ally_death_reactions(dead_card_ui: CardUI, is_player_owner: bool) -> void:
	var ally_slots: Array = player_slots if is_player_owner else opponent_slots
	for slot in ally_slots:
		if not slot or slot.is_empty():
			continue
		var ally_card: CardUI = slot.card_ui
		if ally_card == dead_card_ui:
			continue
		if not ally_card.card_data.has_effect():
			continue
		var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_DEATH, {
			"card_ui": ally_card,
			"is_player": is_player_owner,
			"context": _build_ally_death_context(dead_card_ui)
		})
		_apply_effect_result(result, is_player_owner)

func _build_ally_death_context(dead_card_ui: CardUI) -> Dictionary:
	var context := _get_effect_context()
	context["ally_died"] = true
	context["dead_card_ui"] = dead_card_ui
	return context

func _find_slot_by_card_ui(card_ui: CardUI) -> FieldSlot:
	for slot in player_slots:
		if slot and not slot.is_empty() and slot.card_ui == card_ui:
			return slot
	for slot in opponent_slots:
		if slot and not slot.is_empty() and slot.card_ui == card_ui:
			return slot
	return null

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
# UI UPDATE (shared)
# ═══════════════════════════════════════════
func _get_my_display_name() -> String:
	return "自分"

func _get_opponent_display_name() -> String:
	return "相手"

func _get_ui_font_scale() -> float:
	return 1.0  # Override in online_battle.gd for smaller UI

# ═══════════════════════════════════════════
# UI BUILD (shared)
# ═══════════════════════════════════════════
func _build_ui() -> void:
	var scale := _get_ui_font_scale()

	# Background
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Main layout
	var main_vbox := VBoxContainer.new()
	main_vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	main_vbox.add_theme_constant_override("separation", 4)
	add_child(main_vbox)

	# ── Opponent hand area ──
	opponent_hand_container = HBoxContainer.new()
	opponent_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	opponent_hand_container.add_theme_constant_override("separation", 4)
	opponent_hand_container.custom_minimum_size.y = 60
	main_vbox.add_child(opponent_hand_container)

	# ── Turn indicator ──
	turn_indicator_label = Label.new()
	turn_indicator_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	turn_indicator_label.add_theme_font_size_override("font_size", int(26 * scale))
	turn_indicator_label.custom_minimum_size.y = 30
	main_vbox.add_child(turn_indicator_label)

	# ── Opponent HP ──
	opponent_hp_label = Label.new()
	opponent_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	opponent_hp_label.add_theme_font_size_override("font_size", int(34 * scale))
	opponent_hp_label.add_theme_color_override("font_color", Color(1, 0.4, 0.4))
	main_vbox.add_child(opponent_hp_label)

	# ── Opponent back row (slots 3,4,5) ──
	var opp_back_row := HBoxContainer.new()
	opp_back_row.alignment = BoxContainer.ALIGNMENT_CENTER
	opp_back_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(opp_back_row)
	for i in range(3, 6):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = false
		opp_back_row.add_child(slot)
		slot.setup_lane_info()
		opponent_slots.append(null)  # placeholder

	# ── Opponent front row (slots 0,1,2) ──
	var opp_front_row := HBoxContainer.new()
	opp_front_row.alignment = BoxContainer.ALIGNMENT_CENTER
	opp_front_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(opp_front_row)
	for i in range(0, 3):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = false
		opp_front_row.add_child(slot)
		slot.setup_lane_info()
		opponent_slots.append(null)  # placeholder

	# Fix opponent_slots ordering: we added 3,4,5 then 0,1,2
	var temp_opp: Array = []
	temp_opp.resize(6)
	for slot_node in opp_back_row.get_children():
		if slot_node is FieldSlot:
			temp_opp[slot_node.slot_index] = slot_node
	for slot_node in opp_front_row.get_children():
		if slot_node is FieldSlot:
			temp_opp[slot_node.slot_index] = slot_node
	opponent_slots = temp_opp

	# ── Center phase bar ──
	var phase_bar := HBoxContainer.new()
	phase_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	phase_bar.custom_minimum_size.y = 50
	main_vbox.add_child(phase_bar)

	phase_label = Label.new()
	phase_label.text = "フェーズ: メイン1"
	phase_label.add_theme_font_size_override("font_size", int(38 * scale))
	phase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	phase_bar.add_child(phase_label)

	# ── ダイスブロック（左側、絶対配置） ──
	var dice_panel := PanelContainer.new()
	var dice_sb := StyleBoxFlat.new()
	dice_sb.bg_color = Color(0.12, 0.12, 0.2, 0.9)
	dice_sb.set_corner_radius_all(8)
	dice_sb.set_content_margin_all(8)
	dice_panel.add_theme_stylebox_override("panel", dice_sb)
	dice_panel.custom_minimum_size = Vector2(150, 150)
	dice_panel.set_anchors_preset(Control.PRESET_CENTER_LEFT)
	dice_panel.position = Vector2(5, -75)
	add_child(dice_panel)

	var dice_vbox := VBoxContainer.new()
	dice_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	dice_panel.add_child(dice_vbox)

	var dice_title := Label.new()
	dice_title.text = "ダイス"
	dice_title.add_theme_font_size_override("font_size", int(26 * scale))
	dice_title.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	dice_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_vbox.add_child(dice_title)

	dice_label = Label.new()
	dice_label.text = "-"
	dice_label.add_theme_font_size_override("font_size", 60)
	dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_vbox.add_child(dice_label)

	# ── ボタン2つ（右側、絶対配置） ──
	var btn_col := VBoxContainer.new()
	btn_col.add_theme_constant_override("separation", 8)
	btn_col.set_anchors_preset(Control.PRESET_CENTER_RIGHT)
	btn_col.position = Vector2(-175, -85)
	add_child(btn_col)

	end_turn_btn = Button.new()
	end_turn_btn.text = "ターン\n終了"
	end_turn_btn.custom_minimum_size = Vector2(165, 80)
	end_turn_btn.add_theme_font_size_override("font_size", int(28 * scale))
	end_turn_btn.pressed.connect(_on_end_turn)
	btn_col.add_child(end_turn_btn)
	end_turn_btn.visible = false

	next_phase_btn = Button.new()
	next_phase_btn.text = "次の\nフェーズへ"
	next_phase_btn.custom_minimum_size = Vector2(165, 80)
	next_phase_btn.add_theme_font_size_override("font_size", int(28 * scale))
	next_phase_btn.pressed.connect(_on_end_phase)
	btn_col.add_child(next_phase_btn)

	# ── 降参ボタン（右上、絶対配置） ──
	surrender_btn = Button.new()
	surrender_btn.text = "降参"
	surrender_btn.custom_minimum_size = Vector2(130, 60)
	surrender_btn.add_theme_font_size_override("font_size", int(28 * scale))
	surrender_btn.pressed.connect(_on_surrender)
	surrender_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	surrender_btn.position = Vector2(-140, 10)
	add_child(surrender_btn)

	# ── Player front row (slots 0,1,2) ──
	var pl_front_row := HBoxContainer.new()
	pl_front_row.alignment = BoxContainer.ALIGNMENT_CENTER
	pl_front_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(pl_front_row)
	for i in range(0, 3):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = true
		pl_front_row.add_child(slot)
		slot.setup_lane_info()
		player_slots.append(null)

	# ── Player back row (slots 3,4,5) ──
	var pl_back_row := HBoxContainer.new()
	pl_back_row.alignment = BoxContainer.ALIGNMENT_CENTER
	pl_back_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(pl_back_row)
	for i in range(3, 6):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = true
		pl_back_row.add_child(slot)
		slot.setup_lane_info()
		player_slots.append(null)

	# Fix player_slots ordering
	var temp_pl: Array = []
	temp_pl.resize(6)
	for slot_node in pl_front_row.get_children():
		if slot_node is FieldSlot:
			temp_pl[slot_node.slot_index] = slot_node
	for slot_node in pl_back_row.get_children():
		if slot_node is FieldSlot:
			temp_pl[slot_node.slot_index] = slot_node
	player_slots = temp_pl

	# Connect slot signals
	for slot in player_slots:
		if slot:
			slot.slot_clicked.connect(_on_player_slot_clicked)
	for slot in opponent_slots:
		if slot:
			slot.slot_clicked.connect(_on_opponent_slot_clicked)

	# ── Player HP ──
	player_hp_label = Label.new()
	player_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	player_hp_label.add_theme_font_size_override("font_size", int(34 * scale))
	player_hp_label.add_theme_color_override("font_color", Color(0.4, 1.0, 0.4))
	main_vbox.add_child(player_hp_label)

	# ── Mana display ──
	mana_label = Label.new()
	mana_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mana_label.add_theme_font_size_override("font_size", int(30 * scale))
	mana_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	main_vbox.add_child(mana_label)

	# ── Player hand ──
	var hand_scroll := ScrollContainer.new()
	hand_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	hand_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	hand_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	main_vbox.add_child(hand_scroll)

	player_hand_container = HBoxContainer.new()
	player_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	player_hand_container.add_theme_constant_override("separation", 6)
	player_hand_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hand_scroll.add_child(player_hand_container)

	# ── Dice Preview Panel ──
	dice_preview_panel = PanelContainer.new()
	var dp_style := StyleBoxFlat.new()
	dp_style.bg_color = Color(0.08, 0.08, 0.16, 0.95)
	dp_style.set_corner_radius_all(12)
	dp_style.border_width_left = 2
	dp_style.border_width_right = 2
	dp_style.border_width_top = 2
	dp_style.border_width_bottom = 2
	dp_style.border_color = Color(1, 0.85, 0.2, 0.7)
	dp_style.content_margin_left = 16
	dp_style.content_margin_right = 16
	dp_style.content_margin_top = 10
	dp_style.content_margin_bottom = 10
	dice_preview_panel.add_theme_stylebox_override("panel", dp_style)
	main_vbox.add_child(dice_preview_panel)

	var dp_vbox := VBoxContainer.new()
	dp_vbox.add_theme_constant_override("separation", 6)
	dice_preview_panel.add_child(dp_vbox)

	var dp_title := Label.new()
	dp_title.text = "ダイス予測"
	dp_title.add_theme_font_size_override("font_size", 24)
	dp_title.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	dp_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	dp_vbox.add_child(dp_title)

	dice_preview_label = RichTextLabel.new()
	dice_preview_label.bbcode_enabled = true
	dice_preview_label.fit_content = true
	dice_preview_label.scroll_active = false
	dice_preview_label.add_theme_font_size_override("normal_font_size", 28)
	dice_preview_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dp_vbox.add_child(dice_preview_label)

	# ── Log (small, at bottom) ──
	log_label = RichTextLabel.new()
	log_label.bbcode_enabled = true
	log_label.scroll_following = true
	log_label.custom_minimum_size.y = 150
	log_label.add_theme_font_size_override("normal_font_size", int(24 * scale))
	main_vbox.add_child(log_label)

	# ── Phase transition overlay ──
	phase_overlay = ColorRect.new()
	phase_overlay.color = Color(0, 0, 0, 0.85)
	phase_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	phase_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	phase_overlay.visible = false
	phase_overlay.z_index = 100
	add_child(phase_overlay)

	phase_overlay_label = Label.new()
	phase_overlay_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	phase_overlay_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	phase_overlay_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	phase_overlay_label.add_theme_font_size_override("font_size", 56)
	phase_overlay.add_child(phase_overlay_label)

	# ── Card Preview Overlay ──
	card_preview_overlay = ColorRect.new()
	card_preview_overlay.color = Color(0, 0, 0, 0.7)
	card_preview_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card_preview_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	card_preview_overlay.visible = false
	card_preview_overlay.z_index = 90
	add_child(card_preview_overlay)
	card_preview_container = CenterContainer.new()
	card_preview_container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card_preview_overlay.add_child(card_preview_container)
	card_preview_overlay.gui_input.connect(_on_preview_overlay_input)

func _update_all_ui() -> void:
	var my_name := _get_my_display_name()
	var opp_name := _get_opponent_display_name()
	player_hp_label.text = "HP %s: %d" % [my_name, player_hp]
	opponent_hp_label.text = "HP %s: %d" % [opp_name, opponent_hp]
	var mana_str := BattleUtils.build_mana_string(player_mana, player_max_mana, MAX_MANA_CAP)
	mana_label.text = "マナ: %s (%d/%d)" % [mana_str, player_mana, player_max_mana]
	var whose := "自分" if is_player_turn else "相手"
	phase_label.text = "%s: %s" % [whose, BattleConstants.get_phase_name(current_phase)]
	if is_player_turn:
		phase_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	else:
		phase_label.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
	# Turn indicator
	if is_player_turn:
		var go_text := "先行" if is_player_first else "後攻"
		turn_indicator_label.text = "自分のターン (%s) - ターン %d" % [go_text, turn_number]
		turn_indicator_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
		if end_turn_btn:
			end_turn_btn.disabled = false
		if next_phase_btn:
			next_phase_btn.disabled = false
	else:
		turn_indicator_label.text = "相手のターン - ターン %d" % turn_number
		turn_indicator_label.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
		if end_turn_btn:
			end_turn_btn.disabled = true
		if next_phase_btn:
			next_phase_btn.disabled = true
	# Dice
	if current_dice > 0:
		dice_label.text = "%d" % current_dice
	else:
		dice_label.text = "-"
	# Update sub-elements
	_update_opponent_hand_display()
	_update_hand_highlights()
	_update_dice_preview()

# ═══════════════════════════════════════════
# STUBS (override in subclasses)
# ═══════════════════════════════════════════
func _start_turn() -> void:
	pass

func _opponent_draw_card() -> void:
	pass

func _game_end(_win: bool) -> void:
	pass

func _update_opponent_hand_display() -> void:
	pass

func _summon_card_to_slot(_card_ui: CardUI, _slot: FieldSlot) -> void:
	pass

func _move_card_to_slot(_from_slot: FieldSlot, _to_slot: FieldSlot) -> void:
	pass

func _on_end_turn() -> void:
	pass

func _on_end_phase() -> void:
	pass

func _on_surrender() -> void:
	pass
