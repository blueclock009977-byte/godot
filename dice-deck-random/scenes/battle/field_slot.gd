class_name FieldSlot
extends Control

signal slot_clicked(slot: FieldSlot)

var slot_index: int = 0  # 0-5: 0-2 front, 3-5 back
var is_player_side: bool = true
var card_ui: Control = null
var lane: int = 0  # 0=left, 1=center, 2=right
var is_front_row: bool = true

var background: Panel
var is_highlighted: bool = false
var is_keyboard_focused: bool = false

func _ready() -> void:
	var card_w := CardUI.BASE_WIDTH + 10  # カード幅 + マージン
	var card_h := card_w * CardUI.CARD_RATIO
	custom_minimum_size = Vector2(card_w, card_h)
	size = Vector2(card_w, card_h)
	mouse_filter = Control.MOUSE_FILTER_STOP

	background = Panel.new()
	background.name = "Background"
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)
	_update_display()

func setup_lane_info() -> void:
	# slot 0,1,2 = front row; 3,4,5 = back row
	is_front_row = slot_index < 3
	lane = slot_index % 3  # 0=left,1=center,2=right

func is_empty() -> bool:
	return card_ui == null

func place_card(card: Control) -> void:
	card_ui = card
	if card.get_parent():
		card.reparent(self)
	else:
		add_child(card)
	card.position = Vector2(5, 5)
	card.z_index = 1
	_update_display()

func remove_card() -> Control:
	var card := card_ui
	card_ui = null
	_update_display()
	return card

func set_highlighted(highlight: bool) -> void:
	is_highlighted = highlight
	_update_display()

func set_keyboard_focused(focused: bool) -> void:
	is_keyboard_focused = focused
	_update_display()

func _update_display() -> void:
	if not is_inside_tree():
		return
	var style := StyleBoxFlat.new()
	if card_ui != null:
		style.bg_color = Color(0, 0, 0, 0)
		# Show keyboard focus border even when card is present
		if is_keyboard_focused:
			style.border_width_left = 3
			style.border_width_right = 3
			style.border_width_top = 3
			style.border_width_bottom = 3
			style.border_color = Color(1, 1, 0.5, 0.9)  # Yellow border for keyboard focus
	elif is_keyboard_focused:
		style.bg_color = Color(1.0, 1.0, 0.5, 0.15)
		style.border_width_left = 3
		style.border_width_right = 3
		style.border_width_top = 3
		style.border_width_bottom = 3
		style.border_color = Color(1, 1, 0.5, 0.9)  # Yellow border for keyboard focus
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
