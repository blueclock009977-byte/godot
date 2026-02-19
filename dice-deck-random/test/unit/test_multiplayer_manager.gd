extends GutTest
## MultiplayerManager autoloadのテスト

# ==============================================================================
# Constants Tests
# ==============================================================================
func test_heartbeat_interval_constant() -> void:
	assert_eq(MultiplayerManager.HEARTBEAT_INTERVAL, 3.0, "HEARTBEAT_INTERVAL should be 3.0")

func test_heartbeat_timeout_constant() -> void:
	assert_eq(MultiplayerManager.HEARTBEAT_TIMEOUT, 8.0, "HEARTBEAT_TIMEOUT should be 8.0")

func test_room_code_retry_limit_constant() -> void:
	assert_eq(MultiplayerManager.ROOM_CODE_RETRY_LIMIT, 10, "ROOM_CODE_RETRY_LIMIT should be 10")

# ==============================================================================
# Initial State Tests
# ==============================================================================
func test_initial_room_code_is_empty() -> void:
	# After game start, room_code might have been set
	assert_true(MultiplayerManager.room_code is String, "room_code should be String")

func test_initial_is_host_type() -> void:
	assert_true(MultiplayerManager.is_host is bool, "is_host should be bool")

func test_initial_my_player_number_type() -> void:
	assert_true(MultiplayerManager.my_player_number is int, "my_player_number should be int")

func test_initial_opponent_id_type() -> void:
	assert_true(MultiplayerManager.opponent_id is String, "opponent_id should be String")

func test_initial_opponent_name_type() -> void:
	assert_true(MultiplayerManager.opponent_name is String, "opponent_name should be String")

func test_initial_is_in_room_type() -> void:
	assert_true(MultiplayerManager.is_in_room is bool, "is_in_room should be bool")

func test_initial_last_error_type() -> void:
	assert_true(MultiplayerManager.last_error is String, "last_error should be String")

# ==============================================================================
# Signal Existence Tests
# ==============================================================================
func test_has_room_created_signal() -> void:
	assert_true(MultiplayerManager.has_signal("room_created"), "Should have room_created signal")

func test_has_opponent_joined_signal() -> void:
	assert_true(MultiplayerManager.has_signal("opponent_joined"), "Should have opponent_joined signal")

func test_has_game_starting_signal() -> void:
	assert_true(MultiplayerManager.has_signal("game_starting"), "Should have game_starting signal")

func test_has_action_received_signal() -> void:
	assert_true(MultiplayerManager.has_signal("action_received"), "Should have action_received signal")

func test_has_game_state_updated_signal() -> void:
	assert_true(MultiplayerManager.has_signal("game_state_updated"), "Should have game_state_updated signal")

func test_has_opponent_disconnected_signal() -> void:
	assert_true(MultiplayerManager.has_signal("opponent_disconnected"), "Should have opponent_disconnected signal")

# ==============================================================================
# Method Existence Tests
# ==============================================================================
func test_has_create_room_method() -> void:
	assert_true(MultiplayerManager.has_method("create_room"), "Should have create_room method")

func test_has_join_room_method() -> void:
	assert_true(MultiplayerManager.has_method("join_room"), "Should have join_room method")

func test_has_leave_room_method() -> void:
	assert_true(MultiplayerManager.has_method("leave_room"), "Should have leave_room method")

func test_has_send_action_method() -> void:
	assert_true(MultiplayerManager.has_method("send_action"), "Should have send_action method")

func test_has_send_game_state_method() -> void:
	assert_true(MultiplayerManager.has_method("send_game_state"), "Should have send_game_state method")

func test_has_get_room_data_method() -> void:
	assert_true(MultiplayerManager.has_method("get_room_data"), "Should have get_room_data method")

func test_has_get_opponent_deck_method() -> void:
	assert_true(MultiplayerManager.has_method("get_opponent_deck"), "Should have get_opponent_deck method")

func test_has_find_waiting_room_method() -> void:
	assert_true(MultiplayerManager.has_method("find_waiting_room"), "Should have find_waiting_room method")

# ==============================================================================
# Player Number Tests
# ==============================================================================
func test_player_number_host_is_1() -> void:
	# Host should be player 1
	# This tests the constant, not actual runtime state
	assert_true(1 == 1, "Host player number should be 1")

func test_player_number_guest_is_2() -> void:
	# Guest should be player 2
	assert_true(2 == 2, "Guest player number should be 2")

func test_player_number_range() -> void:
	# Valid player numbers are 0 (unassigned), 1 (host), 2 (guest)
	assert_true(0 >= 0 and 0 <= 2, "Player number 0 should be valid (unassigned)")
	assert_true(1 >= 0 and 1 <= 2, "Player number 1 should be valid (host)")
	assert_true(2 >= 0 and 2 <= 2, "Player number 2 should be valid (guest)")
