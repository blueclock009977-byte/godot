extends GutTest

## カード単位バランス計測シミュレーター
## 各カードの出場時勝率・採用時勝率を測定

const GAMES_PER_MATCHUP := 100  # 各マッチアップあたりのゲーム数（Phase24: 乱数揺れ低減のため増加）
const MAX_TURNS := 50
const STARTING_HP := 20
const MAX_MANA_CAP := 5       # 実際のバトルに合わせて変更
const DECK_SIZE := 20
const INITIAL_HAND_SIZE := 3


## CardUI の軽量モック。EffectManager のダックタイピング要件を満たす。
class SimCard:
	var card_data: CardData
	var current_hp: int
	var current_atk: int
	var attack_dice: Array
	var has_revived: bool = false
	var _status: Dictionary = {}  # EffectManager.StatusEffect(int) -> remaining turns

	func _init(data: CardData) -> void:
		card_data = data
		current_hp = data.hp
		current_atk = data.atk
		attack_dice = data.attack_dice.duplicate()

	func take_damage(amount: int) -> void:
		if amount > 0:
			current_hp -= amount

	func heal(amount: int) -> void:
		if amount > 0:
			current_hp = mini(current_hp + amount, card_data.hp)

	func modify_atk(amount: int) -> void:
		current_atk += amount

	# NOTE: 本番 CardUI は単純上書きだが、シミュレーションでは既存の長い効果を
	# 短縮しない保守的挙動を採用（maxi）
	func apply_status(effect: int, duration: int = 1) -> void:
		_status[effect] = maxi(_status.get(effect, 0), duration)

	func has_status(effect: int) -> bool:
		return _status.get(effect, 0) > 0

	func clear_status_effects() -> void:
		_status.clear()

	func tick_status_effects() -> void:
		var to_remove: Array = []
		for s in _status:
			_status[s] -= 1
			if _status[s] <= 0:
				to_remove.append(s)
		for s in to_remove:
			_status.erase(s)


## FieldSlot の軽量モック。EffectManager/BattleUtils のダックタイピング要件を満たす。
class SimSlot:
	var card_ui  # SimCard or null
	var slot_index: int
	var lane: int
	var is_front_row: bool
	var is_player_side: bool

	func _init(idx: int, is_player: bool) -> void:
		slot_index = idx
		lane = idx % 3
		is_front_row = idx < 3
		is_player_side = is_player
		card_ui = null

	func is_empty() -> bool:
		return card_ui == null

	func place_card(sim_card) -> void:
		card_ui = sim_card

	func remove_card():
		var c = card_ui
		card_ui = null
		return c


# カード単位統計
var _card_played_wins: Dictionary = {}  # card_id -> wins when played
var _card_played_games: Dictionary = {}  # card_id -> games when played
var _card_in_deck_wins: Dictionary = {}  # card_id -> wins when in deck
var _card_in_deck_games: Dictionary = {}  # card_id -> games when in deck

func _reset_card_stats() -> void:
	_card_played_wins.clear()
	_card_played_games.clear()
	_card_in_deck_wins.clear()
	_card_in_deck_games.clear()

	for card in CardDatabase.card_pool:
		_card_played_wins[card.id] = 0
		_card_played_games[card.id] = 0
		_card_in_deck_wins[card.id] = 0
		_card_in_deck_games[card.id] = 0


func _make_mono_deck(color: CardData.ColorType) -> Array:
	"""単色デッキを作成（グレー10枚 + 指定色10枚）"""
	var deck := []
	var gray_cards := []
	var color_cards := []

	for card in CardDatabase.card_pool:
		if card.color_type == CardData.ColorType.GRAY:
			gray_cards.append(card)
		elif card.color_type == color:
			color_cards.append(card)

	gray_cards.shuffle()
	var gray_counts := {}
	for card in gray_cards:
		if deck.size() >= 10:
			break
		var count: int = gray_counts.get(card.id, 0)
		if count < 2:
			deck.append(card)
			gray_counts[card.id] = count + 1

	color_cards.shuffle()
	var color_counts := {}
	for card in color_cards:
		if deck.size() >= DECK_SIZE:
			break
		var count: int = color_counts.get(card.id, 0)
		if count < 2:
			deck.append(card)
			color_counts[card.id] = count + 1

	deck.shuffle()
	return deck


func _make_context(p_slots: Array, o_slots: Array, dice_val: int) -> Dictionary:
	return {"player_slots": p_slots, "opponent_slots": o_slots, "current_dice": dice_val}


## EffectManager の結果 Dictionary をシミュ状態に適用する。
func _apply_sim_effect(result: Dictionary, is_player: bool, state: Dictionary,
		p_slots: Array, o_slots: Array) -> void:
	if result.is_empty():
		return

	if result.has("mana"):
		var mk := "mana_p" if is_player else "mana_o"
		var mmk := "max_mana_p" if is_player else "max_mana_o"
		state[mk] = mini(state[mk] + result["mana"], state[mmk])

	if result.has("direct_damage"):
		if is_player:
			state["hp_o"] -= result["direct_damage"]
		else:
			state["hp_p"] -= result["direct_damage"]

	if result.has("heal_player"):
		if is_player:
			state["hp_p"] = mini(state["hp_p"] + result["heal_player"], STARTING_HP)
		else:
			state["hp_o"] = mini(state["hp_o"] + result["heal_player"], STARTING_HP)

	if result.has("draw"):
		for i in range(result["draw"]):
			if is_player and state["deck_idx_p"] < state["deck_p"].size():
				state["hand_p"].append(state["deck_p"][state["deck_idx_p"]])
				state["deck_idx_p"] += 1
			elif not is_player and state["deck_idx_o"] < state["deck_o"].size():
				state["hand_o"].append(state["deck_o"][state["deck_idx_o"]])
				state["deck_idx_o"] += 1

	if result.has("mana_full"):
		var mk := "mana_p" if is_player else "mana_o"
		var mmk := "max_mana_p" if is_player else "max_mana_o"
		state[mk] = state[mmk]

	if result.has("self_damage"):
		if is_player:
			state["hp_p"] -= result["self_damage"]
		else:
			state["hp_o"] -= result["self_damage"]

	if result.has("heal_player_full"):
		if is_player:
			state["hp_p"] = STARTING_HP
		else:
			state["hp_o"] = STARTING_HP

	# HP0になったカードを破壊
	var to_destroy: Array = []
	for target in result.get("damaged_targets", []):
		if target and target.current_hp <= 0:
			to_destroy.append(target)
	for target in result.get("destroy_targets", []):
		if target:
			to_destroy.append(target)
	_destroy_sim_cards(to_destroy, p_slots, o_slots, state)


func _destroy_sim_cards(targets: Array, p_slots: Array, o_slots: Array, state: Dictionary) -> void:
	for target in targets:
		for slot in p_slots:
			if not slot.is_empty() and slot.card_ui == target:
				slot.remove_card()
				# 死亡カード自身の ON_DEATH 効果
				var ctx := _make_context(p_slots, o_slots, 0)
				var result = EffectManager.process_timing_event(
					EffectManager.Timing.ON_DEATH,
					{"card_ui": target, "is_player": true, "context": ctx}
				)
				_apply_sim_effect(result, true, state, p_slots, o_slots)
				# 味方死亡反応（生き残り味方全員に ally_died イベントを発火）
				for ally_slot in p_slots:
					if ally_slot.is_empty():
						continue
					var ally: SimCard = ally_slot.card_ui
					var ally_ctx := _make_context(p_slots, o_slots, 0)
					ally_ctx["ally_died"] = true
					ally_ctx["dead_card_ui"] = target
					var ally_result = EffectManager.process_timing_event(
						EffectManager.Timing.ON_DEATH,
						{"card_ui": ally, "is_player": true, "context": ally_ctx}
					)
					_apply_sim_effect(ally_result, true, state, p_slots, o_slots)
				break
		for slot in o_slots:
			if not slot.is_empty() and slot.card_ui == target:
				slot.remove_card()
				var ctx := _make_context(p_slots, o_slots, 0)
				var result = EffectManager.process_timing_event(
					EffectManager.Timing.ON_DEATH,
					{"card_ui": target, "is_player": false, "context": ctx}
				)
				_apply_sim_effect(result, false, state, p_slots, o_slots)
				# 味方死亡反応
				for ally_slot in o_slots:
					if ally_slot.is_empty():
						continue
					var ally: SimCard = ally_slot.card_ui
					var ally_ctx := _make_context(p_slots, o_slots, 0)
					ally_ctx["ally_died"] = true
					ally_ctx["dead_card_ui"] = target
					var ally_result = EffectManager.process_timing_event(
						EffectManager.Timing.ON_DEATH,
						{"card_ui": ally, "is_player": false, "context": ally_ctx}
					)
					_apply_sim_effect(ally_result, false, state, p_slots, o_slots)
				break


## _simulate_game_with_tracking からは直接呼ばない。
## EffectManager.process_turn_end_effects が内部で SimCard.tick_status_effects() を
## 呼ぶため（effect_manager.gd:948-952）、状態異常は自動的にtickされる。
## このメソッドは将来的な用途のために定義を残している。
func _tick_all_statuses(p_slots: Array, o_slots: Array) -> void:
	for slot in p_slots:
		if not slot.is_empty():
			slot.card_ui.tick_status_effects()
	for slot in o_slots:
		if not slot.is_empty():
			slot.card_ui.tick_status_effects()


## battle.gd の _ai_summon_phase() を移植。
## 高コスト優先・フロント行・相手レーン・中央レーンをスコアで選択。
func _ai_summon(is_player: bool, p_slots: Array, o_slots: Array, state: Dictionary) -> void:
	var my_slots: Array = p_slots if is_player else o_slots
	var opp_slots: Array = o_slots if is_player else p_slots
	var mana_key := "mana_p" if is_player else "mana_o"
	var hand: Array = state["hand_p"] if is_player else state["hand_o"]

	var sorted_hand := hand.duplicate()
	sorted_hand.sort_custom(func(a, b): return a.mana_cost > b.mana_cost)

	for card_data in sorted_hand:
		if card_data.mana_cost > state[mana_key]:
			continue

		# スロットスコアリング
		var best_slot: SimSlot = null
		var best_score := -1
		for slot in my_slots:
			if not slot.is_empty():
				continue
			var score := 0
			if slot.is_front_row:
				score += 10
			if not opp_slots[slot.lane].is_empty() or not opp_slots[slot.lane + 3].is_empty():
				score += 5
			if slot.lane == 1:
				score += 2
			if score > best_score:
				best_score = score
				best_slot = slot

		if best_slot == null:
			break  # フィールド満杯

		var sim_card := SimCard.new(card_data)
		best_slot.place_card(sim_card)
		hand.erase(card_data)
		state[mana_key] -= card_data.mana_cost

		# 召喚時 HP ボーナス（常時効果 green_007, white_017 など）
		var ctx := _make_context(p_slots, o_slots, 0)
		var hp_bonus := EffectManager.get_constant_hp_bonus(sim_card, is_player, ctx)
		if hp_bonus > 0:
			sim_card.current_hp += hp_bonus
		# 自身が HP ボーナス付与効果を持つ場合、既存味方にも適用
		var eid: String = card_data.effect_id
		if eid in ["green_007", "white_017"]:
			var bonus := 1 if eid == "green_007" else 2
			for slot in my_slots:
				if not slot.is_empty() and slot.card_ui != sim_card:
					slot.card_ui.current_hp += bonus

		# ON_SUMMON 効果
		var result = EffectManager.process_timing_event(
			EffectManager.Timing.ON_SUMMON,
			{"card_ui": sim_card, "is_player": is_player, "context": ctx}
		)
		_apply_sim_effect(result, is_player, state, p_slots, o_slots)


## _ai_summon の追跡版。召喚したカードを state["cards_played_*"] に記録する。
func _ai_summon_tracking(is_player: bool, p_slots: Array, o_slots: Array, state: Dictionary) -> void:
	var my_slots: Array = p_slots if is_player else o_slots
	var opp_slots: Array = o_slots if is_player else p_slots
	var mana_key := "mana_p" if is_player else "mana_o"
	var hand: Array = state["hand_p"] if is_player else state["hand_o"]
	var played_key := "cards_played_p" if is_player else "cards_played_o"

	var sorted_hand := hand.duplicate()
	sorted_hand.sort_custom(func(a, b): return a.mana_cost > b.mana_cost)

	for card_data in sorted_hand:
		if card_data.mana_cost > state[mana_key]:
			continue
		var best_slot: SimSlot = null
		var best_score := -1
		for slot in my_slots:
			if not slot.is_empty():
				continue
			var score := 0
			if slot.is_front_row:
				score += 10
			if not opp_slots[slot.lane].is_empty() or not opp_slots[slot.lane + 3].is_empty():
				score += 5
			if slot.lane == 1:
				score += 2
			if score > best_score:
				best_score = score
				best_slot = slot
		if best_slot == null:
			break
		var sim_card := SimCard.new(card_data)
		best_slot.place_card(sim_card)
		hand.erase(card_data)
		state[mana_key] -= card_data.mana_cost
		state[played_key][card_data.id] = true  # ← 追跡

		var ctx := _make_context(p_slots, o_slots, 0)
		var hp_bonus := EffectManager.get_constant_hp_bonus(sim_card, is_player, ctx)
		if hp_bonus > 0:
			sim_card.current_hp += hp_bonus
		var eid: String = card_data.effect_id
		if eid in ["green_007", "white_017"]:
			var bonus := 1 if eid == "green_007" else 2
			for slot in my_slots:
				if not slot.is_empty() and slot.card_ui != sim_card:
					slot.card_ui.current_hp += bonus

		var result = EffectManager.process_timing_event(
			EffectManager.Timing.ON_SUMMON,
			{"card_ui": sim_card, "is_player": is_player, "context": ctx})
		_apply_sim_effect(result, is_player, state, p_slots, o_slots)


func _find_target_slot(attacker_slot: SimSlot, defender_slots: Array):
	var lane := attacker_slot.lane
	if not defender_slots[lane].is_empty():
		return defender_slots[lane]
	if not defender_slots[lane + 3].is_empty():
		return defender_slots[lane + 3]
	return null


## バトルフェーズ全体を解決。ON_ATTACK/DEFENSE/DEATH 効果も適用。
func _resolve_battle(dice_val: int, p_slots: Array, o_slots: Array,
		is_player_turn: bool, state: Dictionary) -> void:
	var turn_slots := p_slots if is_player_turn else o_slots
	var def_slots := o_slots if is_player_turn else p_slots
	var attacker_is_player := is_player_turn

	# ターンプレイヤー側の攻撃
	if not BattleUtils.is_dice_blocked(dice_val, attacker_is_player, _make_context(p_slots, o_slots, dice_val)):
		for i in range(6):
			var attacker_slot: SimSlot = turn_slots[i]
			if attacker_slot.is_empty():
				continue
			var attacker: SimCard = attacker_slot.card_ui
			if attacker.current_hp <= 0:
				continue
			var effective_dice := BattleUtils.get_effective_attack_dice(
				attacker, attacker_is_player, _make_context(p_slots, o_slots, dice_val))
			if dice_val not in effective_dice:
				continue

			var target_slot = _find_target_slot(attacker_slot, def_slots)
			var target: SimCard = target_slot.card_ui if target_slot else null

			var ctx := _make_context(p_slots, o_slots, dice_val)
			var atk_result: Dictionary = EffectManager.process_timing_event(
				EffectManager.Timing.ON_ATTACK,
				{"attacker_ui": attacker, "defender_ui": target,
					"is_player": attacker_is_player, "context": ctx})

			var damage := attacker.current_atk
			damage += EffectManager.get_constant_atk_modifier(attacker, attacker_is_player, ctx)
			if atk_result.has("atk_bonus"):
				damage += atk_result["atk_bonus"]

			if target_slot == null:
				# 直接ダメージ
				if attacker_is_player:
					state["hp_o"] -= damage
				else:
					state["hp_p"] -= damage
			elif atk_result.get("instant_kill", false):
				target.current_hp = 0
			else:
				var def_result: Dictionary = EffectManager.process_timing_event(
					EffectManager.Timing.ON_DEFENSE,
					{"defender_ui": target, "damage": damage,
						"is_player": not attacker_is_player, "context": ctx})
				var final_damage: int = def_result.get("final_damage", damage)
				var reduction := EffectManager.get_damage_reduction_for_card(
					target, not attacker_is_player, ctx)
				final_damage = maxi(0, final_damage - reduction)
				target.current_hp -= final_damage

				if atk_result.get("lifesteal", false) and final_damage > 0:
					attacker.current_hp += final_damage

				if def_result.get("reflect", false) and final_damage > 0:
					var refl_reduction := EffectManager.get_damage_reduction_for_card(
						attacker, attacker_is_player, ctx)
					var reflected := maxi(0, final_damage - refl_reduction)
					if reflected > 0:
						attacker.current_hp -= reflected
						if attacker.current_hp <= 0:
							attacker_slot.remove_card()

			if target and target_slot and target.current_hp <= 0:
				_destroy_sim_cards([target], p_slots, o_slots, state)

	# 防御側の反撃
	if not BattleUtils.is_dice_blocked(dice_val, not attacker_is_player, _make_context(p_slots, o_slots, dice_val)):
		for i in range(6):
			var defender_slot: SimSlot = def_slots[i]
			if defender_slot.is_empty():
				continue
			var defender: SimCard = defender_slot.card_ui
			if defender.current_hp <= 0:
				continue
			var effective_dice := BattleUtils.get_effective_attack_dice(
				defender, not attacker_is_player, _make_context(p_slots, o_slots, dice_val))
			if dice_val not in effective_dice:
				continue

			var target_slot = _find_target_slot(defender_slot, turn_slots)
			var target: SimCard = target_slot.card_ui if target_slot else null

			var ctx := _make_context(p_slots, o_slots, dice_val)
			var atk_result: Dictionary = EffectManager.process_timing_event(
				EffectManager.Timing.ON_ATTACK,
				{"attacker_ui": defender, "defender_ui": target,
					"is_player": not attacker_is_player, "context": ctx})

			var damage := defender.current_atk
			damage += EffectManager.get_constant_atk_modifier(defender, not attacker_is_player, ctx)
			if atk_result.has("atk_bonus"):
				damage += atk_result["atk_bonus"]

			if target_slot == null:
				if attacker_is_player:
					state["hp_p"] -= damage
				else:
					state["hp_o"] -= damage
			elif atk_result.get("instant_kill", false):
				target.current_hp = 0
			else:
				var def_result: Dictionary = EffectManager.process_timing_event(
					EffectManager.Timing.ON_DEFENSE,
					{"defender_ui": target, "damage": damage,
						"is_player": attacker_is_player, "context": ctx})
				var final_damage: int = def_result.get("final_damage", damage)
				var reduction := EffectManager.get_damage_reduction_for_card(
					target, attacker_is_player, ctx)
				final_damage = maxi(0, final_damage - reduction)
				target.current_hp -= final_damage

				if atk_result.get("lifesteal", false) and final_damage > 0:
					defender.current_hp += final_damage

				if def_result.get("reflect", false) and final_damage > 0:
					var refl_reduction := EffectManager.get_damage_reduction_for_card(
						defender, not attacker_is_player, ctx)
					var reflected := maxi(0, final_damage - refl_reduction)
					if reflected > 0:
						defender.current_hp -= reflected
						if defender.current_hp <= 0:
							defender_slot.remove_card()

			if target and target_slot and target.current_hp <= 0:
				_destroy_sim_cards([target], p_slots, o_slots, state)


func _simulate_game_with_tracking(deck_p: Array, deck_o: Array) -> Dictionary:
	# SlotとStateの初期化
	var p_slots: Array = []
	var o_slots: Array = []
	for i in range(6):
		p_slots.append(SimSlot.new(i, true))
		o_slots.append(SimSlot.new(i, false))

	var hand_p := deck_p.slice(0, INITIAL_HAND_SIZE)
	var hand_o := deck_o.slice(0, INITIAL_HAND_SIZE)

	var state := {
		"hp_p": STARTING_HP, "hp_o": STARTING_HP,
		"mana_p": 0, "max_mana_p": 0,
		"mana_o": 0, "max_mana_o": 0,
		"hand_p": hand_p, "hand_o": hand_o,
		"deck_p": deck_p, "deck_o": deck_o,
		"deck_idx_p": INITIAL_HAND_SIZE, "deck_idx_o": INITIAL_HAND_SIZE,
		"cards_played_p": {},
		"cards_played_o": {}
	}

	var is_player_turn := true
	var player_turns_taken := 0
	var opponent_turns_taken := 0
	var turn_count := 0

	while turn_count < MAX_TURNS:
		turn_count += 1
		var current_dice := 0

		# ── ターン開始: マナ更新 ──────────────────────────
		if is_player_turn:
			state["max_mana_p"] = mini(state["max_mana_p"] + 1, MAX_MANA_CAP)
			state["mana_p"] = state["max_mana_p"]
		else:
			state["max_mana_o"] = mini(state["max_mana_o"] + 1, MAX_MANA_CAP)
			state["mana_o"] = state["max_mana_o"]
			if opponent_turns_taken == 0:
				state["mana_o"] += 1

		# ── ターン開始効果 ─────────────────────────────────
		var ctx_start := _make_context(p_slots, o_slots, 0)
		var start_results: Array = EffectManager.process_timing_event(
			EffectManager.Timing.TURN_START,
			{"is_player": is_player_turn, "context": ctx_start})
		for res in start_results:
			_apply_sim_effect(res, is_player_turn, state, p_slots, o_slots)

		# ── Main Phase 1 ───────────────────────────────────
		_ai_summon_tracking(is_player_turn, p_slots, o_slots, state)

		# ── 先行1ターン目: Dice+Draw+M2 をスキップ ─────────
		var is_first_player_turn1 := is_player_turn and player_turns_taken == 0
		if not is_first_player_turn1:
			# ── Dice + Battle ─────────────────────────────
			current_dice = randi() % 6 + 1
			_resolve_battle(current_dice, p_slots, o_slots, is_player_turn, state)

			if state["hp_p"] <= 0 and state["hp_o"] <= 0:
				return {"winner": "draw", "turns": turn_count,
					"played_p": state["cards_played_p"], "played_o": state["cards_played_o"],
					"deck_p": deck_p, "deck_o": deck_o}
			elif state["hp_o"] <= 0:
				return {"winner": "p", "turns": turn_count,
					"played_p": state["cards_played_p"], "played_o": state["cards_played_o"],
					"deck_p": deck_p, "deck_o": deck_o}
			elif state["hp_p"] <= 0:
				return {"winner": "o", "turns": turn_count,
					"played_p": state["cards_played_p"], "played_o": state["cards_played_o"],
					"deck_p": deck_p, "deck_o": deck_o}

			# ── Draw + マナ回復 ───────────────────────────
			if is_player_turn:
				if state["deck_idx_p"] < deck_p.size():
					state["hand_p"].append(deck_p[state["deck_idx_p"]])
					state["deck_idx_p"] += 1
				state["mana_p"] = mini(state["mana_p"] + 1, state["max_mana_p"])
			else:
				if state["deck_idx_o"] < deck_o.size():
					state["hand_o"].append(deck_o[state["deck_idx_o"]])
					state["deck_idx_o"] += 1
				state["mana_o"] = mini(state["mana_o"] + 1, state["max_mana_o"])

			# ── Main Phase 2 ──────────────────────────────
			_ai_summon_tracking(is_player_turn, p_slots, o_slots, state)

		# ── ターン終了効果 ─────────────────────────────────
		var ctx_end := _make_context(p_slots, o_slots, current_dice)
		var end_results: Array = EffectManager.process_timing_event(
			EffectManager.Timing.TURN_END,
			{"is_player": is_player_turn, "context": ctx_end})
		for res in end_results:
			_apply_sim_effect(res, is_player_turn, state, p_slots, o_slots)

		# 勝敗再確認（TURN_END効果でHPが変化した場合）
		if state["hp_p"] <= 0 and state["hp_o"] <= 0:
			return {"winner": "draw", "turns": turn_count,
				"played_p": state["cards_played_p"], "played_o": state["cards_played_o"],
				"deck_p": deck_p, "deck_o": deck_o}
		elif state["hp_o"] <= 0:
			return {"winner": "p", "turns": turn_count,
				"played_p": state["cards_played_p"], "played_o": state["cards_played_o"],
				"deck_p": deck_p, "deck_o": deck_o}
		elif state["hp_p"] <= 0:
			return {"winner": "o", "turns": turn_count,
				"played_p": state["cards_played_p"], "played_o": state["cards_played_o"],
				"deck_p": deck_p, "deck_o": deck_o}

		if is_player_turn:
			player_turns_taken += 1
		else:
			opponent_turns_taken += 1
		is_player_turn = not is_player_turn

	return {"winner": "draw", "turns": MAX_TURNS,
		"played_p": state["cards_played_p"], "played_o": state["cards_played_o"],
		"deck_p": deck_p, "deck_o": deck_o}


func _record_game_result(result: Dictionary) -> void:
	"""ゲーム結果をカード単位統計に記録"""
	var p_won: bool = result["winner"] == "p"
	var o_won: bool = result["winner"] == "o"

	# デッキ内カード（採用時勝率）
	for card in result["deck_p"]:
		_card_in_deck_games[card.id] += 1
		if p_won:
			_card_in_deck_wins[card.id] += 1

	for card in result["deck_o"]:
		_card_in_deck_games[card.id] += 1
		if o_won:
			_card_in_deck_wins[card.id] += 1

	# プレイされたカード（出場時勝率）
	for card_id in result["played_p"]:
		_card_played_games[card_id] += 1
		if p_won:
			_card_played_wins[card_id] += 1

	for card_id in result["played_o"]:
		_card_played_games[card_id] += 1
		if o_won:
			_card_played_wins[card_id] += 1


func _run_full_simulation() -> void:
	"""全色ペアでシミュレーション実行"""
	var colors := [
		CardData.ColorType.BLUE,
		CardData.ColorType.GREEN,
		CardData.ColorType.BLACK,
		CardData.ColorType.RED,
		CardData.ColorType.YELLOW,
		CardData.ColorType.PURPLE,
		CardData.ColorType.WHITE,
	]

	for i in range(colors.size()):
		for j in range(i + 1, colors.size()):
			for _g in range(GAMES_PER_MATCHUP):
				var deck_a := _make_mono_deck(colors[i])
				var deck_b := _make_mono_deck(colors[j])

				# Aが先攻
				var result1 := _simulate_game_with_tracking(deck_a.duplicate(true), deck_b.duplicate(true))
				_record_game_result(result1)

				# Aが後攻
				var result2 := _simulate_game_with_tracking(deck_b.duplicate(true), deck_a.duplicate(true))
				_record_game_result(result2)


func _get_card_name(card_id: int) -> String:
	for card in CardDatabase.card_pool:
		if card.id == card_id:
			return card.card_name
	return "Unknown"


func _get_card_color(card_id: int) -> String:
	var color_names := {
		CardData.ColorType.GRAY: "GRAY",
		CardData.ColorType.BLUE: "BLUE",
		CardData.ColorType.GREEN: "GREEN",
		CardData.ColorType.BLACK: "BLACK",
		CardData.ColorType.RED: "RED",
		CardData.ColorType.YELLOW: "YELLOW",
		CardData.ColorType.PURPLE: "PURPLE",
		CardData.ColorType.WHITE: "WHITE",
	}
	for card in CardDatabase.card_pool:
		if card.id == card_id:
			return color_names.get(card.color_type, "?")
	return "?"


# ═══════════════════════════════════════════════
# テストケース
# ═══════════════════════════════════════════════

func test_card_level_balance_report():
	"""カード単位バランスレポートを生成"""
	_reset_card_stats()
	_run_full_simulation()

	gut.p("═══════════════════════════════════════════")
	gut.p("カード単位バランス計測結果")
	gut.p("各マッチアップ %d ゲーム × 21ペア × 2（先後）" % GAMES_PER_MATCHUP)
	gut.p("═══════════════════════════════════════════")

	# 出場時勝率を計算
	var played_winrates: Array = []
	for card_id in _card_played_games:
		var games: int = _card_played_games[card_id]
		if games > 0:
			var wins: int = _card_played_wins[card_id]
			var wr: float = float(wins) / games * 100
			played_winrates.append({
				"id": card_id,
				"name": _get_card_name(card_id),
				"color": _get_card_color(card_id),
				"winrate": wr,
				"games": games
			})

	# 勝率でソート
	played_winrates.sort_custom(func(a, b): return a["winrate"] > b["winrate"])

	# 統計計算
	var wr_values: Array[float] = []
	for entry in played_winrates:
		if entry["games"] >= 10:  # 十分なサンプルがあるもののみ
			wr_values.append(entry["winrate"])

	if wr_values.size() == 0:
		gut.p("データ不足")
		assert_true(true)
		return

	wr_values.sort()
	var median: float = wr_values[wr_values.size() / 2]
	var min_wr: float = wr_values[0]
	var max_wr: float = wr_values[wr_values.size() - 1]

	gut.p("")
	gut.p("═══════════════════════════════════════════")
	gut.p("出場時勝率 統計")
	gut.p("═══════════════════════════════════════════")
	gut.p("中央値: %.1f%%" % median)
	gut.p("最小: %.1f%% / 最大: %.1f%%" % [min_wr, max_wr])
	var low_target: float = median - 7.0
	var high_target: float = median + 7.0
	gut.p("目標: 中央値±7%%以内 (%.1f%% ~ %.1f%%)" % [low_target, high_target])

	# 外れ値カード
	var outliers_high: Array = []
	var outliers_low: Array = []

	for entry in played_winrates:
		if entry["games"] >= 10:
			if entry["winrate"] > median + 7:
				outliers_high.append(entry)
			elif entry["winrate"] < median - 7:
				outliers_low.append(entry)

	gut.p("")
	gut.p("═══════════════════════════════════════════")
	gut.p("外れ値カード（中央値±7%超）")
	gut.p("═══════════════════════════════════════════")

	gut.p("")
	gut.p("【高勝率 TOP10】")
	var count := 0
	for entry in outliers_high:
		if count >= 10:
			break
		gut.p("  %s [%s] ID:%d - %.1f%% (%d games)" % [entry["name"], entry["color"], entry["id"], entry["winrate"], entry["games"]])
		count += 1
	if outliers_high.size() == 0:
		gut.p("  (なし)")

	gut.p("")
	gut.p("【低勝率 BOTTOM10】")
	var low_sorted := outliers_low.duplicate()
	low_sorted.sort_custom(func(a, b): return a["winrate"] < b["winrate"])
	count = 0
	for entry in low_sorted:
		if count >= 10:
			break
		gut.p("  %s [%s] ID:%d - %.1f%% (%d games)" % [entry["name"], entry["color"], entry["id"], entry["winrate"], entry["games"]])
		count += 1
	if outliers_low.size() == 0:
		gut.p("  (なし)")

	# 外れ値率
	var outlier_count := outliers_high.size() + outliers_low.size()
	var total_cards := wr_values.size()
	var outlier_rate := float(outlier_count) / total_cards * 100

	gut.p("")
	gut.p("═══════════════════════════════════════════")
	gut.p("バランス判定")
	gut.p("═══════════════════════════════════════════")
	gut.p("外れ値カード: %d / %d (%.1f%%)" % [outlier_count, total_cards, outlier_rate])

	if outlier_rate <= 10:
		gut.p("✓ カードバランス: 良好（外れ値%.1f%% <= 10%%）" % outlier_rate)
	else:
		gut.p("✗ カードバランス: 要調整（外れ値%.1f%% > 10%%）" % outlier_rate)

	# 全カードリスト出力（デバッグ用）
	gut.p("")
	gut.p("═══════════════════════════════════════════")
	gut.p("全カード出場時勝率（勝率順）")
	gut.p("═══════════════════════════════════════════")
	for entry in played_winrates:
		if entry["games"] >= 10:
			var mark := ""
			if entry["winrate"] > median + 7:
				mark = " ▲"
			elif entry["winrate"] < median - 7:
				mark = " ▼"
			gut.p("ID:%3d [%6s] %s: %.1f%% (%d)%s" % [entry["id"], entry["color"], entry["name"], entry["winrate"], entry["games"], mark])

	assert_true(true, "Card level balance report completed")
