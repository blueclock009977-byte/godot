extends Node

enum GameState { TITLE, DECK_EDIT, BATTLE, RESULT }

const DECK_SAVE_PATH := "user://deck.json"

var current_state: GameState = GameState.TITLE
var player_deck: Array = []
var battle_result: String = ""

func _ready() -> void:
	load_deck()

func change_scene(scene_path: String) -> void:
	get_tree().change_scene_to_file(scene_path)

func save_deck() -> void:
	var ids: Array[int] = []
	for card in player_deck:
		ids.append(card.id)
	var file := FileAccess.open(DECK_SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(ids))
		file.close()
		_sync_fs()

func _sync_fs() -> void:
	if OS.get_name() == "Web":
		if OS.has_feature("web"):
			var js_code := "if (window.Module && Module.FS) { Module.FS.syncfs(false, function(err) { if(err) console.error('FS sync error:', err); }); }"
			JavaScriptBridge.eval(js_code)

func load_deck() -> void:
	if not FileAccess.file_exists(DECK_SAVE_PATH):
		return
	var file := FileAccess.open(DECK_SAVE_PATH, FileAccess.READ)
	if not file:
		return
	var text := file.get_as_text()
	file.close()
	var json := JSON.new()
	if json.parse(text) != OK:
		return
	var ids = json.data
	if ids is not Array:
		return
	player_deck = []
	for id in ids:
		var card := CardDatabase.get_card_by_id(int(id))
		if card:
			player_deck.append(card.duplicate_card())
