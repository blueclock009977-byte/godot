extends Node

enum GameState { TITLE, DECK_EDIT, BATTLE, RESULT }

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
	var json_str := JSON.stringify(ids)
	if OS.has_feature("web"):
		var js := "try { localStorage.setItem('ddr_deck', JSON.stringify(%s)); 'ok'; } catch(e) { e.message; }" % json_str
		var result = JavaScriptBridge.eval(js)
		print("[save_deck] result: ", result)
	else:
		var file := FileAccess.open("user://deck.json", FileAccess.WRITE)
		if file:
			file.store_string(json_str)
			file.close()

func load_deck() -> void:
	var text := ""
	if OS.has_feature("web"):
		var result = JavaScriptBridge.eval("localStorage.getItem('ddr_deck') || ''")
		if result != null:
			text = str(result)
		print("[load_deck] loaded: ", text.left(80))
	else:
		var path := "user://deck.json"
		if not FileAccess.file_exists(path):
			return
		var file := FileAccess.open(path, FileAccess.READ)
		if not file:
			return
		text = file.get_as_text()
		file.close()
	if text == "" or text == "null":
		return
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
