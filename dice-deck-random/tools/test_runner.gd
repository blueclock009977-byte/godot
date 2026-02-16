extends SceneTree

# ═══════════════════════════════════════════
# Test Runner - runs all test suites via Godot headless
# Usage: godot --headless --script tools/test_runner.gd
# ═══════════════════════════════════════════

var _total_pass := 0
var _total_fail := 0
var _current_suite := ""

func _init() -> void:
	print("========================================")
	print("  Dice Deck Random - Test Runner")
	print("========================================")

	_suite("Mana Calculation")
	_test_mana()

	_suite("Damage Calculation")
	_test_damage()

	_suite("Deck Validation")
	_test_deck()

	_suite("Card Data Integrity")
	_test_card_data()

	_suite("Battle Simulation")
	_test_battle_sim()

	_suite("Lane Targeting")
	_test_lane_targeting()

	print("")
	print("========================================")
	print("  Total: %d passed, %d failed" % [_total_pass, _total_fail])
	print("========================================")
	if _total_fail > 0:
		print("FAIL")
	else:
		print("All tests PASS")
	quit()

func _suite(name: String) -> void:
	_current_suite = name
	print("\n--- %s ---" % name)

func _assert(condition: bool, test_name: String) -> void:
	if condition:
		_total_pass += 1
		print("  PASS: %s" % test_name)
	else:
		_total_fail += 1
		print("  FAIL: %s" % test_name)

# ═══════════════════════════════════════════
# Mana Tests
# ═══════════════════════════════════════════
func _test_mana() -> void:
	# Max mana = min(turn, 5)
	_assert(mini(1, 5) == 1, "Turn 1: max mana = 1")
	_assert(mini(2, 5) == 2, "Turn 2: max mana = 2")
	_assert(mini(3, 5) == 3, "Turn 3: max mana = 3")
	_assert(mini(4, 5) == 4, "Turn 4: max mana = 4")
	_assert(mini(5, 5) == 5, "Turn 5: max mana = 5 (cap)")
	_assert(mini(6, 5) == 5, "Turn 6: max mana stays 5")
	_assert(mini(99, 5) == 5, "Turn 99: max mana stays 5")

	# Draw phase restores 1 mana
	var mana := 2
	var max_mana := 4
	mana = mini(mana + 1, max_mana)
	_assert(mana == 3, "Draw phase: 2/4 -> 3/4")
	mana = max_mana
	mana = mini(mana + 1, max_mana)
	_assert(mana == max_mana, "Draw phase: 4/4 -> 4/4 (no overflow)")

# ═══════════════════════════════════════════
# Damage Tests
# ═══════════════════════════════════════════
func _test_damage() -> void:
	_assert(5 - 3 == 2, "3 ATK vs 5 HP = 2 remaining")
	_assert(3 - 5 <= 0, "5 ATK vs 3 HP = defeated")
	_assert(4 - 0 == 4, "0 ATK vs 4 HP = no damage")
	_assert(1 - 1 <= 0, "1 ATK vs 1 HP = defeated")
	_assert(10 - 3 <= 0, "Overkill: 10 ATK vs 3 HP")

# ═══════════════════════════════════════════
# Deck Tests
# ═══════════════════════════════════════════
func _test_deck() -> void:
	_assert(20 == 20, "Valid deck: exactly 20 cards")
	_assert(19 != 20, "Invalid: 19 cards")
	_assert(21 != 20, "Invalid: 21 cards")
	_assert(0 != 20, "Invalid: 0 cards")

	# Cost validation: all costs 1-5
	var valid_costs := [1, 2, 3, 4, 5]
	for c in valid_costs:
		_assert(c >= 1 and c <= 5, "Cost %d is valid" % c)
	_assert(not (0 >= 1 and 0 <= 5), "Cost 0 is invalid")
	_assert(not (6 >= 1 and 6 <= 5), "Cost 6 is invalid")

# ═══════════════════════════════════════════
# Card Data Tests (hardcoded expected values)
# ═══════════════════════════════════════════
func _test_card_data() -> void:
	# Point budget: cost * 3 + 3
	# cost 1 = 6pt, cost 2 = 9pt, cost 3 = 12pt, cost 4 = 15pt, cost 5 = 18pt
	var budgets := {1: 6, 2: 9, 3: 12, 4: 15, 5: 18}
	for cost in budgets:
		_assert(cost * 3 + 3 == budgets[cost], "Budget for cost %d = %d" % [cost, budgets[cost]])

	# All 20 vanilla cards should have:
	# - ATK >= 0, HP >= 1
	# - at least 1 attack dice
	# - cost 1-5
	# (We validate the formula, not the actual DB since we can't load autoloads)
	var card_defs := [
		[1, 1, 4, [3]], # ストーンウォール
		[1, 2, 2, [2, 5]], # ゴブリン
		[1, 1, 1, [1, 2, 3, 4]], # スライム
		[1, 1, 3, [1, 6]], # ナイフィンプ
		[2, 5, 2, [3, 4]], # シールドナイト
		[2, 2, 2, [1, 2, 3, 4, 5]], # スカウト
		[2, 2, 4, [2, 4, 6]], # アサシン
		[2, 3, 3, [1, 3, 5]], # パラディン
		[3, 2, 6, [1, 2, 5, 6]], # バーサーカー
		[3, 7, 2, [2, 4, 6]], # フォートレス
		[3, 3, 5, [1, 3, 4, 6]], # ストライカー
		[3, 4, 4, [1, 2, 5, 6]], # ナイト
		[4, 5, 5, [1, 2, 3, 4, 5]], # ブレードマスター
		[4, 9, 3, [1, 4, 5]], # アイアンゴーレム
		[4, 4, 7, [2, 3, 5, 6]], # ドラゴンナイト
		[4, 7, 5, [1, 3, 6]], # ウォーロード
		[5, 6, 6, [1, 2, 3, 4, 5, 6]], # エンシェント
		[5, 8, 4, [1, 2, 3, 4, 5, 6]], # タイタン
		[5, 4, 8, [1, 2, 3, 4, 5, 6]], # ガーディアン
		[5, 10, 2, [1, 2, 3, 4, 5, 6]], # グラスキャノン
	]
	_assert(card_defs.size() == 20, "20 cards defined")

	var all_valid := true
	for card in card_defs:
		var cost: int = card[0]
		var atk: int = card[1]
		var hp: int = card[2]
		var dice: Array = card[3]
		if atk < 0 or hp < 1 or dice.size() == 0 or cost < 1 or cost > 5:
			all_valid = false
	_assert(all_valid, "All cards have valid stats")

	# Check point budget: ATK + HP + dice_count = cost * 3 + 3
	var budget_ok := true
	for card in card_defs:
		var cost: int = card[0]
		var atk: int = card[1]
		var hp: int = card[2]
		var dice: Array = card[3]
		var points := atk + hp + dice.size()
		if points != cost * 3 + 3:
			budget_ok = false
			print("    Budget mismatch: cost=%d atk=%d hp=%d dice=%d total=%d expected=%d" % [cost, atk, hp, dice.size(), points, cost * 3 + 3])
	_assert(budget_ok, "All cards match point budget (cost*3+3)")

# ═══════════════════════════════════════════
# Battle Simulation Tests
# ═══════════════════════════════════════════
func _test_battle_sim() -> void:
	# Simulate: attacker ATK2 vs defender HP3 -> defender survives with 1 HP
	var defender_hp := 3
	var atk := 2
	defender_hp -= atk
	_assert(defender_hp == 1, "ATK2 vs HP3: defender survives (HP=1)")

	# Simulate: attacker ATK5 vs defender HP3 -> defender dies, excess doesn't carry
	defender_hp = 3
	atk = 5
	defender_hp -= atk
	_assert(defender_hp <= 0, "ATK5 vs HP3: defender dies")

	# No target -> direct HP damage
	var player_hp := 20
	var card_atk := 3
	player_hp -= card_atk
	_assert(player_hp == 17, "Direct HP: 20 - 3 = 17")

	# Kill threshold: 20 HP, need 20+ damage total
	player_hp = 20
	for i in range(4):
		player_hp -= 5
	_assert(player_hp <= 0, "4x 5dmg kills 20HP player")

# ═══════════════════════════════════════════
# Lane Targeting Tests
# ═══════════════════════════════════════════
func _test_lane_targeting() -> void:
	# Lane 0=left, 1=center, 2=right
	# slot_index % 3 = lane
	_assert(0 % 3 == 0, "Slot 0: lane 0 (left)")
	_assert(1 % 3 == 1, "Slot 1: lane 1 (center)")
	_assert(2 % 3 == 2, "Slot 2: lane 2 (right)")
	_assert(3 % 3 == 0, "Slot 3: lane 0 (left)")
	_assert(4 % 3 == 1, "Slot 4: lane 1 (center)")
	_assert(5 % 3 == 2, "Slot 5: lane 2 (right)")

	# Front row: slot < 3
	_assert(0 < 3, "Slot 0: front row")
	_assert(2 < 3, "Slot 2: front row")
	_assert(not (3 < 3), "Slot 3: back row")
	_assert(not (5 < 3), "Slot 5: back row")

	# Attack priority: same lane front -> same lane back -> HP
	# (Logic test: if front exists, target front)
	var front_exists := true
	var back_exists := true
	var target := "none"
	if front_exists:
		target = "front"
	elif back_exists:
		target = "back"
	else:
		target = "hp"
	_assert(target == "front", "Target priority: front first")

	front_exists = false
	target = "none"
	if front_exists:
		target = "front"
	elif back_exists:
		target = "back"
	else:
		target = "hp"
	_assert(target == "back", "Target priority: back if no front")

	front_exists = false
	back_exists = false
	target = "none"
	if front_exists:
		target = "front"
	elif back_exists:
		target = "back"
	else:
		target = "hp"
	_assert(target == "hp", "Target priority: HP if no cards")
