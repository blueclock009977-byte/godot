extends Control
## ステージ選択画面
## 10ステージから選択し、StageManagerにセットしてバトルへ遷移

const STAGE_COUNT := 10

# ステージボタン配列
var stage_buttons: Array[Button] = []


func _ready() -> void:
	_setup_stage_buttons()
	_update_button_states()
	$BackButton.pressed.connect(_on_back_pressed)


## ステージボタンを設定
func _setup_stage_buttons() -> void:
	var grid := $StageGrid
	for i in range(STAGE_COUNT):
		var button: Button = grid.get_node("Stage" + str(i + 1) + "Button")
		stage_buttons.append(button)
		var stage_num := i + 1
		button.pressed.connect(_on_stage_selected.bind(stage_num))


## ボタン状態をStageManagerに基づいて更新
func _update_button_states() -> void:
	var max_unlocked := StageManager.max_unlocked_stage

	for i in range(STAGE_COUNT):
		var button := stage_buttons[i]
		var stage_num := i + 1

		if stage_num <= max_unlocked:
			# アンロック済み（クリア済みまたは次のステージ）
			button.disabled = false
			if stage_num < max_unlocked:
				# クリア済み - 緑色
				button.modulate = Color(0.5, 1.0, 0.5)
			else:
				# 現在挑戦可能 - 通常色
				button.modulate = Color(1.0, 1.0, 1.0)
		else:
			# ロック中 - グレーアウト
			button.disabled = true
			button.modulate = Color(0.5, 0.5, 0.5)


## ステージ選択時の処理
func _on_stage_selected(stage: int) -> void:
	StageManager.current_stage = stage
	get_tree().change_scene_to_file("res://scenes/battle.tscn")


## 戻るボタン押下時の処理
func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
