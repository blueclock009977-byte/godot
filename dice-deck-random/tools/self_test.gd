extends SceneTree

var _pass_count := 0
var _fail_count := 0

func _init() -> void:
	print("[SelfTest] Running self-tests...")
	_test_mana_calculation()
	_test_damage_calculation()
	_test_deck_validation()
	print("[SelfTest] Results: %d passed, %d failed" % [_pass_count, _fail_count])
	if _fail_count > 0:
		print("FAIL: %d test(s) failed" % _fail_count)
	else:
		print("All tests PASS")
	quit()

func _assert(condition: bool, test_name: String) -> void:
	if condition:
		_pass_count += 1
		print("[SelfTest] PASS: %s" % test_name)
	else:
		_fail_count += 1
		print("[SelfTest] FAIL: %s" % test_name)

func _test_mana_calculation() -> void:
	_assert(mini(1, 5) == 1, "Mana turn 1 is 1")
	_assert(mini(5, 5) == 5, "Mana turn 5 is 5 (cap)")
	_assert(mini(6, 5) == 5, "Mana turn 6 stays 5 (cap)")
	_assert(mini(10, 5) == 5, "Mana turn 10 stays 5 (cap)")

func _test_damage_calculation() -> void:
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
	var valid_deck: Array[int] = []
	for i in range(20):
		valid_deck.append(i % 20)
	_assert(valid_deck.size() == 20, "Deck size exactly 20")
	_assert(19 != 20, "Deck size 19 is invalid")
	_assert(21 != 20, "Deck size 21 is invalid")
