extends Node

## 効果管理システム
## 効果の定義と処理を一元管理

# 効果タイミング
enum Timing { ON_SUMMON, ON_ATTACK, ON_DEATH, ON_DEFENSE, CONSTANT, TURN_START, TURN_END }

# 状態異常
enum StatusEffect { NONE, FROZEN, POISON }

# 効果定義データ
var effect_definitions: Dictionary = {}

# 参照（battleシーンから設定される）
var battle_scene = null

signal effect_triggered(effect_id: String, source_card, target)
signal log_message(message: String)

func _ready() -> void:
	_register_all_effects()

func _register_all_effects() -> void:
	# ═══════════════════════════════════════════
	# 青カード効果
	# ═══════════════════════════════════════════
	_register("blue_001", Timing.ON_SUMMON, "登場時:敵1体ATK-1")
	_register("blue_002", Timing.CONSTANT, "ダイス3,4でも攻撃可")
	_register("blue_003", Timing.ON_ATTACK, "攻撃時:対象を凍結(次ターン攻撃不可)")
	_register("blue_004", Timing.ON_SUMMON, "登場時:敵全体ATK-1")
	_register("blue_005", Timing.CONSTANT, "ダイス5,6の時ATK+2")
	_register("blue_006", Timing.ON_DEFENSE, "防御時:被ダメージ半減")
	_register("blue_007", Timing.ON_SUMMON, "登場時:敵全体ATK-2")
	_register("blue_008", Timing.ON_ATTACK, "攻撃時:対象を2ターン凍結")
	_register("blue_009", Timing.ON_DEATH, "死亡時:敵1体ATK-1")
	_register("blue_010", Timing.TURN_START, "ターン開始時:自身HP+1")
	_register("blue_011", Timing.ON_SUMMON, "登場時:次ダイス+1")
	_register("blue_012", Timing.ON_ATTACK, "攻撃時:追加で相手HP-1")
	_register("blue_013", Timing.CONSTANT, "同列の味方への被ダメ-1")
	_register("blue_014", Timing.ON_SUMMON, "登場時:カード1枚ドロー")
	_register("blue_015", Timing.CONSTANT, "敵前列のATK-1")
	_register("blue_016", Timing.CONSTANT, "敵全体のATK-1")
	_register("blue_017", Timing.ON_ATTACK, "攻撃時:HP5以下の対象を即破壊")
	_register("blue_018", Timing.ON_SUMMON, "登場時:敵全体を1ターン凍結")

	# ═══════════════════════════════════════════
	# 緑カード効果
	# ═══════════════════════════════════════════
	_register("green_001", Timing.ON_SUMMON, "登場時:マナ+1")
	_register("green_002", Timing.ON_DEATH, "死亡時:マナ+1")
	_register("green_003", Timing.TURN_START, "ターン開始時:自身HP+1")
	_register("green_004", Timing.ON_SUMMON, "登場時:マナ+2")
	_register("green_005", Timing.ON_DEATH, "死亡時:マナ+2")
	_register("green_006", Timing.CONSTANT, "味方召喚コスト-1(最低1)")
	_register("green_007", Timing.CONSTANT, "味方全体のHP+1")
	_register("green_008", Timing.ON_SUMMON, "登場時:マナ+3")
	_register("green_009", Timing.TURN_START, "ターン開始時:マナ+1")
	_register("green_010", Timing.ON_ATTACK, "攻撃時:マナ+1")
	_register("green_011", Timing.ON_SUMMON, "登場時:味方1体HP+2")
	_register("green_012", Timing.ON_DEFENSE, "被ダメージ時:マナ+1")
	_register("green_013", Timing.ON_SUMMON, "登場時:マナ全回復")
	_register("green_014", Timing.ON_DEATH, "味方死亡時:自身HP+2")
	_register("green_015", Timing.ON_SUMMON, "登場時:マナ+2,自身HP+2")
	_register("green_016", Timing.TURN_END, "ターン終了時:味方全体HP+1")
	_register("green_017", Timing.ON_SUMMON, "登場時:味方全体HP+2")

	# ═══════════════════════════════════════════
	# 黒カード効果
	# ═══════════════════════════════════════════
	_register("black_001", Timing.ON_SUMMON, "登場時:自分HP-1")
	_register("black_002", Timing.ON_DEATH, "死亡時:敵1体HP-2")
	_register("black_003", Timing.ON_SUMMON, "登場時:自分HP-2")
	_register("black_004", Timing.ON_ATTACK, "攻撃時:対象に毒(毎ターンHP-1)")
	_register("black_005", Timing.ON_SUMMON, "登場時:自分HP-3")
	_register("black_006", Timing.ON_DEATH, "死亡時:ATK2/HP2のトークン召喚")
	_register("black_007", Timing.ON_ATTACK, "攻撃時:与ダメ分自身HP回復")
	_register("black_008", Timing.ON_SUMMON, "登場時:自分HP-5")
	_register("black_009", Timing.CONSTANT, "相手のダイス6を無効化")
	_register("black_010", Timing.ON_DEATH, "死亡時:敵全体HP-1")
	_register("black_011", Timing.ON_DEATH, "死亡時:HP1で1度だけ復活")
	_register("black_012", Timing.CONSTANT, "相手のダイス1を無効化")
	_register("black_013", Timing.ON_DEATH, "死亡時:敵1体ATK-2")
	_register("black_014", Timing.ON_SUMMON, "登場時:自分HP-2,カード1枚ドロー")
	_register("black_015", Timing.ON_ATTACK, "攻撃時:自身HP-1,ATK+2")
	_register("black_016", Timing.ON_ATTACK, "攻撃時:対象の現HP半減")
	_register("black_017", Timing.ON_SUMMON, "登場時:自分HP-4")
	_register("black_018", Timing.ON_DEATH, "死亡時:敵全体HP-3")
	_register("black_019", Timing.CONSTANT, "相手のダイス1,6を無効化")

func _register(effect_id: String, timing: Timing, description: String) -> void:
	effect_definitions[effect_id] = {
		"timing": timing,
		"description": description
	}

func get_effect_description(effect_id: String) -> String:
	if effect_definitions.has(effect_id):
		return effect_definitions[effect_id]["description"]
	return ""

func get_effect_timing(effect_id: String) -> Timing:
	if effect_definitions.has(effect_id):
		return effect_definitions[effect_id]["timing"]
	return Timing.ON_SUMMON

func has_timing(effect_id: String, timing: Timing) -> bool:
	return get_effect_timing(effect_id) == timing

# ═══════════════════════════════════════════
# 効果処理
# ═══════════════════════════════════════════

## 登場時効果を処理
func process_summon_effect(card_ui, is_player: bool, context: Dictionary) -> Dictionary:
	var effect_id: String = card_ui.card_data.effect_id
	if effect_id == "":
		return {}
	if not has_timing(effect_id, Timing.ON_SUMMON):
		return {}

	var result := {}
	var card_name: String = card_ui.card_data.card_name

	match effect_id:
		"blue_001":  # 登場時:敵1体ATK-1
			var target = _get_random_enemy(is_player, context)
			if target:
				target.modify_atk(-1)
				result["log"] = "[color=cyan]%s の効果: %s のATK-1[/color]" % [card_name, target.card_data.card_name]

		"blue_004":  # 登場時:敵全体ATK-1
			var enemies = _get_all_enemies(is_player, context)
			for enemy in enemies:
				enemy.modify_atk(-1)
			if enemies.size() > 0:
				result["log"] = "[color=cyan]%s の効果: 敵全体のATK-1[/color]" % card_name

		"blue_007":  # 登場時:敵全体ATK-2
			var enemies = _get_all_enemies(is_player, context)
			for enemy in enemies:
				enemy.modify_atk(-2)
			if enemies.size() > 0:
				result["log"] = "[color=cyan]%s の効果: 敵全体のATK-2[/color]" % card_name

		"blue_011":  # 登場時:次ダイス+1
			result["dice_bonus"] = 1
			result["log"] = "[color=cyan]%s の効果: 次のダイス+1[/color]" % card_name

		"blue_014":  # 登場時:カード1枚ドロー
			result["draw"] = 1
			result["log"] = "[color=cyan]%s の効果: 1枚ドロー[/color]" % card_name

		"blue_018":  # 登場時:敵全体を1ターン凍結
			var enemies = _get_all_enemies(is_player, context)
			for enemy in enemies:
				enemy.apply_status(StatusEffect.FROZEN, 1)
			if enemies.size() > 0:
				result["log"] = "[color=cyan]%s の効果: 敵全体を凍結[/color]" % card_name

		"green_001":  # 登場時:マナ+1
			result["mana"] = 1
			result["log"] = "[color=green]%s の効果: マナ+1[/color]" % card_name

		"green_004":  # 登場時:マナ+2
			result["mana"] = 2
			result["log"] = "[color=green]%s の効果: マナ+2[/color]" % card_name

		"green_008":  # 登場時:マナ+3
			result["mana"] = 3
			result["log"] = "[color=green]%s の効果: マナ+3[/color]" % card_name

		"green_011":  # 登場時:味方1体HP+2
			var target = _get_random_ally(is_player, context)
			if target:
				target.heal(2)
				result["log"] = "[color=green]%s の効果: %s のHP+2[/color]" % [card_name, target.card_data.card_name]

		"green_013":  # 登場時:マナ全回復
			result["mana_full"] = true
			result["log"] = "[color=green]%s の効果: マナ全回復[/color]" % card_name

		"green_015":  # 登場時:マナ+2,自身HP+2
			result["mana"] = 2
			card_ui.heal(2)
			result["log"] = "[color=green]%s の効果: マナ+2, 自身HP+2[/color]" % card_name

		"green_017":  # 登場時:味方全体HP+2
			var allies = _get_all_allies(is_player, context)
			for ally in allies:
				ally.heal(2)
			result["log"] = "[color=green]%s の効果: 味方全体HP+2[/color]" % card_name

		"black_001":  # 登場時:自分HP-1
			result["self_damage"] = 1
			result["log"] = "[color=purple]%s の効果: 自分HP-1[/color]" % card_name

		"black_003":  # 登場時:自分HP-2
			result["self_damage"] = 2
			result["log"] = "[color=purple]%s の効果: 自分HP-2[/color]" % card_name

		"black_005":  # 登場時:自分HP-3
			result["self_damage"] = 3
			result["log"] = "[color=purple]%s の効果: 自分HP-3[/color]" % card_name

		"black_008":  # 登場時:自分HP-5
			result["self_damage"] = 5
			result["log"] = "[color=purple]%s の効果: 自分HP-5[/color]" % card_name

		"black_014":  # 登場時:自分HP-2,カード1枚ドロー
			result["self_damage"] = 2
			result["draw"] = 1
			result["log"] = "[color=purple]%s の効果: 自分HP-2, 1枚ドロー[/color]" % card_name

		"black_017":  # 登場時:自分HP-4
			result["self_damage"] = 4
			result["log"] = "[color=purple]%s の効果: 自分HP-4[/color]" % card_name

	if result.has("log"):
		effect_triggered.emit(effect_id, card_ui, null)

	return result

## 攻撃時効果を処理
func process_attack_effect(attacker_ui, defender_ui, is_player: bool, context: Dictionary) -> Dictionary:
	var effect_id: String = attacker_ui.card_data.effect_id
	if effect_id == "":
		return {}
	if not has_timing(effect_id, Timing.ON_ATTACK):
		return {}

	var result := {}
	var card_name: String = attacker_ui.card_data.card_name

	match effect_id:
		"blue_003":  # 攻撃時:対象を凍結
			if defender_ui:
				defender_ui.apply_status(StatusEffect.FROZEN, 1)
				result["log"] = "[color=cyan]%s の効果: %s を凍結[/color]" % [card_name, defender_ui.card_data.card_name]

		"blue_008":  # 攻撃時:対象を2ターン凍結
			if defender_ui:
				defender_ui.apply_status(StatusEffect.FROZEN, 2)
				result["log"] = "[color=cyan]%s の効果: %s を2ターン凍結[/color]" % [card_name, defender_ui.card_data.card_name]

		"blue_012":  # 攻撃時:追加で相手HP-1
			result["direct_damage"] = 1
			result["log"] = "[color=cyan]%s の効果: 相手HPに追加1ダメージ[/color]" % card_name

		"blue_017":  # 攻撃時:HP5以下の対象を即破壊
			if defender_ui and defender_ui.current_hp <= 5:
				result["instant_kill"] = true
				result["log"] = "[color=cyan]%s の効果: %s を即破壊[/color]" % [card_name, defender_ui.card_data.card_name]

		"green_010":  # 攻撃時:マナ+1
			result["mana"] = 1
			result["log"] = "[color=green]%s の効果: マナ+1[/color]" % card_name

		"black_004":  # 攻撃時:対象に毒
			if defender_ui:
				defender_ui.apply_status(StatusEffect.POISON, 99)
				result["log"] = "[color=purple]%s の効果: %s に毒付与[/color]" % [card_name, defender_ui.card_data.card_name]

		"black_007":  # 攻撃時:与ダメ分自身HP回復
			result["lifesteal"] = true
			result["log"] = "[color=purple]%s の効果: 吸血[/color]" % card_name

		"black_015":  # 攻撃時:自身HP-1,ATK+2
			attacker_ui.take_damage(1)
			result["atk_bonus"] = 2
			result["log"] = "[color=purple]%s の効果: HP-1, ATK+2[/color]" % card_name

		"black_016":  # 攻撃時:対象の現HP半減
			if defender_ui:
				var half_hp = defender_ui.current_hp / 2
				defender_ui.take_damage(half_hp)
				result["log"] = "[color=purple]%s の効果: %s のHP半減[/color]" % [card_name, defender_ui.card_data.card_name]

	return result

## 死亡時効果を処理
func process_death_effect(card_ui, is_player: bool, context: Dictionary) -> Dictionary:
	var effect_id: String = card_ui.card_data.effect_id
	if effect_id == "":
		return {}
	if not has_timing(effect_id, Timing.ON_DEATH):
		return {}

	var result := {}
	var card_name: String = card_ui.card_data.card_name

	match effect_id:
		"blue_009":  # 死亡時:敵1体ATK-1
			var target = _get_random_enemy(is_player, context)
			if target:
				target.modify_atk(-1)
				result["log"] = "[color=cyan]%s の効果: %s のATK-1[/color]" % [card_name, target.card_data.card_name]

		"green_002":  # 死亡時:マナ+1
			result["mana"] = 1
			result["log"] = "[color=green]%s の効果: マナ+1[/color]" % card_name

		"green_005":  # 死亡時:マナ+2
			result["mana"] = 2
			result["log"] = "[color=green]%s の効果: マナ+2[/color]" % card_name

		"green_014":  # 味方死亡時:自身HP+2 - これは別の味方が死んだ時に発動
			# この効果は特殊: 他の味方死亡時にトリガー
			pass

		"black_002":  # 死亡時:敵1体HP-2
			var target = _get_random_enemy(is_player, context)
			if target:
				target.take_damage(2)
				result["log"] = "[color=purple]%s の効果: %s にHP-2[/color]" % [card_name, target.card_data.card_name]

		"black_006":  # 死亡時:トークン召喚
			result["spawn_token"] = {"atk": 2, "hp": 2}
			result["log"] = "[color=purple]%s の効果: トークン召喚[/color]" % card_name

		"black_010":  # 死亡時:敵全体HP-1
			var enemies = _get_all_enemies(is_player, context)
			for enemy in enemies:
				enemy.take_damage(1)
			if enemies.size() > 0:
				result["log"] = "[color=purple]%s の効果: 敵全体HP-1[/color]" % card_name

		"black_011":  # 死亡時:HP1で1度だけ復活
			if not card_ui.has_revived:
				result["revive"] = true
				result["log"] = "[color=purple]%s の効果: HP1で復活[/color]" % card_name

		"black_013":  # 死亡時:敵1体ATK-2
			var target = _get_random_enemy(is_player, context)
			if target:
				target.modify_atk(-2)
				result["log"] = "[color=purple]%s の効果: %s のATK-2[/color]" % [card_name, target.card_data.card_name]

		"black_018":  # 死亡時:敵全体HP-3
			var enemies = _get_all_enemies(is_player, context)
			for enemy in enemies:
				enemy.take_damage(3)
			if enemies.size() > 0:
				result["log"] = "[color=purple]%s の効果: 敵全体HP-3[/color]" % card_name

	return result

## 防御時効果を処理
func process_defense_effect(defender_ui, damage: int, is_player: bool, context: Dictionary) -> Dictionary:
	var effect_id: String = defender_ui.card_data.effect_id
	if effect_id == "":
		return {"final_damage": damage}
	if not has_timing(effect_id, Timing.ON_DEFENSE):
		return {"final_damage": damage}

	var result := {"final_damage": damage}
	var card_name: String = defender_ui.card_data.card_name

	match effect_id:
		"blue_006":  # 防御時:被ダメージ半減
			result["final_damage"] = damage / 2
			result["log"] = "[color=cyan]%s の効果: ダメージ半減[/color]" % card_name

		"green_012":  # 被ダメージ時:マナ+1
			result["mana"] = 1
			result["log"] = "[color=green]%s の効果: マナ+1[/color]" % card_name

	return result

## ターン開始時効果を処理
func process_turn_start_effects(is_player: bool, context: Dictionary) -> Array:
	var results := []
	var slots: Array = context["player_slots"] if is_player else context["opponent_slots"]

	for slot in slots:
		if slot and not slot.is_empty():
			var card_ui = slot.card_ui
			var effect_id: String = card_ui.card_data.effect_id
			if effect_id == "":
				continue
			if not has_timing(effect_id, Timing.TURN_START):
				continue

			var card_name: String = card_ui.card_data.card_name
			var result := {}

			match effect_id:
				"blue_010":  # ターン開始時:自身HP+1
					card_ui.heal(1)
					result["log"] = "[color=cyan]%s の効果: 自身HP+1[/color]" % card_name

				"green_003":  # ターン開始時:自身HP+1
					card_ui.heal(1)
					result["log"] = "[color=green]%s の効果: 自身HP+1[/color]" % card_name

				"green_009":  # ターン開始時:マナ+1
					result["mana"] = 1
					result["log"] = "[color=green]%s の効果: マナ+1[/color]" % card_name

			if result.size() > 0:
				results.append(result)

	# 毒ダメージ処理
	for slot in slots:
		if slot and not slot.is_empty():
			var card_ui = slot.card_ui
			if card_ui.has_status(StatusEffect.POISON):
				card_ui.take_damage(1)
				results.append({"log": "[color=purple]%s は毒で1ダメージ[/color]" % card_ui.card_data.card_name})

	return results

## ターン終了時効果を処理
func process_turn_end_effects(is_player: bool, context: Dictionary) -> Array:
	var results := []
	var slots: Array = context["player_slots"] if is_player else context["opponent_slots"]

	for slot in slots:
		if slot and not slot.is_empty():
			var card_ui = slot.card_ui
			var effect_id: String = card_ui.card_data.effect_id
			if effect_id == "":
				continue
			if not has_timing(effect_id, Timing.TURN_END):
				continue

			var card_name: String = card_ui.card_data.card_name
			var result := {}

			match effect_id:
				"green_016":  # ターン終了時:味方全体HP+1
					var allies = _get_all_allies(is_player, context)
					for ally in allies:
						ally.heal(1)
					result["log"] = "[color=green]%s の効果: 味方全体HP+1[/color]" % card_name

			if result.size() > 0:
				results.append(result)

	# 凍結ターン減少
	for slot in slots:
		if slot and not slot.is_empty():
			var card_ui = slot.card_ui
			card_ui.tick_status_effects()

	return results

## 常時効果を計算（攻撃力修正など）
func get_constant_atk_modifier(card_ui, is_player: bool, context: Dictionary) -> int:
	var modifier := 0
	var effect_id: String = card_ui.card_data.effect_id

	# 自身の常時効果
	if effect_id == "blue_005":  # ダイス5,6の時ATK+2
		if context.has("current_dice") and context["current_dice"] in [5, 6]:
			modifier += 2

	# 味方の常時効果による影響
	var ally_slots: Array = context["player_slots"] if is_player else context["opponent_slots"]
	for slot in ally_slots:
		if slot and not slot.is_empty() and slot.card_ui != card_ui:
			var ally_effect: String = slot.card_ui.card_data.effect_id
			match ally_effect:
				"blue_015":  # 敵前列のATK-1 (これは敵に影響)
					pass
				"blue_016":  # 敵全体のATK-1 (これは敵に影響)
					pass

	# 敵の常時効果による影響
	var enemy_slots: Array = context["opponent_slots"] if is_player else context["player_slots"]
	for slot in enemy_slots:
		if slot and not slot.is_empty():
			var enemy_effect: String = slot.card_ui.card_data.effect_id
			match enemy_effect:
				"blue_015":  # 敵前列のATK-1
					var my_slot = _find_slot_for_card(card_ui, ally_slots)
					if my_slot and my_slot.is_front_row:
						modifier -= 1
				"blue_016":  # 敵全体のATK-1
					modifier -= 1

	return modifier

## 常時効果によるダイス修正
func get_dice_modifier(is_player: bool, context: Dictionary) -> Dictionary:
	var result := {"bonus": 0, "extra_dice": [], "blocked_dice": []}

	var ally_slots: Array = context["player_slots"] if is_player else context["opponent_slots"]
	var enemy_slots: Array = context["opponent_slots"] if is_player else context["player_slots"]

	# 味方の効果
	for slot in ally_slots:
		if slot and not slot.is_empty():
			var effect_id: String = slot.card_ui.card_data.effect_id
			match effect_id:
				"blue_002":  # ダイス3,4でも攻撃可
					if 3 not in result["extra_dice"]:
						result["extra_dice"].append(3)
					if 4 not in result["extra_dice"]:
						result["extra_dice"].append(4)

	# 敵の効果
	for slot in enemy_slots:
		if slot and not slot.is_empty():
			var effect_id: String = slot.card_ui.card_data.effect_id
			match effect_id:
				"black_009":  # 相手のダイス6を無効化
					if 6 not in result["blocked_dice"]:
						result["blocked_dice"].append(6)
				"black_012":  # 相手のダイス1を無効化
					if 1 not in result["blocked_dice"]:
						result["blocked_dice"].append(1)
				"black_019":  # 相手のダイス1,6を無効化
					if 1 not in result["blocked_dice"]:
						result["blocked_dice"].append(1)
					if 6 not in result["blocked_dice"]:
						result["blocked_dice"].append(6)

	return result

## 召喚コスト修正を取得
func get_summon_cost_modifier(is_player: bool, context: Dictionary) -> int:
	var modifier := 0
	var ally_slots: Array = context["player_slots"] if is_player else context["opponent_slots"]

	for slot in ally_slots:
		if slot and not slot.is_empty():
			var effect_id: String = slot.card_ui.card_data.effect_id
			if effect_id == "green_006":  # 味方召喚コスト-1
				modifier -= 1

	return modifier

# ═══════════════════════════════════════════
# ヘルパー関数
# ═══════════════════════════════════════════

func _get_random_enemy(is_player: bool, context: Dictionary):
	var enemy_slots: Array = context["opponent_slots"] if is_player else context["player_slots"]
	var enemies := []
	for slot in enemy_slots:
		if slot and not slot.is_empty():
			enemies.append(slot.card_ui)
	if enemies.size() > 0:
		return enemies[randi() % enemies.size()]
	return null

func _get_all_enemies(is_player: bool, context: Dictionary) -> Array:
	var enemy_slots: Array = context["opponent_slots"] if is_player else context["player_slots"]
	var enemies := []
	for slot in enemy_slots:
		if slot and not slot.is_empty():
			enemies.append(slot.card_ui)
	return enemies

func _get_random_ally(is_player: bool, context: Dictionary):
	var ally_slots: Array = context["player_slots"] if is_player else context["opponent_slots"]
	var allies := []
	for slot in ally_slots:
		if slot and not slot.is_empty():
			allies.append(slot.card_ui)
	if allies.size() > 0:
		return allies[randi() % allies.size()]
	return null

func _get_all_allies(is_player: bool, context: Dictionary) -> Array:
	var ally_slots: Array = context["player_slots"] if is_player else context["opponent_slots"]
	var allies := []
	for slot in ally_slots:
		if slot and not slot.is_empty():
			allies.append(slot.card_ui)
	return allies

func _find_slot_for_card(card_ui, slots: Array):
	for slot in slots:
		if slot and not slot.is_empty() and slot.card_ui == card_ui:
			return slot
	return null
