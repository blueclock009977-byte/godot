extends Control

var main_vbox: VBoxContainer
var name_label: Label

func _ready() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var center := CenterContainer.new()
	center.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(center)

	main_vbox = VBoxContainer.new()
	main_vbox.add_theme_constant_override("separation", 30)
	main_vbox.custom_minimum_size.x = 500
	center.add_child(main_vbox)

	# Title
	var title := Label.new()
	title.text = "ダイスデッキランダム"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 52)
	title.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	main_vbox.add_child(title)

	var subtitle := Label.new()
	subtitle.text = "v1.11.0"
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	subtitle.add_theme_font_size_override("font_size", 22)
	subtitle.add_theme_color_override("font_color", Color(0.5, 0.5, 0.6))
	main_vbox.add_child(subtitle)

	# User name display
	name_label = Label.new()
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.add_theme_font_size_override("font_size", 24)
	name_label.add_theme_color_override("font_color", Color(0.5, 0.9, 1.0))
	main_vbox.add_child(name_label)
	_update_name_display()

	var spacer := Control.new()
	spacer.custom_minimum_size.y = 10
	main_vbox.add_child(spacer)

	# Online Match
	var online_btn := _make_button("オンライン対戦", Color(0.9, 0.3, 0.3))
	online_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/lobby/lobby.tscn"))
	main_vbox.add_child(online_btn)

	# NPC Battle
	var npc_btn := _make_button("NPC対戦", Color(0.3, 0.7, 0.9))
	npc_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/battle/battle.tscn"))
	main_vbox.add_child(npc_btn)

	# Deck Edit
	var deck_btn := _make_button("デッキ編集", Color(0.3, 0.8, 0.4))
	deck_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/deck_editor/deck_editor.tscn"))
	main_vbox.add_child(deck_btn)

	# Rules
	var rules_btn := _make_button("ルール", Color(0.5, 0.5, 0.6))
	rules_btn.pressed.connect(_show_rules)
	main_vbox.add_child(rules_btn)

	# Login / Register
	if GameManager.user_name == "":
		var login_btn := _make_button("ログイン / 新規登録", Color(0.8, 0.6, 0.2))
		login_btn.pressed.connect(_show_login_menu)
		main_vbox.add_child(login_btn)
	else:
		var logout_btn := _make_button("ログアウト", Color(0.4, 0.4, 0.5))
		logout_btn.pressed.connect(_on_logout)
		main_vbox.add_child(logout_btn)

	# Load deck if logged in
	if GameManager.user_name != "":
		await GameManager.load_deck()

func _update_name_display() -> void:
	if GameManager.user_name != "":
		name_label.text = "プレイヤー: %s" % GameManager.user_name
	else:
		name_label.text = "プレイヤー: ゲスト"

func _show_login_menu() -> void:
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.9)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.z_index = 20
	add_child(overlay)

	var center2 := CenterContainer.new()
	center2.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.add_child(center2)

	var panel := PanelContainer.new()
	var panel_style := StyleBoxFlat.new()
	panel_style.bg_color = Color(0.12, 0.12, 0.18)
	panel_style.corner_radius_top_left = 12
	panel_style.corner_radius_top_right = 12
	panel_style.corner_radius_bottom_left = 12
	panel_style.corner_radius_bottom_right = 12
	panel_style.border_width_left = 2
	panel_style.border_width_right = 2
	panel_style.border_width_top = 2
	panel_style.border_width_bottom = 2
	panel_style.border_color = Color(1, 0.9, 0.3)
	panel.add_theme_stylebox_override("panel", panel_style)
	center2.add_child(panel)

	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 40)
	margin.add_theme_constant_override("margin_right", 40)
	margin.add_theme_constant_override("margin_top", 30)
	margin.add_theme_constant_override("margin_bottom", 30)
	panel.add_child(margin)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 20)
	vbox.custom_minimum_size.x = 450
	margin.add_child(vbox)

	var title_l := Label.new()
	title_l.text = "ログイン / 新規登録"
	title_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_l.add_theme_font_size_override("font_size", 30)
	title_l.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	vbox.add_child(title_l)

	var hint := Label.new()
	hint.text = "4~8文字(英数字)\n既存の名前ならログイン\n新しい名前なら新規登録"
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.add_theme_font_size_override("font_size", 18)
	hint.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
	vbox.add_child(hint)

	var input_btn := _make_button("名前を入力する", Color(0.3, 0.8, 0.4))
	input_btn.pressed.connect(func():
		var name_text := ""
		if OS.has_feature("web"):
			var result = JavaScriptBridge.eval("prompt('プレイヤー名 (4-8文字、英数字)', '') || ''")
			if result != null:
				name_text = str(result).strip_edges()
		if name_text.length() < 4 or name_text.length() > 8:
			return
		var valid := true
		for ch in name_text:
			if not (ch >= "a" and ch <= "z") and not (ch >= "A" and ch <= "Z") and not (ch >= "0" and ch <= "9"):
				valid = false
				break
		if not valid:
			return
		GameManager.save_user_name(name_text)
		FirebaseManager.player_id = name_text
		await GameManager.load_deck()
		overlay.queue_free()
		# Reload title screen to update buttons
		GameManager.change_scene("res://scenes/title/title_screen.tscn")
	)
	vbox.add_child(input_btn)

	var cancel_btn := _make_button("キャンセル", Color(0.4, 0.4, 0.5))
	cancel_btn.pressed.connect(func(): overlay.queue_free())
	vbox.add_child(cancel_btn)

func _on_logout() -> void:
	GameManager.user_name = ""
	GameManager.player_deck = []
	if OS.has_feature("web"):
		JavaScriptBridge.eval("localStorage.removeItem('ddr_user_name')")
	GameManager.change_scene("res://scenes/title/title_screen.tscn")

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
	var pressed_style := style.duplicate()
	pressed_style.bg_color = color.darkened(0.2)
	btn.add_theme_stylebox_override("pressed", pressed_style)
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
4. ドロー(1枚) & 1マナ回復
5. [color=green]メインフェイズ2[/color] — 召喚/移動
6. ターンエンド

[b]■ 先攻1ターン目[/b]
ダイスなし、ドローなし(メイン1→終了)

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
・移動: フィールドカードタップ → 空きスロットタップ(1マナ)
・ドラッグ&ドロップも可"""

	var close_btn := Button.new()
	close_btn.text = "閉じる"
	close_btn.custom_minimum_size.y = 70
	close_btn.add_theme_font_size_override("font_size", 26)
	close_btn.pressed.connect(func(): overlay.queue_free())
	vbox.add_child(close_btn)
