extends Control
## res://scripts/party_edit.gd: Party editing screen — select 5 characters for the party

const SLOT_NAMES: Array[String] = ["Leader", "Active 1", "Active 2", "Passive 1", "Passive 2"]
const SLOT_COLORS: Array[Color] = [
	Color(1.0, 0.85, 0.3),   # Leader - gold
	Color(0.4, 0.7, 1.0),    # Active 1 - blue
	Color(0.4, 0.7, 1.0),    # Active 2 - blue
	Color(0.6, 0.9, 0.5),    # Passive 1 - green
	Color(0.6, 0.9, 0.5),    # Passive 2 - green
]

var _selected_slot: int = 0
var _party: Array[int] = [-1, -1, -1, -1, -1]
var _slot_buttons: Array[Button] = []
var _char_buttons: Array[Button] = []
var _info_label: Label
var _desc_label: Label

func _ready() -> void:
	_build_ui()
	# Load current party from PartyManager
	var pm = _find_autoload("PartyManager")
	if pm:
		_party = pm.get_party()
	_update_display()

func _build_ui() -> void:
	set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)

	# Background
	var bg := ColorRect.new()
	bg.name = "Background"
	bg.color = Color(0.1, 0.08, 0.2)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Title
	var title := Label.new()
	title.name = "Title"
	title.text = "Party Edit"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	title.offset_top = 20.0
	title.offset_bottom = 60.0
	title.add_theme_font_size_override("font_size", 32)
	title.add_theme_color_override("font_color", Color.WHITE)
	add_child(title)

	# Party slots (top section)
	var slots_container := HBoxContainer.new()
	slots_container.name = "SlotsContainer"
	slots_container.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	slots_container.offset_top = 70.0
	slots_container.offset_bottom = 170.0
	slots_container.offset_left = 10.0
	slots_container.offset_right = -10.0
	slots_container.alignment = BoxContainer.ALIGNMENT_CENTER
	slots_container.add_theme_constant_override("separation", 6)
	add_child(slots_container)

	var cd = _find_autoload("CharacterData")

	for i in range(5):
		var slot_vbox := VBoxContainer.new()
		slot_vbox.name = "Slot%d" % i
		slot_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		slot_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
		slots_container.add_child(slot_vbox)

		var slot_label := Label.new()
		slot_label.text = SLOT_NAMES[i]
		slot_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		slot_label.add_theme_font_size_override("font_size", 12)
		slot_label.add_theme_color_override("font_color", SLOT_COLORS[i])
		slot_vbox.add_child(slot_label)

		var slot_btn := Button.new()
		slot_btn.name = "SlotBtn%d" % i
		slot_btn.text = "Empty"
		slot_btn.custom_minimum_size = Vector2(80, 60)
		slot_btn.pressed.connect(_on_slot_pressed.bind(i))
		var style := StyleBoxFlat.new()
		style.bg_color = Color(0.2, 0.15, 0.3)
		style.border_width_bottom = 3
		style.border_width_top = 3
		style.border_width_left = 3
		style.border_width_right = 3
		style.border_color = SLOT_COLORS[i].darkened(0.3)
		style.corner_radius_top_left = 6
		style.corner_radius_top_right = 6
		style.corner_radius_bottom_left = 6
		style.corner_radius_bottom_right = 6
		slot_btn.add_theme_stylebox_override("normal", style)
		slot_vbox.add_child(slot_btn)
		_slot_buttons.append(slot_btn)

	# Info label
	_info_label = Label.new()
	_info_label.name = "InfoLabel"
	_info_label.text = "Select a slot, then choose a character"
	_info_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_info_label.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	_info_label.offset_top = 175.0
	_info_label.offset_bottom = 200.0
	_info_label.offset_left = 10.0
	_info_label.offset_right = -10.0
	_info_label.add_theme_font_size_override("font_size", 16)
	_info_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	add_child(_info_label)

	# Character grid
	var scroll := ScrollContainer.new()
	scroll.name = "CharScroll"
	scroll.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	scroll.offset_top = 210.0
	scroll.offset_bottom = -160.0
	scroll.offset_left = 10.0
	scroll.offset_right = -10.0
	add_child(scroll)

	var char_grid := GridContainer.new()
	char_grid.name = "CharGrid"
	char_grid.columns = 2
	char_grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	char_grid.add_theme_constant_override("h_separation", 10)
	char_grid.add_theme_constant_override("v_separation", 10)
	scroll.add_child(char_grid)

	if cd:
		var chars = cd.get_all_characters()
		for ch in chars:
			var char_btn := Button.new()
			char_btn.name = "Char%d" % ch["id"]
			char_btn.custom_minimum_size = Vector2(240, 80)
			char_btn.pressed.connect(_on_char_pressed.bind(ch["id"]))

			# Style with character color
			var tsum_colors: Array[Color] = [
				Color(0.95, 0.25, 0.25),
				Color(0.25, 0.55, 0.95),
				Color(0.30, 0.85, 0.35),
				Color(0.95, 0.85, 0.20),
				Color(0.70, 0.30, 0.90),
			]
			var char_color: Color = tsum_colors[ch["color"] % 5]
			var char_style := StyleBoxFlat.new()
			char_style.bg_color = char_color.darkened(0.6)
			char_style.border_width_left = 4
			char_style.border_color = char_color
			char_style.corner_radius_top_left = 6
			char_style.corner_radius_top_right = 6
			char_style.corner_radius_bottom_left = 6
			char_style.corner_radius_bottom_right = 6
			char_btn.add_theme_stylebox_override("normal", char_style)

			var hover_style := StyleBoxFlat.new()
			hover_style.bg_color = char_color.darkened(0.4)
			hover_style.border_width_left = 4
			hover_style.border_color = char_color
			hover_style.corner_radius_top_left = 6
			hover_style.corner_radius_top_right = 6
			hover_style.corner_radius_bottom_left = 6
			hover_style.corner_radius_bottom_right = 6
			char_btn.add_theme_stylebox_override("hover", hover_style)

			char_btn.text = "%s\n%s" % [ch["name"], _get_skill_type_name(ch["active_type"])]
			char_btn.add_theme_font_size_override("font_size", 14)
			char_grid.add_child(char_btn)
			_char_buttons.append(char_btn)

	# Description label
	_desc_label = Label.new()
	_desc_label.name = "DescLabel"
	_desc_label.text = ""
	_desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_desc_label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	_desc_label.offset_top = -150.0
	_desc_label.offset_bottom = -100.0
	_desc_label.offset_left = 20.0
	_desc_label.offset_right = -20.0
	_desc_label.add_theme_font_size_override("font_size", 14)
	_desc_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	add_child(_desc_label)

	# Bottom buttons
	var bottom_bar := HBoxContainer.new()
	bottom_bar.name = "BottomBar"
	bottom_bar.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_WIDE)
	bottom_bar.offset_top = -80.0
	bottom_bar.offset_left = 20.0
	bottom_bar.offset_right = -20.0
	bottom_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	bottom_bar.add_theme_constant_override("separation", 20)
	add_child(bottom_bar)

	var back_btn := Button.new()
	back_btn.name = "BackButton"
	back_btn.text = "Back"
	back_btn.custom_minimum_size = Vector2(150, 50)
	back_btn.pressed.connect(_on_back_pressed)
	bottom_bar.add_child(back_btn)

	var start_btn := Button.new()
	start_btn.name = "StartButton"
	start_btn.text = "Start Game"
	start_btn.custom_minimum_size = Vector2(200, 50)
	start_btn.pressed.connect(_on_start_pressed)
	var start_style := StyleBoxFlat.new()
	start_style.bg_color = Color(0.2, 0.5, 0.3)
	start_style.corner_radius_top_left = 8
	start_style.corner_radius_top_right = 8
	start_style.corner_radius_bottom_left = 8
	start_style.corner_radius_bottom_right = 8
	start_btn.add_theme_stylebox_override("normal", start_style)
	bottom_bar.add_child(start_btn)

func _get_skill_type_name(skill_type: int) -> String:
	match skill_type:
		CharacterData.SkillType.CENTER_CLEAR:
			return "Center Clear"
		CharacterData.SkillType.HORIZONTAL_CLEAR:
			return "H-Line Clear"
		CharacterData.SkillType.VERTICAL_CLEAR:
			return "V-Line Clear"
		CharacterData.SkillType.RANDOM_CLEAR:
			return "Random Clear"
		CharacterData.SkillType.COLOR_CONVERT:
			return "Color Convert"
		CharacterData.SkillType.TIME_STOP:
			return "Time Stop"
		CharacterData.SkillType.BIG_EXPLOSION:
			return "Big Explosion"
		CharacterData.SkillType.SCORE_BURST:
			return "Score Burst"
		CharacterData.SkillType.INSTANT_FEVER:
			return "Instant Fever"
		CharacterData.SkillType.CHAIN_EXTEND:
			return "Chain Extend"
	return "Unknown"

func _on_slot_pressed(slot: int) -> void:
	_selected_slot = slot
	_info_label.text = "Selecting for: %s" % SLOT_NAMES[slot]
	_info_label.add_theme_color_override("font_color", SLOT_COLORS[slot])
	_update_display()

func _on_char_pressed(char_id: int) -> void:
	# Remove character from previous slot if assigned
	for i in range(5):
		if _party[i] == char_id:
			_party[i] = -1
	_party[_selected_slot] = char_id
	_update_display()

	# Show description
	var cd = _find_autoload("CharacterData")
	if cd:
		var ch = cd.get_character(char_id)
		if not ch.is_empty():
			_desc_label.text = ch["desc"]

func _update_display() -> void:
	var cd = _find_autoload("CharacterData")
	# Update slot buttons
	for i in range(_slot_buttons.size()):
		if _party[i] >= 0 and cd:
			var ch = cd.get_character(_party[i])
			if not ch.is_empty():
				_slot_buttons[i].text = ch["name"]
			else:
				_slot_buttons[i].text = "Empty"
		else:
			_slot_buttons[i].text = "Empty"

		# Highlight selected slot
		var style = _slot_buttons[i].get_theme_stylebox("normal") as StyleBoxFlat
		if style:
			if i == _selected_slot:
				style.border_color = SLOT_COLORS[i]
			else:
				style.border_color = SLOT_COLORS[i].darkened(0.3)

	# Update character button states (show which are assigned)
	if cd:
		var chars = cd.get_all_characters()
		for j in range(_char_buttons.size()):
			if j < chars.size():
				var ch_id: int = chars[j]["id"]
				var assigned_slot: int = -1
				for k in range(5):
					if _party[k] == ch_id:
						assigned_slot = k
						break
				if assigned_slot >= 0:
					_char_buttons[j].text = "%s\n[%s]" % [chars[j]["name"], SLOT_NAMES[assigned_slot]]
				else:
					_char_buttons[j].text = "%s\n%s" % [chars[j]["name"], _get_skill_type_name(chars[j]["active_type"])]

func _on_start_pressed() -> void:
	_save_party()
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _on_back_pressed() -> void:
	_save_party()
	get_tree().change_scene_to_file("res://scenes/title.tscn")

func _save_party() -> void:
	var pm = _find_autoload("PartyManager")
	if pm:
		pm.set_party(_party)

func _find_autoload(autoload_name: String) -> Node:
	var root = get_tree().root
	for child in root.get_children():
		if child.name == autoload_name:
			return child
	return null
