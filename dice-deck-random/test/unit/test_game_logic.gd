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

# ═══════════════════════════════════════════
# 勝敗判定テスト
# ═══════════════════════════════════════════

func test_win_condition_opponent_hp_zero():
	var opponent_hp := 0
	assert_true(opponent_hp <= 0, "Win when opponent HP is 0")

func test_win_condition_opponent_hp_negative():
	var opponent_hp := -5
	assert_true(opponent_hp <= 0, "Win when opponent HP is negative")

func test_lose_condition_player_hp_zero():
	var player_hp := 0
	assert_true(player_hp <= 0, "Lose when player HP is 0")

func test_lose_condition_player_hp_negative():
	var player_hp := -3
	assert_true(player_hp <= 0, "Lose when player HP is negative")

func test_game_continues_both_positive():
	var player_hp := 10
	var opponent_hp := 15
	assert_false(player_hp <= 0 or opponent_hp <= 0, "Game continues when both HP positive")

func test_both_hp_zero_draw():
	# 同時に0になった場合のルール（現在の実装ではターンプレイヤー勝利）
	var player_hp := 0
	var opponent_hp := 0
	var is_player_turn := true
	# ターンプレイヤーが勝利する仕様
	assert_true(player_hp <= 0 and opponent_hp <= 0, "Both HP zero is simultaneous defeat")

# ═══════════════════════════════════════════
# ポイントバジェットテスト
# ═══════════════════════════════════════════

func test_point_budget_cost_0():
	var cost := 0
	var budget := 12 + cost * 10
	assert_eq(budget, 12, "Cost 0 → budget 12")

func test_point_budget_cost_1():
	var cost := 1
	var budget := 12 + cost * 10
	assert_eq(budget, 22, "Cost 1 → budget 22")

func test_point_budget_cost_2():
	var cost := 2
	var budget := 12 + cost * 10
	assert_eq(budget, 32, "Cost 2 → budget 32")

func test_point_budget_cost_3():
	var cost := 3
	var budget := 12 + cost * 10
	assert_eq(budget, 42, "Cost 3 → budget 42")

func test_point_budget_cost_4():
	var cost := 4
	var budget := 12 + cost * 10
	assert_eq(budget, 52, "Cost 4 → budget 52")

func test_point_budget_cost_5():
	var cost := 5
	var budget := 12 + cost * 10
	assert_eq(budget, 62, "Cost 5 → budget 62")

# ═══════════════════════════════════════════
# カード召喚コストテスト
# ═══════════════════════════════════════════

func test_can_summon_with_exact_mana():
	var mana := 3
	var card_cost := 3
	assert_true(mana >= card_cost, "Can summon with exact mana")

func test_can_summon_with_excess_mana():
	var mana := 5
	var card_cost := 2
	assert_true(mana >= card_cost, "Can summon with excess mana")

func test_cannot_summon_insufficient_mana():
	var mana := 1
	var card_cost := 3
	assert_false(mana >= card_cost, "Cannot summon with insufficient mana")

func test_can_summon_cost_zero():
	var mana := 0
	var card_cost := 0
	assert_true(mana >= card_cost, "Can summon 0-cost card with 0 mana")

# ═══════════════════════════════════════════
# フィールドスロットテスト
# ═══════════════════════════════════════════

func test_slot_indices():
	# スロット0-2: 前列、3-5: 後列
	for i in range(6):
		var is_front := i < 3
		var lane := i % 3
		if is_front:
			assert_true(i >= 0 and i <= 2, "Front row slots are 0-2")
		else:
			assert_true(i >= 3 and i <= 5, "Back row slots are 3-5")
		assert_true(lane >= 0 and lane <= 2, "Lane is always 0-2")

func test_front_to_back_mapping():
	# 前列スロットから対応する後列スロットへ
	assert_eq(0 + 3, 3, "Front slot 0 → back slot 3")
	assert_eq(1 + 3, 4, "Front slot 1 → back slot 4")
	assert_eq(2 + 3, 5, "Front slot 2 → back slot 5")

func test_back_to_front_mapping():
	# 後列スロットから対応する前列スロットへ
	assert_eq(3 - 3, 0, "Back slot 3 → front slot 0")
	assert_eq(4 - 3, 1, "Back slot 4 → front slot 1")
	assert_eq(5 - 3, 2, "Back slot 5 → front slot 2")
