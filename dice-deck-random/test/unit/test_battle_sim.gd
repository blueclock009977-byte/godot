extends GutTest

# Standalone simulation (same logic as battle.gd _simulate_battle)
func _sim_find_target(attacker: Dictionary, defenders: Array):
	var lane: int = attacker["lane"]
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and d["is_front"]:
			return d
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and not d["is_front"]:
			return d
	return null

func _simulate(dice_val: int, p_cards: Array, o_cards: Array, is_player_turn: bool) -> Array:
	var turn_cards: Array
	var def_cards: Array
	if is_player_turn:
		turn_cards = p_cards
		def_cards = o_cards
	else:
		turn_cards = o_cards
		def_cards = p_cards

	var dmg_to_opp := 0
	var dmg_to_me := 0

	for card in turn_cards:
		if card["hp"] <= 0:
			continue
		var dice_arr: Array = card["dice"]
		if not dice_arr.has(dice_val):
			continue
		var target = _sim_find_target(card, def_cards)
		if target == null:
			if is_player_turn:
				dmg_to_opp += card["atk"]
			else:
				dmg_to_me += card["atk"]
		else:
			target["hp"] -= card["atk"]
			if is_player_turn:
				dmg_to_opp += card["atk"]
			else:
				dmg_to_me += card["atk"]

	for card in def_cards:
		if card["hp"] <= 0:
			continue
		var dice_arr: Array = card["dice"]
		if not dice_arr.has(dice_val):
			continue
		var target = _sim_find_target(card, turn_cards)
		if target == null:
			if is_player_turn:
				dmg_to_me += card["atk"]
			else:
				dmg_to_opp += card["atk"]
		else:
			target["hp"] -= card["atk"]
			if is_player_turn:
				dmg_to_me += card["atk"]
			else:
				dmg_to_opp += card["atk"]

	return [dmg_to_opp, dmg_to_me]

func _make_card(atk: int, hp: int, lane: int, is_front: bool, dice: Array) -> Dictionary:
	return {"atk": atk, "hp": hp, "lane": lane, "is_front": is_front, "dice": dice, "idx": lane + (0 if is_front else 3)}

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
