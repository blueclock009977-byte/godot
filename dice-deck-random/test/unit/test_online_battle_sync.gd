extends GutTest

const OnlineBattleScript = preload("res://scenes/battle/online_battle.gd")

func _new_online_battle() -> Node:
	return OnlineBattleScript.new()

func test_mirror_slot_index_player_view_flip():
	var ob = autofree(_new_online_battle())
	assert_eq(ob._mirror_slot_index(0), 2)
	assert_eq(ob._mirror_slot_index(1), 1)
	assert_eq(ob._mirror_slot_index(2), 0)
	assert_eq(ob._mirror_slot_index(3), 5)
	assert_eq(ob._mirror_slot_index(4), 4)
	assert_eq(ob._mirror_slot_index(5), 3)

func test_to_canonical_slot_index_player1_identity():
	var ob = autofree(_new_online_battle())
	ob.my_player_number = 1
	assert_eq(ob._to_canonical_slot_index(0), 0)
	assert_eq(ob._to_canonical_slot_index(2), 2)
	assert_eq(ob._to_canonical_slot_index(5), 5)

func test_to_canonical_slot_index_player2_mirrored():
	var ob = autofree(_new_online_battle())
	ob.my_player_number = 2
	assert_eq(ob._to_canonical_slot_index(0), 2)
	assert_eq(ob._to_canonical_slot_index(1), 1)
	assert_eq(ob._to_canonical_slot_index(2), 0)
	assert_eq(ob._to_canonical_slot_index(3), 5)

func test_from_canonical_opponent_slot_index_player1_identity():
	var ob = autofree(_new_online_battle())
	ob.my_player_number = 1
	assert_eq(ob._from_canonical_opponent_slot_index(0), 0)
	assert_eq(ob._from_canonical_opponent_slot_index(4), 4)
	assert_eq(ob._from_canonical_opponent_slot_index(5), 5)

func test_from_canonical_opponent_slot_index_player2_mirrored():
	var ob = autofree(_new_online_battle())
	ob.my_player_number = 2
	assert_eq(ob._from_canonical_opponent_slot_index(0), 2)
	assert_eq(ob._from_canonical_opponent_slot_index(1), 1)
	assert_eq(ob._from_canonical_opponent_slot_index(2), 0)
	assert_eq(ob._from_canonical_opponent_slot_index(5), 3)

func test_out_of_turn_summon_is_ignored():
	var ob = autofree(_new_online_battle())
	ob.is_player_turn = true
	ob.opponent_hand_count = 3
	await ob._execute_opponent_action({"type": "summon", "card_id": 1, "slot": 0})
	assert_eq(ob.opponent_hand_count, 3, "Out-of-turn summon must be ignored")

func test_out_of_turn_dice_roll_is_ignored():
	var ob = autofree(_new_online_battle())
	ob.is_player_turn = true
	ob.current_dice = 0
	await ob._execute_opponent_action({"type": "dice_roll", "value": 6})
	assert_eq(ob.current_dice, 0, "Out-of-turn dice_roll must be ignored")
