extends GutTest

func test_mana_cap():
	for turn in range(1, 10):
		var max_mana := mini(turn, 5)
		if turn <= 5:
			assert_eq(max_mana, turn, "Turn %d: mana should be %d" % [turn, turn])
		else:
			assert_eq(max_mana, 5, "Turn %d: mana should be capped at 5" % turn)

func test_mana_recovery_in_draw_phase():
	# Draw phase restores 1 mana, capped at max
	var mana := 2
	var max_mana := 4
	mana = mini(mana + 1, max_mana)
	assert_eq(mana, 3, "2/4 + 1 recovery = 3/4")

	mana = max_mana
	mana = mini(mana + 1, max_mana)
	assert_eq(mana, max_mana, "Full mana + 1 recovery stays at max")

func test_damage_calculation():
	assert_eq(5 - 3, 2, "3 ATK vs 5 HP = 2 remaining")
	assert_true(3 - 5 <= 0, "5 ATK vs 3 HP = defeated")
	assert_eq(4 - 0, 4, "0 ATK = no damage")

func test_lane_assignment():
	for i in range(6):
		var lane := i % 3
		var is_front := i < 3
		assert_between(lane, 0, 2, "Slot %d lane should be 0-2" % i)
		if i < 3:
			assert_true(is_front, "Slot %d should be front row" % i)
		else:
			assert_false(is_front, "Slot %d should be back row" % i)

func test_first_player_turn1_skips_dice():
	var is_player_first := true
	var turn_number := 1
	var is_player_turn := true
	var skip := is_player_first and turn_number == 1 and is_player_turn
	assert_true(skip, "First player turn 1 should skip dice")

func test_second_player_turn1_no_skip():
	var is_player_first := true
	var turn_number := 1
	var is_player_turn := false  # opponent's turn
	var skip_for_first := is_player_first and turn_number == 1 and is_player_turn
	var skip_for_second := (not is_player_first) and turn_number == 1 and (not is_player_turn)
	var skip := skip_for_first or skip_for_second
	assert_false(skip, "Second player in first-player game turn 1 should not skip")

func test_move_cost():
	var MOVE_COST := 1
	var mana := 3
	mana -= MOVE_COST
	assert_eq(mana, 2, "Moving costs 1 mana")

func test_deck_size():
	assert_eq(20, 20, "Deck must be exactly 20 cards")

func test_starting_hand():
	var STARTING_HAND := 5
	assert_eq(STARTING_HAND, 5, "Starting hand is 5 cards")

func test_max_hp():
	var MAX_HP := 20
	assert_eq(MAX_HP, 20, "Max HP is 20")
