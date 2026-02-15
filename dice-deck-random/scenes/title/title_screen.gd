extends Control

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 30)
	vbox.custom_minimum_size.x = 500
	center.add_child(vbox)

	# Title
	var title := Label.new()
	title.text = "ダイスデッキランダム"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 52)
	title.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	vbox.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "v1.2.0"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 22)
	subtitle.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	vbox.add_child(subtitle)

	var spacer := Control.new()
	spacer.custom_minimum_size.y = 20
	vbox.add_child(spacer)

	# Online Match
	var online_btn := _make_button("オンライン対戦", Color(0.9, 0.3, 0.3))
	online_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/lobby/lobby.tscn"))
	vbox.add_child(online_btn)

	# NPC Battle
	var npc_btn := _make_button("NPC対戦", Color(0.3, 0.7, 0.9))
	npc_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/battle/battle.tscn"))
	vbox.add_child(npc_btn)

	# Deck Edit
	var deck_btn := _make_button("デッキ編集", Color(0.3, 0.8, 0.4))
	deck_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/deck_editor/deck_editor.tscn"))
	vbox.add_child(deck_btn)

	# Rules
	var rules_btn := _make_button("ルール", Color(0.5, 0.5, 0.6))
	rules_btn.pressed.connect(_show_rules)
	vbox.add_child(rules_btn)

func _make_button(text: String, color: Color) -> Button:
	var btn := Button.new()
	btn.text = text
	btn.custom_minimum_size.y = 80
	btn.add_theme_font_size_override("font_size", 28)
	var style := StyleBoxFlat.new()
	style.bg_color = color.darkened(0.6)
	style.border_width_left = 3
	style.border_width_right = 3
	style.border_width_top = 3
	style.border_width_bottom = 3
	style.border_color = color
	style.corner_radius_top_left = 10
	style.corner_radius_top_right = 10
	style.corner_radius_bottom_left = 10
	style.corner_radius_bottom_right = 10
	btn.add_theme_stylebox_override("normal", style)
	var hover := style.duplicate()
	hover.bg_color = color.darkened(0.4)
	btn.add_theme_stylebox_override("hover", hover)
	var pressed := style.duplicate()
	pressed.bg_color = color.darkened(0.2)
	btn.add_theme_stylebox_override("pressed", pressed)
	return btn

func _show_rules() -> void:
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.85)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.z_index = 10
	add_child(overlay)

	var margin := MarginContainer.new()
	margin.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	margin.add_theme_constant_override("margin_left", 40)
	margin.add_theme_constant_override("margin_right", 40)
	margin.add_theme_constant_override("margin_top", 60)
	margin.add_theme_constant_override("margin_bottom", 60)
	overlay.add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 10)
	margin.add_child(vbox)

	var title := Label.new()
	title.text = "ルール説明 v2"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 36)
	vbox.add_child(title)

	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var rules_label := RichTextLabel.new()
	rules_label.bbcode_enabled = true
	rules_label.fit_content = true
	rules_label.scroll_active = false
	rules_label.mouse_filter = Control.MOUSE_FILTER_PASS
	rules_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rules_label.add_theme_font_size_override("normal_font_size", 32)
	rules_label.add_theme_font_size_override("bold_font_size", 36)
	scroll.add_child(rules_label)

	rules_label.text = """[b]■ ゲーム概要[/b]
1対1のダイス×カードバトル。HP20同士で戦います。

[b]■ デッキ[/b]
・20枚構成、同じカード最大2枚
・初期手札: 3枚

[b]■ マナシステム[/b]
・毎ターン最大マナ+1(上限5)
・ターン開始時、最大マナまで全回復
・召喚: カードのコスト分消費
・移動: 1マナ消費

[b]■ ターンの流れ[/b]
1. マナ回復(最大+1)
2. [color=green]メインフェイズ1[/color] — 召喚/移動
3. [color=yellow]ダイスロール → バトル解決[/color]
4. ドロー(1枚)
5. [color=green]メインフェイズ2[/color] — 召喚/移動
6. ターンエンド

[b]■ 先攻1ターン目[/b]
ダイスなし、ドローなし(メイン1→メイン2→終了)

[b]■ フィールド(3x2 レーン制)[/b]
  [後4][後5][後6]  相手後列
  [前1][前2][前3]  相手前列
  ─────────────
  [前1][前2][前3]  自分前列
  [後4][後5][後6]  自分後列

レーン: 左(1/4) 中央(2/5) 右(3/6)

[b]■ バトル解決[/b]
1. ダイス1個(両者共通)
2. ターンプレイヤーの該当カードがスロット順に攻撃
3. 生き残った相手の該当カードがスロット順に攻撃

[b]■ 攻撃対象(自動・同レーン)[/b]
優先: 敵前列 → 敵後列 → 敵プレイヤーHP
・後列は同レーンに味方前列がいる間は守られる

[b]■ 操作[/b]
・召喚: 手札カードタップ → 空きスロットタップ
・移動: フィールドカードタップ → 隣接空きスロットタップ(1マナ)
・ドラッグ&ドロップも可"""

	var close_btn := Button.new()
	close_btn.text = "閉じる"
	close_btn.custom_minimum_size.y = 70
	close_btn.add_theme_font_size_override("font_size", 26)
	close_btn.pressed.connect(func(): overlay.queue_free())
	vbox.add_child(close_btn)
