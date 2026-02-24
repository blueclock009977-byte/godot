# Simulation Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `test_balance_simulator.gd` と `test_card_level_balance.gd` を実際のバトルルールと一致させる。

**Architecture:** SimCard/SimSlot モッククラスを各テストファイル内に定義し、EffectManager をそのまま利用する。EffectManager はダックタイピングで動作し、アニメ・ノード系の呼び出しがないため SimCard で直接呼べる。

**Tech Stack:** GDScript 4, GUT 9.5.0, EffectManager (autoload), BattleUtils (class_name)

---

## 修正する差異

| 差異 | 旧 | 新 |
|------|----|----|
| フェーズ | M1→Dice→Draw | M1→Dice→Draw→M2 |
| 先行1ターン目 | Diceあり | Dice+Drawスキップ |
| マナ上限 | 10 | 5 (MAX_MANA_CAP) |
| マナ回復 | +1累積 | ターン開始で全回復 |
| 効果カード | 無視 | EffectManager直接呼ぶ |
| AI召喚 | 安い順・スロット順 | 高コスト優先・スコアリング |

---

## Task 1: SimCard/SimSlot クラスを test_balance_simulator.gd に追加

**Files:**
- Modify: `test/unit/test_balance_simulator.gd`

**Step 1: 既存定数を更新**

ファイル冒頭の定数を以下に差し替え：

```gdscript
const GAMES_PER_MATCHUP := 100
const MAX_TURNS := 50
const STARTING_HP := 20
const MAX_MANA_CAP := 5       # 実際のバトルに合わせて変更（旧: MAX_MANA = 10）
const DECK_SIZE := 20
const INITIAL_HAND_SIZE := 3  # グレー+1色=2色デッキ → 3枚
```

削除する定数（使わなくなる）：
- `STARTING_MANA`
- `SECOND_PLAYER_STARTING_MANA_BONUS`
- `SECOND_PLAYER_INITIAL_DRAW_BONUS`
- `SECOND_PLAYER_FIRST_TURN_TEMP_MANA_BONUS`
- `MAX_MANA`

**Step 2: SimCard 内部クラスを追加**

`var _results: Dictionary = {}` の直前に追加：

```gdscript
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

	func heal(amount: int) -> void:
		if amount > 0:
			current_hp += amount

	func modify_atk(amount: int) -> void:
		current_atk += amount

	func apply_status(effect, duration: int = 1) -> void:
		var s: int = int(effect)
		_status[s] = maxi(_status.get(s, 0), duration)

	func has_status(effect) -> bool:
		return _status.get(int(effect), 0) > 0

	func tick_status_effects() -> void:
		var to_remove: Array = []
		for s in _status:
			_status[s] -= 1
			if _status[s] <= 0:
				to_remove.append(s)
		for s in to_remove:
			_status.erase(s)
```

**Step 3: SimSlot 内部クラスを追加（SimCard の直後）**

```gdscript
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
```

**Step 4: テスト実行（既存テストが壊れていないか確認）**

```bash
cd /Users/masashi_shigekiyo/godot_clock/dice-deck-random
godot --headless --path . -s addons/gut/gut_cmdln.gd \
  -gtest=res://test/unit/test_balance_simulator.gd 2>&1 | tail -20
```

Expected: 既存の3テスト（mono_deck_creation, single_game_simulation, matchup_simulation）がPASS。色別レポートも出力される。

**Step 5: コミット**

```bash
git add test/unit/test_balance_simulator.gd
git commit -m "refactor(sim): SimCard/SimSlot追加・定数更新"
```

---

## Task 2: ヘルパーメソッドを test_balance_simulator.gd に追加

**Files:**
- Modify: `test/unit/test_balance_simulator.gd`

既存の `_make_card_dict`, `_find_target`, `_simulate_single_battle` はすべて削除し、以下のヘルパーメソッドに置き換える。

**Step 1: `_make_context` を追加**

```gdscript
func _make_context(p_slots: Array, o_slots: Array, dice_val: int) -> Dictionary:
	return {"player_slots": p_slots, "opponent_slots": o_slots, "current_dice": dice_val}
```

**Step 2: `_apply_sim_effect` を追加**

```gdscript
## EffectManager の結果 Dictionary をシミュ状態に適用する。
## state キー: hp_p, hp_o, mana_p, max_mana_p, mana_o, max_mana_o,
##             hand_p, hand_o, deck_p, deck_o, deck_idx_p, deck_idx_o
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

	# HP0になったカードを破壊
	var to_destroy: Array = []
	for target in result.get("damaged_targets", []):
		if target and target.current_hp <= 0:
			to_destroy.append(target)
	for target in result.get("destroy_targets", []):
		if target:
			to_destroy.append(target)
	_destroy_sim_cards(to_destroy, p_slots, o_slots, state)
```

**Step 3: `_destroy_sim_cards` を追加**

```gdscript
func _destroy_sim_cards(targets: Array, p_slots: Array, o_slots: Array, state: Dictionary) -> void:
	for target in targets:
		for slot in p_slots:
			if not slot.is_empty() and slot.card_ui == target:
				slot.remove_card()
				# ON_DEATH 効果を発動
				var ctx := _make_context(p_slots, o_slots, 0)
				var result = EffectManager.process_timing_event(
					EffectManager.Timing.ON_DEATH,
					{"card_ui": target, "is_player": true, "context": ctx}
				)
				_apply_sim_effect(result, true, state, p_slots, o_slots)
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
				break
```

**Step 4: `_tick_all_statuses` を追加**

```gdscript
func _tick_all_statuses(p_slots: Array, o_slots: Array) -> void:
	for slot in p_slots:
		if not slot.is_empty():
			slot.card_ui.tick_status_effects()
	for slot in o_slots:
		if not slot.is_empty():
			slot.card_ui.tick_status_effects()
```

**Step 5: `_ai_summon` を追加（実際のAIを移植）**

```gdscript
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
		var eid := card_data.effect_id
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
```

**Step 6: `_find_target_slot` を追加**

```gdscript
func _find_target_slot(attacker_slot: SimSlot, defender_slots: Array):
	var lane := attacker_slot.lane
	if not defender_slots[lane].is_empty():
		return defender_slots[lane]
	if not defender_slots[lane + 3].is_empty():
		return defender_slots[lane + 3]
	return null
```

**Step 7: `_resolve_battle` を追加（旧 `_simulate_single_battle` を置き換え）**

```gdscript
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
			var atk_result := EffectManager.process_timing_event(
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
				var def_result := EffectManager.process_timing_event(
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
			var atk_result := EffectManager.process_timing_event(
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
				var def_result := EffectManager.process_timing_event(
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
```

**Step 8: テスト実行**

```bash
godot --headless --path . -s addons/gut/gut_cmdln.gd \
  -gtest=res://test/unit/test_balance_simulator.gd 2>&1 | tail -20
```

Expected: PASS（この時点ではまだ旧 `_simulate_game` が動いている）

**Step 9: コミット**

```bash
git add test/unit/test_balance_simulator.gd
git commit -m "refactor(sim): ヘルパーメソッド追加（apply_effect/ai_summon/resolve_battle）"
```

---

## Task 3: `_simulate_game` を全面書き換え（test_balance_simulator.gd）

**Files:**
- Modify: `test/unit/test_balance_simulator.gd`

**Step 1: 旧 `_simulate_game` を以下に丸ごと置き換え**

```gdscript
func _simulate_game(deck_p: Array, deck_o: Array) -> Dictionary:
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
		"deck_idx_p": INITIAL_HAND_SIZE, "deck_idx_o": INITIAL_HAND_SIZE
	}

	var is_player_turn := true   # プレイヤーは常に先行（シミュ上の慣例）
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
			if opponent_turns_taken == 0:  # 後攻1ターン目ボーナス
				state["mana_o"] += 1

		# ── ターン開始効果 ─────────────────────────────────
		var ctx_start := _make_context(p_slots, o_slots, 0)
		var start_results: Array = EffectManager.process_timing_event(
			EffectManager.Timing.TURN_START,
			{"is_player": is_player_turn, "context": ctx_start})
		for res in start_results:
			_apply_sim_effect(res, is_player_turn, state, p_slots, o_slots)

		# ── Main Phase 1 ───────────────────────────────────
		_ai_summon(is_player_turn, p_slots, o_slots, state)

		# ── 先行1ターン目: Dice+Draw+M2 をスキップ ─────────
		var is_first_player_turn1 := is_player_turn and player_turns_taken == 0
		if not is_first_player_turn1:
			# ── Dice + Battle ─────────────────────────────
			current_dice = randi() % 6 + 1
			_resolve_battle(current_dice, p_slots, o_slots, is_player_turn, state)

			if state["hp_p"] <= 0 and state["hp_o"] <= 0:
				return {"winner": "draw", "turns": turn_count}
			elif state["hp_o"] <= 0:
				return {"winner": "p", "turns": turn_count}
			elif state["hp_p"] <= 0:
				return {"winner": "o", "turns": turn_count}

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
			_ai_summon(is_player_turn, p_slots, o_slots, state)

		# ── ターン終了効果 ─────────────────────────────────
		var ctx_end := _make_context(p_slots, o_slots, current_dice)
		var end_results: Array = EffectManager.process_timing_event(
			EffectManager.Timing.TURN_END,
			{"is_player": is_player_turn, "context": ctx_end})
		for res in end_results:
			_apply_sim_effect(res, is_player_turn, state, p_slots, o_slots)

		# 毒ダメージ等: TURN_END内で処理される（EffectManagerが担当）

		# ── 状態異常 tick ──────────────────────────────────
		_tick_all_statuses(p_slots, o_slots)

		# 勝敗再確認（TURN_END効果でHPが変化した場合）
		if state["hp_p"] <= 0 and state["hp_o"] <= 0:
			return {"winner": "draw", "turns": turn_count}
		elif state["hp_o"] <= 0:
			return {"winner": "p", "turns": turn_count}
		elif state["hp_p"] <= 0:
			return {"winner": "o", "turns": turn_count}

		if is_player_turn:
			player_turns_taken += 1
		else:
			opponent_turns_taken += 1
		is_player_turn = not is_player_turn

	return {"winner": "draw", "turns": MAX_TURNS}
```

**Step 2: 旧 `_run_matchup` の内部も SimSlot ベースに**

`_run_matchup` の `result1`, `result2` は `_simulate_game` を呼ぶだけなので変更不要。

**Step 3: テスト実行してレポート確認**

```bash
godot --headless --path . -s addons/gut/gut_cmdln.gd \
  -gtest=res://test/unit/test_balance_simulator.gd 2>&1 | tail -50
```

Expected:
- `test_color_balance_report` に色別勝率・外れ値が出力される
- 全テスト PASS

**Step 4: コミット**

```bash
git add test/unit/test_balance_simulator.gd
git commit -m "feat(sim): _simulate_game を実ルール準拠に全面書き換え（効果・M2・マナ修正）"
```

---

## Task 4: test_card_level_balance.gd に同じ変更を適用

**Files:**
- Modify: `test/unit/test_card_level_balance.gd`

このファイルは `test_balance_simulator.gd` と同じ構造だが、`_simulate_game_with_tracking` という名前で カード単位追跡機能が追加されている。

**Step 1: 定数更新・SimCard/SimSlot/ヘルパー追加**

Task 1・Task 2 と同じ内容を `test_card_level_balance.gd` にも適用する。
（コードは同じなのでコピー可）

**Step 2: `_simulate_game_with_tracking` を書き換え**

`_simulate_game` の書き換え（Task 3）と同じ構造で、以下の追跡ロジックを追加：

- 追跡用変数を state に含める:
  ```gdscript
  state["cards_played_p"] = {}
  state["cards_played_o"] = {}
  ```
- `_ai_summon` の代わりに追跡版 `_ai_summon_tracking` を作成。
  SimCard を place_card した後に `state["cards_played_p"][card_data.id] = true` を記録。

追跡版 AI 召喚を追加：

```gdscript
func _ai_summon_tracking(is_player: bool, p_slots: Array, o_slots: Array,
		state: Dictionary) -> void:
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
		var eid := card_data.effect_id
		if eid in ["green_007", "white_017"]:
			var bonus := 1 if eid == "green_007" else 2
			for slot in my_slots:
				if not slot.is_empty() and slot.card_ui != sim_card:
					slot.card_ui.current_hp += bonus

		var result = EffectManager.process_timing_event(
			EffectManager.Timing.ON_SUMMON,
			{"card_ui": sim_card, "is_player": is_player, "context": ctx})
		_apply_sim_effect(result, is_player, state, p_slots, o_slots)
```

`_simulate_game_with_tracking` の書き換えは Task 3 の `_simulate_game` とほぼ同じ。
`_ai_summon` の呼び出しを `_ai_summon_tracking` に変え、
最後の return で `state["cards_played_p"]` と `state["deck_p"]` をそのまま返す：

```gdscript
return {
    "winner": "p",
    "turns": turn_count,
    "played_p": state["cards_played_p"],
    "played_o": state["cards_played_o"],
    "deck_p": deck_p,
    "deck_o": deck_o
}
```

**Step 3: テスト実行**

```bash
godot --headless --path . -s addons/gut/gut_cmdln.gd \
  -gtest=res://test/unit/test_card_level_balance.gd 2>&1 | tail -50
```

Expected:
- カード単位バランスレポートが出力される
- 外れ値カード一覧が表示される
- 全テスト PASS

**Step 4: コミット**

```bash
git add test/unit/test_card_level_balance.gd
git commit -m "feat(sim): test_card_level_balance を実ルール準拠に全面書き換え"
```

---

## Task 5: 全テスト実行・最終確認

**Step 1: 全 GUT テストを実行**

```bash
godot --headless --path . -s addons/gut/gut_cmdln.gd -gexit 2>&1 | tail -30
```

Expected:
- 既存の全テスト（245件程度）PASS
- シミュレーションの新しいレポートが出力される

**Step 2: syntax check**

```bash
tools/check_syntax.sh
```

Expected: エラーなし（trailing whitespace に注意）

**Step 3: 最終コミット**

```bash
git add -u
git commit -m "test(sim): バランスシミュレーション実ルール準拠修正完了"
```

---

## 注意事項・既知の制限

1. **召喚コスト修正** (`green_006`/`purple_004`) は `_ai_summon` 内で未適用（基本コストを使用）。
   これは BattleUtils.get_effective_summon_cost が is_player=true を固定で渡すため、
   対戦シミュでは正確に計算できない。影響は軽微。

2. **`black_011` 復活効果** - ON_DEATH 効果で `result["revive"] = true` が返った場合、
   シミュ内では復活処理を実装していない（`_destroy_sim_cards` で無視される）。
   これは意図的な省略（復活後の再配置ロジックが複雑なため）。

3. **`_run_matchup` の先後交代** - `_run_matchup` は A が先攻→後攻の2ゲームを回すが、
   `_simulate_game` 内では「プレイヤー常に先行」固定のため、
   Aが後攻のゲームでは「`deck_b` がプレイヤー先行、`deck_a` が後攻」として実行される（正しい挙動）。
