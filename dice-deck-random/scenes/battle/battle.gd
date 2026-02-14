extends Control

# ─── Constants ───
const CARD_UI_SCENE := preload("res://scenes/battle/card_ui.tscn")
const FIELD_SLOT_SCENE := preload("res://scenes/battle/field_slot.tscn")
const MAX_HP := 20
const MAX_MANA_CAP := 5
const STARTING_HAND := 3
const MOVE_COST := 1

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
var surrender_btn: Button
var log_label: RichTextLabel
var phase_overlay: ColorRect
var phase_overlay_label: Label
var turn_indicator_label: Label
var center_info: HBoxContainer

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
	turn_indicator_label.add_theme_font_size_override("font_size", 20)
	turn_indicator_label.custom_minimum_size.y = 30
	main_vbox.add_child(turn_indicator_label)

	# ── Opponent HP ──
	opponent_hp_label = Label.new()
	opponent_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	opponent_hp_label.add_theme_font_size_override("font_size", 28)
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

	# ── Center info bar ──
	center_info = HBoxContainer.new()
	center_info.alignment = BoxContainer.ALIGNMENT_CENTER
	center_info.add_theme_constant_override("separation", 20)
	center_info.custom_minimum_size.y = 60
	main_vbox.add_child(center_info)

	dice_label = Label.new()
	dice_label.text = "🎲 -"
	dice_label.add_theme_font_size_override("font_size", 32)
	center_info.add_child(dice_label)

	phase_label = Label.new()
	phase_label.text = "メイン1"
	phase_label.add_theme_font_size_override("font_size", 24)
	center_info.add_child(phase_label)

	end_turn_btn = Button.new()
	end_turn_btn.text = "終了"
	end_turn_btn.custom_minimum_size = Vector2(100, 50)
	end_turn_btn.add_theme_font_size_override("font_size", 22)
	end_turn_btn.pressed.connect(_on_end_phase)
	center_info.add_child(end_turn_btn)

	surrender_btn = Button.new()
	surrender_btn.text = "🏳"
	surrender_btn.custom_minimum_size = Vector2(60, 50)
	surrender_btn.add_theme_font_size_override("font_size", 22)
	surrender_btn.pressed.connect(_on_surrender)
	center_info.add_child(surrender_btn)

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
	player_hp_label.add_theme_font_size_override("font_size", 28)
	player_hp_label.add_theme_color_override("font_color", Color(0.4, 1.0, 0.4))
	main_vbox.add_child(player_hp_label)

	# ── Mana display ──
	mana_label = Label.new()
	mana_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mana_label.add_theme_font_size_override("font_size", 24)
	mana_label.add_theme_color_override("font_color", Color(0.4, 0.7, 1.0))
	main_vbox.add_child(mana_label)

	# ── Player hand ──
	var hand_scroll := ScrollContainer.new()
	hand_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	hand_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	hand_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	main_vbox.add_child(hand_scroll)

	player_hand_container = HBoxContainer.new()
	player_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	player_hand_container.add_theme_constant_override("separation", 6)
	player_hand_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hand_scroll.add_child(player_hand_container)

	# ── Log (small, at bottom) ──
	log_label = RichTextLabel.new()
	log_label.bbcode_enabled = true
	log_label.scroll_following = true
	log_label.custom_minimum_size.y = 80
	log_label.add_theme_font_size_override("normal_font_size", 16)
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

func _update_all_ui() -> void:
	player_hp_label.text = "HP 自分: %d" % player_hp
	opponent_hp_label.text = "HP 相手: %d" % opponent_hp
	var mana_str := ""
	for i in range(MAX_MANA_CAP):
		if i < player_mana:
			mana_str += "●"
		elif i < player_max_mana:
			mana_str += "○"
		else:
			mana_str += "·"
	mana_label.text = "マナ: %s (%d/%d)" % [mana_str, player_mana, player_max_mana]
	var phase_names := {Phase.MAIN1: "メイン1", Phase.DICE: "ダイス", Phase.DRAW: "ドロー", Phase.MAIN2: "メイン2", Phase.END: "終了"}
	phase_label.text = phase_names.get(current_phase, "?")
	# Turn indicator
	if is_player_turn:
		var go_text := "先行" if is_player_first else "後攻"
		turn_indicator_label.text = "自分のターン (%s) - ターン %d" % [go_text, turn_number]
		turn_indicator_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	else:
		turn_indicator_label.text = "相手のターン - ターン %d" % turn_number
		turn_indicator_label.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
	if current_dice > 0:
		dice_label.text = "🎲 %d" % current_dice
	else:
		dice_label.text = "🎲 -"
	# Opponent hand display
	_update_opponent_hand_display()
	# Hand card summonability
	_update_hand_highlights()

func _update_opponent_hand_display() -> void:
	for child in opponent_hand_container.get_children():
		child.queue_free()
	for i in range(opponent_hand.size()):
		var card_back := Panel.new()
		card_back.custom_minimum_size = Vector2(40, 55)
		var style := StyleBoxFlat.new()
		style.bg_color = Color(0.3, 0.3, 0.4)
		style.corner_radius_top_left = 4
		style.corner_radius_top_right = 4
		style.corner_radius_bottom_left = 4
		style.corner_radius_bottom_right = 4
		card_back.add_theme_stylebox_override("panel", style)
		opponent_hand_container.add_child(card_back)

func _update_hand_highlights() -> void:
	var in_main_phase := current_phase == Phase.MAIN1 or current_phase == Phase.MAIN2
	for card_ui in player_hand:
		if card_ui is CardUI:
			var can_summon: bool = in_main_phase and is_player_turn and not is_animating and card_ui.card_data.mana_cost <= player_mana and _has_empty_player_slot()
			card_ui.set_summonable(can_summon)

func _has_empty_player_slot() -> bool:
	for slot in player_slots:
		if slot and slot.is_empty():
			return true
	return false

func _log(text: String) -> void:
	log_label.append_text(text + "\n")

func _show_phase_banner(text: String, banner_color: Color = Color(1, 1, 1), duration: float = 0.8) -> void:
	phase_overlay_label.text = text
	phase_overlay_label.add_theme_color_override("font_color", banner_color)
	phase_overlay.modulate = Color(1, 1, 1, 0)
	phase_overlay.visible = true
	var tween := create_tween()
	tween.tween_property(phase_overlay, "modulate:a", 1.0, 0.15)
	tween.tween_interval(duration)
	tween.tween_property(phase_overlay, "modulate:a", 0.0, 0.2)
	tween.tween_callback(func(): phase_overlay.visible = false)
	await tween.finished


# ═══════════════════════════════════════════
# GAME START
# ═══════════════════════════════════════════
func _start_game() -> void:
	# Prepare decks
	if GameManager.player_deck.size() >= 20:
		for card in GameManager.player_deck:
			player_deck.append(card.duplicate_card())
	else:
		player_deck = _to_card_data_array(CardDatabase.build_random_deck())
	opponent_deck = _to_card_data_array(CardDatabase.build_random_deck())
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

	# Draw starting hands
	for i in range(STARTING_HAND):
		_player_draw_card()
		_opponent_draw_card()

	_update_all_ui()
	_start_turn()

func _to_card_data_array(arr: Array) -> Array[CardData]:
	var result: Array[CardData] = []
	for item in arr:
		result.append(item)
	return result

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
			await _show_phase_banner("🎲 ダイス!", Color(1, 0.9, 0.3), 0.5)
			await _do_dice_and_battle()
			if game_over:
				return
			# Draw phase
			current_phase = Phase.DRAW
			_update_all_ui()
			_player_draw_card()
			_log("カードを1枚ドローした。")
			# Go to Main2
			current_phase = Phase.MAIN2
			_clear_selection()
			_update_all_ui()
			await _show_phase_banner("メインフェイズ2", Color(0.5, 0.8, 1.0), 0.5)
	elif current_phase == Phase.MAIN2:
		_end_turn()

func _end_turn() -> void:
	current_phase = Phase.END
	_clear_selection()
	_update_all_ui()
	is_player_turn = not is_player_turn
	_start_turn()

# ═══════════════════════════════════════════
# DICE & BATTLE
# ═══════════════════════════════════════════
func _do_dice_and_battle() -> void:
	is_animating = true
	# Roll dice with animation
	current_dice = await _animate_dice_roll()
	_log("[color=yellow]🎲 ダイス: %d[/color]" % current_dice)
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
		if current_dice not in card_ui.card_data.attack_dice:
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

		# Highlight attacker briefly
		card_ui.modulate = Color(1.5, 1.2, 0.5)
		await get_tree().create_timer(0.2).timeout

		if target_is_player_hp:
			if attacker_is_player:
				_log("[color=lime]%s → 相手HPに%dダメージ！[/color]" % [atk_name, damage])
				await _animate_attack(card_ui, opponent_hp_label)
				_spawn_damage_popup(opponent_hp_label.global_position + Vector2(50, 0), damage)
				_shake_node(opponent_hp_label)
				opponent_hp -= damage
				if opponent_hp <= 0:
					_game_end(true)
					return
			else:
				_log("[color=red]%s → 自分HPに%dダメージ！[/color]" % [atk_name, damage])
				await _animate_attack(card_ui, player_hp_label)
				_spawn_damage_popup(player_hp_label.global_position + Vector2(50, 0), damage)
				_shake_node(player_hp_label)
				player_hp -= damage
				if player_hp <= 0:
					_game_end(false)
					return
		elif target_slot:
			var def_card: CardUI = target_slot.card_ui
			_log("%s → %sに%dダメージ" % [atk_name, def_card.card_data.card_name, damage])
			await _animate_attack(card_ui, def_card)
			def_card.play_damage_flash()
			_spawn_damage_popup(def_card.global_position + Vector2(40, 0), damage)
			var remaining := def_card.take_damage(damage)
			if remaining <= 0:
				_log("[color=gray]%s 破壊！[/color]" % def_card.card_data.card_name)
				await def_card.play_destroy_animation()
				target_slot.remove_card()
				def_card.queue_free()

		card_ui.modulate = Color.WHITE
		_update_all_ui()
		await get_tree().create_timer(0.3).timeout

func _animate_dice_roll() -> int:
	var final := randi() % 6 + 1
	dice_label.add_theme_font_size_override("font_size", 32)
	for i in range(12):
		current_dice = randi() % 6 + 1
		dice_label.text = "🎲 %d" % current_dice
		dice_label.pivot_offset = dice_label.size / 2
		if i % 2 == 0:
			dice_label.scale = Vector2(1.2, 1.2)
		else:
			dice_label.scale = Vector2(0.9, 0.9)
		await get_tree().create_timer(0.04 + i * 0.025).timeout
	current_dice = final
	dice_label.text = "🎲 %d" % current_dice
	var tween := create_tween()
	tween.tween_property(dice_label, "scale", Vector2(1.5, 1.5), 0.1)
	tween.tween_property(dice_label, "scale", Vector2(1.0, 1.0), 0.15)
	await tween.finished
	dice_label.add_theme_font_size_override("font_size", 36)
	await get_tree().create_timer(0.3).timeout
	return final

func _animate_attack(card_ui: CardUI, target_node: Control) -> void:
	var orig := card_ui.global_position
	var target_center := target_node.global_position + target_node.size / 2
	var card_center := orig + card_ui.size / 2
	var direction := (target_center - card_center).normalized()
	var lunge_distance := card_center.distance_to(target_center) * 0.4
	lunge_distance = clampf(lunge_distance, 30.0, 200.0)
	var lunge_pos := orig + direction * lunge_distance

	card_ui.z_index = 50
	var tween := create_tween()
	tween.tween_property(card_ui, "global_position", lunge_pos, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	tween.tween_property(card_ui, "global_position", orig, 0.18).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	await tween.finished
	card_ui.z_index = 1

func _shake_node(node: Control) -> void:
	var orig_pos := node.position
	var tween := create_tween()
	tween.tween_property(node, "position", orig_pos + Vector2(8, 0), 0.04)
	tween.tween_property(node, "position", orig_pos + Vector2(-8, 0), 0.04)
	tween.tween_property(node, "position", orig_pos + Vector2(5, 0), 0.04)
	tween.tween_property(node, "position", orig_pos + Vector2(-5, 0), 0.04)
	tween.tween_property(node, "position", orig_pos, 0.04)

func _spawn_damage_popup(pos: Vector2, amount: int) -> void:
	var popup := Label.new()
	popup.text = "-%d" % amount
	popup.add_theme_font_size_override("font_size", 32)
	popup.add_theme_color_override("font_color", Color(1, 0.2, 0.2))
	popup.global_position = pos
	popup.z_index = 200
	popup.top_level = true
	add_child(popup)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(popup, "global_position:y", pos.y - 60, 0.6)
	tween.tween_property(popup, "modulate:a", 0.0, 0.6)
	tween.finished.connect(func(): popup.queue_free())

# ═══════════════════════════════════════════
# DRAW
# ═══════════════════════════════════════════
func _player_draw_card() -> void:
	if player_deck.is_empty():
		return
	var card_data: CardData = player_deck.pop_front()
	var card_ui := CARD_UI_SCENE.instantiate() as CardUI
	player_hand_container.add_child(card_ui)
	card_ui.setup(card_data)
	card_ui.card_clicked.connect(_on_hand_card_clicked)
	card_ui.card_drag_ended.connect(_on_hand_card_drag_ended)
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
	if card_ui.card_data.mana_cost > player_mana:
		_log("マナが足りない！")
		return
	if not _has_empty_player_slot():
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
	if card_ui.card_data.mana_cost > player_mana:
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
			# Highlight adjacent empty slots
			var adjacent := _get_adjacent_slots(slot.slot_index)
			for adj_idx in adjacent:
				var adj_slot: FieldSlot = player_slots[adj_idx]
				if adj_slot and adj_slot.is_empty():
					adj_slot.set_highlighted(true)
		else:
			_clear_selection()

func _on_opponent_slot_clicked(_slot: FieldSlot) -> void:
	# No direct interaction with opponent slots in v2
	pass

func _get_adjacent_slots(idx: int) -> Array[int]:
	# Adjacent = same row left/right, or same lane other row
	var result: Array[int] = []
	var row_start := (idx / 3) * 3
	var lane_idx := idx % 3
	# Left in same row
	if lane_idx > 0:
		result.append(row_start + lane_idx - 1)
	# Right in same row
	if lane_idx < 2:
		result.append(row_start + lane_idx + 1)
	# Same lane other row
	if idx < 3:
		result.append(idx + 3)
	else:
		result.append(idx - 3)
	return result

func _summon_card_to_slot(card_ui: CardUI, slot: FieldSlot) -> void:
	player_mana -= card_ui.card_data.mana_cost
	# Remove from hand
	player_hand.erase(card_ui)
	card_ui.card_clicked.disconnect(_on_hand_card_clicked)
	card_ui.card_drag_ended.disconnect(_on_hand_card_drag_ended)
	card_ui.set_selected(false)
	card_ui.set_summonable(false)
	if card_ui.get_parent():
		card_ui.get_parent().remove_child(card_ui)
	card_ui.reset_position()
	slot.place_card(card_ui)
	_log("召喚: %s (コスト %d)" % [card_ui.card_data.card_name, card_ui.card_data.mana_cost])
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
	current_phase = Phase.MAIN1
	_update_all_ui()
	await _ai_summon_phase()
	await get_tree().create_timer(0.3).timeout

	if not skip_dice_draw:
		# Dice phase
		current_phase = Phase.DICE
		_update_all_ui()
		await _do_dice_and_battle()
		if game_over:
			return
		await get_tree().create_timer(0.3).timeout

		# Draw
		current_phase = Phase.DRAW
		_update_all_ui()
		_opponent_draw_card()
		_log("相手がカードをドローした。")
		await get_tree().create_timer(0.3).timeout

	# Main Phase 2
	current_phase = Phase.MAIN2
	_update_all_ui()
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

func _on_surrender() -> void:
	if game_over:
		return
	game_over = true
	GameManager.battle_result = "lose"
	_log("[color=red]降参しました。[/color]")
	await get_tree().create_timer(1.0).timeout
	GameManager.change_scene("res://scenes/result/result.tscn")
