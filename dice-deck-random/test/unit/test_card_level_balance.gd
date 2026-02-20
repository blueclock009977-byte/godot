extends GutTest

## カード単位バランス計測シミュレーター
## 各カードの出場時勝率・採用時勝率を測定

const GAMES_PER_MATCHUP := 100  # 各マッチアップあたりのゲーム数（Phase24: 乱数揺れ低減のため増加）
const MAX_TURNS := 50
const STARTING_HP := 20
const STARTING_MANA := 1
const SECOND_PLAYER_FIRST_TURN_TEMP_MANA_BONUS := 1
const MAX_MANA := 10
const DECK_SIZE := 20
const INITIAL_HAND_SIZE := 3

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


func _make_card_dict(card: CardData, slot_idx: int) -> Dictionary:
	return {
		"card": card,
		"atk": card.atk,
		"hp": card.hp,
		"lane": slot_idx % 3,
		"is_front": slot_idx < 3,
		"dice": card.attack_dice.duplicate(),
		"idx": slot_idx
	}


func _find_target(attacker: Dictionary, defenders: Array) -> Variant:
	var lane: int = attacker["lane"]
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and d["is_front"]:
			return d
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and not d["is_front"]:
			return d
	return null


func _simulate_single_battle(dice_val: int, p_cards: Array, o_cards: Array, is_player_turn: bool) -> Array:
	var turn_cards := p_cards if is_player_turn else o_cards
	var def_cards := o_cards if is_player_turn else p_cards

	var dmg_to_opp := 0
	var dmg_to_me := 0

	turn_cards.sort_custom(func(a, b): return a["idx"] < b["idx"])
	for card in turn_cards:
		if card["hp"] <= 0:
			continue
		if not card["dice"].has(dice_val):
			continue
		var target = _find_target(card, def_cards)
		if target == null:
			if is_player_turn:
				dmg_to_opp += card["atk"]
			else:
				dmg_to_me += card["atk"]
		else:
			target["hp"] -= card["atk"]

	def_cards.sort_custom(func(a, b): return a["idx"] < b["idx"])
	for card in def_cards:
		if card["hp"] <= 0:
			continue
		if not card["dice"].has(dice_val):
			continue
		var target = _find_target(card, turn_cards)
		if target == null:
			if is_player_turn:
				dmg_to_me += card["atk"]
			else:
				dmg_to_opp += card["atk"]
		else:
			target["hp"] -= card["atk"]

	return [dmg_to_opp, dmg_to_me]


func _simulate_game_with_tracking(deck_p: Array, deck_o: Array) -> Dictionary:
	"""カード単位追跡付きゲームシミュレーション"""
	var hand_p := deck_p.slice(0, INITIAL_HAND_SIZE)
	var hand_o := deck_o.slice(0, INITIAL_HAND_SIZE)
	var deck_idx_p := INITIAL_HAND_SIZE
	var deck_idx_o := INITIAL_HAND_SIZE

	var hp_p := STARTING_HP
	var hp_o := STARTING_HP
	var mana_p := STARTING_MANA
	var mana_o := STARTING_MANA

	var field_p: Array = [null, null, null, null, null, null]
	var field_o: Array = [null, null, null, null, null, null]

	# カード追跡用
	var cards_played_p: Dictionary = {}  # card_id -> true
	var cards_played_o: Dictionary = {}

	var opponent_turns_taken := 0
	var is_player_turn := true
	var turn_count := 0

	while turn_count < MAX_TURNS:
		turn_count += 1

		if is_player_turn:
			hand_p.sort_custom(func(a, b): return a.mana_cost < b.mana_cost)
			var to_remove := []
			for card in hand_p:
				if card.mana_cost <= mana_p:
					var slot := -1
					for i in range(6):
						if field_p[i] == null:
							slot = i
							break
					if slot >= 0:
						field_p[slot] = _make_card_dict(card, slot)
						mana_p -= card.mana_cost
						to_remove.append(card)
						cards_played_p[card.id] = true
			for card in to_remove:
				hand_p.erase(card)
		else:
			hand_o.sort_custom(func(a, b): return a.mana_cost < b.mana_cost)
			var to_remove := []
			var temp_mana_bonus := SECOND_PLAYER_FIRST_TURN_TEMP_MANA_BONUS if opponent_turns_taken == 0 else 0
			var available_mana := mana_o + temp_mana_bonus
			for card in hand_o:
				if card.mana_cost <= available_mana:
					var slot := -1
					for i in range(6):
						if field_o[i] == null:
							slot = i
							break
					if slot >= 0:
						field_o[slot] = _make_card_dict(card, slot)
						available_mana -= card.mana_cost
						to_remove.append(card)
						cards_played_o[card.id] = true
			for card in to_remove:
				hand_o.erase(card)
			mana_o = mini(mana_o, available_mana)

		var dice_val := randi() % 6 + 1
		var p_cards := []
		var o_cards := []
		for i in range(6):
			if field_p[i] != null and field_p[i]["hp"] > 0:
				p_cards.append(field_p[i])
			if field_o[i] != null and field_o[i]["hp"] > 0:
				o_cards.append(field_o[i])

		var dmg_result := _simulate_single_battle(dice_val, p_cards, o_cards, is_player_turn)
		hp_o -= dmg_result[0]
		hp_p -= dmg_result[1]

		for i in range(6):
			if field_p[i] != null and field_p[i]["hp"] <= 0:
				field_p[i] = null
			if field_o[i] != null and field_o[i]["hp"] <= 0:
				field_o[i] = null

		if hp_p <= 0 and hp_o <= 0:
			return {"winner": "draw", "turns": turn_count, "played_p": cards_played_p, "played_o": cards_played_o, "deck_p": deck_p, "deck_o": deck_o}
		elif hp_o <= 0:
			return {"winner": "p", "turns": turn_count, "played_p": cards_played_p, "played_o": cards_played_o, "deck_p": deck_p, "deck_o": deck_o}
		elif hp_p <= 0:
			return {"winner": "o", "turns": turn_count, "played_p": cards_played_p, "played_o": cards_played_o, "deck_p": deck_p, "deck_o": deck_o}

		if is_player_turn:
			if deck_idx_p < deck_p.size():
				hand_p.append(deck_p[deck_idx_p])
				deck_idx_p += 1
			mana_p = mini(mana_p + 1, MAX_MANA)
		else:
			if deck_idx_o < deck_o.size():
				hand_o.append(deck_o[deck_idx_o])
				deck_idx_o += 1
			mana_o = mini(mana_o + 1, MAX_MANA)

		if not is_player_turn:
			opponent_turns_taken += 1

		is_player_turn = not is_player_turn

	return {"winner": "draw", "turns": MAX_TURNS, "played_p": cards_played_p, "played_o": cards_played_o, "deck_p": deck_p, "deck_o": deck_o}


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
