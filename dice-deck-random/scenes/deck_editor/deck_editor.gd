extends Control

const MAX_DECK_SIZE := 20
const MAX_COPIES := 2
const CardUIScene := preload("res://scenes/battle/card_ui.tscn")

var deck: Array[CardData] = []
var deck_grid: HBoxContainer
var pool_grid: VBoxContainer
var current_row: HBoxContainer
var cards_in_row: int = 0
const CARDS_PER_ROW := 3
var deck_count_label: Label
var deck_color_label: Label
var cost_buttons: Array[Button] = []
var color_buttons: Array[Button] = []
var current_cost_filter: int = 0  # 0=all
var current_color_filter: int = -1  # -1=all, 0=GRAY, 1=BLUE, 2=GREEN, 3=BLACK
var slot_dialog: Control
var card_preview_overlay: ColorRect
var card_preview_container: CenterContainer

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
	main_vbox.add_theme_constant_override("separation", 4)
	add_child(main_vbox)

	# Header
	var header := Label.new()
	header.text = "デッキ編集"
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	header.add_theme_font_size_override("font_size", 32)
	header.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	main_vbox.add_child(header)

	# === YOUR DECK SECTION ===
	var deck_info := HBoxContainer.new()
	deck_info.alignment = BoxContainer.ALIGNMENT_CENTER
	deck_info.add_theme_constant_override("separation", 20)
	main_vbox.add_child(deck_info)

	deck_count_label = Label.new()
	deck_count_label.add_theme_font_size_override("font_size", 20)
	deck_count_label.add_theme_color_override("font_color", Color(0.4, 0.8, 1))
	deck_info.add_child(deck_count_label)

	deck_color_label = Label.new()
	deck_color_label.add_theme_font_size_override("font_size", 20)
	deck_info.add_child(deck_color_label)

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
	deck_grid.add_theme_constant_override("separation", 4)
	deck_scroll.add_child(deck_grid)

	# === CARD POOL SECTION ===
	var pool_header := Label.new()
	pool_header.text = "カード一覧"
	pool_header.add_theme_font_size_override("font_size", 18)
	pool_header.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	main_vbox.add_child(pool_header)

	# Color filter tabs
	var color_row := HBoxContainer.new()
	color_row.add_theme_constant_override("separation", 4)
	color_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main_vbox.add_child(color_row)

	var color_labels := ["全て", "グレー", "青", "緑", "黒"]
	var color_colors := [Color(0.5, 0.5, 0.5), Color(0.5, 0.5, 0.55), Color(0.3, 0.5, 0.9), Color(0.3, 0.8, 0.3), Color(0.3, 0.2, 0.3)]
	for i in range(color_labels.size()):
		var btn := Button.new()
		btn.text = color_labels[i]
		btn.custom_minimum_size = Vector2(70, 40)
		btn.add_theme_font_size_override("font_size", 16)
		btn.pressed.connect(_on_color_filter_pressed.bind(i - 1))  # -1=all, 0=GRAY, 1=BLUE...
		color_row.add_child(btn)
		color_buttons.append(btn)

	# Cost filter tabs
	var cost_row := HBoxContainer.new()
	cost_row.add_theme_constant_override("separation", 4)
	cost_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main_vbox.add_child(cost_row)

	var cost_labels := ["全て", "1", "2", "3", "4", "5"]
	for i in range(cost_labels.size()):
		var btn := Button.new()
		btn.text = cost_labels[i]
		btn.custom_minimum_size = Vector2(55, 35)
		btn.add_theme_font_size_override("font_size", 16)
		btn.pressed.connect(_on_cost_filter_pressed.bind(i))
		cost_row.add_child(btn)
		cost_buttons.append(btn)

	# Pool scroll with card grid
	var pool_scroll := ScrollContainer.new()
	pool_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	pool_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	pool_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	main_vbox.add_child(pool_scroll)

	pool_grid = VBoxContainer.new()
	pool_grid.custom_minimum_size.x = 920
	pool_grid.add_theme_constant_override("separation", 6)
	pool_scroll.add_child(pool_grid)

	# Bottom buttons
	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 10)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main_vbox.add_child(btn_row)

	var back_btn := Button.new()
	back_btn.text = "戻る"
	back_btn.custom_minimum_size = Vector2(140, 55)
	back_btn.add_theme_font_size_override("font_size", 20)
	back_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/title/title_screen.tscn"))
	btn_row.add_child(back_btn)

	var clear_btn := Button.new()
	clear_btn.text = "全削除"
	clear_btn.custom_minimum_size = Vector2(140, 55)
	clear_btn.add_theme_font_size_override("font_size", 20)
	clear_btn.pressed.connect(_on_clear)
	btn_row.add_child(clear_btn)

	var save_btn := Button.new()
	save_btn.text = "保存/読込"
	save_btn.custom_minimum_size = Vector2(140, 55)
	save_btn.add_theme_font_size_override("font_size", 20)
	save_btn.pressed.connect(_show_slot_dialog)
	btn_row.add_child(save_btn)

	# Load existing deck
	if GameManager.player_deck.size() > 0:
		for card in GameManager.player_deck:
			deck.append(card.duplicate_card() if card is CardData else card)

	_update_pool_display()
	_update_deck_display()
	_update_filter_buttons()
	# カードプレビューオーバーレイ作成
	card_preview_overlay = ColorRect.new()
	card_preview_overlay.color = Color(0, 0, 0, 0.8)
	card_preview_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card_preview_overlay.visible = false
	card_preview_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	card_preview_overlay.gui_input.connect(_on_preview_overlay_input)
	add_child(card_preview_overlay)
	card_preview_container = CenterContainer.new()
	card_preview_container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card_preview_overlay.add_child(card_preview_container)

# === FILTER ===

func _on_cost_filter_pressed(cost_index: int) -> void:
	current_cost_filter = cost_index
	_update_pool_display()
	_update_filter_buttons()

func _on_color_filter_pressed(color_index: int) -> void:
	current_color_filter = color_index
	_update_pool_display()
	_update_filter_buttons()

func _update_filter_buttons() -> void:
	# Cost buttons
	for i in range(cost_buttons.size()):
		var btn := cost_buttons[i]
		var style := StyleBoxFlat.new()
		if i == current_cost_filter:
			style.bg_color = Color(0.3, 0.3, 0.5)
			style.border_width_bottom = 2
			style.border_color = Color(1, 0.9, 0.3)
		else:
			style.bg_color = Color(0.15, 0.15, 0.2)
		style.corner_radius_top_left = 4
		style.corner_radius_top_right = 4
		style.corner_radius_bottom_left = 4
		style.corner_radius_bottom_right = 4
		btn.add_theme_stylebox_override("normal", style)

	# Color buttons
	var color_colors := [Color(0.5, 0.5, 0.5), Color(0.5, 0.5, 0.55), Color(0.3, 0.5, 0.9), Color(0.3, 0.8, 0.3), Color(0.3, 0.2, 0.3)]
	for i in range(color_buttons.size()):
		var btn := color_buttons[i]
		var style := StyleBoxFlat.new()
		if i == current_color_filter + 1:  # +1 because -1=all maps to index 0
			style.bg_color = color_colors[i].lightened(0.2)
			style.border_width_bottom = 2
			style.border_color = Color(1, 0.9, 0.3)
		else:
			style.bg_color = color_colors[i].darkened(0.3)
		style.corner_radius_top_left = 4
		style.corner_radius_top_right = 4
		style.corner_radius_bottom_left = 4
		style.corner_radius_bottom_right = 4
		btn.add_theme_stylebox_override("normal", style)

# === POOL DISPLAY ===

func _update_pool_display() -> void:
	for child in pool_grid.get_children():
		child.queue_free()
	cards_in_row = 0

	var cards := CardDatabase.get_all_cards()
	for card in cards:
		# Cost filter
		if current_cost_filter > 0 and card.mana_cost != current_cost_filter:
			continue
		# Color filter
		if current_color_filter >= 0 and int(card.color_type) != current_color_filter:
			continue
		_add_pool_card(card)

func _add_pool_card(card: CardData) -> void:
	var wrapper := VBoxContainer.new()
	wrapper.add_theme_constant_override("separation", 2)

	# CardUIを固定サイズのコンテナでラップ
	var card_container := Control.new()
	card_container.custom_minimum_size = Vector2(300, 420)
	card_container.size = Vector2(300, 420)
	card_container.clip_contents = true
	var card_ui: CardUI = CardUIScene.instantiate()
	card_ui.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	# Count in deck
	var count := _count_in_deck(card.id)
	var count_label := Label.new()
	count_label.text = "%d / %d" % [count, MAX_COPIES]
	count_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	count_label.add_theme_font_size_override("font_size", 14)
	if count >= MAX_COPIES:
		count_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
	else:
		count_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))

	# Check if can add this card
	var can_add := _can_add_card(card)
	if count >= MAX_COPIES or not can_add:
		card_ui.modulate = Color(0.5, 0.5, 0.5, 0.7)

	card_container.add_child(card_ui)
	wrapper.add_child(card_container)
	card_ui.setup(card, 300, 420)  # add_child後にsetupを呼ぶ
	wrapper.add_child(count_label)
	# Click to add
	card_ui.card_clicked.connect(func(_c: CardUI): _add_card_to_deck(card))
	card_ui.card_long_pressed.connect(func(_c: CardUI): _show_card_preview(card_ui))

	# 3枚ごとに新しい行を作成
	if cards_in_row == 0 or cards_in_row >= CARDS_PER_ROW:
		current_row = HBoxContainer.new()
		current_row.custom_minimum_size = Vector2(920, 450)
		current_row.add_theme_constant_override("separation", 6)
		pool_grid.add_child(current_row)
		cards_in_row = 0
	current_row.add_child(wrapper)
	cards_in_row += 1

func _get_deck_color() -> CardData.ColorType:
	for card in deck:
		if card.color_type != CardData.ColorType.GRAY:
			return card.color_type
	return CardData.ColorType.GRAY

func _can_add_card(card: CardData) -> bool:
	if deck.size() >= MAX_DECK_SIZE:
		return false
	if _count_in_deck(card.id) >= MAX_COPIES:
		return false
	# 1色制限: グレー以外のカードは、既にデッキにある色と同じでなければならない
	if card.color_type != CardData.ColorType.GRAY:
		var deck_color := _get_deck_color()
		if deck_color != CardData.ColorType.GRAY and deck_color != card.color_type:
			return false
	return true

func _add_card_to_deck(card: CardData) -> void:
	if not _can_add_card(card):
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
		card_ui.setup(card, 180, 260)

		# Click to remove
		var idx := i
		card_ui.card_clicked.connect(func(_c: CardUI): _remove_card_from_deck(idx))

		card_ui.card_long_pressed.connect(func(_c: CardUI): _show_card_preview(card_ui))
		deck_grid.add_child(card_ui)

	deck_count_label.text = "デッキ: %d / %d" % [deck.size(), MAX_DECK_SIZE]
	if deck.size() == MAX_DECK_SIZE:
		deck_count_label.add_theme_color_override("font_color", Color(0.3, 1, 0.3))
	else:
		deck_count_label.add_theme_color_override("font_color", Color(0.4, 0.8, 1))

	# Show deck color
	var deck_color := _get_deck_color()
	if deck_color == CardData.ColorType.GRAY:
		deck_color_label.text = "色: なし"
		deck_color_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
	else:
		var color_names := {
			CardData.ColorType.BLUE: "青",
			CardData.ColorType.GREEN: "緑",
			CardData.ColorType.BLACK: "黒",
		}
		var color_colors := {
			CardData.ColorType.BLUE: Color(0.3, 0.5, 0.9),
			CardData.ColorType.GREEN: Color(0.3, 0.8, 0.3),
			CardData.ColorType.BLACK: Color(0.6, 0.4, 0.6),
		}
		deck_color_label.text = "色: %s" % color_names.get(deck_color, "?")
		deck_color_label.add_theme_color_override("font_color", color_colors.get(deck_color, Color.WHITE))

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

# === SLOT DIALOG ===

func _show_slot_dialog() -> void:
	if slot_dialog:
		slot_dialog.queue_free()

	# オーバーレイ
	slot_dialog = ColorRect.new()
	slot_dialog.color = Color(0, 0, 0, 0.7)
	slot_dialog.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	slot_dialog.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(slot_dialog)

	# ダイアログ本体
	var panel := PanelContainer.new()
	panel.set_anchors_preset(Control.PRESET_CENTER)
	panel.custom_minimum_size = Vector2(400, 500)
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.15, 0.15, 0.2)
	style.corner_radius_top_left = 10
	style.corner_radius_top_right = 10
	style.corner_radius_bottom_left = 10
	style.corner_radius_bottom_right = 10
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_color = Color(0.4, 0.6, 0.8)
	panel.add_theme_stylebox_override("panel", style)
	slot_dialog.add_child(panel)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	panel.add_child(vbox)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 15)
	margin.add_theme_constant_override("margin_right", 15)
	margin.add_theme_constant_override("margin_top", 15)
	margin.add_theme_constant_override("margin_bottom", 15)
	panel.add_child(margin)

	var inner_vbox := VBoxContainer.new()
	inner_vbox.add_theme_constant_override("separation", 8)
	margin.add_child(inner_vbox)

	# タイトル
	var title := Label.new()
	title.text = "デッキスロット"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 26)
	title.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	inner_vbox.add_child(title)

	# スロット一覧をロード
	_load_slot_buttons(inner_vbox)

	# 閉じるボタン
	var close_btn := Button.new()
	close_btn.text = "閉じる"
	close_btn.custom_minimum_size = Vector2(120, 45)
	close_btn.add_theme_font_size_override("font_size", 18)
	close_btn.pressed.connect(func(): slot_dialog.queue_free(); slot_dialog = null)
	inner_vbox.add_child(close_btn)

func _load_slot_buttons(parent: VBoxContainer) -> void:
	# スロット情報を取得（非同期）
	var slots_info := await GameManager.get_all_deck_slots()

	for i in range(GameManager.MAX_DECK_SLOTS):
		var hbox := HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 10)
		hbox.alignment = BoxContainer.ALIGNMENT_CENTER
		parent.add_child(hbox)

		# スロット番号とカード枚数
		var label := Label.new()
		var count: int = slots_info.get(i, 0)
		if count > 0:
			label.text = "スロット %d (%d枚)" % [i + 1, count]
			label.add_theme_color_override("font_color", Color(0.5, 1.0, 0.5))
		else:
			label.text = "スロット %d (空)" % [i + 1]
			label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
		label.custom_minimum_size.x = 150
		label.add_theme_font_size_override("font_size", 18)
		hbox.add_child(label)

		# 保存ボタン
		var save_btn := Button.new()
		save_btn.text = "保存"
		save_btn.custom_minimum_size = Vector2(70, 35)
		save_btn.add_theme_font_size_override("font_size", 16)
		save_btn.pressed.connect(_save_to_slot.bind(i))
		hbox.add_child(save_btn)

		# 読込ボタン
		var load_btn := Button.new()
		load_btn.text = "読込"
		load_btn.custom_minimum_size = Vector2(70, 35)
		load_btn.add_theme_font_size_override("font_size", 16)
		load_btn.disabled = count == 0
		load_btn.pressed.connect(_load_from_slot.bind(i))
		hbox.add_child(load_btn)

func _save_to_slot(slot: int) -> void:
	if deck.size() != MAX_DECK_SIZE:
		_show_message("エラー", "デッキは%d枚必要です！ (現在: %d枚)" % [MAX_DECK_SIZE, deck.size()])
		return
	await GameManager.save_deck_to_slot(slot, deck)
	GameManager.player_deck = deck.duplicate()
	_show_message("保存完了", "スロット %d に保存しました！" % [slot + 1])
	if slot_dialog:
		slot_dialog.queue_free()
		slot_dialog = null

func _load_from_slot(slot: int) -> void:
	var loaded := await GameManager.load_deck_from_slot(slot)
	if loaded.size() == 0:
		_show_message("エラー", "デッキを読み込めませんでした")
		return
	deck = loaded
	GameManager.player_deck = deck.duplicate()
	_update_deck_display()
	_update_pool_display()
	_show_message("読込完了", "スロット %d から読み込みました！ (%d枚)" % [slot + 1, deck.size()])
	if slot_dialog:
		slot_dialog.queue_free()
		slot_dialog = null

func _show_message(title_text: String, message: String) -> void:
	var popup := AcceptDialog.new()
	popup.title = title_text
	popup.dialog_text = message
	add_child(popup)
	popup.popup_centered()

# === CARD PREVIEW ===

func _show_card_preview(card_ui: CardUI) -> void:
	for child in card_preview_container.get_children():
		child.queue_free()

	var vbox := VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_theme_constant_override("separation", 10)
	card_preview_container.add_child(vbox)

	var preview := CardUIScene.instantiate() as CardUI
	vbox.add_child(preview)
	preview.setup(card_ui.card_data, 300, 420)
	preview.mouse_filter = Control.MOUSE_FILTER_IGNORE

	# 効果説明を表示
	if card_ui.card_data.has_effect():
		var effect_label := Label.new()
		var effect_desc := EffectManager.get_effect_description(card_ui.card_data.effect_id)
		effect_label.text = effect_desc
		effect_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		effect_label.add_theme_font_size_override("font_size", 24)
		effect_label.add_theme_color_override("font_color", Color(1, 0.9, 0.5))
		effect_label.autowrap_mode = TextServer.AUTOWRAP_WORD
		effect_label.custom_minimum_size.x = 300
		vbox.add_child(effect_label)

	card_preview_overlay.visible = true

func _hide_card_preview() -> void:
	card_preview_overlay.visible = false
	for child in card_preview_container.get_children():
		child.queue_free()

func _on_preview_overlay_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		_hide_card_preview()
	if event is InputEventScreenTouch and event.pressed:
		_hide_card_preview()
