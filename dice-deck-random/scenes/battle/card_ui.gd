class_name CardUI
extends Control

signal card_clicked(card_ui: CardUI)
signal card_drag_started(card_ui: CardUI)
signal card_drag_ended(card_ui: CardUI, target_position: Vector2)

var card_data: CardData
var current_hp: int = 0
var current_atk: int = 0
var is_attack_ready: bool = false
var is_summonable: bool = false
var is_selected: bool = false
var is_face_down: bool = false
var is_dragging: bool = false
var drag_offset: Vector2 = Vector2.ZERO
var original_position: Vector2 = Vector2.ZERO
var bonus_attack_dice: Array[int] = []

# Child nodes - will be created in _ready
var background: Panel
var name_label: Label
var stats_label: Label
var dice_label: Label
var effect_label: Label
var glow_effect: ColorRect
var glow_tween: Tween

func _ready() -> void:
	custom_minimum_size = Vector2(140, 200)
	size = Vector2(140, 200)
	mouse_filter = Control.MOUSE_FILTER_STOP

	# Create child nodes programmatically
	background = Panel.new()
	background.name = "Background"
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(background)

	var vbox := VBoxContainer.new()
	vbox.name = "VBox"
	vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	vbox.add_theme_constant_override("separation", 2)
	add_child(vbox)

	name_label = Label.new()
	name_label.name = "NameLabel"
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 14)
	name_label.clip_text = true
	vbox.add_child(name_label)

	stats_label = Label.new()
	stats_label.name = "StatsLabel"
	stats_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stats_label.add_theme_font_size_override("font_size", 18)
	vbox.add_child(stats_label)

	dice_label = Label.new()
	dice_label.name = "DiceLabel"
	dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_label.add_theme_font_size_override("font_size", 11)
	dice_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	vbox.add_child(dice_label)

	effect_label = Label.new()
	effect_label.name = "EffectLabel"
	effect_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	effect_label.add_theme_font_size_override("font_size", 10)
	effect_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	effect_label.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_child(effect_label)

	glow_effect = ColorRect.new()
	glow_effect.name = "GlowEffect"
	glow_effect.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	glow_effect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	glow_effect.visible = false
	add_child(glow_effect)

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
		name_label.text = "???"
		stats_label.text = ""
		dice_label.text = ""
		effect_label.text = ""
		var style := StyleBoxFlat.new()
		style.bg_color = Color(0.3, 0.3, 0.4)
		style.corner_radius_top_left = 8
		style.corner_radius_top_right = 8
		style.corner_radius_bottom_left = 8
		style.corner_radius_bottom_right = 8
		background.add_theme_stylebox_override("panel", style)
		glow_effect.visible = false
		return

	name_label.text = card_data.card_name
	stats_label.text = "HP:%d ATK:%d" % [current_hp, current_atk]

	var s_dice := ""
	for d in card_data.summon_dice:
		s_dice += str(d) + " "
	var a_dice := ""
	var all_atk_dice := get_all_attack_dice()
	for d in all_atk_dice:
		a_dice += str(d) + " "
	dice_label.text = "S[%s] A[%s]" % [s_dice.strip_edges(), a_dice.strip_edges()]

	if card_data.effect_description != "":
		effect_label.text = card_data.effect_description
		effect_label.visible = true
	else:
		effect_label.text = ""
		effect_label.visible = false

	var style := StyleBoxFlat.new()
	style.bg_color = card_data.color.darkened(0.3)
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_color = card_data.color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	background.add_theme_stylebox_override("panel", style)

	var should_glow := is_attack_ready or is_summonable or is_selected
	glow_effect.visible = should_glow
	if is_selected:
		glow_effect.color = Color(1, 1, 0, 0.3)
	elif is_attack_ready:
		glow_effect.color = Color(1, 0.3, 0.3, 0.25)
	elif is_summonable:
		glow_effect.color = Color(0.3, 1, 0.3, 0.25)
	_update_glow_animation(should_glow)

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

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				card_clicked.emit(self)
				is_dragging = true
				drag_offset = get_global_mouse_position() - global_position
				original_position = global_position
				card_drag_started.emit(self)
				accept_event()
			else:
				if is_dragging:
					is_dragging = false
					card_drag_ended.emit(self, global_position + size / 2)
					accept_event()
	elif event is InputEventMouseMotion:
		if is_dragging:
			global_position = get_global_mouse_position() - drag_offset
			accept_event()

	if event is InputEventScreenTouch:
		if event.pressed:
			card_clicked.emit(self)
			is_dragging = true
			drag_offset = event.position
			original_position = global_position
			card_drag_started.emit(self)
			accept_event()
		else:
			if is_dragging:
				is_dragging = false
				card_drag_ended.emit(self, global_position + size / 2)
				accept_event()
	elif event is InputEventScreenDrag:
		if is_dragging:
			global_position = event.position - drag_offset
			accept_event()

func reset_position() -> void:
	global_position = original_position
	is_dragging = false

func _update_glow_animation(should_glow: bool) -> void:
	if glow_tween:
		glow_tween.kill()
		glow_tween = null
	if should_glow and glow_effect.visible:
		glow_tween = create_tween().set_loops()
		glow_tween.tween_property(glow_effect, "modulate:a", 0.4, 0.6).set_trans(Tween.TRANS_SINE)
		glow_tween.tween_property(glow_effect, "modulate:a", 1.0, 0.6).set_trans(Tween.TRANS_SINE)

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
