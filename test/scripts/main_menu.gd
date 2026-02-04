extends Control

func _ready() -> void:
	$StartButton.pressed.connect(_on_start)
	$UpgradeButton.pressed.connect(_on_upgrade)
	$QuitButton.pressed.connect(_on_quit)

func _on_start() -> void:
	get_tree().change_scene_to_file("res://scenes/stage_select.tscn")

func _on_upgrade() -> void:
	get_tree().change_scene_to_file("res://scenes/upgrade_shop.tscn")

func _on_quit() -> void:
	get_tree().quit()
