extends Control

var room_code_input: LineEdit
var status_label: Label
var create_btn: Button
var join_btn: Button
var back_btn: Button
var room_code_display: Label
var waiting_panel: VBoxContainer

func _ready() -> void:
	_build_ui()
	MultiplayerManager.opponent_joined.connect(_on_opponent_joined)

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var vbox := VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	vbox.offset_left = -220
	vbox.offset_right = 220
	vbox.offset_top = -350
	vbox.offset_bottom = 350
	vbox.add_theme_constant_override("separation", 30)
	add_child(vbox)

	var title := Label.new()
	title.text = "Online Battle"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 42)
	vbox.add_child(title)

	# Create room button
	create_btn = Button.new()
	create_btn.text = "Create Room"
	create_btn.custom_minimum_size.y = 80
	create_btn.add_theme_font_size_override("font_size", 28)
	create_btn.pressed.connect(_on_create_room)
	vbox.add_child(create_btn)

	# Separator
	var sep_label := Label.new()
	sep_label.text = "── OR ──"
	sep_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sep_label.add_theme_font_size_override("font_size", 20)
	sep_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	vbox.add_child(sep_label)

	# Join room
	var join_label := Label.new()
	join_label.text = "Enter Room Code:"
	join_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	join_label.add_theme_font_size_override("font_size", 22)
	vbox.add_child(join_label)

	room_code_input = LineEdit.new()
	room_code_input.placeholder_text = "ABCDEF"
	room_code_input.alignment = HORIZONTAL_ALIGNMENT_CENTER
	room_code_input.add_theme_font_size_override("font_size", 32)
	room_code_input.max_length = 6
	room_code_input.custom_minimum_size.y = 60
	vbox.add_child(room_code_input)

	join_btn = Button.new()
	join_btn.text = "Join Room"
	join_btn.custom_minimum_size.y = 80
	join_btn.add_theme_font_size_override("font_size", 28)
	join_btn.pressed.connect(_on_join_room)
	vbox.add_child(join_btn)

	# Status
	status_label = Label.new()
	status_label.text = ""
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.add_theme_font_size_override("font_size", 22)
	status_label.add_theme_color_override("font_color", Color(1, 0.8, 0.3))
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	vbox.add_child(status_label)

	# Room code display (shown when waiting)
	room_code_display = Label.new()
	room_code_display.text = ""
	room_code_display.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	room_code_display.add_theme_font_size_override("font_size", 48)
	room_code_display.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	vbox.add_child(room_code_display)

	# Back button
	back_btn = Button.new()
	back_btn.text = "Back"
	back_btn.custom_minimum_size.y = 60
	back_btn.add_theme_font_size_override("font_size", 24)
	back_btn.pressed.connect(_on_back)
	vbox.add_child(back_btn)

func _get_deck_ids() -> Array:
	var ids: Array = []
	if GameManager.player_deck.size() >= 20:
		for card in GameManager.player_deck:
			ids.append(card.id)
	else:
		var deck := CardDatabase.build_random_deck()
		for card in deck:
			ids.append(card.id)
	return ids

func _on_create_room() -> void:
	create_btn.disabled = true
	join_btn.disabled = true
	status_label.text = "Creating room..."

	var deck_ids := _get_deck_ids()
	var code := await MultiplayerManager.create_room(deck_ids)
	if code != "":
		room_code_display.text = code
		status_label.text = "Waiting for opponent...\nShare this code:"
	else:
		status_label.text = "Failed to create room."
		create_btn.disabled = false
		join_btn.disabled = false

func _on_join_room() -> void:
	var code := room_code_input.text.strip_edges().to_upper()
	if code.length() != 6:
		status_label.text = "Enter a 6-letter room code."
		return

	create_btn.disabled = true
	join_btn.disabled = true
	status_label.text = "Joining room %s..." % code

	var deck_ids := _get_deck_ids()
	var success := await MultiplayerManager.join_room(code, deck_ids)
	if success:
		status_label.text = "Joined! Starting game..."
		await get_tree().create_timer(1.0).timeout
		_start_online_battle()
	else:
		status_label.text = "Failed to join. Room may not exist or is full."
		create_btn.disabled = false
		join_btn.disabled = false

func _on_opponent_joined() -> void:
	status_label.text = "Opponent joined! Starting game..."
	await get_tree().create_timer(1.0).timeout
	_start_online_battle()

func _start_online_battle() -> void:
	GameManager.change_scene("res://scenes/battle/online_battle.tscn")

func _on_back() -> void:
	if MultiplayerManager.is_in_room:
		await MultiplayerManager.leave_room()
	GameManager.change_scene("res://scenes/title/title_screen.tscn")
