extends Control
## res://scripts/title.gd: Title screen with start and party edit buttons

@onready var start_button: Button = $VBoxContainer/StartButton
@onready var party_button: Button = $VBoxContainer/PartyButton

func _ready() -> void:
	# Style the title label
	var title_label = $VBoxContainer/TitleLabel
	if title_label:
		title_label.add_theme_font_size_override("font_size", 48)
		title_label.add_theme_color_override("font_color", Color(1.0, 0.9, 0.3))
	if start_button:
		start_button.pressed.connect(_on_start_pressed)
		start_button.add_theme_font_size_override("font_size", 24)
	if party_button:
		party_button.pressed.connect(_on_party_pressed)
		party_button.add_theme_font_size_override("font_size", 24)

func _on_start_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _on_party_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/party_edit.tscn")
