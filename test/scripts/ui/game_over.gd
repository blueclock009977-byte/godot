extends CanvasLayer

@onready var panel: ColorRect = $Panel

func _ready() -> void:
    panel.visible = false
    $Panel/RetryButton.pressed.connect(_on_retry)
    $Panel/MenuButton.pressed.connect(_on_menu)

func show_game_over() -> void:
    $Panel/Label.text = "YOU DIED"
    panel.visible = true
    get_tree().paused = true

func show_victory() -> void:
    $Panel/Label.text = "VICTORY!"
    panel.visible = true
    get_tree().paused = true

func _on_retry() -> void:
    get_tree().paused = false
    get_tree().reload_current_scene()

func _on_menu() -> void:
    get_tree().paused = false
    get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
