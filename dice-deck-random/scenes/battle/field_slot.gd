class_name FieldSlot
extends Control

signal slot_clicked(slot: FieldSlot)

var slot_index: int = 0
var is_player_side: bool = true
var card_ui: Control = null  # CardUI reference
var forward_slots: Array = []

var background: Panel
var is_highlighted: bool = false

func _ready() -> void:
	custom_minimum_size = Vector2(185, 260)
	size = Vector2(185, 260)
	mouse_filter = Control.MOUSE_FILTER_STOP

	background = Panel.new()
	background.name = "Background"
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	_update_display()

func is_empty() -> bool:
	return card_ui == null

func place_card(card: Control) -> void:
	card_ui = card
	if card.get_parent():
		card.reparent(self)
	else:
		add_child(card)
	card.position = Vector2(5, 5)  # Small padding
	card.z_index = 1
	_update_display()

func remove_card() -> Control:
	var card := card_ui
	card_ui = null
	_update_display()
	return card

func is_protected() -> bool:
	if forward_slots.size() == 0:
		return false
	for slot in forward_slots:
		if slot.is_empty():
			return false
	return true

func set_highlighted(highlight: bool) -> void:
	is_highlighted = highlight
	_update_display()

func _update_display() -> void:
	if not is_inside_tree():
		return
	var style := StyleBoxFlat.new()
	if card_ui != null:
		style.bg_color = Color(0, 0, 0, 0)
	elif is_highlighted:
		style.bg_color = Color(0.2, 1.0, 0.2, 0.15)
		style.border_width_left = 2
		style.border_width_right = 2
		style.border_width_top = 2
		style.border_width_bottom = 2
		style.border_color = Color(0.3, 1.0, 0.3, 0.6)
	else:
		style.bg_color = Color(1, 1, 1, 0.08)
		style.border_width_left = 1
		style.border_width_right = 1
		style.border_width_top = 1
		style.border_width_bottom = 1
		style.border_color = Color(1, 1, 1, 0.2)
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	background.add_theme_stylebox_override("panel", style)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			slot_clicked.emit(self)
			accept_event()
	if event is InputEventScreenTouch:
		if event.pressed:
			slot_clicked.emit(self)
			accept_event()
