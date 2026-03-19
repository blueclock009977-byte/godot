extends Control
## res://scripts/ui_manager.gd: HUD displaying score, timer, combo, fever gauge, and game over overlay

var _score_label: Label
var _time_label: Label
var _combo_label: Label
var _fever_bar: ProgressBar
var _fever_label: Label
var _game_over_panel: PanelContainer
var _final_score_label: Label
var _retry_button: Button

func _ready() -> void:
	_build_ui()
	_connect_signals()

func _build_ui() -> void:
	# Full rect
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	# Top HUD bar
	var top_bar := HBoxContainer.new()
	top_bar.name = "TopBar"
	top_bar.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top_bar.offset_bottom = 60.0
	top_bar.offset_left = 10.0
	top_bar.offset_right = -10.0
	top_bar.offset_top = 10.0
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

	# Fever bar
	var fever_container := VBoxContainer.new()
	fever_container.name = "FeverContainer"
	fever_container.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	fever_container.offset_top = 65.0
	fever_container.offset_bottom = 100.0
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
	if _final_score_label:
		_final_score_label.text = "Score: %d" % final_score

func _on_skill_gauge_updated(_slot: int, _current: float, _max_val: float) -> void:
	# Placeholder for Phase 2
	pass

func _on_retry_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _on_title_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/title.tscn")

func hide_game_over() -> void:
	if _game_over_panel:
		_game_over_panel.visible = false
