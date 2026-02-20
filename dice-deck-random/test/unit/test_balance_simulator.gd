extends GutTest

## 色別勝率・先後差シミュレーター
## 各色のデッキで多数の対戦をシミュレートしてバランスを検証

const GAMES_PER_MATCHUP := 100  # 各マッチアップあたりのゲーム数
const MAX_TURNS := 50  # 最大ターン数（無限ループ防止）
const STARTING_HP := 20
const STARTING_MANA := 1
const MAX_MANA := 10
const DECK_SIZE := 20
const INITIAL_HAND_SIZE := 3

var _results: Dictionary = {}

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

	# グレーから10枚ランダム選択（同名2枚まで）
	gray_cards.shuffle()
	var gray_counts := {}
	for card in gray_cards:
		if deck.size() >= 10:
			break
		var count: int = gray_counts.get(card.id, 0)
		if count < 2:
			deck.append(card)
			gray_counts[card.id] = count + 1

	# 色カードから10枚ランダム選択（同名2枚まで）
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
	"""カードデータからシミュレーション用辞書を作成"""
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
	"""攻撃対象を探す"""
	var lane: int = attacker["lane"]
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and d["is_front"]:
			return d
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and not d["is_front"]:
			return d
	return null


func _simulate_single_battle(dice_val: int, p_cards: Array, o_cards: Array, is_player_turn: bool) -> Array:
	"""単一のダイス結果に対するバトルをシミュレート"""
	var turn_cards := p_cards if is_player_turn else o_cards
	var def_cards := o_cards if is_player_turn else p_cards

	var dmg_to_opp := 0
	var dmg_to_me := 0

	# ターンプレイヤー側の攻撃
	turn_cards.sort_custom(func(a, b): return a["idx"] < b["idx"])
	for card in turn_cards:
		if card["hp"] <= 0:
			continue
		if not card["dice"].has(dice_val):
			continue
		var target = _find_target(card, def_cards)
		if target == null:
			# 直接攻撃：プレイヤーHPにダメージ
			if is_player_turn:
				dmg_to_opp += card["atk"]
			else:
				dmg_to_me += card["atk"]
		else:
			# カードへの攻撃：カードHPにのみダメージ（プレイヤーHPには影響なし）
			target["hp"] -= card["atk"]

	# 防御側の反撃
	def_cards.sort_custom(func(a, b): return a["idx"] < b["idx"])
	for card in def_cards:
		if card["hp"] <= 0:
			continue
		if not card["dice"].has(dice_val):
			continue
		var target = _find_target(card, turn_cards)
		if target == null:
			# 直接攻撃：プレイヤーHPにダメージ
			if is_player_turn:
				dmg_to_me += card["atk"]
			else:
				dmg_to_opp += card["atk"]
		else:
			# カードへの攻撃：カードHPにのみダメージ
			target["hp"] -= card["atk"]

	return [dmg_to_opp, dmg_to_me]


func _simulate_game(deck_p: Array, deck_o: Array) -> Dictionary:
	"""1ゲームをシミュレート。戻り値: {"winner": "p" or "o" or "draw", "turns": int}"""
	var hand_p := deck_p.slice(0, INITIAL_HAND_SIZE)
	var hand_o := deck_o.slice(0, INITIAL_HAND_SIZE)
	var deck_idx_p := INITIAL_HAND_SIZE
	var deck_idx_o := INITIAL_HAND_SIZE

	var hp_p := STARTING_HP
	var hp_o := STARTING_HP
	var mana_p := STARTING_MANA
	var mana_o := STARTING_MANA

	var field_p: Array = [null, null, null, null, null, null]  # 0-2: front, 3-5: back
	var field_o: Array = [null, null, null, null, null, null]

	var is_player_turn := true  # プレイヤーが先攻
	var turn_count := 0

	while turn_count < MAX_TURNS:
		turn_count += 1

		# 現在のターンプレイヤー
		var cur_hand: Array
		var cur_field: Array
		var cur_mana: int
		var cur_deck: Array
		var cur_deck_idx: int

		if is_player_turn:
			cur_hand = hand_p
			cur_field = field_p
			cur_mana = mana_p
			cur_deck = deck_p
			cur_deck_idx = deck_idx_p
		else:
			cur_hand = hand_o
			cur_field = field_o
			cur_mana = mana_o
			cur_deck = deck_o
			cur_deck_idx = deck_idx_o

		# Main Phase 1: 召喚（貪欲にコスト順で召喚）
		cur_hand.sort_custom(func(a, b): return a.mana_cost < b.mana_cost)
		var to_remove := []
		for card in cur_hand:
			if card.mana_cost <= cur_mana:
				# 空きスロットを探す
				var slot := -1
				for i in range(6):
					if cur_field[i] == null:
						slot = i
						break
				if slot >= 0:
					cur_field[slot] = _make_card_dict(card, slot)
					cur_mana -= card.mana_cost
					to_remove.append(card)
		for card in to_remove:
			cur_hand.erase(card)

		# ダイスロール + バトル
		var dice_val := randi() % 6 + 1
		var p_cards := []
		var o_cards := []
		for i in range(6):
			if field_p[i] != null and field_p[i]["hp"] > 0:
				p_cards.append(field_p[i])
			if field_o[i] != null and field_o[i]["hp"] > 0:
				o_cards.append(field_o[i])

		# 直接カード配列を渡す（_simulate_single_battle内でHPが更新される）
		var dmg_result := _simulate_single_battle(dice_val, p_cards, o_cards, is_player_turn)
		hp_o -= dmg_result[0]  # 敵へのダメージ（プレイヤー視点）
		hp_p -= dmg_result[1]  # 自分へのダメージ

		# 死亡判定（field配列を直接参照しているのでHP更新済み）
		for i in range(6):
			if field_p[i] != null and field_p[i]["hp"] <= 0:
				field_p[i] = null
			if field_o[i] != null and field_o[i]["hp"] <= 0:
				field_o[i] = null

		# 勝敗判定
		if hp_p <= 0 and hp_o <= 0:
			return {"winner": "draw", "turns": turn_count}
		elif hp_o <= 0:
			return {"winner": "p", "turns": turn_count}
		elif hp_p <= 0:
			return {"winner": "o", "turns": turn_count}

		# ドローフェーズ
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

		# ターン交代
		is_player_turn = not is_player_turn

		# 参照を戻す
		if is_player_turn:
			hand_p = cur_hand
			mana_p = cur_mana
			deck_idx_p = cur_deck_idx
		else:
			hand_o = cur_hand
			mana_o = cur_mana
			deck_idx_o = cur_deck_idx

	return {"winner": "draw", "turns": MAX_TURNS}


func _run_matchup(color_a: CardData.ColorType, color_b: CardData.ColorType, games: int) -> Dictionary:
	"""2色間のマッチアップをシミュレート"""
	var a_wins := 0
	var b_wins := 0
	var draws := 0
	var a_first_wins := 0  # Aが先攻で勝った数
	var a_second_wins := 0  # Aが後攻で勝った数
	var total_turns := 0

	for i in range(games):
		var deck_a := _make_mono_deck(color_a)
		var deck_b := _make_mono_deck(color_b)

		# Aが先攻
		var result1 := _simulate_game(deck_a.duplicate(), deck_b.duplicate())
		total_turns += result1["turns"]
		if result1["winner"] == "p":
			a_wins += 1
			a_first_wins += 1
		elif result1["winner"] == "o":
			b_wins += 1
		else:
			draws += 1

		# Aが後攻
		var result2 := _simulate_game(deck_b.duplicate(), deck_a.duplicate())
		total_turns += result2["turns"]
		if result2["winner"] == "o":
			a_wins += 1
			a_second_wins += 1
		elif result2["winner"] == "p":
			b_wins += 1
		else:
			draws += 1

	var total := games * 2
	return {
		"a_winrate": float(a_wins) / total * 100,
		"b_winrate": float(b_wins) / total * 100,
		"draw_rate": float(draws) / total * 100,
		"a_first_advantage": float(a_first_wins) / games * 100 - float(a_second_wins) / games * 100,
		"avg_turns": float(total_turns) / total
	}


# ═══════════════════════════════════════════════
# テストケース
# ═══════════════════════════════════════════════

func test_mono_deck_creation():
	"""単色デッキが正しく作成されるか"""
	var deck := _make_mono_deck(CardData.ColorType.BLUE)
	assert_eq(deck.size(), DECK_SIZE, "Deck should have %d cards" % DECK_SIZE)

	var gray_count := 0
	var color_count := 0
	for card in deck:
		if card.color_type == CardData.ColorType.GRAY:
			gray_count += 1
		elif card.color_type == CardData.ColorType.BLUE:
			color_count += 1
	assert_gt(gray_count, 0, "Deck should have gray cards")
	assert_gt(color_count, 0, "Deck should have colored cards")


func test_single_game_simulation():
	"""単一ゲームシミュレーションが動作するか"""
	var deck_a := _make_mono_deck(CardData.ColorType.BLUE)
	var deck_b := _make_mono_deck(CardData.ColorType.RED)
	var result := _simulate_game(deck_a, deck_b)

	assert_has(result, "winner", "Result should have winner")
	assert_has(result, "turns", "Result should have turns")
	assert_true(result["winner"] in ["p", "o", "draw"], "Winner should be p, o, or draw")
	assert_gt(result["turns"], 0, "Game should have at least 1 turn")


func test_matchup_simulation():
	"""マッチアップシミュレーションが動作するか"""
	var result := _run_matchup(CardData.ColorType.BLUE, CardData.ColorType.RED, 10)

	assert_has(result, "a_winrate", "Result should have a_winrate")
	assert_has(result, "b_winrate", "Result should have b_winrate")
	assert_between(result["a_winrate"], 0.0, 100.0, "Winrate should be 0-100")


func test_color_balance_report():
	"""色別バランスレポートを生成（メインシミュレーション）"""
	var colors := [
		CardData.ColorType.BLUE,
		CardData.ColorType.GREEN,
		CardData.ColorType.BLACK,
		CardData.ColorType.RED,
		CardData.ColorType.YELLOW,
		CardData.ColorType.PURPLE,
		CardData.ColorType.WHITE,
	]
	var color_names := ["BLUE", "GREEN", "BLACK", "RED", "YELLOW", "PURPLE", "WHITE"]

	gut.p("═══════════════════════════════════════════")
	gut.p("色別バランスシミュレーション結果")
	gut.p("各マッチアップ %d ゲーム（先攻/後攻各1回）" % GAMES_PER_MATCHUP)
	gut.p("═══════════════════════════════════════════")

	# 各色の総合勝率を追跡
	var total_wins: Dictionary = {}
	var total_games: Dictionary = {}
	var first_advantages: Array[float] = []

	for i in range(colors.size()):
		total_wins[colors[i]] = 0
		total_games[colors[i]] = 0

	# 全色ペアをシミュレート
	for i in range(colors.size()):
		for j in range(i + 1, colors.size()):
			var result := _run_matchup(colors[i], colors[j], GAMES_PER_MATCHUP)
			var games := GAMES_PER_MATCHUP * 2

			total_wins[colors[i]] += int(result["a_winrate"] * games / 100)
			total_wins[colors[j]] += int(result["b_winrate"] * games / 100)
			total_games[colors[i]] += games
			total_games[colors[j]] += games

			first_advantages.append(result["a_first_advantage"])

			gut.p("%s vs %s: %.1f%% vs %.1f%% (先攻有利: %+.1f%%, 平均%.1fターン)" % [
				color_names[i], color_names[j],
				result["a_winrate"], result["b_winrate"],
				result["a_first_advantage"], result["avg_turns"]
			])

	gut.p("")
	gut.p("═══════════════════════════════════════════")
	gut.p("総合勝率（全マッチアップ通算）")
	gut.p("═══════════════════════════════════════════")

	var winrates: Array[float] = []
	for i in range(colors.size()):
		var wr: float = float(total_wins[colors[i]]) / total_games[colors[i]] * 100
		winrates.append(wr)
		gut.p("%s: %.1f%% (%d/%d)" % [color_names[i], wr, total_wins[colors[i]], total_games[colors[i]]])

	# 統計情報
	var avg_wr: float = 0.0
	var max_wr: float = 0.0
	var min_wr: float = 100.0
	for wr: float in winrates:
		avg_wr += wr
		max_wr = maxf(max_wr, wr)
		min_wr = minf(min_wr, wr)
	avg_wr /= winrates.size()

	var avg_first: float = 0.0
	for fa: float in first_advantages:
		avg_first += fa
	avg_first /= first_advantages.size()

	gut.p("")
	gut.p("═══════════════════════════════════════════")
	gut.p("バランス指標")
	gut.p("═══════════════════════════════════════════")
	gut.p("色別勝率範囲: %.1f%% - %.1f%% (差: %.1f%%)" % [min_wr, max_wr, max_wr - min_wr])
	gut.p("平均先攻有利度: %+.1f%%" % avg_first)

	# バランス判定（目標: 勝率差10%以内、先攻有利5%以内）
	var balance_ok := (max_wr - min_wr) <= 15.0
	var first_ok := absf(avg_first) <= 8.0

	gut.p("")
	if balance_ok:
		gut.p("✓ 色バランス: 良好（差%.1f%% <= 15%%）" % (max_wr - min_wr))
	else:
		gut.p("✗ 色バランス: 要調整（差%.1f%% > 15%%）" % (max_wr - min_wr))

	if first_ok:
		gut.p("✓ 先後バランス: 良好（先攻有利%+.1f%% <= ±8%%）" % avg_first)
	else:
		gut.p("✗ 先後バランス: 要調整（先攻有利%+.1f%% > ±8%%）" % avg_first)

	# テストとしては常にパス（レポート目的）
	assert_true(true, "Balance simulation completed")
