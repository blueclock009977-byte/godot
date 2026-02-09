extends Control

func _ready() -> void:
	# Dark background
	var bg := ColorRect.new()
	bg.color = Color(0.1, 0.1, 0.15)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var vbox := VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	vbox.offset_left = -200
	vbox.offset_right = 200
	vbox.offset_top = -250
	vbox.offset_bottom = 250
	vbox.add_theme_constant_override("separation", 40)
	add_child(vbox)

	var title := Label.new()
	title.text = "Dice Deck Random"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 48)
	vbox.add_child(title)

	var spacer := Control.new()
	spacer.custom_minimum_size.y = 60
	vbox.add_child(spacer)

	var npc_btn := Button.new()
	npc_btn.text = "NPC Battle"
	npc_btn.custom_minimum_size.y = 80
	npc_btn.add_theme_font_size_override("font_size", 28)
	npc_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/battle/battle.tscn"))
	vbox.add_child(npc_btn)

	var deck_btn := Button.new()
	deck_btn.text = "Deck Edit"
	deck_btn.custom_minimum_size.y = 80
	deck_btn.add_theme_font_size_override("font_size", 28)
	deck_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/deck_editor/deck_editor.tscn"))
	vbox.add_child(deck_btn)

	var rules_btn := Button.new()
	rules_btn.text = "Rules"
	rules_btn.custom_minimum_size.y = 80
	rules_btn.add_theme_font_size_override("font_size", 28)
	rules_btn.pressed.connect(_show_rules)
	vbox.add_child(rules_btn)

func _show_rules() -> void:
	# Full-screen rules overlay
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

	# Title
	var title := Label.new()
	title.text = "ルール説明"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 36)
	vbox.add_child(title)

	# Scrollable rules
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vbox.add_child(scroll)

	var rules_label := RichTextLabel.new()
	rules_label.bbcode_enabled = true
	rules_label.fit_content = true
	rules_label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rules_label.add_theme_font_size_override("normal_font_size", 22)
	rules_label.add_theme_font_size_override("bold_font_size", 24)
	scroll.add_child(rules_label)

	rules_label.text = """[b]■ ゲーム概要[/b]
1対1のダイス×カードバトルゲーム。
お互いのHP(20)を先に0にした方が勝ちです。

[b]■ デッキ[/b]
・デッキは20枚で構成されます
・同じカードは2枚まで入れられます
・デッキ編集画面で自分のデッキを組めます

[b]■ ターンの流れ[/b]
各ターンは以下の順で進みます:

[color=yellow]1. ダイスロール[/color]
  サイコロを1個振ります(1〜6)。
  この出目がそのターンの全ての行動の基準になります。

[color=yellow]2. ドロー[/color]
  デッキから2枚カードを引きます。

[color=yellow]3. メインフェイズ[/color]
  以下の行動を好きな順番・回数で行えます:
  ・カードの召喚
  ・カードで攻撃
  行動が終わったら「End Turn」で相手のターンへ。

[b]■ カードの見方[/b]
[color=green]上段: 召喚ダイス目[/color] — この出目で召喚できる
中央: カード名 / 効果テキスト
[color=red]下段: 攻撃ダイス目[/color] — この出目で攻撃できる
左下: [color=green]HP[/color](体力)  右下: [color=red]ATK[/color](攻撃力)

[b]■ 召喚[/b]
・ダイスの出目がカードの[color=green]召喚ダイス目[/color]と一致すれば召喚可能
・召喚可能なカードは[color=green]緑の枠[/color]で表示されます
・カードをタップ → 光っている空きスロットをタップ
・またはカードをドラッグ&ドロップでも召喚できます
・1ターンに何枚でも召喚できます

[b]■ 攻撃[/b]
・ダイスの出目がカードの[color=red]攻撃ダイス目[/color]と一致すれば攻撃可能
・攻撃可能なカードは[color=red]赤い枠[/color]で表示されます
・カードをタップ → 敵カードをタップで攻撃
・またはカードをドラッグ&ドロップでも攻撃できます
・攻撃するとATK分のダメージを敵カードのHPに与えます
・HPが0以下になったカードは破壊されます

[b]■ フィールド配置[/b]
フィールドは前列3枠 + 後列2枠の計5枠です:

  [後列3] [後列4]
  [前列0] [前列1] [前列2]

[color=cyan]・後列の守り:[/color]
  後列3は前列0と前列1の両方にカードがいる間、攻撃されません。
  後列4は前列1と前列2の両方にカードがいる間、攻撃されません。

[color=cyan]・プレイヤーへの直接攻撃:[/color]
  後列3と後列4の両方にカードがいる場合、
  プレイヤーへの直接攻撃はできません。
  どちらかが空いていれば直接攻撃が可能です。

[b]■ カード効果の種類[/b]
[color=green]召喚時効果[/color] — カードを場に出した瞬間に発動
  例: ダメージ、ドロー、味方強化など

[color=red]破壊時効果[/color] — カードが破壊された時に発動
  例: ドロー、反撃ダメージ、全体ダメージなど

[color=cyan]常時効果(パッシブ)[/color] — 場にいる間ずっと有効
  例: 隣接味方ATK+1、被ダメージ軽減など

[color=yellow]自動発動効果[/color] — 特定の条件で自動的に発動
  例: 相手召喚時にダメージ、被攻撃時に反撃など

[b]■ 勝利条件[/b]
相手のHPを0以下にすれば勝利!
デッキが尽きてもゲームは続きます。"""

	# Close button
	var close_btn := Button.new()
	close_btn.text = "閉じる"
	close_btn.custom_minimum_size.y = 70
	close_btn.add_theme_font_size_override("font_size", 26)
	close_btn.pressed.connect(func(): overlay.queue_free())
	vbox.add_child(close_btn)
