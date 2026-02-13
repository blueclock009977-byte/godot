extends Control

const MAX_DECK_SIZE := 20
const MAX_COPIES := 2
const CardUIScene := preload("res://scenes/battle/card_ui.tscn")

var deck: Array[CardData] = []
var deck_grid: HBoxContainer
var pool_grid: GridContainer
var deck_count_label: Label
var tab_buttons: Array[Button] = []
var current_cost_filter: int = 0  # 0=all

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var main_vbox := VBoxContainer.new()
	main_vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	main_vbox.offset_left = 10
	main_vbox.offset_right = -10
	main_vbox.offset_top = 10
	main_vbox.offset_bottom = -10
	main_vbox.add_theme_constant_override("separation", 6)
	add_child(main_vbox)

	# Header
	var header := Label.new()
	header.text = "DECK EDITOR"
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	header.add_theme_font_size_override("font_size", 32)
	header.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	main_vbox.add_child(header)

	# === YOUR DECK SECTION ===
	deck_count_label = Label.new()
	deck_count_label.add_theme_font_size_override("font_size", 22)
	deck_count_label.add_theme_color_override("font_color", Color(0.4, 0.8, 1))
	main_vbox.add_child(deck_count_label)

	var deck_panel := PanelContainer.new()
	deck_panel.custom_minimum_size.y = 300
	var deck_style := StyleBoxFlat.new()
	deck_style.bg_color = Color(0.12, 0.12, 0.18)
	deck_style.corner_radius_top_left = 8
	deck_style.corner_radius_top_right = 8
	deck_style.corner_radius_bottom_left = 8
	deck_style.corner_radius_bottom_right = 8
	deck_panel.add_theme_stylebox_override("panel", deck_style)
	main_vbox.add_child(deck_panel)

	var deck_scroll := ScrollContainer.new()
	deck_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	deck_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	deck_panel.add_child(deck_scroll)

	deck_grid = HBoxContainer.new()
	deck_grid.add_theme_constant_override("separation", 6)
	deck_scroll.add_child(deck_grid)

	# === CARD POOL SECTION ===
	var pool_header := Label.new()
	pool_header.text = "CARD POOL (タップで追加)"
	pool_header.add_theme_font_size_override("font_size", 20)
	pool_header.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	main_vbox.add_child(pool_header)

	# Cost filter tabs
	var tab_row := HBoxContainer.new()
	tab_row.add_theme_constant_override("separation", 6)
	tab_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main_vbox.add_child(tab_row)

	var filter_labels := ["ALL", "💎1", "💎2", "💎3", "💎4", "💎5"]
	for i in range(filter_labels.size()):
		var btn := Button.new()
		btn.text = filter_labels[i]
		btn.custom_minimum_size = Vector2(80, 45)
		btn.add_theme_font_size_override("font_size", 18)
		btn.pressed.connect(_on_filter_pressed.bind(i))
		tab_row.add_child(btn)
		tab_buttons.append(btn)

	# Pool scroll with card grid
	var pool_scroll := ScrollContainer.new()
	pool_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	pool_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	pool_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	main_vbox.add_child(pool_scroll)

	pool_grid = GridContainer.new()
	pool_grid.columns = 5
	pool_grid.add_theme_constant_override("h_separation", 8)
	pool_grid.add_theme_constant_override("v_separation", 8)
	pool_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	pool_scroll.add_child(pool_grid)

	# Bottom buttons
	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 10)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main_vbox.add_child(btn_row)

	var back_btn := Button.new()
	back_btn.text = "戻る"
	back_btn.custom_minimum_size = Vector2(160, 60)
	back_btn.add_theme_font_size_override("font_size", 22)
	back_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/title/title_screen.tscn"))
	btn_row.add_child(back_btn)

	var clear_btn := Button.new()
	clear_btn.text = "全削除"
	clear_btn.custom_minimum_size = Vector2(160, 60)
	clear_btn.add_theme_font_size_override("font_size", 22)
	clear_btn.pressed.connect(_on_clear)
	btn_row.add_child(clear_btn)

	var save_btn := Button.new()
	save_btn.text = "保存"
	save_btn.custom_minimum_size = Vector2(160, 60)
	save_btn.add_theme_font_size_override("font_size", 22)
	save_btn.pressed.connect(_on_save)
	btn_row.add_child(save_btn)

	# Load existing deck
	if GameManager.player_deck.size() > 0:
		for card in GameManager.player_deck:
			deck.append(card.duplicate_card() if card is CardData else card)

	_update_pool_display()
	_update_deck_display()
	_update_filter_buttons()

# === FILTER ===

func _on_filter_pressed(cost_index: int) -> void:
	current_cost_filter = cost_index
	_update_pool_display()
	_update_filter_buttons()

func _update_filter_buttons() -> void:
	for i in range(tab_buttons.size()):
		var btn := tab_buttons[i]
		var style := StyleBoxFlat.new()
		if i == current_cost_filter:
			style.bg_color = Color(0.3, 0.3, 0.5)
			style.border_width_bottom = 3
			style.border_color = Color(1, 0.9, 0.3)
		else:
			style.bg_color = Color(0.15, 0.15, 0.2)
		style.corner_radius_top_left = 6
		style.corner_radius_top_right = 6
		style.corner_radius_bottom_left = 6
		style.corner_radius_bottom_right = 6
		btn.add_theme_stylebox_override("normal", style)

# === POOL DISPLAY ===

func _update_pool_display() -> void:
	for child in pool_grid.get_children():
		child.queue_free()

	var cards := CardDatabase.get_all_cards()
	for card in cards:
		if current_cost_filter > 0 and card.mana_cost != current_cost_filter:
			continue
		_add_pool_card(card)

func _add_pool_card(card: CardData) -> void:
	var wrapper := VBoxContainer.new()
	wrapper.add_theme_constant_override("separation", 2)

	var card_ui: CardUI = CardUIScene.instantiate()
	card_ui.setup(card)
	card_ui.custom_minimum_size = Vector2(185, 260)

	# Count in deck
	var count := _count_in_deck(card.id)
	var count_label := Label.new()
	count_label.text = "%d / %d" % [count, MAX_COPIES]
	count_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	count_label.add_theme_font_size_override("font_size", 16)
	if count >= MAX_COPIES:
		count_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
	else:
		count_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))

	# Grey out if max copies
	if count >= MAX_COPIES:
		card_ui.modulate = Color(0.5, 0.5, 0.5, 0.7)

	wrapper.add_child(card_ui)
	wrapper.add_child(count_label)

	# Click to add
	card_ui.card_clicked.connect(func(_c: CardUI): _add_card_to_deck(card))

	pool_grid.add_child(wrapper)

func _add_card_to_deck(card: CardData) -> void:
	if deck.size() >= MAX_DECK_SIZE:
		return
	if _count_in_deck(card.id) >= MAX_COPIES:
		return
	deck.append(card.duplicate_card())
	_update_deck_display()
	_update_pool_display()

# === DECK DISPLAY ===

func _update_deck_display() -> void:
	for child in deck_grid.get_children():
		child.queue_free()

	# Sort deck by mana cost
	var sorted_deck := deck.duplicate()
	sorted_deck.sort_custom(func(a: CardData, b: CardData): return a.mana_cost < b.mana_cost)

	for i in range(deck.size()):
		var card: CardData = deck[i]
		var card_ui: CardUI = CardUIScene.instantiate()
		card_ui.setup(card)
		card_ui.custom_minimum_size = Vector2(175, 250)

		# Click to remove
		var idx := i
		card_ui.card_clicked.connect(func(_c: CardUI): _remove_card_from_deck(idx))

		deck_grid.add_child(card_ui)

	deck_count_label.text = "YOUR DECK: %d / %d (タップで削除)" % [deck.size(), MAX_DECK_SIZE]
	if deck.size() == MAX_DECK_SIZE:
		deck_count_label.add_theme_color_override("font_color", Color(0.3, 1, 0.3))
	else:
		deck_count_label.add_theme_color_override("font_color", Color(0.4, 0.8, 1))

func _remove_card_from_deck(index: int) -> void:
	if index >= 0 and index < deck.size():
		deck.remove_at(index)
		_update_deck_display()
		_update_pool_display()

func _count_in_deck(card_id: int) -> int:
	var count := 0
	for c in deck:
		if c.id == card_id:
			count += 1
	return count

# === BUTTONS ===

func _on_clear() -> void:
	deck.clear()
	_update_deck_display()
	_update_pool_display()

func _on_save() -> void:
	if deck.size() == MAX_DECK_SIZE:
		GameManager.player_deck = deck.duplicate()
		GameManager.save_deck()
		var popup := AcceptDialog.new()
		popup.title = "保存完了"
		popup.dialog_text = "デッキを保存しました！ (%d枚)" % deck.size()
		add_child(popup)
		popup.popup_centered()
	else:
		var popup := AcceptDialog.new()
		popup.title = "エラー"
		popup.dialog_text = "デッキは%d枚必要です！ (現在: %d枚)" % [MAX_DECK_SIZE, deck.size()]
		add_child(popup)
		popup.popup_centered()
