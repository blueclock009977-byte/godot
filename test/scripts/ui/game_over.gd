extends CanvasLayer

@onready var panel: ColorRect = $Panel

var _is_ending := false

func _ready() -> void:
	panel.visible = false
	$Panel/RetryButton.pressed.connect(_on_retry)
	$Panel/MenuButton.pressed.connect(_on_menu)

func show_game_over() -> void:
	_is_ending = false
	$Panel/Label.text = "YOU DIED"
	panel.visible = true
	get_tree().paused = true

func show_victory(reward_gold: int = 0) -> void:
	_is_ending = false
	$Panel/Label.text = "STAGE " + str(StageManager.current_stage - 1) + " CLEAR!\n+" + str(reward_gold) + "G"
	$Panel/RetryButton.text = "NEXT STAGE"
	panel.visible = true
	get_tree().paused = true

func show_ending(reward_gold: int = 0) -> void:
	_is_ending = true
	$Panel/Label.text = "CONGRATULATIONS!\nALL STAGES CLEARED!\n+" + str(reward_gold) + "G"
	$Panel/RetryButton.text = "NEW GAME"
	panel.visible = true
	get_tree().paused = true

func _on_retry() -> void:
	get_tree().paused = false
	$Panel/RetryButton.text = "RETRY"  # リセット
	if _is_ending:
		# エンディング後はステージ1からやり直し
		StageManager.current_stage = 1
		get_tree().change_scene_to_file("res://scenes/stage_select.tscn")
	elif $Panel/Label.text == "YOU DIED":
		# ゲームオーバー時は同じステージをリトライ
		get_tree().reload_current_scene()
	else:
		# 通常勝利時はステージ選択へ
		get_tree().change_scene_to_file("res://scenes/stage_select.tscn")

func _on_menu() -> void:
	get_tree().paused = false
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
