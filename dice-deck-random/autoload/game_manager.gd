extends Node

enum GameState { TITLE, DECK_EDIT, BATTLE, RESULT }

var current_state: GameState = GameState.TITLE
var player_deck: Array = []
var battle_result: String = ""
var user_name: String = ""
var current_deck_slot: int = -1  # -1 = デッキ未設定

func _ready() -> void:
	_load_user_name()
	_load_current_deck_slot()
	if user_name != "":
		FirebaseManager.player_id = user_name
		_restore_deck_on_startup()

func change_scene(scene_path: String) -> void:
	get_tree().change_scene_to_file(scene_path)

func _load_user_name() -> void:
	if OS.has_feature("web"):
		var result = JavaScriptBridge.eval("localStorage.getItem('ddr_user_name') || ''")
		if result != null and str(result) != "":
			user_name = str(result)
	else:
		var path := "user://user_name.txt"
		if FileAccess.file_exists(path):
			var f := FileAccess.open(path, FileAccess.READ)
			if f:
				user_name = f.get_as_text().strip_edges()
				f.close()

func save_user_name(name: String) -> void:
	user_name = name
	if OS.has_feature("web"):
		JavaScriptBridge.eval("localStorage.setItem('ddr_user_name', '%s')" % name)
	else:
		var f := FileAccess.open("user://user_name.txt", FileAccess.WRITE)
		if f:
			f.store_string(name)
			f.close()

func save_deck() -> void:
	if user_name == "":
		return
	var ids: Array[int] = []
	for card in player_deck:
		ids.append(card.id)
	var json_str := JSON.stringify(ids)
	# Save to Firebase
	await FirebaseManager.put_data("users/%s/deck" % user_name, ids)

func load_deck() -> void:
	if user_name == "":
		return
	var result := await FirebaseManager.get_data("users/%s/deck" % user_name)
	if result.code != 200 or result.data == null:
		return
	var ids = result.data
	if ids is not Array:
		return
	player_deck = []
	for id in ids:
		var card := CardDatabase.get_card_by_id(int(id))
		if card:
			player_deck.append(card.duplicate_card())

const MAX_DECK_SLOTS := 10

func save_deck_to_slot(slot: int, deck: Array) -> bool:
	if user_name == "" or slot < 0 or slot >= MAX_DECK_SLOTS:
		return false
	var ids: Array[int] = []
	for card in deck:
		ids.append(card.id)
	var result := await FirebaseManager.put_data("users/%s/decks/%d" % [user_name, slot], ids)
	return result.code == 200

func load_deck_from_slot(slot: int) -> Array:
	if user_name == "" or slot < 0 or slot >= MAX_DECK_SLOTS:
		return []
	var result := await FirebaseManager.get_data("users/%s/decks/%d" % [user_name, slot])
	if result.code != 200 or result.data == null:
		return []
	var ids = result.data
	if ids is not Array:
		return []
	var deck: Array = []
	for id in ids:
		var card := CardDatabase.get_card_by_id(int(id))
		if card:
			deck.append(card.duplicate_card())
	return deck

func get_all_deck_slots() -> Dictionary:
	"""全スロットのデッキ情報を取得（スロット番号 -> カード枚数）"""
	if user_name == "":
		return {}
	var result := await FirebaseManager.get_data("users/%s/decks" % user_name)
	if result.code != 200 or result.data == null:
		return {}
	var slots := {}
	if result.data is Dictionary:
		for key in result.data:
			var ids = result.data[key]
			if ids is Array:
				slots[int(key)] = ids.size()
	return slots

func delete_deck_slot(slot: int) -> void:
	if user_name == "" or slot < 0 or slot >= MAX_DECK_SLOTS:
		return
	await FirebaseManager.delete_data("users/%s/decks/%d" % [user_name, slot])

func _load_current_deck_slot() -> void:
	if OS.has_feature("web"):
		var result = JavaScriptBridge.eval("localStorage.getItem('ddr_current_deck_slot')")
		if result != null and str(result) != "" and str(result) != "null":
			current_deck_slot = int(str(result))
	else:
		var path := "user://current_deck_slot.txt"
		if FileAccess.file_exists(path):
			var f := FileAccess.open(path, FileAccess.READ)
			if f:
				var val := f.get_as_text().strip_edges()
				if val.is_valid_int():
					current_deck_slot = int(val)
				f.close()

func save_current_deck_slot(slot: int) -> void:
	current_deck_slot = slot
	if OS.has_feature("web"):
		JavaScriptBridge.eval("localStorage.setItem('ddr_current_deck_slot', '%d')" % slot)
	else:
		var f := FileAccess.open("user://current_deck_slot.txt", FileAccess.WRITE)
		if f:
			f.store_string(str(slot))
			f.close()

func _restore_deck_on_startup() -> void:
	if current_deck_slot >= 0 and current_deck_slot < MAX_DECK_SLOTS:
		var deck := await load_deck_from_slot(current_deck_slot)
		if deck.size() > 0:
			player_deck = deck
		else:
			current_deck_slot = -1
			save_current_deck_slot(-1)
