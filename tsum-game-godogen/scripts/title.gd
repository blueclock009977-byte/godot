extends Control
## res://scripts/title.gd: Title screen with start and party edit buttons

@onready var start_button: Button = $VBoxContainer/StartButton
@onready var party_button: Button = $VBoxContainer/PartyButton

func _ready() -> void:
	if start_button:
		start_button.pressed.connect(_on_start_pressed)
	if party_button:
		party_button.pressed.connect(_on_party_pressed)

func _on_start_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main.tscn")

func _on_party_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/party_edit.tscn")
