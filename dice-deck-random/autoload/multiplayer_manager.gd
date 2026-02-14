extends Node

## Room-based matchmaking and game state sync via Firebase REST API.

signal room_created(room_code: String)
signal opponent_joined()
signal game_starting()
signal action_received(action: Dictionary)
signal game_state_updated(state: Dictionary)
signal opponent_disconnected()

var room_code: String = ""
var is_host: bool = false  # player1 = host
var my_player_number: int = 0  # 1 or 2
var opponent_id: String = ""
var is_in_room: bool = false

var _poll_timer: Timer
var _last_action_index: int = -1
var _polling: bool = false

func _ready() -> void:
	_poll_timer = Timer.new()
	_poll_timer.wait_time = 0.5
	_poll_timer.timeout.connect(_poll_room)
	add_child(_poll_timer)

# ─── Room Management ───

func create_room(deck_ids: Array) -> String:
	room_code = _generate_room_code()
	is_host = true
	my_player_number = 1

	var room_data := {
		"status": "waiting",
		"player1": {
			"id": FirebaseManager.player_id,
			"deck": deck_ids,
			"ready": true
		},
		"game_state": {},
		"actions": {},
		"last_action_index": -1,
		"created_at": Time.get_unix_time_from_system()
	}

	var result := await FirebaseManager.put_data("rooms/%s" % room_code, room_data)
	if result.code == 200:
		is_in_room = true
		_last_action_index = -1
		_poll_timer.start()
		room_created.emit(room_code)
		return room_code
	return ""

func join_room(code: String, deck_ids: Array) -> bool:
	room_code = code.to_upper()
	var result := await FirebaseManager.get_data("rooms/%s" % room_code)
	if result.code != 200 or result.data == null:
		return false
	if result.data.get("status") != "waiting":
		return false
	if result.data.get("player2") != null:
		return false

	is_host = false
	my_player_number = 2
	opponent_id = result.data["player1"]["id"]

	var player2_data := {
		"id": FirebaseManager.player_id,
		"deck": deck_ids,
		"ready": true
	}
	var patch_result := await FirebaseManager.patch_data("rooms/%s" % room_code, {
		"player2": player2_data,
		"status": "playing"
	})
	if patch_result.code == 200:
		is_in_room = true
		_last_action_index = -1
		_poll_timer.start()
		return true
	return false

func leave_room() -> void:
	if not is_in_room:
		return
	_poll_timer.stop()
	_polling = false
	if room_code != "":
		await FirebaseManager.patch_data("rooms/%s" % room_code, {"status": "finished"})
	is_in_room = false
	room_code = ""
	_last_action_index = -1

# ─── Actions ───

func send_action(action: Dictionary) -> void:
	if not is_in_room:
		return
	action["player"] = my_player_number
	action["timestamp"] = Time.get_unix_time_from_system()

	# Get current last_action_index, increment, write
	var result := await FirebaseManager.get_data("rooms/%s/last_action_index" % room_code)
	var idx: int = -1
	if result.data != null:
		idx = int(result.data)
	idx += 1

	await FirebaseManager.put_data("rooms/%s/actions/%d" % [room_code, idx], action)
	await FirebaseManager.put_data("rooms/%s/last_action_index" % room_code, idx)
	_last_action_index = idx

func send_game_state(state: Dictionary) -> void:
	if not is_in_room:
		return
	await FirebaseManager.put_data("rooms/%s/game_state" % room_code, state)

# ─── Polling ───

func _poll_room() -> void:
	if _polling or not is_in_room:
		return
	_polling = true

	# Check for opponent join (host waiting)
	if is_host:
		var room_result := await FirebaseManager.get_data("rooms/%s" % room_code)
		if room_result.code == 200 and room_result.data != null:
			var data: Dictionary = room_result.data
			if data.get("status") == "playing" and data.get("player2") != null:
				if opponent_id == "":
					opponent_id = data["player2"]["id"]
					opponent_joined.emit()
			if data.get("status") == "finished":
				opponent_disconnected.emit()

	# Check for new actions
	var idx_result := await FirebaseManager.get_data("rooms/%s/last_action_index" % room_code)
	if idx_result.code == 200 and idx_result.data != null:
		var remote_idx: int = int(idx_result.data)
		while _last_action_index < remote_idx:
			var next_idx := _last_action_index + 1
			var action_result := await FirebaseManager.get_data("rooms/%s/actions/%d" % [room_code, next_idx])
			if action_result.code == 200 and action_result.data != null:
				var action: Dictionary = action_result.data
				# Only emit actions from opponent
				if int(action.get("player", 0)) != my_player_number:
					action_received.emit(action)
				_last_action_index = next_idx
			else:
				break

	_polling = false

func get_room_data() -> Dictionary:
	var result := await FirebaseManager.get_data("rooms/%s" % room_code)
	if result.code == 200 and result.data != null:
		return result.data
	return {}

func get_opponent_deck() -> Array:
	var key := "player1" if my_player_number == 2 else "player2"
	var result := await FirebaseManager.get_data("rooms/%s/%s/deck" % [room_code, key])
	if result.code == 200 and result.data != null:
		return Array(result.data)
	return []

func _generate_room_code() -> String:
	var chars := "ABCDEFGHJKLMNPQRSTUVWXYZ"
	var code := ""
	for i in range(6):
		code += chars[randi() % chars.length()]
	return code
