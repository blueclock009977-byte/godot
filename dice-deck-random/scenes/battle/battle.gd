extends BattleBase
## Local battle controller (vs AI opponent).

# ─── Local-only State ───
var opponent_hand: Array = []  # Array of CardData (AI's hidden hand)

func _ready() -> void:
	_build_ui()
	_start_game()

func _update_opponent_hand_display() -> void:
	BattleUtils.update_opponent_hand_display(opponent_hand_container, opponent_hand.size())

# ═══════════════════════════════════════════
# GAME START
# ═══════════════════════════════════════════
func _start_game() -> void:
	# Prepare decks
	if GameManager.player_deck.size() >= 20:
		for card in GameManager.player_deck:
			player_deck.append(card.duplicate_card())
	else:
		player_deck = CardDatabase.build_random_battle_deck()
	opponent_deck = CardDatabase.build_random_battle_deck()
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

# ═══════════════════════════════════════════
# DRAW (override _opponent_draw_card from BattleBase)
# ═══════════════════════════════════════════
func _opponent_draw_card() -> void:
	if opponent_deck.is_empty():
		return
	var card_data: CardData = opponent_deck.pop_front()
	opponent_hand.append(card_data)
	_update_opponent_hand_display()

# ═══════════════════════════════════════════
# PLAYER INPUT
# ═══════════════════════════════════════════
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
			_process_summon_effect(card_ui, false)
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
