extends Control

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.1, 0.1, 0.15)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var vbox := VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	vbox.offset_left = -250
	vbox.offset_right = 250
	vbox.offset_top = -200
	vbox.offset_bottom = 200
	vbox.add_theme_constant_override("separation", 60)
	add_child(vbox)

	var result_label := Label.new()
	if GameManager.battle_result == "win":
		result_label.text = "勝利！"
		result_label.add_theme_color_override("font_color", Color(1, 0.85, 0.2))
	else:
		result_label.text = "敗北..."
		result_label.add_theme_color_override("font_color", Color(0.6, 0.3, 0.3))
	result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_label.add_theme_font_size_override("font_size", 56)
	vbox.add_child(result_label)

	var back_btn := Button.new()
	back_btn.text = "タイトルに戻る"
	back_btn.custom_minimum_size.y = 80
	back_btn.add_theme_font_size_override("font_size", 28)
	back_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/title/title_screen.tscn"))
	vbox.add_child(back_btn)
