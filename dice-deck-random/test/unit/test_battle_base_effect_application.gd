extends GutTest

class TestBattleBase extends BattleBase:
	var game_end_called: bool = false
	var game_end_win: bool = false
	var destroyed_slot = null
	var destroyed_owner_is_player: bool = false
	var destroyed_ui = null
	var destroy_call_count: int = 0

	func _update_all_ui() -> void:
		pass

	func _game_end(win: bool) -> void:
		game_end_called = true
		game_end_win = win

	func _destroy_card_in_slot(target_slot, is_player_owner: bool) -> void:
		destroy_call_count += 1
		destroyed_slot = target_slot
		destroyed_owner_is_player = is_player_owner

	func _destroy_card_ui_immediate(card_ui) -> void:
		destroy_call_count += 1
		destroyed_ui = card_ui

	func _find_slot_by_card_ui(card_ui):
		for slot in player_slots:
			if slot and not slot.is_empty() and slot.card_ui == card_ui:
				return slot
		for slot in opponent_slots:
			if slot and not slot.is_empty() and slot.card_ui == card_ui:
				return slot
		return null

class DummySlot:
	var _empty: bool = false
	var card_ui = null

	func is_empty() -> bool:
		return _empty

func test_apply_effect_result_heal_player_applies_to_owner_hp() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 10

	battle._apply_effect_result({"heal_player": 3}, true)

	assert_eq(battle.player_hp, 13, "heal_player should increase owner HP")
	battle.free()

func test_apply_effect_result_heal_player_full_sets_owner_to_max_hp() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 4
	battle.opponent_hp = 7

	battle._apply_effect_result({"heal_player_full": true}, true)

	assert_eq(battle.player_hp, BattleConstants.MAX_HP, "heal_player_full should restore owner to max HP")
	assert_eq(battle.opponent_hp, 7, "heal_player_full should not affect opponent HP")
	battle.free()

func test_apply_effect_result_heal_player_applies_to_opponent_side_when_is_player_false() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 10
	battle.opponent_hp = 9

	battle._apply_effect_result({"heal_player": 3}, false)

	assert_eq(battle.player_hp, 10, "heal_player should not affect player side when is_player is false")
	assert_eq(battle.opponent_hp, 12, "heal_player should increase opponent owner HP")
	battle.free()

func test_apply_effect_result_heal_player_full_applies_to_opponent_side_when_is_player_false() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 10
	battle.opponent_hp = 2

	battle._apply_effect_result({"heal_player_full": true}, false)

	assert_eq(battle.player_hp, 10, "heal_player_full should not affect player side when is_player is false")
	assert_eq(battle.opponent_hp, BattleConstants.MAX_HP, "heal_player_full should restore opponent owner to max HP")
	battle.free()

func test_apply_effect_result_direct_damage_triggers_game_end() -> void:
	var battle := TestBattleBase.new()
	battle.opponent_hp = 1

	battle._apply_effect_result({"direct_damage": 1}, true)

	assert_true(battle.game_end_called, "lethal direct_damage should trigger game end")
	assert_true(battle.game_end_win, "player lethal direct_damage should be win")
	battle.free()

func test_apply_effect_result_self_damage_triggers_game_end() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 1

	battle._apply_effect_result({"self_damage": 1}, true)

	assert_true(battle.game_end_called, "lethal self_damage should trigger game end")
	assert_false(battle.game_end_win, "player lethal self_damage should be loss")
	battle.free()

func test_battle_base_uses_unified_single_card_timing_entry_helper() -> void:
	var script_text := FileAccess.get_file_as_string("res://scenes/battle/battle_base.gd")

	assert_true(script_text.find("func _process_single_card_timing_effect") >= 0, "BattleBase should define a unified single-card timing helper")
	assert_true(script_text.find("Timing.ON_SUMMON") >= 0, "ON_SUMMON should route through unified helper")
	assert_true(script_text.find("Timing.ON_ATTACK") >= 0, "ON_ATTACK should route through unified helper")
	assert_true(script_text.find("Timing.ON_DEATH") >= 0, "ON_DEATH should route through unified helper")
	assert_true(script_text.find("Timing.ON_DEFENSE") >= 0, "ON_DEFENSE should route through unified helper")

func test_battle_base_uses_unified_turn_timing_entry_helper() -> void:
	var script_text := FileAccess.get_file_as_string("res://scenes/battle/battle_base.gd")

	assert_true(script_text.find("func _process_turn_timing_effects") >= 0, "BattleBase should define a unified turn timing helper")
	assert_true(script_text.find("Timing.TURN_START") >= 0, "TURN_START should route through unified helper")
	assert_true(script_text.find("Timing.TURN_END") >= 0, "TURN_END should route through unified helper")

func test_battle_base_ally_death_reaction_uses_unified_timing_entry_helper() -> void:
	var script_text := FileAccess.get_file_as_string("res://scenes/battle/battle_base.gd")

	assert_true(script_text.find("_run_timing_event_with_context") >= 0 and script_text.find("Timing.ON_DEATH") >= 0, "ally death reactions should route through unified timing entry helper")
	assert_true(script_text.find("\"ally_died\": true") >= 0, "ally death reactions should pass ally_died context through shared event helper")

func test_battle_base_ally_death_reaction_uses_single_card_timing_helper() -> void:
	var script_text := FileAccess.get_file_as_string("res://scenes/battle/battle_base.gd")

	assert_true(script_text.find("_process_single_card_timing_effect") >= 0 and script_text.find("EffectManager.Timing.ON_DEATH, ally_card, is_player_owner") >= 0,
		"ally death reactions should use single-card timing helper to keep timing entrypoints unified")

func test_apply_attack_effect_pre_damage_instant_kill_destroys_target_slot() -> void:
	var battle := TestBattleBase.new()
	var slot := DummySlot.new()

	var handled: bool = await battle._apply_attack_effect_pre_damage({"instant_kill": true}, slot, true)

	assert_true(handled, "instant_kill should be handled before normal damage step")
	assert_eq(battle.destroyed_slot, slot, "instant_kill should destroy current target slot")
	assert_false(battle.destroyed_owner_is_player, "attacker is player so destroyed card should be opponent-owned")
	battle.free()

func test_apply_attack_effect_pre_damage_returns_false_without_target() -> void:
	var battle := TestBattleBase.new()

	var handled: bool = await battle._apply_attack_effect_pre_damage({"instant_kill": true}, null, true)

	assert_false(handled, "instant_kill without slot should be ignored safely")
	assert_null(battle.destroyed_slot, "no target means destroy should not be called")
	battle.free()

func test_apply_card_damage_and_handle_destroy_uses_slot_destruction_when_lethal() -> void:
	var battle := TestBattleBase.new()
	var card := CardUI.new()
	card.current_hp = 1
	var slot := DummySlot.new()
	slot.card_ui = card
	battle.player_slots = [slot]
	battle.opponent_slots = []

	var destroyed: bool = await battle._apply_card_damage_and_handle_destroy(card, 1, true)

	assert_true(destroyed, "lethal damage should return destroyed=true")
	assert_eq(battle.destroyed_slot, slot, "lethal damage should use slot destruction path")
	assert_eq(battle.destroyed_ui, null, "slot path should not call immediate destroy")
	battle.free()

func test_apply_card_damage_and_handle_destroy_ignores_non_lethal_damage() -> void:
	var battle := TestBattleBase.new()
	var card := CardUI.new()
	card.current_hp = 3

	var destroyed: bool = await battle._apply_card_damage_and_handle_destroy(card, 1, true)

	assert_false(destroyed, "non-lethal damage should not destroy card")
	assert_eq(card.current_hp, 2, "non-lethal damage should still reduce HP")
	assert_eq(battle.destroyed_slot, null, "non-lethal damage should not call slot destroy")
	battle.free()

func test_apply_effect_result_uses_destroy_targets_helper() -> void:
	var script_text := FileAccess.get_file_as_string("res://scenes/battle/battle_base.gd")

	assert_true(script_text.find("func _apply_destroy_targets_from_effect") >= 0,
		"BattleBase should define destroy_targets helper for effect application")
	assert_true(script_text.find("_apply_destroy_targets_from_effect(result)") >= 0,
		"_apply_effect_result should delegate destroy_targets handling to helper")

func test_apply_effect_result_damaged_targets_runs_slot_destroy_for_lethal_card() -> void:
	var battle := TestBattleBase.new()
	var card := CardUI.new()
	card.current_hp = 0
	var slot := DummySlot.new()
	slot.card_ui = card
	battle.player_slots = [slot]
	battle.opponent_slots = []

	battle._apply_effect_result({"damaged_targets": [card]}, true)

	assert_eq(battle.destroyed_slot, slot, "lethal damaged_targets should use shared destroy flow")
	battle.free()

func test_apply_effect_result_damaged_targets_skips_alive_card() -> void:
	var battle := TestBattleBase.new()
	var card := CardUI.new()
	card.current_hp = 2
	var slot := DummySlot.new()
	slot.card_ui = card
	battle.player_slots = [slot]
	battle.opponent_slots = []

	battle._apply_effect_result({"damaged_targets": [card]}, true)

	assert_null(battle.destroyed_slot, "alive damaged_targets should not be destroyed")
	assert_null(battle.destroyed_ui, "alive damaged_targets should not call immediate destroy")
	battle.free()

func test_apply_effect_result_does_not_double_destroy_same_target_from_damage_and_destroy_lists() -> void:
	var battle := TestBattleBase.new()
	var card := CardUI.new()
	card.current_hp = 0
	var slot := DummySlot.new()
	slot.card_ui = card
	battle.player_slots = [slot]
	battle.opponent_slots = []

	battle._apply_effect_result({
		"damaged_targets": [card],
		"destroy_targets": [card]
	}, true)

	assert_eq(battle.destroy_call_count, 1,
		"same card in damaged_targets and destroy_targets should be destroyed exactly once")
	battle.free()
