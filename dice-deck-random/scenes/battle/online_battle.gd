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

func _mirror_slot_index(slot_idx: int) -> int:
	if slot_idx < 0:
		return slot_idx
	var row := int(slot_idx / 3) # 0: front, 1: back
	var lane := slot_idx % 3      # 0: left, 1: center, 2: right
	return row * 3 + (2 - lane)

func _to_canonical_slot_index(local_slot_idx: int) -> int:
	# canonical = player1視点のスロット番号
	if my_player_number == 2:
		return _mirror_slot_index(local_slot_idx)
	return local_slot_idx

func _from_canonical_opponent_slot_index(canonical_slot_idx: int) -> int:
	# 受信した相手アクション(canonical)を自分画面のopponent_slotsへ変換
	if my_player_number == 2:
		return _mirror_slot_index(canonical_slot_idx)
	return canonical_slot_idx

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
# UI SCALE (smaller for online mode)
# ═══════════════════════════════════════════
func _get_ui_font_scale() -> float:
	return 0.85

func _get_my_display_name() -> String:
	return GameManager.user_name if GameManager.user_name != "" else "自分"

func _get_opponent_display_name() -> String:
	return MultiplayerManager.opponent_name if MultiplayerManager.opponent_name != "" else "相手"

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
		player_deck = CardDatabase.build_random_battle_deck()

	# Load opponent deck from Firebase
	var opp_deck_ids := await MultiplayerManager.get_opponent_deck()
	opponent_deck = []
	for id in opp_deck_ids:
		var card := CardDatabase.get_card_by_id(int(id))
		if card:
			opponent_deck.append(card.duplicate_card())
	if opponent_deck.size() < 20:
		opponent_deck = CardDatabase.build_random_battle_deck()

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
			player_mana = mini(player_mana + 1, player_max_mana)
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
			if is_player_turn:
				_log("[color=yellow]WARN: out-of-turn summon action ignored[/color]")
				return
			var card_id: int = int(action.get("card_id", 0))
			var canonical_slot_idx: int = int(action.get("slot", 0))
			var slot_idx: int = _from_canonical_opponent_slot_index(canonical_slot_idx)
			_opponent_summon(card_id, slot_idx)
			await get_tree().create_timer(0.4).timeout
		"move":
			if is_player_turn:
				_log("[color=yellow]WARN: out-of-turn move action ignored[/color]")
				return
			var canonical_from_slot: int = int(action.get("from_slot", 0))
			var canonical_to_slot: int = int(action.get("to_slot", 0))
			var from_slot: int = _from_canonical_opponent_slot_index(canonical_from_slot)
			var to_slot: int = _from_canonical_opponent_slot_index(canonical_to_slot)
			_opponent_move(from_slot, to_slot)
			await get_tree().create_timer(0.3).timeout
		"end_phase":
			if is_player_turn:
				_log("[color=yellow]WARN: out-of-turn end_phase action ignored[/color]")
				return
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
			if is_player_turn:
				_log("[color=yellow]WARN: out-of-turn dice_roll action ignored[/color]")
				return
			var dice_val: int = int(action.get("value", 1))
			await _do_dice_and_battle(dice_val)
			if game_over:
				return
		"draw":
			if is_player_turn:
				_log("[color=yellow]WARN: out-of-turn draw action ignored[/color]")
				return
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
	_connect_card_preview_signal(card_ui)
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
	_connect_card_preview_signal(card_ui)
	var canonical_slot := _to_canonical_slot_index(slot.slot_index)
	var ok := await _send_action({"type": "summon", "card_id": card_ui.card_data.id, "slot": canonical_slot})
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
	var canonical_from := _to_canonical_slot_index(from_slot.slot_index)
	var canonical_to := _to_canonical_slot_index(to_slot.slot_index)
	var ok := await _send_action({"type": "move", "from_slot": canonical_from, "to_slot": canonical_to})
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
