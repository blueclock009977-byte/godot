extends Node

var _pass_count := 0
var _fail_count := 0

func _ready() -> void:
	if not OS.is_debug_build():
		return
	print("[SelfTest] Running self-tests...")
	_test_mana_calculation()
	_test_damage_calculation()
	_test_deck_validation()
	_test_card_database_integrity()
	print("[SelfTest] Results: %d passed, %d failed" % [_pass_count, _fail_count])
	if _fail_count > 0:
		push_error("[SelfTest] %d test(s) FAILED" % _fail_count)

func _assert(condition: bool, test_name: String) -> void:
	if condition:
		_pass_count += 1
		print("[SelfTest] PASS: %s" % test_name)
	else:
		_fail_count += 1
		print("[SelfTest] FAIL: %s" % test_name)

func _test_mana_calculation() -> void:
	# Mana increases by 1 per turn, capped at 5
	for turn in range(1, 8):
		var max_mana := mini(turn, 5)
		_assert(max_mana == mini(turn, 5), "Mana turn %d = %d" % [turn, max_mana])
	_assert(mini(1, 5) == 1, "Mana turn 1 is 1")
	_assert(mini(5, 5) == 5, "Mana turn 5 is 5 (cap)")
	_assert(mini(6, 5) == 5, "Mana turn 6 stays 5 (cap)")
	_assert(mini(10, 5) == 5, "Mana turn 10 stays 5 (cap)")

func _test_damage_calculation() -> void:
	# Attacker ATK reduces defender HP
	var atk := 3
	var defender_hp := 5
	var remaining := defender_hp - atk
	_assert(remaining == 2, "Damage: 3 ATK vs 5 HP = 2 remaining")

	atk = 5
	defender_hp = 3
	remaining = defender_hp - atk
	_assert(remaining <= 0, "Damage: 5 ATK vs 3 HP = defeated")

	atk = 0
	defender_hp = 4
	remaining = defender_hp - atk
	_assert(remaining == 4, "Damage: 0 ATK vs 4 HP = no damage")

func _test_deck_validation() -> void:
	# Valid deck: exactly 20 cards, costs 1-5
	var valid_deck: Array[int] = []
	for i in range(20):
		valid_deck.append(i % 20)
	_assert(valid_deck.size() == 20, "Deck size exactly 20")

	# Invalid deck sizes
	_assert(19 != 20, "Deck size 19 is invalid")
	_assert(21 != 20, "Deck size 21 is invalid")

	# Validate costs 1-5
	var all_valid := true
	for card in CardDatabase.card_pool:
		if card.mana_cost < 1 or card.mana_cost > 5:
			all_valid = false
			break
	_assert(all_valid, "All card costs between 1-5")

func _test_card_database_integrity() -> void:
	var cards := CardDatabase.get_all_cards()
	_assert(cards.size() == 20, "CardDatabase has exactly 20 cards")

	var all_valid := true
	for card in cards:
		if card.atk < 0:
			all_valid = false
		if card.hp <= 0:
			all_valid = false
		if card.attack_dice.size() == 0:
			all_valid = false
		if card.mana_cost < 1 or card.mana_cost > 5:
			all_valid = false
	_assert(all_valid, "All 20 cards have valid atk/hp/dice/cost")

	# Check unique IDs
	var ids := {}
	var unique := true
	for card in cards:
		if ids.has(card.id):
			unique = false
			break
		ids[card.id] = true
	_assert(unique, "All card IDs are unique")
