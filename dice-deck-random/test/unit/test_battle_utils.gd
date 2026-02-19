extends GutTest

# Tests for BattleUtils pure functions

## get_adjacent_slots tests

func test_get_adjacent_slots_lane0_front():
	# Slot 0 = lane 0, front row
	# Adjacent: right (1), back row same lane (3)
	var result := BattleUtils.get_adjacent_slots(0)
	assert_eq(result.size(), 2)
	assert_true(1 in result, "Should include right neighbor")
	assert_true(3 in result, "Should include back row same lane")

func test_get_adjacent_slots_lane1_front():
	# Slot 1 = lane 1, front row
	# Adjacent: left (0), right (2), back row same lane (4)
	var result := BattleUtils.get_adjacent_slots(1)
	assert_eq(result.size(), 3)
	assert_true(0 in result, "Should include left neighbor")
	assert_true(2 in result, "Should include right neighbor")
	assert_true(4 in result, "Should include back row same lane")

func test_get_adjacent_slots_lane2_front():
	# Slot 2 = lane 2, front row
	# Adjacent: left (1), back row same lane (5)
	var result := BattleUtils.get_adjacent_slots(2)
	assert_eq(result.size(), 2)
	assert_true(1 in result, "Should include left neighbor")
	assert_true(5 in result, "Should include back row same lane")

func test_get_adjacent_slots_lane0_back():
	# Slot 3 = lane 0, back row
	# Adjacent: right (4), front row same lane (0)
	var result := BattleUtils.get_adjacent_slots(3)
	assert_eq(result.size(), 2)
	assert_true(4 in result, "Should include right neighbor")
	assert_true(0 in result, "Should include front row same lane")

func test_get_adjacent_slots_lane1_back():
	# Slot 4 = lane 1, back row
	# Adjacent: left (3), right (5), front row same lane (1)
	var result := BattleUtils.get_adjacent_slots(4)
	assert_eq(result.size(), 3)
	assert_true(3 in result, "Should include left neighbor")
	assert_true(5 in result, "Should include right neighbor")
	assert_true(1 in result, "Should include front row same lane")

func test_get_adjacent_slots_lane2_back():
	# Slot 5 = lane 2, back row
	# Adjacent: left (4), front row same lane (2)
	var result := BattleUtils.get_adjacent_slots(5)
	assert_eq(result.size(), 2)
	assert_true(4 in result, "Should include left neighbor")
	assert_true(2 in result, "Should include front row same lane")


## build_mana_string tests

func test_build_mana_string_full():
	# 5 current, 5 max, 10 cap -> ●●●●●○○○○○ (wait, 5 max should show)
	# Actually: ●●●●●·····
	var result := BattleUtils.build_mana_string(5, 5, 10)
	assert_eq(result, "●●●●●·····", "5/5 mana with 10 cap")

func test_build_mana_string_partial():
	# 3 current, 5 max, 10 cap -> ●●●○○·····
	var result := BattleUtils.build_mana_string(3, 5, 10)
	assert_eq(result, "●●●○○·····", "3/5 mana with 10 cap")

func test_build_mana_string_empty():
	# 0 current, 5 max, 10 cap -> ○○○○○·····
	var result := BattleUtils.build_mana_string(0, 5, 10)
	assert_eq(result, "○○○○○·····", "0/5 mana with 10 cap")

func test_build_mana_string_max_cap():
	# 10 current, 10 max, 10 cap -> ●●●●●●●●●●
	var result := BattleUtils.build_mana_string(10, 10, 10)
	assert_eq(result, "●●●●●●●●●●", "10/10 mana at cap")

func test_build_mana_string_overcap_max():
	# Edge case: max_mana > cap (shouldn't happen but be safe)
	# 5 current, 12 max, 10 cap
	var result := BattleUtils.build_mana_string(5, 12, 10)
	assert_eq(result, "●●●●●○○○○○", "5/12 mana capped at 10")


## sim_find_target tests

func _make_defender(hp: int, lane: int, is_front: bool) -> Dictionary:
	return {"hp": hp, "lane": lane, "is_front": is_front}

func test_sim_find_target_front_first():
	# Front row should be targeted before back row
	var attacker := {"lane": 1}
	var defenders := [
		_make_defender(5, 1, false),  # back row
		_make_defender(3, 1, true),   # front row
	]
	var target = BattleUtils.sim_find_target(attacker, defenders)
	assert_not_null(target)
	assert_eq(target["hp"], 3, "Should target front row first")

func test_sim_find_target_back_if_no_front():
	# If no front row, target back row
	var attacker := {"lane": 1}
	var defenders := [
		_make_defender(5, 1, false),  # back row only
	]
	var target = BattleUtils.sim_find_target(attacker, defenders)
	assert_not_null(target)
	assert_eq(target["hp"], 5, "Should target back row if no front")

func test_sim_find_target_different_lane():
	# No target in different lane
	var attacker := {"lane": 0}
	var defenders := [
		_make_defender(5, 1, true),
		_make_defender(3, 2, true),
	]
	var target = BattleUtils.sim_find_target(attacker, defenders)
	assert_null(target, "No target in lane 0")

func test_sim_find_target_dead_ignored():
	# Dead cards (hp <= 0) should be ignored
	var attacker := {"lane": 1}
	var defenders := [
		_make_defender(0, 1, true),   # dead front
		_make_defender(5, 1, false),  # alive back
	]
	var target = BattleUtils.sim_find_target(attacker, defenders)
	assert_not_null(target)
	assert_eq(target["hp"], 5, "Should skip dead card and hit back row")


## build_dice_preview_text tests

func test_build_dice_preview_text_format():
	# Results: [dmg_to_opp, dmg_to_me] for each dice 1-6
	var results := [
		[3, 0],   # dice 1: +3 score (green)
		[0, 2],   # dice 2: -2 score (red)
		[2, 2],   # dice 3: 0 score (gray)
		[5, 1],   # dice 4: +4 score (green)
		[0, 0],   # dice 5: 0 score (gray)
		[1, 3],   # dice 6: -2 score (red)
	]
	var text := BattleUtils.build_dice_preview_text(results)
	
	# Check that it contains the dice values and colored scores
	assert_true("[color=green]+3" in text, "Dice 1 should show green +3")
	assert_true("[color=red]-2" in text, "Dice 2 should show red -2")
	assert_true("[color=gray]0" in text, "Dice 3 should show gray 0")
	assert_true("[color=green]+4" in text, "Dice 4 should show green +4")


## has_empty_slot tests
## Note: has_empty_slot checks slot.is_empty() for non-null slots.
## In production, slots are FieldSlot objects. For testing, we use mock objects.

class MockSlot:
	var _is_empty: bool
	func _init(empty: bool) -> void:
		_is_empty = empty
	func is_empty() -> bool:
		return _is_empty

func test_has_empty_slot_all_empty():
	var slots := [MockSlot.new(true), MockSlot.new(true), MockSlot.new(true), MockSlot.new(true), MockSlot.new(true), MockSlot.new(true)]
	assert_true(BattleUtils.has_empty_slot(slots), "All empty slots")

func test_has_empty_slot_all_filled():
	var slots := [MockSlot.new(false), MockSlot.new(false), MockSlot.new(false), MockSlot.new(false), MockSlot.new(false), MockSlot.new(false)]
	assert_false(BattleUtils.has_empty_slot(slots), "All filled = no empty")

func test_has_empty_slot_mixed():
	var slots := [MockSlot.new(false), MockSlot.new(true), MockSlot.new(false), MockSlot.new(true), MockSlot.new(false), MockSlot.new(true)]
	assert_true(BattleUtils.has_empty_slot(slots), "Mixed = has empty")

func test_has_empty_slot_one_empty():
	var slots := [MockSlot.new(false), MockSlot.new(false), MockSlot.new(false), MockSlot.new(false), MockSlot.new(false), MockSlot.new(true)]
	assert_true(BattleUtils.has_empty_slot(slots), "Five filled, one empty = has empty")

func test_has_empty_slot_null_treated_as_occupied():
	# null slots are skipped by the condition (slot and slot.is_empty())
	var slots := [null, null, MockSlot.new(true), null, null, null]
	assert_true(BattleUtils.has_empty_slot(slots), "One MockSlot empty among nulls")


## is_dice_blocked tests
## Note: is_dice_blocked uses EffectManager.get_dice_modifier internally,
## which requires player_slots and opponent_slots with card_ui objects.
## For simplicity, we test with empty slots (no blocking effects).

func _make_empty_slots_context() -> Dictionary:
	# Both sides empty = no blocking effects
	return {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null]
	}

func test_is_dice_blocked_empty_context():
	var context := _make_empty_slots_context()
	# With no cards on field, no dice should be blocked
	assert_false(BattleUtils.is_dice_blocked(1, true, context), "Dice 1 not blocked (empty)")
	assert_false(BattleUtils.is_dice_blocked(6, true, context), "Dice 6 not blocked (empty)")
	assert_false(BattleUtils.is_dice_blocked(3, false, context), "Opponent dice 3 not blocked (empty)")
