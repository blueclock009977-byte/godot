extends Node

## Firebase Realtime Database REST API wrapper for Godot 4.4+ Web export.
## Uses HTTPRequest nodes with polling (no SSE for prototype simplicity).

const FIREBASE_URL := "https://dicedeckrandomtcg-default-rtdb.firebaseio.com"

var player_id: String = ""

func _ready() -> void:
	_load_or_create_player_id()

func _load_or_create_player_id() -> void:
	var path := "user://player_id.txt"
	if FileAccess.file_exists(path):
		var f := FileAccess.open(path, FileAccess.READ)
		if f:
			player_id = f.get_as_text().strip_edges()
			f.close()
			if player_id.length() > 0:
				return
	var chars := "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	player_id = ""
	for i in range(16):
		player_id += chars[randi() % chars.length()]
	var f := FileAccess.open(path, FileAccess.WRITE)
	if f:
		f.store_string(player_id)
		f.close()

# ─── HTTP helpers ───

func _create_request() -> HTTPRequest:
	var req := HTTPRequest.new()
	add_child(req)
	return req

func put_data(path: String, data: Variant) -> Dictionary:
	var req := _create_request()
	var url := "%s/%s.json" % [FIREBASE_URL, path]
	var body := JSON.stringify(data)
	var headers := ["Content-Type: application/json"]
	req.request(url, headers, HTTPClient.METHOD_PUT, body)
	var result: Array = await req.request_completed
	req.queue_free()
	return _parse_response(result)

func patch_data(path: String, data: Dictionary) -> Dictionary:
	var req := _create_request()
	var url := "%s/%s.json" % [FIREBASE_URL, path]
	var body := JSON.stringify(data)
	var headers := ["Content-Type: application/json", "X-HTTP-Method-Override: PATCH"]
	req.request(url, headers, HTTPClient.METHOD_PUT, body)
	var result: Array = await req.request_completed
	req.queue_free()
	return _parse_response(result)

func get_data(path: String) -> Dictionary:
	var req := _create_request()
	var url := "%s/%s.json" % [FIREBASE_URL, path]
	req.request(url, [], HTTPClient.METHOD_GET)
	var result: Array = await req.request_completed
	req.queue_free()
	return _parse_response(result)

func delete_data(path: String) -> Dictionary:
	var req := _create_request()
	var url := "%s/%s.json" % [FIREBASE_URL, path]
	req.request(url, [], HTTPClient.METHOD_DELETE)
	var result: Array = await req.request_completed
	req.queue_free()
	return _parse_response(result)

func _parse_response(result: Array) -> Dictionary:
	var result_code: int = result[0]
	var response_code: int = result[1]
	var body: PackedByteArray = result[3]
	var body_str := body.get_string_from_utf8()
	if response_code != 200:
		print("[Firebase] HTTP %d (result: %d) body: %s" % [response_code, result_code, body_str.left(500)])
	var parsed = null
	if body_str.length() > 0:
		var json := JSON.new()
		if json.parse(body_str) == OK:
			parsed = json.data
	return {"code": response_code, "data": parsed}
