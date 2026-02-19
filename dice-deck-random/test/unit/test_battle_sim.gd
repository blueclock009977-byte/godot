extends GutTest

# Test using shared BattleUtils functions

func _make_card(atk: int, hp: int, lane: int, is_front: bool, dice: Array) -> Dictionary:
	return {"atk": atk, "hp": hp, "lane": lane, "is_front": is_front, "dice": dice, "idx": lane + (0 if is_front else 3)}

# Wrapper to simulate battle without actual slot objects
# Creates mock data structure that BattleUtils.simulate_battle expects
func _simulate(dice_val: int, p_cards: Array, o_cards: Array, is_player_turn: bool) -> Array:
	# BattleUtils.simulate_battle expects slot objects with card_ui properties
	# For unit testing, we use a standalone implementation
	var turn_cards: Array = p_cards.duplicate(true) if is_player_turn else o_cards.duplicate(true)
	var def_cards: Array = o_cards.duplicate(true) if is_player_turn else p_cards.duplicate(true)

	var dmg_to_opp := 0
	var dmg_to_me := 0

	turn_cards.sort_custom(func(a, b): return a["idx"] < b["idx"])
	for card in turn_cards:
		if card["hp"] <= 0:
			continue
		var dice_arr: Array = card["dice"]
		if not dice_arr.has(dice_val):
			continue
		var target: Variant = BattleUtils.sim_find_target(card, def_cards)
		if target == null:
			if is_player_turn:
				dmg_to_opp += card["atk"]
			else:
				dmg_to_me += card["atk"]
		else:
			var t: Dictionary = target
			t["hp"] -= card["atk"]
			if is_player_turn:
				dmg_to_opp += card["atk"]
			else:
				dmg_to_me += card["atk"]

	def_cards.sort_custom(func(a, b): return a["idx"] < b["idx"])
	for card in def_cards:
		if card["hp"] <= 0:
			continue
		var dice_arr: Array = card["dice"]
		if not dice_arr.has(dice_val):
			continue
		var target: Variant = BattleUtils.sim_find_target(card, turn_cards)
		if target == null:
			if is_player_turn:
				dmg_to_me += card["atk"]
			else:
				dmg_to_opp += card["atk"]
		else:
			var t: Dictionary = target
			t["hp"] -= card["atk"]
			if is_player_turn:
				dmg_to_me += card["atk"]
			else:
				dmg_to_opp += card["atk"]

	return [dmg_to_opp, dmg_to_me]

func test_empty_field():
	var result := _simulate(1, [], [], true)
	assert_eq(result, [0, 0], "Empty field = no damage")

func test_single_card_direct_hp():
	# Player card in lane 0 front, no opponent in lane 0
	var p := [_make_card(3, 5, 0, true, [1, 2, 3])]
	var result := _simulate(1, p, [], true)
	assert_eq(result[0], 3, "Direct HP damage = ATK 3")
	assert_eq(result[1], 0, "No damage to player")

func test_single_card_wrong_dice():
	var p := [_make_card(3, 5, 0, true, [1, 2, 3])]
	var result := _simulate(6, p, [], true)
	assert_eq(result, [0, 0], "Wrong dice = no attack")

func test_card_vs_card_same_lane():
	# Player ATK2 vs Opponent HP3, same lane
	var p := [_make_card(2, 4, 1, true, [1, 2, 3, 4, 5, 6])]
	var o := [_make_card(1, 3, 1, true, [1, 2, 3, 4, 5, 6])]
	var result := _simulate(1, p.duplicate(true), o.duplicate(true), true)
	# Player attacks first: deals 2 to opponent card (hp 3->1)
	# Opponent attacks back: deals 1 to player card (hp 4->3)
	assert_eq(result[0], 2, "Player deals 2 to opponent card")
	assert_eq(result[1], 1, "Opponent deals 1 to player card")

func test_kill_then_direct_hp():
	# Player ATK5 vs Opponent HP3 front, same lane
	# Kill front card, but no further pass-through in same attack
	var p := [_make_card(5, 4, 0, true, [1])]
	var o := [_make_card(1, 3, 0, true, [1])]
	var result := _simulate(1, p.duplicate(true), o.duplicate(true), true)
	# Player kills opponent card (5 dmg to 3 hp card)
	# Opponent card is dead (hp <= 0), doesn't attack back
	assert_eq(result[0], 5, "Player deals 5 (overkill on card)")
	assert_eq(result[1], 0, "Dead card doesn't attack back")

func test_front_blocks_back():
	# Opponent has front and back in same lane
	# Attacker should hit front first
	var p := [_make_card(2, 5, 1, true, [3])]
	var o_front := _make_card(1, 4, 1, true, [3])
	var o_back := _make_card(3, 6, 1, false, [3])
	var o := [o_front, o_back]
	var result := _simulate(3, p.duplicate(true), o.duplicate(true), true)
	# Player hits front (2 dmg, front hp 4->2)
	# Front hits back: wait, opponent cards both activate
	# o_front attacks p lane 1 front (p card), deals 1
	# o_back attacks p lane 1 front (p card), deals 3
	assert_eq(result[0], 2, "Player hits front card for 2")
	assert_eq(result[1], 4, "Both opponent cards hit player card (1+3)")

func test_different_lanes_no_interaction():
	# Player in lane 0, opponent in lane 2
	var p := [_make_card(3, 5, 0, true, [1])]
	var o := [_make_card(2, 4, 2, true, [1])]
	var result := _simulate(1, p.duplicate(true), o.duplicate(true), true)
	# Both attack direct HP (no target in their lane)
	assert_eq(result[0], 3, "Player hits opponent HP directly")
	assert_eq(result[1], 2, "Opponent hits player HP directly")

func test_opponent_turn():
	# When it's opponent's turn, turn_cards = o_cards
	var p := [_make_card(2, 5, 0, true, [1])]
	var o := [_make_card(3, 4, 0, true, [1])]
	var result := _simulate(1, p.duplicate(true), o.duplicate(true), false)
	# Opponent attacks first (turn player): hits player card for 3
	# Player attacks back: hits opponent card for 2
	assert_eq(result[0], 2, "Player deals 2 to opponent card")
	assert_eq(result[1], 3, "Opponent deals 3 to player card")

func test_back_row_only_same_lane():
	# Player has back row card in lane 1, opponent has front in lane 1
	# Back row should attack front row in same lane
	var p := [_make_card(4, 3, 1, false, [2])]  # back row, lane 1
	var o := [_make_card(2, 5, 1, true, [2])]   # front row, lane 1
	var result := _simulate(2, p.duplicate(true), o.duplicate(true), true)
	# Player back attacks opponent front: 4 dmg
	# Opponent front attacks player back: 2 dmg
	assert_eq(result[0], 4, "Player back row attacks opponent front")
	assert_eq(result[1], 2, "Opponent front attacks player back")

func test_back_row_direct_hp_no_defender():
	# Player has back row only, no opponent in that lane
	var p := [_make_card(3, 4, 2, false, [4])]  # back row, lane 2
	var result := _simulate(4, p.duplicate(true), [], true)
	assert_eq(result[0], 3, "Back row deals direct HP damage when lane empty")
	assert_eq(result[1], 0, "No damage to player")

func test_multiple_lanes_battle():
	# Multiple lanes active simultaneously
	var p := [
		_make_card(2, 3, 0, true, [1]),  # lane 0 front
		_make_card(3, 4, 2, true, [1]),  # lane 2 front
	]
	var o := [
		_make_card(1, 5, 0, true, [1]),  # lane 0 front
		_make_card(2, 3, 1, true, [1]),  # lane 1 front (no opponent)
	]
	var result := _simulate(1, p.duplicate(true), o.duplicate(true), true)
	# Player lane 0 attacks opponent lane 0: 2 dmg
	# Player lane 2 attacks direct HP: 3 dmg
	# Opponent lane 0 attacks player lane 0: 1 dmg
	# Opponent lane 1 attacks direct HP: 2 dmg
	assert_eq(result[0], 5, "Player deals 2+3=5 total")
	assert_eq(result[1], 3, "Opponent deals 1+2=3 total")

func test_selective_dice_activation():
	# Some cards activate on certain dice, others don't
	var p := [
		_make_card(5, 3, 0, true, [1, 2]),  # activates on 1,2
		_make_card(4, 3, 1, true, [3, 4]),  # activates on 3,4
	]
	var result := _simulate(2, p.duplicate(true), [], true)
	# Only first card activates (dice 2)
	assert_eq(result[0], 5, "Only card with dice 2 attacks")
	assert_eq(result[1], 0, "No damage to player")

func test_dead_card_no_counterattack():
	# If a card dies from the first attack, it shouldn't counterattack
	var p := [_make_card(10, 5, 0, true, [1])]  # very high ATK
	var o := [_make_card(3, 2, 0, true, [1])]   # low HP, will die
	var result := _simulate(1, p.duplicate(true), o.duplicate(true), true)
	# Player kills opponent card (10 dmg to 2 hp)
	# Dead card doesn't counterattack
	assert_eq(result[0], 10, "Player overkills opponent card")
	assert_eq(result[1], 0, "Dead card doesn't counterattack")

func test_all_six_dice_values():
	# Test card with all dice values [1,2,3,4,5,6]
	var p := [_make_card(2, 5, 0, true, [1, 2, 3, 4, 5, 6])]
	for dice_val in range(1, 7):
		var result := _simulate(dice_val, p.duplicate(true), [], true)
		assert_eq(result[0], 2, "Card attacks on dice %d" % dice_val)
