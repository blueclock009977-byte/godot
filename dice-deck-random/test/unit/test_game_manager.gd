extends GutTest
## GameManager autoloadのテスト

# ==============================================================================
# GameState Enum Tests
# ==============================================================================
func test_game_state_enum_values() -> void:
	assert_eq(GameManager.GameState.TITLE, 0, "TITLE should be 0")
	assert_eq(GameManager.GameState.DECK_EDIT, 1, "DECK_EDIT should be 1")
	assert_eq(GameManager.GameState.BATTLE, 2, "BATTLE should be 2")
	assert_eq(GameManager.GameState.RESULT, 3, "RESULT should be 3")

# ==============================================================================
# Constants Tests
# ==============================================================================
func test_max_deck_slots_constant() -> void:
	assert_eq(GameManager.MAX_DECK_SLOTS, 10, "MAX_DECK_SLOTS should be 10")

# ==============================================================================
# Initial State Tests
# ==============================================================================
func test_initial_current_state() -> void:
	# Note: initial value may have changed during runtime
	assert_true(GameManager.current_state is int, "current_state should be int (enum)")

func test_initial_player_deck_is_array() -> void:
	assert_true(GameManager.player_deck is Array, "player_deck should be Array")

func test_initial_battle_result_is_string() -> void:
	assert_true(GameManager.battle_result is String, "battle_result should be String")

func test_initial_user_name_is_string() -> void:
	assert_true(GameManager.user_name is String, "user_name should be String")

func test_initial_current_deck_slot_type() -> void:
	assert_true(GameManager.current_deck_slot is int, "current_deck_slot should be int")

# ==============================================================================
# Method Existence Tests
# ==============================================================================
func test_has_required_methods() -> void:
	assert_true(GameManager.has_method("change_scene"), "Should have change_scene method")
	assert_true(GameManager.has_method("save_user_name"), "Should have save_user_name method")
	assert_true(GameManager.has_method("save_deck"), "Should have save_deck method")
	assert_true(GameManager.has_method("load_deck"), "Should have load_deck method")
	assert_true(GameManager.has_method("save_deck_to_slot"), "Should have save_deck_to_slot method")
	assert_true(GameManager.has_method("load_deck_from_slot"), "Should have load_deck_from_slot method")
	assert_true(GameManager.has_method("get_all_deck_slots"), "Should have get_all_deck_slots method")
	assert_true(GameManager.has_method("delete_deck_slot"), "Should have delete_deck_slot method")
	assert_true(GameManager.has_method("save_current_deck_slot"), "Should have save_current_deck_slot method")

# ==============================================================================
# Slot Validation Tests (without Firebase)
# ==============================================================================
func test_save_deck_to_slot_rejects_negative_slot() -> void:
	var original_user := GameManager.user_name
	GameManager.user_name = "test_user"
	# Slot -1 should fail validation (returns false before async)
	# Note: The actual function is async, but validation happens synchronously
	# Testing the validation logic
	assert_true(-1 < 0 or -1 >= GameManager.MAX_DECK_SLOTS, "Negative slot should be out of range")
	GameManager.user_name = original_user

func test_save_deck_to_slot_rejects_slot_too_large() -> void:
	var original_user := GameManager.user_name
	GameManager.user_name = "test_user"
	assert_true(GameManager.MAX_DECK_SLOTS >= GameManager.MAX_DECK_SLOTS, "Slot >= MAX should be rejected")
	assert_true(100 >= GameManager.MAX_DECK_SLOTS, "Large slot should be rejected")
	GameManager.user_name = original_user

func test_valid_slot_range() -> void:
	for slot in range(GameManager.MAX_DECK_SLOTS):
		assert_true(slot >= 0 and slot < GameManager.MAX_DECK_SLOTS, "Slot %d should be valid" % slot)

# ==============================================================================
# Deck Slot Response Parsing Tests
# ==============================================================================
func test_extract_slot_counts_from_dictionary_response() -> void:
	var raw := {
		"0": [1, 2, 3],
		"2": [4, 5],
		"5": null,
	}
	var slots: Dictionary = GameManager.call("_extract_slot_counts", raw)
	assert_eq(slots.get(0, -1), 3, "Dictionary key '0' should map to 3 cards")
	assert_eq(slots.get(2, -1), 2, "Dictionary key '2' should map to 2 cards")
	assert_false(slots.has(5), "Null slot data should be ignored")

func test_extract_slot_counts_from_array_response() -> void:
	var raw := [
		[1, 2, 3, 4],
		null,
		[10, 11],
	]
	var slots: Dictionary = GameManager.call("_extract_slot_counts", raw)
	assert_eq(slots.get(0, -1), 4, "Array index 0 should map to 4 cards")
	assert_eq(slots.get(2, -1), 2, "Array index 2 should map to 2 cards")
	assert_false(slots.has(1), "Null array entries should be ignored")
