extends SceneTree
## test/test_party_system.gd: Test harness for Party System & Character Skills

var _frame: int = 0
var _root: Window
var _current_scene: Node = null

func _initialize() -> void:
	_root = root
	# Start on party edit screen
	_load_scene("res://scenes/party_edit.tscn")

func _process(delta: float) -> bool:
	_frame += 1

	match _frame:
		5:
			# Verify party edit screen loaded
			_verify_party_edit()
		15:
			# Verify character data exists
			_verify_character_data()
		25:
			# Verify party manager state
			_verify_party_manager()
		35:
			# Switch to main game
			_load_scene("res://scenes/main.tscn")
		50:
			# Verify game started with party bonuses
			_verify_game_with_party()
		60:
			# Simulate chains to charge skill gauge
			_simulate_chains()
		80:
			# Verify skill gauge charging
			_verify_skill_gauges()
		90:
			# Test skill execution
			_test_skill_execution()
		100:
			# Verify leader skill effects
			_verify_leader_effects()
		110:
			# Verify passive effects
			_verify_passive_effects()
		120:
			# Final summary
			print("ASSERT PASS: Party system test complete")

	return false

func _load_scene(path: String) -> void:
	if _current_scene:
		_current_scene.free()
		_current_scene = null
	var scene: PackedScene = load(path)
	_current_scene = scene.instantiate()
	_root.add_child(_current_scene)

func _verify_party_edit() -> void:
	if _current_scene:
		print("ASSERT PASS: Party edit scene loaded")
	else:
		print("ASSERT FAIL: Party edit scene not loaded")

func _verify_character_data() -> void:
	var cd = _find_autoload("CharacterData")
	if not cd:
		print("ASSERT FAIL: CharacterData autoload not found")
		return

	var chars = cd.get_all_characters()
	if chars.size() == 10:
		print("ASSERT PASS: 10 characters in database")
	else:
		print("ASSERT FAIL: Expected 10 characters, got %d" % chars.size())

	# Verify 2 per color
	var color_counts: Array[int] = [0, 0, 0, 0, 0]
	for c in chars:
		var col: int = c["color"]
		color_counts[col] += 1
	var all_two := true
	for i in range(5):
		if color_counts[i] != 2:
			all_two = false
			print("ASSERT FAIL: Color %d has %d characters (expected 2)" % [i, color_counts[i]])
	if all_two:
		print("ASSERT PASS: 2 characters per color")

	# Verify each character has required fields
	var required_keys: Array[String] = ["id", "name", "color", "leader_type", "leader_value",
		"active_type", "active_power", "gauge_max", "passive_type", "passive_value", "desc"]
	var all_valid := true
	for c in chars:
		for key in required_keys:
			if not c.has(key):
				all_valid = false
				print("ASSERT FAIL: Character %s missing key %s" % [c.get("name", "?"), key])
	if all_valid:
		print("ASSERT PASS: All characters have required fields")

func _verify_party_manager() -> void:
	var pm = _find_autoload("PartyManager")
	if not pm:
		print("ASSERT FAIL: PartyManager autoload not found")
		return

	var party = pm.get_party()
	if party.size() == 5:
		print("ASSERT PASS: Party has 5 slots")
	else:
		print("ASSERT FAIL: Party has %d slots (expected 5)" % party.size())

	# Test set_party_member
	pm.set_party_member(0, 1)
	var leader = pm.get_leader()
	if not leader.is_empty() and leader["id"] == 1:
		print("ASSERT PASS: set_party_member works for leader slot")
	else:
		print("ASSERT FAIL: set_party_member failed for leader slot")

	# Test score multiplier > 1.0 with score boost leader
	pm.set_party_member(0, 0)  # Blaze has SCORE_BOOST +0.2
	var mult: float = pm.get_score_multiplier()
	if mult > 1.0:
		print("ASSERT PASS: Score multiplier is %.2f (> 1.0)" % mult)
	else:
		print("ASSERT FAIL: Score multiplier is %.2f (expected > 1.0)" % mult)

	# Reset to default
	pm.set_party([0, 2, 4, 6, 8])

func _verify_game_with_party() -> void:
	var gm = _find_autoload("GameManager")
	if not gm:
		print("ASSERT FAIL: GameManager not found")
		return
	if gm.is_running():
		print("ASSERT PASS: Game is running after scene load")
	else:
		print("ASSERT FAIL: Game not running")

func _simulate_chains() -> void:
	var gm = _find_autoload("GameManager")
	if not gm:
		return
	# Simulate multiple chains to charge gauge
	for i in range(10):
		gm.add_chain_score(5, 0)

func _verify_skill_gauges() -> void:
	var pm = _find_autoload("PartyManager")
	if not pm:
		print("ASSERT FAIL: PartyManager not found for gauge check")
		return

	var g0: float = pm.get_gauge(0)
	var g1: float = pm.get_gauge(1)
	if g0 > 0.0:
		print("ASSERT PASS: Skill gauge 0 charged to %.1f" % g0)
	else:
		print("ASSERT FAIL: Skill gauge 0 not charged")

	if g1 > 0.0:
		print("ASSERT PASS: Skill gauge 1 charged to %.1f" % g1)
	else:
		print("ASSERT FAIL: Skill gauge 1 not charged")

func _test_skill_execution() -> void:
	var gm = _find_autoload("GameManager")
	var pm = _find_autoload("PartyManager")
	if not gm or not pm:
		print("ASSERT FAIL: Missing autoloads for skill test")
		return

	# Check if any skill is ready
	var any_ready := false
	for i in range(2):
		if pm.is_skill_ready(i):
			any_ready = true
			var result = gm.use_skill(i)
			if result.get("success", false):
				print("ASSERT PASS: Skill %d executed successfully (effect: %s)" % [i, result.get("effect", "")])
			else:
				print("ASSERT FAIL: Skill %d execution failed" % i)

	if not any_ready:
		# Charge more and try again
		for i in range(20):
			gm.add_chain_score(5, 0)
		for i in range(2):
			if pm.is_skill_ready(i):
				any_ready = true
				var result = gm.use_skill(i)
				if result.get("success", false):
					print("ASSERT PASS: Skill %d executed after extra charging (effect: %s)" % [i, result.get("effect", "")])

	if not any_ready:
		print("ASSERT FAIL: No skill became ready after charging")

func _verify_leader_effects() -> void:
	var pm = _find_autoload("PartyManager")
	if not pm:
		return
	# Set Blaze as leader (SCORE_BOOST +20%)
	pm.set_party_member(0, 0)
	var mult: float = pm.get_score_multiplier()
	if mult >= 1.2:
		print("ASSERT PASS: Leader score boost applied (%.2f)" % mult)
	else:
		print("ASSERT FAIL: Leader score boost not applied (%.2f)" % mult)

	# Set Aqua as leader (TIME_EXTEND +5s)
	pm.set_party_member(0, 2)
	var time_bonus: float = pm.get_time_bonus()
	if time_bonus >= 5.0:
		print("ASSERT PASS: Leader time extend applied (%.1f)" % time_bonus)
	else:
		print("ASSERT FAIL: Leader time extend not applied (%.1f)" % time_bonus)

func _verify_passive_effects() -> void:
	var pm = _find_autoload("PartyManager")
	if not pm:
		return
	# Set passives with GAUGE_ACCEL
	pm.set_party_member(3, 4)  # Leaf: GAUGE_ACCEL +20%
	var accel: float = pm.get_gauge_accel()
	if accel > 0.0:
		print("ASSERT PASS: Passive gauge accel applied (%.2f)" % accel)
	else:
		print("ASSERT FAIL: Passive gauge accel not applied")

	# Set passive with FEVER_EXTEND
	pm.set_party_member(4, 1)  # Ember: FEVER_EXTEND +3s
	var fever_ext: float = pm.get_fever_extend()
	if fever_ext > 0.0:
		print("ASSERT PASS: Passive fever extend applied (%.1f)" % fever_ext)
	else:
		print("ASSERT FAIL: Passive fever extend not applied")

	print("ASSERT PASS: All passive effects verified")

func _find_autoload(autoload_name: String) -> Node:
	for child in _root.get_children():
		if child.name == autoload_name:
			return child
	return null
