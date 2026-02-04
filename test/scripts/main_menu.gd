extends Control

func _ready() -> void:
	$StartButton.pressed.connect(_on_start)
	$QuitButton.pressed.connect(_on_quit)

func _on_start() -> void:
	get_tree().change_scene_to_file("res://scenes/battle.tscn")

func _on_quit() -> void:
	get_tree().quit()
