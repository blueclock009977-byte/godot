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
var opponent_name: String = ""
var is_in_room: bool = false

var _poll_timer: Timer
var _last_action_index: int = -1
var _polling: bool = false
var _my_room_created_at: float = 0.0
var _heartbeat_timer: Timer
const HEARTBEAT_INTERVAL := 3.0
const HEARTBEAT_TIMEOUT := 8.0
var last_error: String = ""

func _ready() -> void:
	_poll_timer = Timer.new()
	_poll_timer.wait_time = 0.5
	_poll_timer.timeout.connect(_poll_room)
	add_child(_poll_timer)

	_heartbeat_timer = Timer.new()
	_heartbeat_timer.wait_time = HEARTBEAT_INTERVAL
	_heartbeat_timer.timeout.connect(_send_heartbeat)
	add_child(_heartbeat_timer)

# ─── Room Management ───

func create_room(deck_ids: Array) -> String:
	room_code = _generate_room_code()
	is_host = true
	my_player_number = 1

	var room_data := {
		"status": "waiting",
		"player1": {
			"id": FirebaseManager.player_id,
			"name": GameManager.user_name,
			"deck": deck_ids,
			"ready": true,
			"last_seen": Time.get_unix_time_from_system()
		},
		"game_state": {},
		"actions": {},
		"last_action_index": -1,
		"created_at": Time.get_unix_time_from_system()
	}

	var result := await FirebaseManager.put_data("rooms/%s" % room_code, room_data)
	last_error = "HTTP %d" % result.code
	if result.code == 200:
		is_in_room = true
		_last_action_index = -1
		_poll_timer.start()
		_my_room_created_at = Time.get_unix_time_from_system()
		room_created.emit(room_code)
		_heartbeat_timer.start()
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
	opponent_name = result.data["player1"].get("name", "")

	var player2_data := {
		"id": FirebaseManager.player_id,
		"name": GameManager.user_name,
		"deck": deck_ids,
		"ready": true,
		"last_seen": Time.get_unix_time_from_system()
	}
	var patch_result := await FirebaseManager.patch_data("rooms/%s" % room_code, {
		"player2": player2_data,
		"status": "playing"
	})
	if patch_result.code == 200:
		is_in_room = true
		_last_action_index = -1
		_poll_timer.start()
		_heartbeat_timer.start()
		# ホスト生存確認: 4秒待ってlast_seenが更新されるかチェック
		var pre_check := await FirebaseManager.get_data("rooms/%s/player1/last_seen" % room_code)
		var pre_seen: float = 0.0
		if pre_check.code == 200 and pre_check.data != null:
			pre_seen = float(pre_check.data)
		await get_tree().create_timer(4.0).timeout
		var post_check := await FirebaseManager.get_data("rooms/%s/player1/last_seen" % room_code)
		var post_seen: float = 0.0
		if post_check.code == 200 and post_check.data != null:
			post_seen = float(post_check.data)
		if post_seen <= pre_seen:
			# ホスト死亡 - 部屋を片付けて失敗
			await leave_room()
			await FirebaseManager.delete_data("rooms/%s" % room_code)
			return false
		return true
	return false

func leave_room() -> void:
	if not is_in_room:
		return
	_poll_timer.stop()
	_heartbeat_timer.stop()

	# Check opponent heartbeat
	if is_in_room:
		var opp_key := "player2" if is_host else "player1"
		var hb_result := await FirebaseManager.get_data("rooms/%s/%s/last_seen" % [room_code, opp_key])
		if hb_result.code == 200 and hb_result.data != null:
			var last_seen: float = float(hb_result.data)
			var now := Time.get_unix_time_from_system()
			if now - last_seen > HEARTBEAT_TIMEOUT:
				opponent_disconnected.emit()

	_polling = false
	if room_code != "":
		await FirebaseManager.patch_data("rooms/%s" % room_code, {"status": "finished"})
		# 部屋削除は遅延実行
		var code_to_delete := room_code
		_schedule_room_delete(code_to_delete)
	is_in_room = false
	room_code = ""
	opponent_name = ""
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
					opponent_name = data["player2"].get("name", "")
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

	# Check opponent heartbeat
	var opp_key := "player2" if is_host else "player1"
	var hb_result := await FirebaseManager.get_data("rooms/%s/%s/last_seen" % [room_code, opp_key])
	if hb_result.code == 200 and hb_result.data != null:
		var last_seen: float = float(hb_result.data)
		var now := Time.get_unix_time_from_system()
		if now - last_seen > HEARTBEAT_TIMEOUT:
			opponent_disconnected.emit()
			_polling = false
			return
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

func _send_heartbeat() -> void:
	if not is_in_room:
		return
	var key := "player1" if is_host else "player2"
	await FirebaseManager.put_data("rooms/%s/%s/last_seen" % [room_code, key], Time.get_unix_time_from_system())

func _generate_room_code() -> String:
	var chars := "ABCDEFGHJKLMNPQRSTUVWXYZ"
	var code := ""
	for i in range(6):
		code += chars[randi() % chars.length()]
	return code

func find_waiting_room(only_before: float = 0.0) -> String:
	var result := await FirebaseManager.get_data("rooms")
	last_error = "HTTP %d" % result.code
	var now := Time.get_unix_time_from_system()
	if result.code == 200 and result.data != null and result.data is Dictionary:
		for code in result.data.keys():
			var room: Dictionary = result.data[code]
			if room.get("status", "") == "waiting":
				var created: float = float(room.get("created_at", 0))
				if now - created > 300:
					# 古い部屋を削除
					await FirebaseManager.delete_data("rooms/%s" % code)
					continue
				if only_before > 0.0 and created >= only_before:
					continue
				# ホストが生きてるかチェック（last_seenが5秒以内）
				var p1 = room.get("player1")
				# 自分の部屋はスキップ
				if code == room_code:
					continue
				if p1 is Dictionary and p1.get("id", "") == FirebaseManager.player_id:
					continue
				if p1 is Dictionary:
					var last_seen: float = float(p1.get("last_seen", 0))
					if last_seen > 0 and now - last_seen > 5.0:
						# ホスト死亡、部屋を削除
						await FirebaseManager.delete_data("rooms/%s" % code)
						continue
				return code

	return ""

func _schedule_room_delete(code: String) -> void:
	await get_tree().create_timer(5.0).timeout
	await FirebaseManager.delete_data("rooms/%s" % code)
