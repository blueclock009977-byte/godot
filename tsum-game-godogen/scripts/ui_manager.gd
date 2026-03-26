extends Control
## res://scripts/ui_manager.gd: HUD displaying score, timer, combo, fever gauge, skill buttons, and game over overlay

var _score_label: Label
var _time_label: Label
var _combo_label: Label
var _fever_bar: ProgressBar
var _fever_label: Label
var _game_over_panel: PanelContainer
var _final_score_label: Label
var _retry_button: Button
var _skill_buttons: Array = []
var _skill_bars: Array = []
var _skill_labels: Array = []
var _leader_label: Label

func _ready() -> void:
	_build_ui()
	_connect_signals()
	_update_leader_label()
	# Make all non-button UI pass-through for touch/mouse events
	_set_mouse_filter_recursive(self, Control.MOUSE_FILTER_IGNORE)

func _build_ui() -> void:
	# Full rect
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	# CRITICAL: Let touch/mouse events pass through to game field
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	# Top HUD bar
	var top_bar := HBoxContainer.new()
	top_bar.name = "TopBar"
	top_bar.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top_bar.offset_bottom = 60.0
	top_bar.offset_left = 10.0
	top_bar.offset_right = -10.0
	top_bar.offset_top = 10.0
	top_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(top_bar)

	# Timer
	_time_label = Label.new()
	_time_label.name = "TimeLabel"
	_time_label.text = "60"
	_time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	_time_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_time_label.add_theme_font_size_override("font_size", 28)
	_time_label.add_theme_color_override("font_color", Color.WHITE)
	top_bar.add_child(_time_label)

	# Score
	_score_label = Label.new()
	_score_label.name = "ScoreLabel"
	_score_label.text = "0"
	_score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_score_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_score_label.add_theme_font_size_override("font_size", 32)
	_score_label.add_theme_color_override("font_color", Color.WHITE)
	top_bar.add_child(_score_label)

	# Combo
	_combo_label = Label.new()
	_combo_label.name = "ComboLabel"
	_combo_label.text = ""
	_combo_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_combo_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	_combo_label.add_theme_font_size_override("font_size", 24)
	_combo_label.add_theme_color_override("font_color", Color(1.0, 0.9, 0.3))
	top_bar.add_child(_combo_label)

	# Leader skill label
	_leader_label = Label.new()
	_leader_label.name = "LeaderLabel"
	_leader_label.text = ""
	_leader_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_leader_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	_leader_label.offset_top = 58.0
	_leader_label.offset_bottom = 78.0
	_leader_label.offset_left = 10.0
	_leader_label.offset_right = -10.0
	_leader_label.add_theme_font_size_override("font_size", 14)
	_leader_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.4))
	add_child(_leader_label)

	# Fever bar
	var fever_container := VBoxContainer.new()
	fever_container.name = "FeverContainer"
	fever_container.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	fever_container.offset_top = 80.0
	fever_container.offset_bottom = 115.0
	fever_container.offset_left = 30.0
	fever_container.offset_right = -30.0
	add_child(fever_container)

	_fever_label = Label.new()
	_fever_label.name = "FeverLabel"
	_fever_label.text = "FEVER"
	_fever_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_fever_label.add_theme_font_size_override("font_size", 14)
	_fever_label.add_theme_color_override("font_color", Color(1.0, 0.5, 0.8))
	fever_container.add_child(_fever_label)

	_fever_bar = ProgressBar.new()
	_fever_bar.name = "FeverBar"
	_fever_bar.min_value = 0.0
	_fever_bar.max_value = 100.0
	_fever_bar.value = 0.0
	_fever_bar.custom_minimum_size = Vector2(0, 16)
	_fever_bar.show_percentage = false
	fever_container.add_child(_fever_bar)

	# Skill buttons at bottom
	_build_skill_buttons()

	# Game Over Panel (hidden initially)
	_game_over_panel = PanelContainer.new()
	_game_over_panel.name = "GameOverPanel"
	_game_over_panel.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_game_over_panel.offset_left = -150.0
	_game_over_panel.offset_right = 150.0
	_game_over_panel.offset_top = -120.0
	_game_over_panel.offset_bottom = 120.0
	_game_over_panel.visible = false
	add_child(_game_over_panel)

	var go_vbox := VBoxContainer.new()
	go_vbox.name = "VBox"
	go_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	_game_over_panel.add_child(go_vbox)

	var go_title := Label.new()
	go_title.name = "GameOverTitle"
	go_title.text = "GAME OVER"
	go_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	go_title.add_theme_font_size_override("font_size", 36)
	go_title.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
	go_vbox.add_child(go_title)

	_final_score_label = Label.new()
	_final_score_label.name = "FinalScoreLabel"
	_final_score_label.text = "Score: 0"
	_final_score_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_final_score_label.add_theme_font_size_override("font_size", 28)
	go_vbox.add_child(_final_score_label)

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	go_vbox.add_child(spacer)

	_retry_button = Button.new()
	_retry_button.name = "RetryButton"
	_retry_button.text = "Retry"
	_retry_button.custom_minimum_size = Vector2(200, 50)
	_retry_button.pressed.connect(_on_retry_pressed)
	go_vbox.add_child(_retry_button)

	var title_button := Button.new()
	title_button.name = "TitleButton"
	title_button.text = "Title"
	title_button.custom_minimum_size = Vector2(200, 50)
	title_button.pressed.connect(_on_title_pressed)
	go_vbox.add_child(title_button)

func _set_mouse_filter_recursive(node: Control, filter: int) -> void:
	node.mouse_filter = filter
	for child in node.get_children():
		if child is Control:
			# Keep buttons clickable
			if child is Button:
				child.mouse_filter = Control.MOUSE_FILTER_STOP
			else:
				_set_mouse_filter_recursive(child, filter)

func _build_skill_buttons() -> void:
	var skill_container := HBoxContainer.new()
	skill_container.name = "SkillContainer"
	skill_container.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	skill_container.offset_top = -120.0
	skill_container.offset_left = 20.0
	skill_container.offset_right = -20.0
	skill_container.alignment = BoxContainer.ALIGNMENT_CENTER
	skill_container.add_theme_constant_override("separation", 20)
	add_child(skill_container)

	var pm = _find_autoload("PartyManager")

	for i in range(2):
		var skill_vbox := VBoxContainer.new()
		skill_vbox.name = "Skill%d" % i
		skill_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		skill_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		skill_container.add_child(skill_vbox)

		# Skill name label
		var name_label := Label.new()
		name_label.name = "SkillName%d" % i
		name_label.text = "Skill %d" % (i + 1)
		name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		name_label.add_theme_font_size_override("font_size", 14)
		name_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
		skill_vbox.add_child(name_label)
		_skill_labels.append(name_label)

		# Update label with character name
		if pm:
			var ch = pm.get_active_character(i)
			if not ch.is_empty():
				name_label.text = ch["name"]

		# Gauge bar
		var gauge_bar := ProgressBar.new()
		gauge_bar.name = "SkillGauge%d" % i
		gauge_bar.min_value = 0.0
		gauge_bar.max_value = 100.0
		gauge_bar.value = 0.0
		gauge_bar.custom_minimum_size = Vector2(0, 12)
		gauge_bar.show_percentage = false
		skill_vbox.add_child(gauge_bar)
		_skill_bars.append(gauge_bar)

		# Update gauge max from character data
		if pm:
			gauge_bar.max_value = pm.get_gauge_max(i)

		# Skill button
		var btn := Button.new()
		btn.name = "SkillButton%d" % i
		btn.text = "SKILL"
		btn.custom_minimum_size = Vector2(100, 50)
		btn.disabled = true
		btn.pressed.connect(_on_skill_pressed.bind(i))
		# Style the button
		var style := StyleBoxFlat.new()
		style.bg_color = Color(0.3, 0.2, 0.5)
		style.corner_radius_top_left = 8
		style.corner_radius_top_right = 8
		style.corner_radius_bottom_left = 8
		style.corner_radius_bottom_right = 8
		btn.add_theme_stylebox_override("normal", style)
		var hover_style := StyleBoxFlat.new()
		hover_style.bg_color = Color(0.4, 0.3, 0.6)
		hover_style.corner_radius_top_left = 8
		hover_style.corner_radius_top_right = 8
		hover_style.corner_radius_bottom_left = 8
		hover_style.corner_radius_bottom_right = 8
		btn.add_theme_stylebox_override("hover", hover_style)
		var disabled_style := StyleBoxFlat.new()
		disabled_style.bg_color = Color(0.2, 0.15, 0.25)
		disabled_style.corner_radius_top_left = 8
		disabled_style.corner_radius_top_right = 8
		disabled_style.corner_radius_bottom_left = 8
		disabled_style.corner_radius_bottom_right = 8
		btn.add_theme_stylebox_override("disabled", disabled_style)
		skill_vbox.add_child(btn)
		_skill_buttons.append(btn)

func _update_leader_label() -> void:
	var pm = _find_autoload("PartyManager")
	if not pm or not _leader_label:
		return
	var leader = pm.get_leader()
	if leader.is_empty():
		_leader_label.text = ""
		return
	var effect_text: String = ""
	var lt = leader["leader_type"]
	match lt:
		CharacterData.LeaderType.SCORE_BOOST:
			effect_text = "Score +%d%%" % int(leader["leader_value"] * 100)
		CharacterData.LeaderType.TIME_EXTEND:
			effect_text = "Time +%ds" % int(leader["leader_value"])
		CharacterData.LeaderType.FEVER_BOOST:
			effect_text = "Fever x%.1f" % (1.0 + leader["leader_value"])
		CharacterData.LeaderType.COMBO_BOOST:
			effect_text = "Combo +%.1fs" % leader["leader_value"]
		CharacterData.LeaderType.GAUGE_BOOST:
			effect_text = "Gauge +%d%%" % int(leader["leader_value"] * 100)
	_leader_label.text = "Leader: %s [%s]" % [leader["name"], effect_text]

func _connect_signals() -> void:
	# Find GameManager autoload
	var gm = _find_autoload("GameManager")
	if gm:
		gm.time_updated.connect(_on_time_updated)
		gm.score_updated.connect(_on_score_updated)
		gm.combo_updated.connect(_on_combo_updated)
		gm.fever_updated.connect(_on_fever_updated)
		gm.game_over.connect(_on_game_over)
		gm.skill_gauge_updated.connect(_on_skill_gauge_updated)

func _find_autoload(autoload_name: String) -> Node:
	var root = get_tree().root
	for child in root.get_children():
		if child.name == autoload_name:
			return child
	return null

func _on_time_updated(remaining: float) -> void:
	if _time_label:
		_time_label.text = str(int(ceil(remaining)))

func _on_score_updated(new_score: int) -> void:
	if _score_label:
		_score_label.text = str(new_score)

func _on_combo_updated(combo_count: int) -> void:
	if _combo_label:
		if combo_count > 1:
			_combo_label.text = "%d Combo!" % combo_count
		else:
			_combo_label.text = ""

func _on_fever_updated(gauge: float, active: bool) -> void:
	if _fever_bar:
		_fever_bar.value = gauge
	if _fever_label:
		if active:
			_fever_label.text = "FEVER!!!"
			_fever_label.add_theme_color_override("font_color", Color(1.0, 0.2, 0.5))
		else:
			_fever_label.text = "FEVER"
			_fever_label.add_theme_color_override("font_color", Color(1.0, 0.5, 0.8))

func _on_game_over(final_score: int) -> void:
	if _game_over_panel:
		_game_over_panel.visible = true
		_game_over_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	if _final_score_label:
		_final_score_label.text = "Score: %d" % final_score
	# Disable skill buttons
	for btn in _skill_buttons:
		btn.disabled = true

func _on_skill_gauge_updated(slot: int, current: float, max_val: float) -> void:
	if slot < 0 or slot > 1:
		return
	if slot < _skill_bars.size():
		_skill_bars[slot].max_value = max_val
		_skill_bars[slot].value = current
	if slot < _skill_buttons.size():
		_skill_buttons[slot].disabled = current < max_val
		if current >= max_val:
			_skill_buttons[slot].text = "READY!"
			_skill_buttons[slot].add_theme_color_override("font_color", Color(1.0, 1.0, 0.3))
		else:
			_skill_buttons[slot].text = "SKILL"
			_skill_buttons[slot].remove_theme_color_override("font_color")

func _on_skill_pressed(slot: int) -> void:
	var gm = _find_autoload("GameManager")
	if gm:
		var result = gm.use_skill(slot)
		if result.get("success", false):
			# Flash effect on button
			if slot < _skill_buttons.size():
				var tween = create_tween()
				tween.tween_property(_skill_buttons[slot], ^"modulate", Color(2, 2, 2), 0.1)
				tween.tween_property(_skill_buttons[slot], ^"modulate", Color.WHITE, 0.2)

func _on_retry_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _on_title_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/title.tscn")

func hide_game_over() -> void:
	if _game_over_panel:
		_game_over_panel.visible = false
