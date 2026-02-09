extends Control

const MAX_DECK_SIZE := 20
const MAX_COPIES := 2

var deck: Array[CardData] = []
var deck_list_container: VBoxContainer
var deck_count_label: Label

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.1, 0.1, 0.15)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Main vertical split
	var main_vbox := VBoxContainer.new()
	main_vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	main_vbox.offset_left = 20
	main_vbox.offset_right = -20
	main_vbox.offset_top = 20
	main_vbox.offset_bottom = -20
	main_vbox.add_theme_constant_override("separation", 10)
	add_child(main_vbox)

	# Header
	var header := Label.new()
	header.text = "Deck Editor"
	header.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	header.add_theme_font_size_override("font_size", 36)
	main_vbox.add_child(header)

	# Card pool section (top half)
	var pool_label := Label.new()
	pool_label.text = "Card Pool (tap to add)"
	pool_label.add_theme_font_size_override("font_size", 22)
	main_vbox.add_child(pool_label)

	var pool_scroll := ScrollContainer.new()
	pool_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	pool_scroll.custom_minimum_size.y = 700
	main_vbox.add_child(pool_scroll)

	var pool_list := VBoxContainer.new()
	pool_list.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	pool_list.add_theme_constant_override("separation", 4)
	pool_scroll.add_child(pool_list)

	# Populate card pool
	for card in CardDatabase.get_all_cards():
		var btn := Button.new()
		var s_dice := ""
		for d in card.summon_dice:
			s_dice += str(d)
		var a_dice := ""
		for d in card.attack_dice:
			a_dice += str(d)
		var eff_text := ""
		if card.effect_description != "":
			eff_text = " | " + card.effect_description
		btn.text = "%s  HP:%d ATK:%d  S[%s] A[%s]%s" % [
			card.card_name, card.hp, card.atk, s_dice, a_dice, eff_text
		]
		btn.add_theme_font_size_override("font_size", 16)
		btn.custom_minimum_size.y = 50
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.pressed.connect(_on_card_selected.bind(card))
		# Color the button background with card color
		var style := StyleBoxFlat.new()
		style.bg_color = card.color.darkened(0.6)
		style.border_width_bottom = 1
		style.border_color = card.color.darkened(0.3)
		style.corner_radius_top_left = 4
		style.corner_radius_top_right = 4
		style.corner_radius_bottom_left = 4
		style.corner_radius_bottom_right = 4
		btn.add_theme_stylebox_override("normal", style)
		pool_list.add_child(btn)

	# Separator
	var sep := HSeparator.new()
	main_vbox.add_child(sep)

	# Deck section (bottom half)
	deck_count_label = Label.new()
	deck_count_label.add_theme_font_size_override("font_size", 22)
	main_vbox.add_child(deck_count_label)

	var deck_scroll := ScrollContainer.new()
	deck_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	deck_scroll.custom_minimum_size.y = 500
	main_vbox.add_child(deck_scroll)

	deck_list_container = VBoxContainer.new()
	deck_list_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	deck_list_container.add_theme_constant_override("separation", 2)
	deck_scroll.add_child(deck_list_container)

	# Buttons
	var btn_row := HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 20)
	btn_row.alignment = BoxContainer.ALIGNMENT_CENTER
	main_vbox.add_child(btn_row)

	var back_btn := Button.new()
	back_btn.text = "Back"
	back_btn.custom_minimum_size = Vector2(200, 70)
	back_btn.add_theme_font_size_override("font_size", 24)
	back_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/title/title_screen.tscn"))
	btn_row.add_child(back_btn)

	var save_btn := Button.new()
	save_btn.text = "Save Deck"
	save_btn.custom_minimum_size = Vector2(200, 70)
	save_btn.add_theme_font_size_override("font_size", 24)
	save_btn.pressed.connect(_on_save)
	btn_row.add_child(save_btn)

	# Load existing deck if any
	if GameManager.player_deck.size() > 0:
		for card in GameManager.player_deck:
			deck.append(card.duplicate_card() if card is CardData else card)

	_update_deck_display()

func _on_card_selected(card: CardData) -> void:
	if deck.size() >= MAX_DECK_SIZE:
		return
	var count := 0
	for c in deck:
		if c.id == card.id:
			count += 1
	if count >= MAX_COPIES:
		return
	deck.append(card.duplicate_card())
	_update_deck_display()

func _update_deck_display() -> void:
	for child in deck_list_container.get_children():
		child.queue_free()

	for i in range(deck.size()):
		var card: CardData = deck[i]
		var hbox := HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 10)

		var label := Label.new()
		var s_dice := ""
		for d in card.summon_dice:
			s_dice += str(d)
		var a_dice := ""
		for d in card.attack_dice:
			a_dice += str(d)
		label.text = "%s  HP:%d ATK:%d  S[%s] A[%s]" % [card.card_name, card.hp, card.atk, s_dice, a_dice]
		label.add_theme_font_size_override("font_size", 16)
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		hbox.add_child(label)

		var remove_btn := Button.new()
		remove_btn.text = "X"
		remove_btn.custom_minimum_size = Vector2(50, 40)
		remove_btn.pressed.connect(_on_remove_card.bind(i))
		hbox.add_child(remove_btn)

		deck_list_container.add_child(hbox)

	deck_count_label.text = "Your Deck: %d / %d" % [deck.size(), MAX_DECK_SIZE]

func _on_remove_card(index: int) -> void:
	deck.remove_at(index)
	_update_deck_display()

func _on_save() -> void:
	if deck.size() == MAX_DECK_SIZE:
		GameManager.player_deck = deck.duplicate()
		GameManager.save_deck()
		# Show confirmation
		var popup := AcceptDialog.new()
		popup.title = "Saved"
		popup.dialog_text = "Deck saved! (%d cards)" % deck.size()
		add_child(popup)
		popup.popup_centered()
	else:
		var popup := AcceptDialog.new()
		popup.title = "Error"
		popup.dialog_text = "Deck must have exactly %d cards! (Currently: %d)" % [MAX_DECK_SIZE, deck.size()]
		add_child(popup)
		popup.popup_centered()
