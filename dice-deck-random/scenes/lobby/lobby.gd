extends Control

var deck_status_label: Label
var status_label: Label
var room_code_display: Label
var main_menu: VBoxContainer
var friend_menu: VBoxContainer
var waiting_panel: VBoxContainer
var cancel_btn: Button
var _search_timer: Timer
var _searching: bool = false

func _ready() -> void:
	_build_ui()
	MultiplayerManager.opponent_joined.connect(_on_opponent_joined)

func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var root_vbox := VBoxContainer.new()
	root_vbox.add_theme_constant_override("separation", 20)
	root_vbox.custom_minimum_size.x = 500
	center.add_child(root_vbox)

	var title := Label.new()
	title.text = "オンライン対戦"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 42)
	title.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	root_vbox.add_child(title)

	# Deck status
	deck_status_label = Label.new()
	_update_deck_status()
	deck_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	deck_status_label.add_theme_font_size_override("font_size", 20)
	root_vbox.add_child(deck_status_label)

	# Status
	status_label = Label.new()
	status_label.text = ""
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	status_label.add_theme_font_size_override("font_size", 22)
	status_label.add_theme_color_override("font_color", Color(1, 0.8, 0.3))
	status_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	root_vbox.add_child(status_label)

	# Room code display (for waiting)
	room_code_display = Label.new()
	room_code_display.text = ""
	room_code_display.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	room_code_display.add_theme_font_size_override("font_size", 56)
	room_code_display.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	root_vbox.add_child(room_code_display)

	# === MAIN MENU ===
	main_menu = VBoxContainer.new()
	main_menu.add_theme_constant_override("separation", 20)
	root_vbox.add_child(main_menu)

	var random_btn := _make_button("ランダムマッチ", Color(0.9, 0.4, 0.2))
	random_btn.pressed.connect(_on_random_match)
	main_menu.add_child(random_btn)

	var friend_btn := _make_button("フレンド対戦", Color(0.3, 0.6, 0.9))
	friend_btn.pressed.connect(_show_friend_menu)
	main_menu.add_child(friend_btn)

	var back_btn := _make_button("← 戻る", Color(0.4, 0.4, 0.5))
	back_btn.pressed.connect(_on_back)
	main_menu.add_child(back_btn)

	# === FRIEND MENU (hidden initially) ===
	friend_menu = VBoxContainer.new()
	friend_menu.add_theme_constant_override("separation", 20)
	friend_menu.visible = false
	root_vbox.add_child(friend_menu)

	var create_btn := _make_button("部屋を作る", Color(0.3, 0.8, 0.4))
	create_btn.pressed.connect(_on_create_room)
	friend_menu.add_child(create_btn)

	var join_btn := _make_button("コードで参加", Color(0.3, 0.6, 0.9))
	join_btn.pressed.connect(_on_join_room)
	friend_menu.add_child(join_btn)

	var friend_back_btn := _make_button("← 戻る", Color(0.4, 0.4, 0.5))
	friend_back_btn.pressed.connect(_show_main_menu)
	friend_menu.add_child(friend_back_btn)


	# Cancel button
	cancel_btn = Button.new()
	cancel_btn.text = "キャンセル"
	cancel_btn.custom_minimum_size = Vector2(300, 70)
	cancel_btn.add_theme_font_size_override("font_size", 26)
	var cancel_style := StyleBoxFlat.new()
	cancel_style.bg_color = Color(0.5, 0.2, 0.2)
	cancel_style.border_width_left = 2
	cancel_style.border_width_right = 2
	cancel_style.border_width_top = 2
	cancel_style.border_width_bottom = 2
	cancel_style.border_color = Color(0.9, 0.3, 0.3)
	cancel_style.corner_radius_top_left = 8
	cancel_style.corner_radius_top_right = 8
	cancel_style.corner_radius_bottom_left = 8
	cancel_style.corner_radius_bottom_right = 8
	cancel_btn.add_theme_stylebox_override("normal", cancel_style)
	cancel_btn.pressed.connect(_on_cancel)
	cancel_btn.visible = false
	cancel_btn.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	cancel_btn.offset_top = -200
	cancel_btn.offset_bottom = -130
	cancel_btn.offset_left = -150
	cancel_btn.offset_right = 150
	add_child(cancel_btn)

func _make_button(text: String, color: Color) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size.y = 70
	btn.add_theme_font_size_override("font_size", 26)
	var style := StyleBoxFlat.new()
	style.bg_color = color.darkened(0.6)
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_color = color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = color.darkened(0.4)
	btn.add_theme_stylebox_override("hover", hover)
	return btn

func _show_cancel() -> void:
	if cancel_btn:
		cancel_btn.visible = true

func _hide_cancel() -> void:
	if cancel_btn:
		cancel_btn.visible = false

func _on_cancel() -> void:
	_hide_cancel()
	_stop_search()
	status_label.text = "キャンセル中..."
	if MultiplayerManager.is_in_room:
		await MultiplayerManager.leave_room()
	_show_main_menu()


func _show_friend_menu() -> void:
	main_menu.visible = false
	friend_menu.visible = true
	status_label.text = ""
	room_code_display.text = ""

func _show_main_menu() -> void:
	friend_menu.visible = false
	main_menu.visible = true
	status_label.text = ""
	room_code_display.text = ""

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

# === RANDOM MATCH ===
func _on_random_match() -> void:
	main_menu.visible = false
	friend_menu.visible = false
	_show_cancel()
	status_label.text = "対戦相手を探しています..."
	_searching = true

	var deck_ids := _get_deck_ids()

	# First try: find existing room
	var matched := await _try_join_waiting_room(deck_ids)
	if matched:
		return

	# No room found, create one and keep searching
	var code := await MultiplayerManager.create_room(deck_ids)
	if code == "":
		status_label.text = "部屋作成に失敗しました。通信エラーの可能性があります"
		await get_tree().create_timer(3.0).timeout
		_searching = false
		_show_main_menu()
		return

	# Start periodic re-search while waiting
	_search_timer = Timer.new()
	_search_timer.wait_time = 5.0
	_search_timer.timeout.connect(_on_search_tick.bind(deck_ids))
	add_child(_search_timer)
	_search_timer.start()

func _try_join_waiting_room(deck_ids: Array) -> bool:
	var waiting_room := await MultiplayerManager.find_waiting_room(MultiplayerManager._my_room_created_at)
	if waiting_room != "":
		var success := await MultiplayerManager.join_room(waiting_room, deck_ids)
		if success:
			status_label.text = "対戦相手が見つかりました！"
			_stop_search()
			await get_tree().create_timer(1.0).timeout
			_start_online_battle()
			return true
	return false

func _on_search_tick(deck_ids: Array) -> void:
	if not _searching:
		return
	var waiting_room := await MultiplayerManager.find_waiting_room(MultiplayerManager._my_room_created_at)
	if waiting_room != "" and _searching:
		# Found another room! Leave ours and join theirs
		var old_code := MultiplayerManager.room_code
		await MultiplayerManager.leave_room()
		var success := await MultiplayerManager.join_room(waiting_room, deck_ids)
		if success:
			status_label.text = "対戦相手が見つかりました！"
			_stop_search()
			await get_tree().create_timer(1.0).timeout
			_start_online_battle()
			return
		else:
			# Join failed, recreate our room
			await MultiplayerManager.create_room(deck_ids)

func _stop_search() -> void:
	_searching = false
	if _search_timer:
		_search_timer.stop()
		_search_timer.queue_free()
		_search_timer = null


# === FRIEND MATCH ===
func _on_create_room() -> void:
	friend_menu.visible = false
	_show_cancel()
	status_label.text = "部屋を作成中..."

	var deck_ids := _get_deck_ids()
	var code := await MultiplayerManager.create_room(deck_ids)
	if code != "":
		room_code_display.text = code
		status_label.text = "相手にこのコードを共有してね:"
	else:
		status_label.text = "部屋の作成に失敗しました。通信エラーの可能性があります"
		await get_tree().create_timer(3.0).timeout
		_show_friend_menu()

func _on_join_room() -> void:
	var code := ""
	if OS.has_feature("web"):
		var result = JavaScriptBridge.eval("prompt('ルームコード (6文字)', '') || ''")
		if result is String:
			code = result.strip_edges().to_upper()
	else:
		code = "TEST01"
	if code.length() != 6:
		if code == "":
			return
		status_label.text = "6文字のコードを入力してください"
		return

	friend_menu.visible = false
	status_label.text = "部屋 %s に参加中..." % code

	var deck_ids := _get_deck_ids()
	var success := await MultiplayerManager.join_room(code, deck_ids)
	if success:
		status_label.text = "参加成功！ゲーム開始..."
		await get_tree().create_timer(1.0).timeout
		_start_online_battle()
	else:
		status_label.text = "参加失敗。部屋が存在しないか満員です"
		_show_friend_menu()

# === CALLBACKS ===
func _on_opponent_joined() -> void:
	_hide_cancel()
	status_label.text = "対戦相手が来た！ゲーム開始..."
	room_code_display.text = ""
	await get_tree().create_timer(1.0).timeout
	_start_online_battle()

func _start_online_battle() -> void:
	_hide_cancel()
	GameManager.change_scene("res://scenes/battle/online_battle.tscn")

func _on_back() -> void:
	if MultiplayerManager.is_in_room:
		await MultiplayerManager.leave_room()
	GameManager.change_scene("res://scenes/title/title_screen.tscn")

func _update_deck_status() -> void:
	if GameManager.player_deck.size() == 0:
		deck_status_label.text = "デッキ: 未設定"
		deck_status_label.add_theme_color_override("font_color", Color(1, 0.4, 0.4))
	elif GameManager.current_deck_slot >= 0:
		deck_status_label.text = "デッキ: スロット %d" % (GameManager.current_deck_slot + 1)
		deck_status_label.add_theme_color_override("font_color", Color(0.4, 1, 0.6))
	else:
		deck_status_label.text = "デッキ: 設定済み (%d枚)" % GameManager.player_deck.size()
		deck_status_label.add_theme_color_override("font_color", Color(0.4, 1, 0.6))
