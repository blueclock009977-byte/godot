class_name CardUI
extends Control

signal card_clicked(card_ui: CardUI)
signal card_drag_started(card_ui: CardUI)
signal card_drag_ended(card_ui: CardUI, target_position: Vector2)

var card_data: CardData
var current_hp: int = 0
var current_atk: int = 0
var is_attack_ready: bool = false
var has_attacked_this_turn: bool = false
var is_summonable: bool = false
var is_summon_and_attack: bool = false
var is_selected: bool = false
var is_face_down: bool = false
var is_dragging: bool = false
var is_pressing: bool = false
var drag_offset: Vector2 = Vector2.ZERO
var press_start_pos: Vector2 = Vector2.ZERO
var original_position: Vector2 = Vector2.ZERO
const DRAG_THRESHOLD := 15.0
var bonus_attack_dice: Array[int] = []

# Child nodes
var background: Panel
var summon_dice_label: Label
var image_area: Panel
var name_label: Label
var effect_label: Label
var attack_dice_label: Label
var hp_badge: Panel
var hp_label: Label
var atk_badge: Panel
var atk_label: Label
var glow_tween: Tween

func _ready() -> void:
	custom_minimum_size = Vector2(175, 250)
	size = Vector2(175, 250)
	mouse_filter = Control.MOUSE_FILTER_STOP

	# Background panel
	background = Panel.new()
	background.name = "Background"
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	# Main margin - MOUSE_FILTER_IGNORE so clicks pass to CardUI
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

	# 1) Summon dice (top)
	summon_dice_label = Label.new()
	summon_dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	summon_dice_label.add_theme_font_size_override("font_size", 20)
	summon_dice_label.add_theme_color_override("font_color", Color(0.5, 1.0, 0.5))
	summon_dice_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbox.add_child(summon_dice_label)

	# 2) Image area (card color illustration placeholder)
	image_area = Panel.new()
	image_area.custom_minimum_size = Vector2(0, 80)
	image_area.size_flags_vertical = Control.SIZE_EXPAND_FILL
	image_area.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbox.add_child(image_area)

	# 3) Card name
	name_label = Label.new()
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.clip_text = true
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbox.add_child(name_label)

	# 4) Effect description
	effect_label = Label.new()
	effect_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	effect_label.add_theme_font_size_override("font_size", 12)
	effect_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	effect_label.custom_minimum_size = Vector2(0, 0)
	effect_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbox.add_child(effect_label)

	# 5) Attack dice
	attack_dice_label = Label.new()
	attack_dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	attack_dice_label.add_theme_font_size_override("font_size", 20)
	attack_dice_label.add_theme_color_override("font_color", Color(1.0, 0.5, 0.5))
	attack_dice_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vbox.add_child(attack_dice_label)

	# 6) Bottom row: HP circle (left) / ATK circle (right)
	var bottom_row := HBoxContainer.new()
	bottom_row.add_theme_constant_override("separation", 0)
	bottom_row.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	bottom_row.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_child(bottom_row)

	# HP badge
	hp_badge = Panel.new()
	hp_badge.custom_minimum_size = Vector2(44, 44)
	hp_badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.add_child(hp_badge)

	hp_label = Label.new()
	hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hp_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	hp_label.add_theme_font_size_override("font_size", 24)
	hp_label.add_theme_color_override("font_color", Color.WHITE)
	hp_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	hp_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hp_badge.add_child(hp_label)

	# Spacer between badges
	var badge_spacer := Control.new()
	badge_spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	badge_spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.add_child(badge_spacer)

	# ATK badge
	atk_badge = Panel.new()
	atk_badge.custom_minimum_size = Vector2(44, 44)
	atk_badge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	bottom_row.add_child(atk_badge)

	atk_label = Label.new()
	atk_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	atk_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	atk_label.add_theme_font_size_override("font_size", 24)
	atk_label.add_theme_color_override("font_color", Color.WHITE)
	atk_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	atk_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	atk_badge.add_child(atk_label)

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
		summon_dice_label.text = ""
		name_label.text = "???"
		effect_label.text = ""
		effect_label.visible = false
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

	# Summon dice (top)
	var s_dice := ""
	for d in card_data.summon_dice:
		s_dice += "[%d]" % d
	summon_dice_label.text = s_dice if s_dice != "" else "-"

	# Card name
	name_label.text = card_data.card_name

	# Effect
	if card_data.effect_description != "":
		effect_label.text = card_data.effect_description
		effect_label.visible = true
	else:
		effect_label.text = ""
		effect_label.visible = false

	# Attack dice
	var all_atk_dice := get_all_attack_dice()
	var a_dice := ""
	for d in all_atk_dice:
		a_dice += "[%d]" % d
	attack_dice_label.text = a_dice if a_dice != "" else "-"

	# HP / ATK badges
	hp_badge.visible = true
	atk_badge.visible = true
	hp_label.text = "%d" % current_hp
	atk_label.text = "%d" % current_atk
	_update_badge_style(hp_badge, Color(0.15, 0.55, 0.15))
	_update_badge_style(atk_badge, Color(0.7, 0.15, 0.15))

	# Border color: selected=white, summon+attack=yellow, attack=red, summon=green
	var border_color: Color
	var border_width: int = 2
	if is_selected:
		border_color = Color(1, 1, 1)
		border_width = 4
	elif is_attack_ready:
		border_color = Color(1, 0.2, 0.2)
		border_width = 4
	elif is_summon_and_attack:
		border_color = Color(1, 0.9, 0.1)
		border_width = 4
	elif is_summonable:
		border_color = Color(0.2, 1, 0.2)
		border_width = 4
	else:
		border_color = card_data.color
		border_width = 2

	# Background style
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

	# Image area style (lighter card color)
	var img_style := StyleBoxFlat.new()
	img_style.bg_color = card_data.color.darkened(0.2)
	img_style.corner_radius_top_left = 4
	img_style.corner_radius_top_right = 4
	img_style.corner_radius_bottom_left = 4
	img_style.corner_radius_bottom_right = 4
	image_area.add_theme_stylebox_override("panel", img_style)

	# Glow animation for active states
	var should_glow := is_attack_ready or is_summonable or is_summon_and_attack or is_selected
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

func get_all_attack_dice() -> Array[int]:
	var result: Array[int] = card_data.attack_dice.duplicate()
	for d in bonus_attack_dice:
		if d not in result:
			result.append(d)
	result.sort()
	return result

func take_damage(amount: int) -> int:
	current_hp -= amount
	_update_display()
	return current_hp

func heal(amount: int) -> void:
	current_hp += amount
	_update_display()

func set_attack_ready(ready: bool) -> void:
	is_attack_ready = ready
	_update_display()

func set_summonable(summonable: bool) -> void:
	is_summonable = summonable
	_update_display()

func set_selected(selected: bool) -> void:
	is_selected = selected
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
	# --- Mouse ---
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				is_pressing = true
				press_start_pos = get_global_mouse_position()
				drag_offset = press_start_pos - global_position
				accept_event()
			else:
				if is_dragging:
					var drop_pos := global_position + size / 2
					_end_drag()
					card_drag_ended.emit(self, drop_pos)
				elif is_pressing:
					# No drag happened = pure tap
					card_clicked.emit(self)
				is_pressing = false
				accept_event()
	elif event is InputEventMouseMotion:
		if is_pressing and not is_dragging:
			var dist: float = get_global_mouse_position().distance_to(press_start_pos)
			if dist >= DRAG_THRESHOLD:
				_start_drag()
				card_drag_started.emit(self)
		if is_dragging:
			global_position = get_global_mouse_position() - drag_offset
			accept_event()

	# --- Touch ---
	if event is InputEventScreenTouch:
		if event.pressed:
			is_pressing = true
			press_start_pos = event.position
			drag_offset = event.position - global_position
			accept_event()
		else:
			if is_dragging:
				var drop_pos := global_position + size / 2
				_end_drag()
				card_drag_ended.emit(self, drop_pos)
			elif is_pressing:
				card_clicked.emit(self)
			is_pressing = false
			accept_event()
	elif event is InputEventScreenDrag:
		if is_pressing and not is_dragging:
			var dist: float = event.position.distance_to(press_start_pos)
			if dist >= DRAG_THRESHOLD:
				_start_drag()
				card_drag_started.emit(self)
		if is_dragging:
			global_position = event.position - drag_offset
			accept_event()

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
		# Pulse modulate alpha for border glow effect
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
