extends BattleBase
## Online multiplayer battle controller.
## Fork of battle.gd adapted for Firebase-synced 1v1 play.
## MY turn: input enabled, actions sent to Firebase.
## OPPONENT turn: input disabled, actions received from Firebase.

# ─── Online-specific State ───
var opponent_hand_count: int = 0  # Track opponent's hand size only
var my_player_number: int = 0  # 1 or 2
var _waiting_for_opponent: bool = false
var _action_queue: Array[Dictionary] = []
var _processing_actions: bool = false

func _ready() -> void:
	my_player_number = MultiplayerManager.my_player_number
	MultiplayerManager.action_received.connect(_on_action_received)
	MultiplayerManager.opponent_disconnected.connect(_on_opponent_disconnected)
	_build_ui()
	_start_game()

func _exit_tree() -> void:
	if MultiplayerManager.action_received.is_connected(_on_action_received):
		MultiplayerManager.action_received.disconnect(_on_action_received)
	if MultiplayerManager.opponent_disconnected.is_connected(_on_opponent_disconnected):
		MultiplayerManager.opponent_disconnected.disconnect(_on_opponent_disconnected)

# ═══════════════════════════════════════════
# UI CONSTRUCTION (same as battle.gd)
# ═══════════════════════════════════════════
func _build_ui() -> void:
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var main_vbox := VBoxContainer.new()
	main_vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	main_vbox.add_theme_constant_override("separation", 4)
	add_child(main_vbox)

	# Opponent hand area
	opponent_hand_container = HBoxContainer.new()
	opponent_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	opponent_hand_container.add_theme_constant_override("separation", 4)
	opponent_hand_container.custom_minimum_size.y = 60
	main_vbox.add_child(opponent_hand_container)

	# Turn indicator
	turn_indicator_label = Label.new()
	turn_indicator_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	turn_indicator_label.add_theme_font_size_override("font_size", 20)
	turn_indicator_label.custom_minimum_size.y = 30
	main_vbox.add_child(turn_indicator_label)

	# Opponent HP
	opponent_hp_label = Label.new()
	opponent_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	opponent_hp_label.add_theme_font_size_override("font_size", 28)
	opponent_hp_label.add_theme_color_override("font_color", Color(1, 0.4, 0.4))
	main_vbox.add_child(opponent_hp_label)

	# Opponent back row
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
		opponent_slots.append(null)

	# Opponent front row
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
		opponent_slots.append(null)

	var temp_opp: Array = []
	temp_opp.resize(6)
	for slot_node in opp_back_row.get_children():
		if slot_node is FieldSlot:
			temp_opp[slot_node.slot_index] = slot_node
	for slot_node in opp_front_row.get_children():
		if slot_node is FieldSlot:
			temp_opp[slot_node.slot_index] = slot_node
	opponent_slots = temp_opp

	# Center phase bar
	var phase_bar := HBoxContainer.new()
	phase_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	phase_bar.custom_minimum_size.y = 50
	main_vbox.add_child(phase_bar)

	phase_label = Label.new()
	phase_label.text = "フェーズ: メイン1"
	phase_label.add_theme_font_size_override("font_size", 32)
	phase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	phase_bar.add_child(phase_label)

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
	dice_title.add_theme_font_size_override("font_size", 22)
	dice_title.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	dice_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_vbox.add_child(dice_title)

	dice_label = Label.new()
	dice_label.text = "-"
	dice_label.add_theme_font_size_override("font_size", 60)
	dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_vbox.add_child(dice_label)

	var btn_col := VBoxContainer.new()
	btn_col.add_theme_constant_override("separation", 8)
	btn_col.set_anchors_preset(Control.PRESET_CENTER_RIGHT)
	btn_col.position = Vector2(-175, -85)
	add_child(btn_col)

	end_turn_btn = Button.new()
	end_turn_btn.text = "ターン\n終了"
	end_turn_btn.custom_minimum_size = Vector2(165, 80)
	end_turn_btn.add_theme_font_size_override("font_size", 24)
	end_turn_btn.pressed.connect(_on_end_turn)
	btn_col.add_child(end_turn_btn)
	end_turn_btn.visible = false

	next_phase_btn = Button.new()
	next_phase_btn.text = "次の\nフェーズへ"
	next_phase_btn.custom_minimum_size = Vector2(165, 80)
	next_phase_btn.add_theme_font_size_override("font_size", 24)
	next_phase_btn.pressed.connect(_on_end_phase)
	btn_col.add_child(next_phase_btn)

	surrender_btn = Button.new()
	surrender_btn.text = "降参"
	surrender_btn.custom_minimum_size = Vector2(130, 60)
	surrender_btn.add_theme_font_size_override("font_size", 24)
	surrender_btn.pressed.connect(_on_surrender)
	surrender_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	surrender_btn.position = Vector2(-140, 10)
	add_child(surrender_btn)

	# Player front row
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

	# Player back row
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

	var temp_pl: Array = []
	temp_pl.resize(6)
	for slot_node in pl_front_row.get_children():
		if slot_node is FieldSlot:
			temp_pl[slot_node.slot_index] = slot_node
	for slot_node in pl_back_row.get_children():
		if slot_node is FieldSlot:
			temp_pl[slot_node.slot_index] = slot_node
	player_slots = temp_pl

	for slot in player_slots:
		if slot:
			slot.slot_clicked.connect(_on_player_slot_clicked)
	for slot in opponent_slots:
		if slot:
			slot.slot_clicked.connect(_on_opponent_slot_clicked)

	# Player HP
	player_hp_label = Label.new()
	player_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	player_hp_label.add_theme_font_size_override("font_size", 28)
	player_hp_label.add_theme_color_override("font_color", Color(0.4, 1.0, 0.4))
	main_vbox.add_child(player_hp_label)

	# Mana
	mana_label = Label.new()
	mana_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mana_label.add_theme_font_size_override("font_size", 24)
	mana_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	main_vbox.add_child(mana_label)

	# Player hand
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

	# Log
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

	# Log
	log_label = RichTextLabel.new()
	log_label.bbcode_enabled = true
	log_label.scroll_following = true
	log_label.custom_minimum_size.y = 150
	log_label.add_theme_font_size_override("normal_font_size", 20)
	main_vbox.add_child(log_label)

	# Phase overlay
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
	var my_name := GameManager.user_name if GameManager.user_name != "" else "自分"
	var opp_name := MultiplayerManager.opponent_name if MultiplayerManager.opponent_name != "" else "相手"
	player_hp_label.text = "HP %s: %d" % [my_name, player_hp]
	opponent_hp_label.text = "HP %s: %d" % [opp_name, opponent_hp]
	var mana_str := BattleUtils.build_mana_string(player_mana, player_max_mana, MAX_MANA_CAP)
	mana_label.text = "マナ: %s (%d/%d)" % [mana_str, player_mana, player_max_mana]
	var whose := "自分" if is_player_turn else "相手"
	phase_label.text = "%s: %s" % [whose, BattleConstants.get_phase_name(current_phase)]
	if is_player_turn:
		phase_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	else:
		phase_label.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
	if is_player_turn:
		var go_text := "先行" if is_player_first else "後攻"
		turn_indicator_label.text = "自分のターン (%s) - ターン %d" % [go_text, turn_number]
		turn_indicator_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
		end_turn_btn.disabled = false
		next_phase_btn.disabled = false
	else:
		turn_indicator_label.text = "相手のターン - ターン %d" % turn_number
		turn_indicator_label.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
		end_turn_btn.disabled = true
		next_phase_btn.disabled = true
	if current_dice > 0:
		dice_label.text = "%d" % current_dice
	else:
		dice_label.text = "-"
	_update_opponent_hand_display()
	_update_hand_highlights()
	# Dice preview
	_update_dice_preview()

func _update_opponent_hand_display() -> void:
	BattleUtils.update_opponent_hand_display(opponent_hand_container, opponent_hand_count)

# ═══════════════════════════════════════════
# GAME START
# ═══════════════════════════════════════════
func _start_game() -> void:
	# Load player deck
	if GameManager.player_deck.size() >= 20:
		for card in GameManager.player_deck:
			player_deck.append(card.duplicate_card())
	else:
		player_deck = CardDatabase.build_random_deck()

	# Load opponent deck from Firebase
	var opp_deck_ids := await MultiplayerManager.get_opponent_deck()
	opponent_deck = []
	for id in opp_deck_ids:
		var card := CardDatabase.get_card_by_id(int(id))
		if card:
			opponent_deck.append(card.duplicate_card())
	if opponent_deck.size() < 20:
		opponent_deck = CardDatabase.build_random_deck()

	# Use room data seed for shuffle consistency
	# Both players need same shuffle. Use room code as seed.
	var seed_val: int = room_code_to_seed(MultiplayerManager.room_code)
	var rng := RandomNumberGenerator.new()
	rng.seed = seed_val

	# Shuffle both decks with shared RNG
	_shuffle_with_rng(player_deck, rng)
	_shuffle_with_rng(opponent_deck, rng)

	# Player 1 goes first
	is_player_first = (my_player_number == 1)
	is_player_turn = is_player_first
	turn_number = 0

	_log("[color=yellow]オンラインゲーム開始！ %s が先行です。[/color]" % ("自分" if is_player_first else "相手"))

	if is_player_first:
		await _show_phase_banner("オンラインバトル！\nあなたは先行です", Color(0.3, 1.0, 0.5), 1.2)
	else:
		await _show_phase_banner("オンラインバトル！\nあなたは後攻です", Color(1.0, 0.7, 0.3), 1.2)

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

func room_code_to_seed(code: String) -> int:
	var h: int = 0
	for i in range(code.length()):
		h = h * 31 + code.unicode_at(i)
	return h

func _shuffle_with_rng(arr: Array, rng: RandomNumberGenerator) -> void:
	for i in range(arr.size() - 1, 0, -1):
		var j := rng.randi_range(0, i)
		var tmp = arr[i]
		arr[i] = arr[j]
		arr[j] = tmp

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
		player_max_mana = mini(player_max_mana + 1, MAX_MANA_CAP)
		player_mana = player_max_mana
		_log("[color=cyan]── 自分のターン %d (マナ: %d) ──[/color]" % [turn_number, player_mana])
	else:
		opponent_max_mana = mini(opponent_max_mana + 1, MAX_MANA_CAP)
		opponent_mana = opponent_max_mana
		_log("[color=red]── 相手のターン %d ──[/color]" % turn_number)

	_process_turn_start_effects(is_player_turn)
	current_phase = Phase.MAIN1
	_update_all_ui()

	if is_player_turn:
		await _show_phase_banner("自分のターン", Color(0.3, 1.0, 0.5), 0.6)
		# Player input enabled - wait for actions
	else:
		await _show_phase_banner("相手のターン", Color(1.0, 0.4, 0.4), 0.6)
		# Wait for opponent actions via Firebase polling
		_waiting_for_opponent = true

# ─── Player's end phase button ───
func _on_end_phase() -> void:
	if not is_player_turn or is_animating or game_over:
		return

	var is_first_player_turn1 := is_player_first and turn_number == 1
	var skip_dice_draw := is_first_player_turn1

	if current_phase == Phase.MAIN1:
		if skip_dice_draw:
			var ok_skip := await _send_action({"type": "end_phase", "phase": "main1", "skip": true})
			if not ok_skip:
				return
			_end_turn()
			return
		else:
			var ok_main1 := await _send_action({"type": "end_phase", "phase": "main1"})
			if not ok_main1:
				return
			# Dice phase
			current_phase = Phase.DICE
			_clear_selection()
			_update_all_ui()
			await _show_phase_banner("ダイス!", Color(1, 0.9, 0.3), 0.5)
			var dice_val := randi() % 6 + 1
			var ok_dice := await _send_action({"type": "dice_roll", "value": dice_val})
			if not ok_dice:
				return
			await _do_dice_and_battle(dice_val)
			if game_over:
				return
			# Draw
			current_phase = Phase.DRAW
			_update_all_ui()
			await _show_phase_banner("ドロー & 1マナ回復", Color(0.3, 1.0, 0.5), 0.5)
			var ok_draw := await _send_action({"type": "draw"})
			if not ok_draw:
				return
			_player_draw_card()
			_opponent_draw_card()
			player_mana = mini(player_mana + 1, player_max_mana)
			opponent_mana = mini(opponent_mana + 1, opponent_max_mana)
			_log("カードを1枚ドロー。1マナ回復。")
			# Main2
			current_phase = Phase.MAIN2
			_clear_selection()
			_update_all_ui()
			await _show_phase_banner("メインフェイズ2", Color(0.3, 1.0, 0.5), 0.5)
	elif current_phase == Phase.MAIN2:
		var ok_main2 := await _send_action({"type": "end_phase", "phase": "main2"})
		if not ok_main2:
			return
		_end_turn()

func _on_end_turn() -> void:
	if not is_player_turn or is_animating or game_over:
		return
	# Keep network protocol consistent: turn end is always end_phase(main2).
	if current_phase != Phase.MAIN2:
		return
	var ok := await _send_action({"type": "end_phase", "phase": "main2"})
	if not ok:
		return
	_end_turn()

# ═══════════════════════════════════════════
# SEND ACTIONS TO FIREBASE
# ═══════════════════════════════════════════
func _send_action(action: Dictionary) -> bool:
	var ok := await MultiplayerManager.send_action(action)
	if not ok:
		_log("[color=red]通信エラー: アクション送信に失敗 (%s)[/color]" % MultiplayerManager.last_error)
	return ok

# ═══════════════════════════════════════════
# RECEIVE OPPONENT ACTIONS
# ═══════════════════════════════════════════
func _on_action_received(action: Dictionary) -> void:
	if game_over:
		return
	_action_queue.append(action)
	if not _processing_actions:
		_process_action_queue()

func _process_action_queue() -> void:
	_processing_actions = true
	while _action_queue.size() > 0:
		var action: Dictionary = _action_queue.pop_front()
		await _execute_opponent_action(action)
	_processing_actions = false

func _execute_opponent_action(action: Dictionary) -> void:
	var action_type: String = action.get("type", "")
	match action_type:
		"summon":
			var card_id: int = int(action.get("card_id", 0))
			var slot_idx: int = int(action.get("slot", 0))
			_opponent_summon(card_id, slot_idx)
			await get_tree().create_timer(0.4).timeout
		"move":
			var from_slot: int = int(action.get("from_slot", 0))
			var to_slot: int = int(action.get("to_slot", 0))
			_opponent_move(from_slot, to_slot)
			await get_tree().create_timer(0.3).timeout
		"end_phase":
			var phase_name: String = action.get("phase", "main1")
			var skip: bool = action.get("skip", false)
			if phase_name == "main1":
				if skip:
					# First turn skip
					_end_turn()
					return
				else:
					# Dice phase
					current_phase = Phase.DICE
					_update_all_ui()
					await _show_phase_banner("ダイス!", Color(1, 0.9, 0.3), 0.5)
					# Wait for dice_roll action
			elif phase_name == "main2":
				_end_turn()
		"dice_roll":
			var dice_val: int = int(action.get("value", 1))
			await _do_dice_and_battle(dice_val)
			if game_over:
				return
		"draw":
			current_phase = Phase.DRAW
			_update_all_ui()
			await _show_phase_banner("ドロー & 1マナ回復", Color(0.3, 1.0, 0.5), 0.5)
			_opponent_draw_card()
			opponent_mana = mini(opponent_mana + 1, opponent_max_mana)
			_log("相手がカードをドロー。1マナ回復。")
			current_phase = Phase.MAIN2
			_clear_selection()
			_update_all_ui()
			await _show_phase_banner("メインフェイズ2", Color(0.3, 1.0, 0.5), 0.5)
		"surrender":
			_game_end(true)

func _opponent_summon(card_id: int, slot_idx: int) -> void:
	_log("[color=gray]DEBUG: opponent_summon id=%d slot=%d hand=%d[/color]" % [card_id, slot_idx, opponent_hand_count])
	if slot_idx < 0 or slot_idx >= opponent_slots.size():
		_log("[color=red]ERROR: invalid summon slot %d[/color]" % slot_idx)
		return
	# Find card in opponent deck (they drew it) - for display only
	var card_data := CardDatabase.get_card_by_id(card_id)
	if not card_data:
		return
	var slot: FieldSlot = opponent_slots[slot_idx]
	if not slot or not slot.is_empty():
		_log("[color=red]ERROR: slot %d is not empty or null[/color]" % slot_idx)
		return
	var data_copy := card_data.duplicate_card()
	opponent_mana = maxi(0, opponent_mana - data_copy.mana_cost)
	opponent_hand_count = maxi(0, opponent_hand_count - 1)

	var card_ui := CARD_UI_SCENE.instantiate() as CardUI
	slot.place_card(card_ui)
	card_ui.setup(data_copy)
	_log("相手が %s を召喚" % data_copy.card_name)
	# 相手の召喚時効果を発動
	_process_summon_effect(card_ui, false)
	_update_all_ui()

func _opponent_move(from_idx: int, to_idx: int) -> void:
	if from_idx < 0 or from_idx >= opponent_slots.size() or to_idx < 0 or to_idx >= opponent_slots.size():
		_log("[color=red]ERROR: invalid move %d -> %d[/color]" % [from_idx, to_idx])
		return
	var from_slot: FieldSlot = opponent_slots[from_idx]
	var to_slot: FieldSlot = opponent_slots[to_idx]
	if not from_slot or not to_slot:
		return
	if from_slot.is_empty():
		return
	if not to_slot.is_empty():
		_log("[color=red]ERROR: target slot %d is not empty[/color]" % to_idx)
		return
	opponent_mana = maxi(0, opponent_mana - MOVE_COST)
	var card := from_slot.remove_card()
	to_slot.place_card(card)
	_log("相手が %s を移動" % card.card_data.card_name)
	_update_all_ui()

# ═══════════════════════════════════════════
# DRAW (override _opponent_draw_card from BattleBase)
# ═══════════════════════════════════════════
func _opponent_draw_card() -> void:
	if opponent_deck.is_empty():
		return
	opponent_deck.pop_front()  # Remove from their deck but don't show
	opponent_hand_count += 1
	_update_opponent_hand_display()

# ═══════════════════════════════════════════
# PLAYER INPUT
# ═══════════════════════════════════════════
func _summon_card_to_slot(card_ui: CardUI, slot: FieldSlot) -> void:
	var effective_cost := _get_effective_summon_cost(card_ui)
	player_mana -= effective_cost
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
	var ok := await _send_action({"type": "summon", "card_id": card_ui.card_data.id, "slot": slot.slot_index})
	if not ok:
		slot.remove_card()
		player_mana += effective_cost
		player_hand_container.add_child(card_ui)
		card_ui.set_card_size(120)
		card_ui.card_clicked.connect(_on_hand_card_clicked)
		card_ui.card_drag_ended.connect(_on_hand_card_drag_ended)
		card_ui.card_long_pressed.connect(_on_hand_card_long_pressed)
		player_hand.append(card_ui)
		_clear_selection()
		_update_all_ui()
		return
	_log("召喚: %s (コスト %d)" % [card_ui.card_data.card_name, effective_cost])
	_process_summon_effect(card_ui, true)
	_clear_selection()
	_update_all_ui()

func _move_card_to_slot(from_slot: FieldSlot, to_slot: FieldSlot) -> void:
	player_mana -= MOVE_COST
	var card := from_slot.remove_card()
	to_slot.place_card(card)
	var ok := await _send_action({"type": "move", "from_slot": from_slot.slot_index, "to_slot": to_slot.slot_index})
	if not ok:
		to_slot.remove_card()
		from_slot.place_card(card)
		player_mana += MOVE_COST
		_update_all_ui()
		return
	_log("移動: %s (マナ1消費)" % card.card_data.card_name)
	_clear_selection()
	_update_all_ui()

# ═══════════════════════════════════════════
# GAME END
# ═══════════════════════════════════════════
func _game_end(player_wins: bool) -> void:
	game_over = true
	_waiting_for_opponent = false
	_update_all_ui()
	if player_wins:
		_log("[color=yellow]勝利！[/color]")
		GameManager.battle_result = "win"
	else:
		_log("[color=red]敗北...[/color]")
		GameManager.battle_result = "lose"
	await MultiplayerManager.leave_room()
	await get_tree().create_timer(2.0).timeout
	GameManager.change_scene("res://scenes/result/result.tscn")

func _on_opponent_disconnected() -> void:
	if game_over:
		return
	_log("[color=red]相手が切断しました[/color]")
	game_over = true
	GameManager.battle_result = "win"
	await MultiplayerManager.leave_room()
	await get_tree().create_timer(2.0).timeout
	GameManager.change_scene("res://scenes/result/result.tscn")

func _on_surrender() -> void:
	if game_over:
		return
	var ok := await _send_action({"type": "surrender"})
	if not ok:
		return
	game_over = true
	GameManager.battle_result = "lose"
	_log("[color=red]降参しました。[/color]")
	await MultiplayerManager.leave_room()
	await get_tree().create_timer(1.0).timeout
	GameManager.change_scene("res://scenes/result/result.tscn")
