class_name CardUI
extends Control

signal card_clicked(card_ui: CardUI)
signal card_drag_started(card_ui: CardUI)
signal card_drag_ended(card_ui: CardUI, target_position: Vector2)

var card_data: CardData
var current_hp: int = 0
var current_atk: int = 0
var is_selected: bool = false
var is_face_down: bool = false
var is_dragging: bool = false
var is_pressing: bool = false
var is_summonable: bool = false
var is_movable: bool = false
var drag_offset: Vector2 = Vector2.ZERO
var press_start_pos: Vector2 = Vector2.ZERO
var original_position: Vector2 = Vector2.ZERO
const DRAG_THRESHOLD := 30.0

var background: Panel
var mana_cost_label: Label
var image_area: Panel
var name_label: Label
var attack_dice_label: Label
var hp_badge: Panel
var hp_label: Label
var atk_badge: Panel
var atk_label: Label
var glow_tween: Tween

func _ready() -> void:
	custom_minimum_size = Vector2(200, 250)
	size = Vector2(175, 250)
	mouse_filter = Control.MOUSE_FILTER_STOP

	background = Panel.new()
	background.name = "Background"
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 6)
	margin.add_theme_constant_override("margin_right", 6)
	margin.add_theme_constant_override("margin_top", 5)
	margin.add_theme_constant_override("margin_bottom", 5)
	margin.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 2)
	vbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
	margin.add_child(vbox)

	# Mana cost (top)
	mana_cost_label = Label.new()
	mana_cost_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mana_cost_label.add_theme_font_size_override("font_size", 26)
	mana_cost_label.add_theme_color_override("font_color", Color(0.4, 0.7, 1.0))
	mana_cost_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbox.add_child(mana_cost_label)

	# Image area
	image_area = Panel.new()
	image_area.custom_minimum_size = Vector2(0, 80)
	image_area.size_flags_vertical = Control.SIZE_EXPAND_FILL
	image_area.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbox.add_child(image_area)

	# Card name
	name_label = Label.new()
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 22)
	name_label.clip_text = true
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbox.add_child(name_label)

	# Attack dice
	attack_dice_label = Label.new()
	attack_dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	attack_dice_label.add_theme_font_size_override("font_size", 24)
	attack_dice_label.add_theme_color_override("font_color", Color(1.0, 0.5, 0.5))
	attack_dice_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbox.add_child(attack_dice_label)

	# Bottom row: HP / ATK
	var bottom_row := HBoxContainer.new()
	bottom_row.add_theme_constant_override("separation", 0)
	bottom_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bottom_row.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(bottom_row)

	hp_badge = Panel.new()
	hp_badge.custom_minimum_size = Vector2(44, 44)
	hp_badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.add_child(hp_badge)

	hp_label = Label.new()
	hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hp_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hp_label.add_theme_font_size_override("font_size", 28)
	hp_label.add_theme_color_override("font_color", Color.WHITE)
	hp_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hp_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hp_badge.add_child(hp_label)

	var badge_spacer := Control.new()
	badge_spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	badge_spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.add_child(badge_spacer)

	atk_badge = Panel.new()
	atk_badge.custom_minimum_size = Vector2(44, 44)
	atk_badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.add_child(atk_badge)

	atk_label = Label.new()
	atk_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	atk_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	atk_label.add_theme_font_size_override("font_size", 28)
	atk_label.add_theme_color_override("font_color", Color.WHITE)
	atk_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	atk_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	atk_badge.add_child(atk_label)
	# setup()がツリー参加前に呼ばれた場合に描画
	if card_data:
		_update_display()

func setup(data: CardData) -> void:
	card_data = data
	current_hp = data.hp
	current_atk = data.atk
	if is_inside_tree():
		_update_display()

func _update_display() -> void:
	if not is_inside_tree():
		return
	if is_face_down:
		mana_cost_label.text = ""
		name_label.text = "???"
		attack_dice_label.text = ""
		hp_label.text = ""
		atk_label.text = ""
		hp_badge.visible = false
		atk_badge.visible = false
		var style := StyleBoxFlat.new()
		style.bg_color = Color(0.3, 0.3, 0.4)
		style.corner_radius_top_left = 8
		style.corner_radius_top_right = 8
		style.corner_radius_bottom_left = 8
		style.corner_radius_bottom_right = 8
		background.add_theme_stylebox_override("panel", style)
		var img_style := StyleBoxFlat.new()
		img_style.bg_color = Color(0.25, 0.25, 0.35)
		img_style.corner_radius_top_left = 4
		img_style.corner_radius_top_right = 4
		img_style.corner_radius_bottom_left = 4
		img_style.corner_radius_bottom_right = 4
		image_area.add_theme_stylebox_override("panel", img_style)
		return

	# Mana cost
	mana_cost_label.text = "%dコスト" % card_data.mana_cost

	name_label.text = card_data.card_name

	# Attack dice
	var a_dice := ""
	for d in card_data.attack_dice:
		a_dice += "[%d]" % d
	attack_dice_label.text = a_dice if a_dice != "" else "-"

	hp_badge.visible = true
	atk_badge.visible = true
	hp_label.text = "%d" % current_hp
	atk_label.text = "%d" % current_atk
	_update_badge_style(hp_badge, Color(0.15, 0.55, 0.15))
	_update_badge_style(atk_badge, Color(0.7, 0.15, 0.15))

	# Border
	var border_color: Color
	var border_width: int = 2
	if is_selected:
		border_color = Color(1, 1, 1)
		border_width = 4
	elif is_summonable:
		border_color = Color(0.2, 1, 0.2)
		border_width = 4
	elif is_movable:
		border_color = Color(0.2, 0.7, 1.0)
		border_width = 4
	else:
		border_color = card_data.color
		border_width = 2

	var style := StyleBoxFlat.new()
	style.bg_color = card_data.color.darkened(0.5)
	style.border_width_left = border_width
	style.border_width_right = border_width
	style.border_width_top = border_width
	style.border_width_bottom = border_width
	style.border_color = border_color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	background.add_theme_stylebox_override("panel", style)

	var img_style := StyleBoxFlat.new()
	img_style.bg_color = card_data.color.darkened(0.2)
	img_style.corner_radius_top_left = 4
	img_style.corner_radius_top_right = 4
	img_style.corner_radius_bottom_left = 4
	img_style.corner_radius_bottom_right = 4
	image_area.add_theme_stylebox_override("panel", img_style)

	var should_glow := is_selected or is_summonable or is_movable
	_update_glow_animation(should_glow)

func _update_badge_style(badge: Panel, color: Color) -> void:
	var s := StyleBoxFlat.new()
	s.bg_color = Color(color.r, color.g, color.b, 0.6)
	s.corner_radius_top_left = 22
	s.corner_radius_top_right = 22
	s.corner_radius_bottom_left = 22
	s.corner_radius_bottom_right = 22
	s.border_width_left = 1
	s.border_width_right = 1
	s.border_width_top = 1
	s.border_width_bottom = 1
	s.border_color = Color(color.r * 1.5, color.g * 1.5, color.b * 1.5, 0.6)
	badge.add_theme_stylebox_override("panel", s)

func take_damage(amount: int) -> int:
	current_hp -= amount
	_update_display()
	return current_hp

func set_selected(selected: bool) -> void:
	is_selected = selected
	_update_display()

func set_summonable(summonable: bool) -> void:
	is_summonable = summonable
	_update_display()

func set_movable(movable: bool) -> void:
	is_movable = movable
	_update_display()

func set_face_down(face_down: bool) -> void:
	is_face_down = face_down
	_update_display()

func _start_drag() -> void:
	original_position = global_position
	is_dragging = true
	top_level = true
	z_index = 100
	global_position = original_position

func _end_drag() -> void:
	is_dragging = false
	top_level = false
	z_index = 0

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				is_pressing = true
				press_start_pos = get_global_mouse_position()
			else:
				if is_pressing and _is_point_inside(get_global_mouse_position()):
					card_clicked.emit(self)
					if get_parent() is FieldSlot:
						(get_parent() as FieldSlot).slot_clicked.emit(get_parent())
				is_pressing = false
				accept_event()
	if event is InputEventScreenTouch:
		if event.pressed:
			is_pressing = true
			press_start_pos = event.position
		else:
			if is_pressing and _is_point_inside(event.position):
				card_clicked.emit(self)
				if get_parent() is FieldSlot:
					(get_parent() as FieldSlot).slot_clicked.emit(get_parent())
			is_pressing = false
			accept_event()

func _is_point_inside(point: Vector2) -> bool:
	var rect := get_global_rect()
	return rect.has_point(point)

func reset_position() -> void:
	if top_level:
		top_level = false
		z_index = 0
	global_position = original_position
	is_dragging = false
	is_pressing = false

func _update_glow_animation(should_glow: bool) -> void:
	if glow_tween:
		glow_tween.kill()
		glow_tween = null
	if should_glow:
		glow_tween = create_tween().set_loops()
		glow_tween.tween_property(self, "modulate:a", 0.6, 0.5).set_trans(Tween.TRANS_SINE)
		glow_tween.tween_property(self, "modulate:a", 1.0, 0.5).set_trans(Tween.TRANS_SINE)
	else:
		modulate.a = 1.0

func play_destroy_animation() -> Signal:
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(self, "modulate:a", 0.0, 0.3).set_trans(Tween.TRANS_QUAD)
	tween.tween_property(self, "scale", Vector2(0.7, 0.7), 0.3).set_trans(Tween.TRANS_QUAD)
	return tween.finished

func play_damage_flash() -> void:
	var tween := create_tween()
	tween.tween_property(self, "modulate", Color(1, 0.3, 0.3), 0.08)
	tween.tween_property(self, "modulate", Color.WHITE, 0.15)
