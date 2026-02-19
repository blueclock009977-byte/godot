extends Control

# ─── Constants (from BattleConstants) ───
const CARD_UI_SCENE := preload(BattleConstants.CARD_UI_SCENE_PATH)
const FIELD_SLOT_SCENE := preload(BattleConstants.FIELD_SLOT_SCENE_PATH)
const MAX_HP := BattleConstants.MAX_HP
const MAX_MANA_CAP := BattleConstants.MAX_MANA_CAP
const DEFAULT_STARTING_HAND := BattleConstants.DEFAULT_STARTING_HAND
const MOVE_COST := BattleConstants.MOVE_COST

# ─── Enums ───
enum Phase { MAIN1, DICE, DRAW, MAIN2, END }
enum SelectMode { NONE, SUMMON_SELECT_SLOT, MOVE_SELECT_SLOT }

# ─── Game State ───
var player_hp: int = MAX_HP
var opponent_hp: int = MAX_HP
var player_mana: int = 0
var player_max_mana: int = 0
var opponent_mana: int = 0
var opponent_max_mana: int = 0
var player_deck: Array[CardData] = []
var opponent_deck: Array[CardData] = []
var player_hand: Array = []  # Array of CardUI
var opponent_hand: Array = []  # Array of CardData (hidden)
var current_dice: int = 0
var turn_number: int = 0
var is_player_turn: bool = true
var is_player_first: bool = true
var current_phase: Phase = Phase.MAIN1
var select_mode: SelectMode = SelectMode.NONE
var selected_hand_card: CardUI = null
var selected_field_card: CardUI = null
var selected_field_slot: FieldSlot = null
var is_animating: bool = false
var game_over: bool = false

# ─── UI References ───
var player_slots: Array = []  # FieldSlot[6]: 0-2 front, 3-5 back
var opponent_slots: Array = []
var player_hand_container: HBoxContainer
var opponent_hand_container: HBoxContainer
var player_hp_label: Label
var opponent_hp_label: Label
var mana_label: Label
var phase_label: Label
var dice_label: Label
var end_turn_btn: Button
var next_phase_btn: Button
var surrender_btn: Button
var log_label: RichTextLabel
var phase_overlay: ColorRect
var phase_overlay_label: Label
var turn_indicator_label: Label
var dice_preview_panel: PanelContainer
var dice_preview_label: RichTextLabel
var center_info: HBoxContainer
var card_preview_overlay: ColorRect
var card_preview_container: CenterContainer

func _ready() -> void:
	_build_ui()
	_start_game()

# ═══════════════════════════════════════════
# UI CONSTRUCTION
# ═══════════════════════════════════════════
func _build_ui() -> void:
	# Background
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Main layout
	var main_vbox := VBoxContainer.new()
	main_vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	main_vbox.add_theme_constant_override("separation", 4)
	add_child(main_vbox)

	# ── Opponent hand area ──
	opponent_hand_container = HBoxContainer.new()
	opponent_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	opponent_hand_container.add_theme_constant_override("separation", 4)
	opponent_hand_container.custom_minimum_size.y = 60
	main_vbox.add_child(opponent_hand_container)

	# ── Turn indicator ──
	turn_indicator_label = Label.new()
	turn_indicator_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	turn_indicator_label.add_theme_font_size_override("font_size", 26)
	turn_indicator_label.custom_minimum_size.y = 30
	main_vbox.add_child(turn_indicator_label)

	# ── Opponent HP ──
	opponent_hp_label = Label.new()
	opponent_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	opponent_hp_label.add_theme_font_size_override("font_size", 34)
	opponent_hp_label.add_theme_color_override("font_color", Color(1, 0.4, 0.4))
	main_vbox.add_child(opponent_hp_label)

	# ── Opponent back row (slots 3,4,5) ──
	var opp_back_row := HBoxContainer.new()
	opp_back_row.alignment = BoxContainer.ALIGNMENT_CENTER
	opp_back_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(opp_back_row)
	for i in range(3, 6):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = false
		opp_back_row.add_child(slot)
		slot.setup_lane_info()
		opponent_slots.append(null)  # placeholder

	# ── Opponent front row (slots 0,1,2) ──
	var opp_front_row := HBoxContainer.new()
	opp_front_row.alignment = BoxContainer.ALIGNMENT_CENTER
	opp_front_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(opp_front_row)
	for i in range(0, 3):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = false
		opp_front_row.add_child(slot)
		slot.setup_lane_info()
		opponent_slots.append(null)  # placeholder

	# Fix opponent_slots ordering: we added 3,4,5 then 0,1,2
	# Reorder so index matches slot_index
	var temp_opp: Array = []
	temp_opp.resize(6)
	for slot_node in opp_back_row.get_children():
		if slot_node is FieldSlot:
			temp_opp[slot_node.slot_index] = slot_node
	for slot_node in opp_front_row.get_children():
		if slot_node is FieldSlot:
			temp_opp[slot_node.slot_index] = slot_node
	opponent_slots = temp_opp

	# ── Center phase bar (中央のフェーズ表示のみ) ──
	var phase_bar := HBoxContainer.new()
	phase_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	phase_bar.custom_minimum_size.y = 50
	main_vbox.add_child(phase_bar)

	phase_label = Label.new()
	phase_label.text = "フェーズ: メイン1"
	phase_label.add_theme_font_size_override("font_size", 38)
	phase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	phase_bar.add_child(phase_label)

	# ── ダイスブロック（左側、絶対配置） ──
	var dice_panel := PanelContainer.new()
	var dice_sb := StyleBoxFlat.new()
	dice_sb.bg_color = Color(0.12, 0.12, 0.2, 0.9)
	dice_sb.set_corner_radius_all(8)
	dice_sb.set_content_margin_all(8)
	dice_panel.add_theme_stylebox_override("panel", dice_sb)
	dice_panel.custom_minimum_size = Vector2(150, 150)
	dice_panel.set_anchors_preset(Control.PRESET_CENTER_LEFT)
	dice_panel.position = Vector2(5, -75)
	add_child(dice_panel)

	var dice_vbox := VBoxContainer.new()
	dice_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	dice_panel.add_child(dice_vbox)

	var dice_title := Label.new()
	dice_title.text = "ダイス"
	dice_title.add_theme_font_size_override("font_size", 26)
	dice_title.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	dice_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_vbox.add_child(dice_title)

	dice_label = Label.new()
	dice_label.text = "-"
	dice_label.add_theme_font_size_override("font_size", 60)
	dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_vbox.add_child(dice_label)

	# ── ボタン2つ（右側、絶対配置） ──
	var btn_col := VBoxContainer.new()
	btn_col.add_theme_constant_override("separation", 8)
	btn_col.set_anchors_preset(Control.PRESET_CENTER_RIGHT)
	btn_col.position = Vector2(-175, -85)
	add_child(btn_col)

	end_turn_btn = Button.new()
	end_turn_btn.text = "ターン\n終了"
	end_turn_btn.custom_minimum_size = Vector2(165, 80)
	end_turn_btn.add_theme_font_size_override("font_size", 28)
	end_turn_btn.pressed.connect(_on_end_turn)
	btn_col.add_child(end_turn_btn)
	end_turn_btn.visible = false

	next_phase_btn = Button.new()
	next_phase_btn.text = "次の\nフェーズへ"
	next_phase_btn.custom_minimum_size = Vector2(165, 80)
	next_phase_btn.add_theme_font_size_override("font_size", 28)
	next_phase_btn.pressed.connect(_on_end_phase)
	btn_col.add_child(next_phase_btn)

	# ── 降参ボタン（右上、絶対配置） ──
	surrender_btn = Button.new()
	surrender_btn.text = "降参"
	surrender_btn.custom_minimum_size = Vector2(130, 60)
	surrender_btn.add_theme_font_size_override("font_size", 28)
	surrender_btn.pressed.connect(_on_surrender)
	surrender_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	surrender_btn.position = Vector2(-140, 10)
	add_child(surrender_btn)

	# ── Player front row (slots 0,1,2) ──
	var pl_front_row := HBoxContainer.new()
	pl_front_row.alignment = BoxContainer.ALIGNMENT_CENTER
	pl_front_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(pl_front_row)
	for i in range(0, 3):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = true
		pl_front_row.add_child(slot)
		slot.setup_lane_info()
		player_slots.append(null)

	# ── Player back row (slots 3,4,5) ──
	var pl_back_row := HBoxContainer.new()
	pl_back_row.alignment = BoxContainer.ALIGNMENT_CENTER
	pl_back_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(pl_back_row)
	for i in range(3, 6):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = true
		pl_back_row.add_child(slot)
		slot.setup_lane_info()
		player_slots.append(null)

	# Fix player_slots ordering
	var temp_pl: Array = []
	temp_pl.resize(6)
	for slot_node in pl_front_row.get_children():
		if slot_node is FieldSlot:
			temp_pl[slot_node.slot_index] = slot_node
	for slot_node in pl_back_row.get_children():
		if slot_node is FieldSlot:
			temp_pl[slot_node.slot_index] = slot_node
	player_slots = temp_pl

	# Connect slot signals
	for slot in player_slots:
		if slot:
			slot.slot_clicked.connect(_on_player_slot_clicked)
	for slot in opponent_slots:
		if slot:
			slot.slot_clicked.connect(_on_opponent_slot_clicked)

	# ── Player HP ──
	player_hp_label = Label.new()
	player_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	player_hp_label.add_theme_font_size_override("font_size", 34)
	player_hp_label.add_theme_color_override("font_color", Color(0.4, 1.0, 0.4))
	main_vbox.add_child(player_hp_label)

	# ── Mana display ──
	mana_label = Label.new()
	mana_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mana_label.add_theme_font_size_override("font_size", 30)
	mana_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	main_vbox.add_child(mana_label)

	# ── Player hand ──
	var hand_scroll := ScrollContainer.new()
	hand_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	hand_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	hand_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	# hand_scroll mouse_filter default
	main_vbox.add_child(hand_scroll)

	player_hand_container = HBoxContainer.new()
	player_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	player_hand_container.add_theme_constant_override("separation", 6)
	player_hand_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hand_scroll.add_child(player_hand_container)

# ── Dice Preview Panel ──
	dice_preview_panel = PanelContainer.new()
	var dp_style := StyleBoxFlat.new()
	dp_style.bg_color = Color(0.08, 0.08, 0.16, 0.95)
	dp_style.set_corner_radius_all(12)
	dp_style.border_width_left = 2
	dp_style.border_width_right = 2
	dp_style.border_width_top = 2
	dp_style.border_width_bottom = 2
	dp_style.border_color = Color(1, 0.85, 0.2, 0.7)
	dp_style.content_margin_left = 16
	dp_style.content_margin_right = 16
	dp_style.content_margin_top = 10
	dp_style.content_margin_bottom = 10
	dice_preview_panel.add_theme_stylebox_override("panel", dp_style)
	main_vbox.add_child(dice_preview_panel)

	var dp_vbox := VBoxContainer.new()
	dp_vbox.add_theme_constant_override("separation", 6)
	dice_preview_panel.add_child(dp_vbox)

	var dp_title := Label.new()
	dp_title.text = "ダイス予測"
	dp_title.add_theme_font_size_override("font_size", 24)
	dp_title.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	dp_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	dp_vbox.add_child(dp_title)

	dice_preview_label = RichTextLabel.new()
	dice_preview_label.bbcode_enabled = true
	dice_preview_label.fit_content = true
	dice_preview_label.scroll_active = false
	dice_preview_label.add_theme_font_size_override("normal_font_size", 28)
	dice_preview_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dp_vbox.add_child(dice_preview_label)

		# ── Log (small, at bottom) ──
	log_label = RichTextLabel.new()
	log_label.bbcode_enabled = true
	log_label.scroll_following = true
	log_label.custom_minimum_size.y = 150
	log_label.add_theme_font_size_override("normal_font_size", 24)
	main_vbox.add_child(log_label)

	# ── Phase transition overlay ──
	phase_overlay = ColorRect.new()
	phase_overlay.color = Color(0, 0, 0, 0.85)
	phase_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	phase_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	phase_overlay.visible = false
	phase_overlay.z_index = 100
	add_child(phase_overlay)

	phase_overlay_label = Label.new()
	phase_overlay_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	phase_overlay_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	phase_overlay_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	phase_overlay_label.add_theme_font_size_override("font_size", 56)
	phase_overlay.add_child(phase_overlay_label)

	# ── Card Preview Overlay ──
	card_preview_overlay = ColorRect.new()
	card_preview_overlay.color = Color(0, 0, 0, 0.7)
	card_preview_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card_preview_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	card_preview_overlay.visible = false
	card_preview_overlay.z_index = 90
	add_child(card_preview_overlay)
	card_preview_container = CenterContainer.new()
	card_preview_container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card_preview_overlay.add_child(card_preview_container)
	card_preview_overlay.gui_input.connect(_on_preview_overlay_input)

func _update_all_ui() -> void:
	player_hp_label.text = "HP 自分: %d" % player_hp
	opponent_hp_label.text = "HP 相手: %d" % opponent_hp
	var mana_str := BattleUtils.build_mana_string(player_mana, player_max_mana, MAX_MANA_CAP)
	mana_label.text = "マナ: %s (%d/%d)" % [mana_str, player_mana, player_max_mana]
	var whose := "自分" if is_player_turn else "相手"
	phase_label.text = "%s: %s" % [whose, BattleConstants.get_phase_name(current_phase)]
	if is_player_turn:
		phase_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	else:
		phase_label.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
	# Turn indicator
	if is_player_turn:
		var go_text := "先行" if is_player_first else "後攻"
		turn_indicator_label.text = "自分のターン (%s) - ターン %d" % [go_text, turn_number]
		turn_indicator_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	else:
		turn_indicator_label.text = "相手のターン - ターン %d" % turn_number
		turn_indicator_label.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
	if current_dice > 0:
		dice_label.text = "%d" % current_dice
	else:
		dice_label.text = "-"
	# Opponent hand display
	_update_opponent_hand_display()
	# Hand card summonability
	_update_hand_highlights()
	# Dice preview
	_update_dice_preview()


func _update_dice_preview() -> void:
	dice_preview_panel.visible = not game_over
	if game_over:
		return
	var results := []
	for dice_val in range(1, 7):
		results.append(_simulate_battle(dice_val))
	dice_preview_label.text = BattleUtils.build_dice_preview_text(results)

func _simulate_battle(dice_val: int) -> Array:
	return BattleUtils.simulate_battle(dice_val, player_slots, opponent_slots, is_player_turn)


func _update_opponent_hand_display() -> void:
	for child in opponent_hand_container.get_children():
		child.queue_free()
	for i in range(opponent_hand.size()):
		var card_back := Panel.new()
		card_back.custom_minimum_size = Vector2(40, 55)
		card_back.add_theme_stylebox_override("panel", BattleUtils.create_card_back_style())
		opponent_hand_container.add_child(card_back)

func _update_hand_highlights() -> void:
	var in_main_phase := current_phase == Phase.MAIN1 or current_phase == Phase.MAIN2
	for card_ui in player_hand:
		if card_ui is CardUI:
			var can_summon: bool = in_main_phase and is_player_turn and not is_animating and _get_effective_summon_cost(card_ui) <= player_mana and BattleUtils.has_empty_slot(player_slots)
			card_ui.set_summonable(can_summon)
	# Field cards: glow if movable (in main phase, has mana, has empty slot)
	var can_move: bool = in_main_phase and is_player_turn and not is_animating and player_mana >= MOVE_COST and BattleUtils.has_empty_slot(player_slots)
	for slot in player_slots:
		if slot and not slot.is_empty():
			slot.card_ui.set_movable(can_move)

func _log(text: String) -> void:
	log_label.append_text(text + "\n")

func _show_phase_banner(text: String, banner_color: Color = Color(1, 1, 1), duration: float = 0.8) -> void:
	await BattleUtils.show_phase_banner(self, phase_overlay, phase_overlay_label, text, banner_color, duration)


# ═══════════════════════════════════════════
# GAME START
# ═══════════════════════════════════════════
func _start_game() -> void:
	# Prepare decks
	if GameManager.player_deck.size() >= 20:
		for card in GameManager.player_deck:
			player_deck.append(card.duplicate_card())
	else:
		player_deck = CardDatabase.build_random_deck()
	opponent_deck = CardDatabase.build_random_deck()
	player_deck.shuffle()
	opponent_deck.shuffle()

	# Decide who goes first
	is_player_first = randi() % 2 == 0
	is_player_turn = is_player_first
	turn_number = 0

	_log("[color=yellow]ゲーム開始！ %s が先行です。[/color]" % ("自分" if is_player_first else "相手"))

	# Show who goes first
	if is_player_first:
		await _show_phase_banner("バトル開始！\nあなたは先行です", Color(0.3, 1.0, 0.5), 1.2)
	else:
		await _show_phase_banner("バトル開始！\nあなたは後攻です", Color(1.0, 0.7, 0.3), 1.2)

	# Draw starting hands (based on deck color count)
	var player_hand_size := CardDatabase.get_initial_hand_size(player_deck)
	var opponent_hand_size := CardDatabase.get_initial_hand_size(opponent_deck)
	_log("[color=gray]初期手札: 自分%d枚, 相手%d枚[/color]" % [player_hand_size, opponent_hand_size])
	for i in range(max(player_hand_size, opponent_hand_size)):
		if i < player_hand_size:
			_player_draw_card()
		if i < opponent_hand_size:
			_opponent_draw_card()

	_update_all_ui()
	_start_turn()

# ═══════════════════════════════════════════
# TURN FLOW
# ═══════════════════════════════════════════
func _start_turn() -> void:
	if game_over:
		return
	turn_number += 1
	current_dice = 0
	_clear_selection()

	if is_player_turn:
		# Increase max mana
		player_max_mana = mini(player_max_mana + 1, MAX_MANA_CAP)
		player_mana = player_max_mana
		_log("[color=cyan]── 自分のターン %d (マナ: %d) ──[/color]" % [turn_number, player_mana])
	else:
		opponent_max_mana = mini(opponent_max_mana + 1, MAX_MANA_CAP)
		opponent_mana = opponent_max_mana
		_log("[color=red]── 相手のターン %d ──[/color]" % turn_number)

	# Check first turn special rules
	var is_first_player_turn1 := is_player_first and turn_number == 1 and is_player_turn
	var is_second_player_turn1 := (not is_player_first) and turn_number == 1 and (not is_player_turn)

	var skip_dice_draw := is_first_player_turn1 or is_second_player_turn1

	_process_turn_start_effects(is_player_turn)
	current_phase = Phase.MAIN1
	_update_all_ui()

	if is_player_turn:
		await _show_phase_banner("自分のターン", Color(0.3, 1.0, 0.5), 0.6)
	else:
		await _show_phase_banner("相手のターン", Color(1.0, 0.4, 0.4), 0.6)

	if is_player_turn:
		# Player: wait for input in Main1
		pass
	else:
		# Opponent AI turn
		await _run_opponent_turn(skip_dice_draw)

func _on_end_phase() -> void:
	if not is_player_turn or is_animating or game_over:
		return

	var is_first_player_turn1 := is_player_first and turn_number == 1
	var skip_dice_draw := is_first_player_turn1

	if current_phase == Phase.MAIN1:
		if skip_dice_draw:
			# First player turn 1: skip directly to end
			_end_turn()
			return
		else:
			#  Dice phase
			current_phase = Phase.DICE
			_clear_selection()
			_update_all_ui()
			await _show_phase_banner("ダイス!", Color(1, 0.9, 0.3), 0.5)
			await _do_dice_and_battle()
			if game_over:
				return
			# Draw phase
			current_phase = Phase.DRAW
			_update_all_ui()
			await _show_phase_banner("ドロー & 1マナ回復", Color(0.3, 1.0, 0.5), 0.5)
			_player_draw_card()
			_log("カードを1枚ドローした。")
			player_mana = mini(player_mana + 1, player_max_mana)
			_log("[color=cyan]1マナ回復した。(マナ: %d/%d)[/color]" % [player_mana, player_max_mana])
			# Go to Main2
			current_phase = Phase.MAIN2
			_clear_selection()
			_update_all_ui()
			await _show_phase_banner("メインフェイズ2", Color(0.3, 1.0, 0.5), 0.5)
	elif current_phase == Phase.MAIN2:
		_end_turn()

func _on_end_turn() -> void:
	if not is_player_turn or is_animating or game_over:
		return
	if current_phase == Phase.MAIN1 or current_phase == Phase.MAIN2:
		_end_turn()

func _end_turn() -> void:
	current_phase = Phase.END
	_clear_selection()
	_update_all_ui()
	await _show_phase_banner("ターン終了", Color(0.6, 0.6, 0.6), 0.5)
	_process_turn_end_effects(is_player_turn)
	is_player_turn = not is_player_turn
	_start_turn()

# ═══════════════════════════════════════════
# DICE & BATTLE
# ═══════════════════════════════════════════
func _do_dice_and_battle() -> void:
	is_animating = true
	# Roll dice with animation
	current_dice = await _animate_dice_roll()
	_log("[color=yellow]ダイス: %d[/color]" % current_dice)

	# ダイスブロック効果をチェック
	if _is_dice_blocked(current_dice, is_player_turn):
		_log("[color=purple]ダイス%dは相手の効果でブロックされた！[/color]" % current_dice)
	if _is_dice_blocked(current_dice, not is_player_turn):
		_log("[color=purple]相手のダイス%dは自分の効果でブロックされた！[/color]" % current_dice)
	_update_all_ui()

	# Turn player's cards attack first
	var turn_slots: Array
	var def_slots: Array
	if is_player_turn:
		turn_slots = player_slots
		def_slots = opponent_slots
	else:
		turn_slots = opponent_slots
		def_slots = player_slots

	# Attack in slot order 0→1→2→3→4→5
	await _resolve_attacks(turn_slots, def_slots, is_player_turn)
	if game_over:
		is_animating = false
		return

	# Surviving defender's cards attack
	await _resolve_attacks(def_slots, turn_slots, not is_player_turn)
	if game_over:
		is_animating = false
		return

	is_animating = false

func _resolve_attacks(attacker_slots: Array, defender_slots: Array, attacker_is_player: bool) -> void:
	for i in range(6):
		var slot: FieldSlot = attacker_slots[i]
		if not slot or slot.is_empty():
			continue
		var card_ui: CardUI = slot.card_ui
		var effective_dice := _get_effective_attack_dice(card_ui, attacker_is_player)
		if _is_dice_blocked(current_dice, attacker_is_player):
			continue
		if current_dice not in effective_dice:
			continue

		var lane: int = slot.lane
		var is_front: bool = slot.is_front_row

		# Find target
		var target_slot: FieldSlot = null
		var target_is_player_hp := false

		if is_front:
			var enemy_front: FieldSlot = defender_slots[lane]
			var enemy_back: FieldSlot = defender_slots[lane + 3]
			if enemy_front and not enemy_front.is_empty():
				target_slot = enemy_front
			elif enemy_back and not enemy_back.is_empty():
				target_slot = enemy_back
			else:
				target_is_player_hp = true
		else:
			var enemy_front: FieldSlot = defender_slots[lane]
			var enemy_back: FieldSlot = defender_slots[lane + 3]
			if enemy_front and not enemy_front.is_empty():
				target_slot = enemy_front
			elif enemy_back and not enemy_back.is_empty():
				target_slot = enemy_back
			else:
				target_is_player_hp = true

		var atk_name := card_ui.card_data.card_name
		var damage: int = card_ui.current_atk
		# 常時効果によるATK修正
		var atk_mod := EffectManager.get_constant_atk_modifier(card_ui, attacker_is_player, _get_effect_context())
		damage += atk_mod
		var defender_ui = target_slot.card_ui if target_slot else null
		var atk_effect := _process_attack_effect(card_ui, defender_ui, attacker_is_player)
		if atk_effect.has("atk_bonus"):
			damage += atk_effect["atk_bonus"]

		# Highlight attacker briefly
		card_ui.modulate = Color(1.5, 1.2, 0.5)
		await get_tree().create_timer(0.2).timeout

		if target_is_player_hp:
			if attacker_is_player:
				_log("[color=lime]%s → 相手HPに%dダメージ！[/color]" % [atk_name, damage])
				await BattleUtils.animate_attack(self, card_ui, opponent_hp_label)
				BattleUtils.spawn_damage_popup(self, opponent_hp_label.global_position + Vector2(50, 0), damage)
				BattleUtils.shake_node(self, opponent_hp_label)
				opponent_hp -= damage
				if opponent_hp <= 0:
					_game_end(true)
					return
			else:
				_log("[color=red]%s → 自分HPに%dダメージ！[/color]" % [atk_name, damage])
				await BattleUtils.animate_attack(self, card_ui, player_hp_label)
				BattleUtils.spawn_damage_popup(self, player_hp_label.global_position + Vector2(50, 0), damage)
				BattleUtils.shake_node(self, player_hp_label)
				player_hp -= damage
				if player_hp <= 0:
					_game_end(false)
					return
		elif target_slot:
			var def_card: CardUI = target_slot.card_ui
			_log("%s → %sに%dダメージ" % [atk_name, def_card.card_data.card_name, damage])
			await BattleUtils.animate_attack(self, card_ui, def_card)
			def_card.play_damage_flash()
			BattleUtils.spawn_damage_popup(self, def_card.global_position + Vector2(40, 0), damage)
			var final_damage := _process_defense_effect(def_card, damage, not attacker_is_player)
			var remaining := def_card.take_damage(final_damage)
			if remaining <= 0:
				_log("[color=gray]%s 破壊！[/color]" % def_card.card_data.card_name)
				await def_card.play_destroy_animation()
				_process_death_effect(def_card, not attacker_is_player)
				target_slot.remove_card()
				def_card.queue_free()

		card_ui.modulate = Color.WHITE
		_update_all_ui()
		await get_tree().create_timer(0.3).timeout

func _animate_dice_roll() -> int:
	current_dice = await BattleUtils.animate_dice_roll(self, dice_label)
	return current_dice

# ═══════════════════════════════════════════
# DRAW
# ═══════════════════════════════════════════
func _player_draw_card() -> void:
	if player_deck.is_empty():
		return
	var card_data: CardData = player_deck.pop_front()
	var card_ui := CARD_UI_SCENE.instantiate() as CardUI
	player_hand_container.add_child(card_ui)
	card_ui.setup(card_data, 120)
	card_ui.card_clicked.connect(_on_hand_card_clicked)
	card_ui.card_drag_ended.connect(_on_hand_card_drag_ended)
	card_ui.card_long_pressed.connect(_on_hand_card_long_pressed)
	player_hand.append(card_ui)
	_update_all_ui()

func _opponent_draw_card() -> void:
	if opponent_deck.is_empty():
		return
	var card_data: CardData = opponent_deck.pop_front()
	opponent_hand.append(card_data)
	_update_opponent_hand_display()

# ═══════════════════════════════════════════
# PLAYER INPUT
# ═══════════════════════════════════════════
func _clear_selection() -> void:
	if selected_hand_card:
		selected_hand_card.set_selected(false)
		selected_hand_card = null
	if selected_field_card:
		selected_field_card.set_selected(false)
		selected_field_card.set_movable(false)
		selected_field_card = null
		selected_field_slot = null
	select_mode = SelectMode.NONE
	for slot in player_slots:
		if slot:
			slot.set_highlighted(false)
	_update_hand_highlights()

func _on_hand_card_clicked(card_ui: CardUI) -> void:
	if not is_player_turn or is_animating or game_over:
		return
	if current_phase != Phase.MAIN1 and current_phase != Phase.MAIN2:
		return

	if select_mode == SelectMode.SUMMON_SELECT_SLOT and selected_hand_card == card_ui:
		# Deselect
		_clear_selection()
		return

	# Check if affordable
	if _get_effective_summon_cost(card_ui) > player_mana:
		_log("マナが足りない！")
		return
	if not BattleUtils.has_empty_slot(player_slots):
		_log("空きスロットがない！")
		return

	_clear_selection()
	selected_hand_card = card_ui
	card_ui.set_selected(true)
	select_mode = SelectMode.SUMMON_SELECT_SLOT
	# Highlight empty slots
	for slot in player_slots:
		if slot and slot.is_empty():
			slot.set_highlighted(true)

func _on_hand_card_drag_ended(card_ui: CardUI, drop_pos: Vector2) -> void:
	if not is_player_turn or is_animating or game_over:
		card_ui.reset_position()
		return
	if current_phase != Phase.MAIN1 and current_phase != Phase.MAIN2:
		card_ui.reset_position()
		return
	if _get_effective_summon_cost(card_ui) > player_mana:
		card_ui.reset_position()
		return

	# Find slot under drop
	for slot in player_slots:
		if slot and slot.is_empty():
			var slot_rect := Rect2(slot.global_position, slot.size)
			if slot_rect.has_point(drop_pos):
				_summon_card_to_slot(card_ui, slot)
				return
	card_ui.reset_position()

func _on_player_slot_clicked(slot: FieldSlot) -> void:
	if not is_player_turn or is_animating or game_over:
		return
	if current_phase != Phase.MAIN1 and current_phase != Phase.MAIN2:
		return

	if select_mode == SelectMode.SUMMON_SELECT_SLOT:
		# Summon to this slot
		if slot.is_empty() and selected_hand_card:
			_summon_card_to_slot(selected_hand_card, slot)
		return

	if select_mode == SelectMode.MOVE_SELECT_SLOT:
		# Move to this slot
		if slot.is_empty() and selected_field_slot:
			_move_card_to_slot(selected_field_slot, slot)
		else:
			_clear_selection()
		return

	# Clicking on occupied slot: select for move
	if not slot.is_empty():
		if player_mana >= MOVE_COST:
			_clear_selection()
			selected_field_card = slot.card_ui
			selected_field_slot = slot
			slot.card_ui.set_selected(true)
			slot.card_ui.set_movable(true)
			select_mode = SelectMode.MOVE_SELECT_SLOT
			# Highlight all empty slots
			for s in player_slots:
				if s and s.is_empty():
					s.set_highlighted(true)
		else:
			_clear_selection()

func _on_opponent_slot_clicked(_slot: FieldSlot) -> void:
	# No direct interaction with opponent slots in v2
	pass

func _summon_card_to_slot(card_ui: CardUI, slot: FieldSlot) -> void:
	var effective_cost := _get_effective_summon_cost(card_ui)
	player_mana -= effective_cost
	# Remove from hand
	player_hand.erase(card_ui)
	card_ui.card_clicked.disconnect(_on_hand_card_clicked)
	card_ui.card_drag_ended.disconnect(_on_hand_card_drag_ended)
	if card_ui.card_long_pressed.is_connected(_on_hand_card_long_pressed):
		card_ui.card_long_pressed.disconnect(_on_hand_card_long_pressed)
	card_ui.set_selected(false)
	card_ui.set_summonable(false)
	if card_ui.get_parent():
		card_ui.get_parent().remove_child(card_ui)
	card_ui.reset_position()
	card_ui.set_card_size(175)
	slot.place_card(card_ui)
	_log("召喚: %s (コスト %d)" % [card_ui.card_data.card_name, effective_cost])
	_process_summon_effect(card_ui, true)
	_clear_selection()
	_update_all_ui()

func _move_card_to_slot(from_slot: FieldSlot, to_slot: FieldSlot) -> void:
	player_mana -= MOVE_COST
	var card := from_slot.remove_card()
	to_slot.place_card(card)
	_log("移動: %s (マナ1消費)" % card.card_data.card_name)
	_clear_selection()
	_update_all_ui()

# ═══════════════════════════════════════════
# OPPONENT AI
# ═══════════════════════════════════════════
func _run_opponent_turn(skip_dice_draw: bool) -> void:
	await get_tree().create_timer(0.5).timeout

	# Main Phase 1 - Summon
	_process_turn_start_effects(is_player_turn)
	current_phase = Phase.MAIN1
	_update_all_ui()
	await _show_phase_banner("メイン1", Color(0.3, 1.0, 0.5), 0.5)
	await _ai_summon_phase()
	await get_tree().create_timer(0.3).timeout

	if not skip_dice_draw:
		# Dice phase
		current_phase = Phase.DICE
		_update_all_ui()
		await _show_phase_banner("ダイス!", Color(1, 0.9, 0.3), 0.5)
		await _do_dice_and_battle()
		if game_over:
			return
		await get_tree().create_timer(0.3).timeout

		# Draw
		current_phase = Phase.DRAW
		_update_all_ui()
		await _show_phase_banner("ドロー & 1マナ回復", Color(0.3, 1.0, 0.5), 0.5)
		_opponent_draw_card()
		_log("相手がカードをドローした。")
		opponent_mana = mini(opponent_mana + 1, opponent_max_mana)
		_log("相手が1マナ回復した。")
		await get_tree().create_timer(0.3).timeout

	if not skip_dice_draw:
		# Main Phase 2
		current_phase = Phase.MAIN2
		_update_all_ui()
		await _show_phase_banner("メインフェイズ2", Color(0.3, 1.0, 0.5), 0.5)
		await _ai_summon_phase()
		await get_tree().create_timer(0.3).timeout

	# End turn
	is_player_turn = not is_player_turn
	_start_turn()

func _ai_summon_phase() -> void:
	# Sort hand by mana cost descending (strongest first)
	var sorted_hand := opponent_hand.duplicate()
	sorted_hand.sort_custom(func(a, b): return a.mana_cost > b.mana_cost)

	for card_data in sorted_hand:
		if card_data.mana_cost > opponent_mana:
			continue
		# Find best slot: prioritize front row, then lanes with player cards
		var best_slot: FieldSlot = null
		var best_score: int = -1

		for slot in opponent_slots:
			if not slot or not slot.is_empty():
				continue
			var score := 0
			# Prefer front row
			if slot.is_front_row:
				score += 10
			# Prefer lanes where player has cards (to block)
			var player_front: FieldSlot = player_slots[slot.lane]
			var player_back: FieldSlot = player_slots[slot.lane + 3]
			if (player_front and not player_front.is_empty()) or (player_back and not player_back.is_empty()):
				score += 5
			# Prefer center lane
			if slot.lane == 1:
				score += 2
			if score > best_score:
				best_score = score
				best_slot = slot

		if best_slot:
			opponent_mana -= card_data.mana_cost
			opponent_hand.erase(card_data)
			var card_ui := CARD_UI_SCENE.instantiate() as CardUI
			best_slot.place_card(card_ui)
			card_ui.setup(card_data)
			_log("相手が %s を召喚" % card_data.card_name)
			_update_all_ui()
			await get_tree().create_timer(0.4).timeout

# ═══════════════════════════════════════════
# GAME END
# ═══════════════════════════════════════════
func _game_end(player_wins: bool) -> void:
	game_over = true
	_update_all_ui()
	if player_wins:
		_log("[color=yellow]勝利！[/color]")
		GameManager.battle_result = "win"
	else:
		_log("[color=red]敗北...[/color]")
		GameManager.battle_result = "lose"
	# Delay then go to result
	await get_tree().create_timer(2.0).timeout
	GameManager.change_scene("res://scenes/result/result.tscn")

func _on_hand_card_long_pressed(card_ui: CardUI) -> void:
	_show_card_preview(card_ui)

func _show_card_preview(card_ui: CardUI) -> void:
	BattleUtils.show_card_preview(card_preview_container, card_preview_overlay, CARD_UI_SCENE, card_ui)

func _hide_card_preview() -> void:
	BattleUtils.hide_card_preview(card_preview_container, card_preview_overlay)

func _on_preview_overlay_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		_hide_card_preview()
	if event is InputEventScreenTouch and event.pressed:
		_hide_card_preview()

func _on_surrender() -> void:
	if game_over:
		return
	game_over = true
	GameManager.battle_result = "lose"
	_log("[color=red]降参しました。[/color]")
	await get_tree().create_timer(1.0).timeout
	GameManager.change_scene("res://scenes/result/result.tscn")

# ═══════════════════════════════════════════
# 効果処理
# ═══════════════════════════════════════════

func _get_effect_context() -> Dictionary:
	return {
		"player_slots": player_slots,
		"opponent_slots": opponent_slots,
		"current_dice": current_dice
	}

func _process_summon_effect(card_ui: CardUI, is_player: bool) -> void:
	if not card_ui.card_data.has_effect():
		return
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_summon_effect(card_ui, is_player, context)
	_apply_effect_result(result, is_player)

func _process_attack_effect(attacker_ui: CardUI, defender_ui, is_player: bool) -> Dictionary:
	if not attacker_ui.card_data.has_effect():
		return {}
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_attack_effect(attacker_ui, defender_ui, is_player, context)
	_apply_effect_result(result, is_player)
	return result

func _process_death_effect(card_ui: CardUI, is_player: bool) -> Dictionary:
	if not card_ui.card_data.has_effect():
		return {}
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_death_effect(card_ui, is_player, context)
	_apply_effect_result(result, is_player)
	return result

func _process_defense_effect(defender_ui: CardUI, damage: int, is_player: bool) -> int:
	if not defender_ui.card_data.has_effect():
		return damage
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_defense_effect(defender_ui, damage, is_player, context)
	_apply_effect_result(result, is_player)
	return result.get("final_damage", damage)

func _process_turn_start_effects(is_player: bool) -> void:
	var context := _get_effect_context()
	var results: Array = EffectManager.process_turn_start_effects(is_player, context)
	for result in results:
		_apply_effect_result(result, is_player)

func _process_turn_end_effects(is_player: bool) -> void:
	var context := _get_effect_context()
	var results: Array = EffectManager.process_turn_end_effects(is_player, context)
	for result in results:
		_apply_effect_result(result, is_player)

func _apply_effect_result(result: Dictionary, is_player: bool) -> void:
	if result.is_empty():
		return

	# ログ出力
	if result.has("log"):
		_log(result["log"])

	# マナ増加
	if result.has("mana"):
		if is_player:
			player_mana = mini(player_mana + result["mana"], player_max_mana)
		else:
			opponent_mana = mini(opponent_mana + result["mana"], opponent_max_mana)

	# マナ全回復
	if result.has("mana_full"):
		if is_player:
			player_mana = player_max_mana
		else:
			opponent_mana = opponent_max_mana

	# 自分へのダメージ
	if result.has("self_damage"):
		if is_player:
			player_hp -= result["self_damage"]
			if player_hp <= 0:
				_game_end(false)
		else:
			opponent_hp -= result["self_damage"]
			if opponent_hp <= 0:
				_game_end(true)

	# 相手への直接ダメージ
	if result.has("direct_damage"):
		if is_player:
			opponent_hp -= result["direct_damage"]
			if opponent_hp <= 0:
				_game_end(true)
		else:
			player_hp -= result["direct_damage"]
			if player_hp <= 0:
				_game_end(false)

	# ドロー
	if result.has("draw"):
		for i in range(result["draw"]):
			if is_player:
				_player_draw_card()
			else:
				_opponent_draw_card()

	_update_all_ui()

func _get_effective_attack_dice(card_ui: CardUI, is_player: bool) -> Array:
	var context := _get_effect_context()
	return BattleUtils.get_effective_attack_dice(card_ui, is_player, context)

func _is_dice_blocked(dice_value: int, is_player: bool) -> bool:
	var context := _get_effect_context()
	return BattleUtils.is_dice_blocked(dice_value, is_player, context)

func _get_effective_summon_cost(card_ui: CardUI) -> int:
	var context := _get_effect_context()
	return BattleUtils.get_effective_summon_cost(card_ui, context)
