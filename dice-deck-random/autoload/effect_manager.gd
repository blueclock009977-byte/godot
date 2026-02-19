extends Node

## 効果管理システム
## 効果の定義と処理を一元管理

# 効果タイミング
enum Timing { ON_SUMMON, ON_ATTACK, ON_DEATH, ON_DEFENSE, CONSTANT, TURN_START, TURN_END }

# 状態異常
enum StatusEffect { NONE, FROZEN, POISON }

const TIMING_CARD_UI_KEYS := {
	Timing.ON_SUMMON: ["card_ui", "summon_card_ui"],
	Timing.ON_ATTACK: ["attacker_ui", "attack_card_ui", "card_ui"],
	Timing.ON_DEATH: ["card_ui", "dead_card_ui"],
	Timing.ON_DEFENSE: ["defender_ui", "defense_card_ui", "card_ui"],
	Timing.TURN_START: ["card_ui", "turn_card_ui", "turn_start_card_ui"],
	Timing.TURN_END: ["card_ui", "turn_card_ui", "turn_end_card_ui"]
}

const TIMING_PAYLOAD_KEYS := {
	Timing.ON_SUMMON: {"is_player": ["is_player"], "context": ["context"]},
	Timing.ON_ATTACK: {"is_player": ["is_player"], "context": ["context"], "defender_ui": ["defender_ui"]},
	Timing.ON_DEATH: {"is_player": ["is_player"], "context": ["context"]},
	Timing.ON_DEFENSE: {"is_player": ["is_player"], "context": ["context"], "damage": ["damage"]},
	Timing.TURN_START: {"is_player": ["is_player"], "context": ["context"]},
	Timing.TURN_END: {"is_player": ["is_player"], "context": ["context"]}
}

const TIMING_DISPATCHER_METHODS := {
	Timing.ON_SUMMON: "_dispatch_timing_on_summon",
	Timing.ON_ATTACK: "_dispatch_timing_on_attack",
	Timing.ON_DEATH: "_dispatch_timing_on_death",
	Timing.ON_DEFENSE: "_dispatch_timing_on_defense",
	Timing.TURN_START: "_dispatch_timing_turn_start",
	Timing.TURN_END: "_dispatch_timing_turn_end"
}

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

	# ═══════════════════════════════════════════
	# 赤カード効果 (攻撃特化、直接ダメージ)
	# ═══════════════════════════════════════════
	_register("red_001", Timing.ON_SUMMON, "登場時:敵1体HP-2")
	_register("red_002", Timing.ON_ATTACK, "攻撃時:対象に追加2ダメージ")
	_register("red_003", Timing.ON_SUMMON, "登場時:敵全体HP-1")
	_register("red_004", Timing.CONSTANT, "ATK+1(常時)")
	_register("red_005", Timing.ON_ATTACK, "攻撃時:自身ATK+1(永続)")
	_register("red_006", Timing.ON_DEATH, "死亡時:敵全体HP-2")
	_register("red_007", Timing.ON_SUMMON, "登場時:味方全体ATK+1")
	_register("red_008", Timing.ON_ATTACK, "攻撃時:2回攻撃")
	_register("red_009", Timing.ON_DEATH, "死亡時:自爆(敵味方全体HP-2)")
	_register("red_010", Timing.TURN_START, "ターン開始時:自身ATK+1")
	_register("red_011", Timing.ON_SUMMON, "登場時:敵1体HP-3")
	_register("red_012", Timing.CONSTANT, "ダイス1でATK+3")
	_register("red_013", Timing.ON_ATTACK, "攻撃時:相手HP直接-1")
	_register("red_014", Timing.ON_DEATH, "死亡時:敵1体HP-4")
	_register("red_015", Timing.ON_SUMMON, "登場時:敵全体HP-2")
	_register("red_016", Timing.CONSTANT, "ATK+2(常時)")

	# ═══════════════════════════════════════════
	# 黄カード効果 (サポート、バフ、ユーティリティ)
	# ═══════════════════════════════════════════
	_register("yellow_001", Timing.ON_SUMMON, "登場時:味方1体HP+2")
	_register("yellow_002", Timing.CONSTANT, "味方全体ダイス+1追加")
	_register("yellow_003", Timing.ON_SUMMON, "登場時:手札2枚ドロー")
	_register("yellow_004", Timing.ON_DEFENSE, "防御時:ダメージを1軽減")
	_register("yellow_005", Timing.TURN_START, "ターン開始時:カード1枚ドロー")
	_register("yellow_006", Timing.ON_SUMMON, "登場時:味方全体HP+1")
	_register("yellow_007", Timing.CONSTANT, "自身への被ダメ-1")
	_register("yellow_008", Timing.ON_ATTACK, "攻撃時:自身HP+1")
	_register("yellow_009", Timing.ON_SUMMON, "登場時:味方1体ATK+2")
	_register("yellow_010", Timing.TURN_END, "ターン終了時:マナ+1")
	_register("yellow_011", Timing.ON_DEATH, "死亡時:味方全体HP+2")
	_register("yellow_012", Timing.CONSTANT, "味方全体ATK+1")
	_register("yellow_013", Timing.ON_SUMMON, "登場時:味方全体ATK+1,HP+1")
	_register("yellow_014", Timing.ON_DEFENSE, "防御時:攻撃者にダメージ反射")
	_register("yellow_015", Timing.TURN_START, "ターン開始時:味方1体HP+2")

	# ═══════════════════════════════════════════
	# 紫カード効果 (コントロール、デバフ、トリッキー)
	# ═══════════════════════════════════════════
	_register("purple_001", Timing.ON_SUMMON, "登場時:敵1体のダイス1つ無効化")
	_register("purple_002", Timing.ON_ATTACK, "攻撃時:対象ATK-2(永続)")
	_register("purple_003", Timing.ON_SUMMON, "登場時:相手の手札1枚破棄")
	_register("purple_004", Timing.CONSTANT, "相手の召喚コスト+1")
	_register("purple_005", Timing.ON_DEATH, "死亡時:敵1体を凍結")
	_register("purple_006", Timing.ON_SUMMON, "登場時:敵全体ATK-1,HP-1")
	_register("purple_007", Timing.ON_ATTACK, "攻撃時:対象のダイス2つ無効化")
	_register("purple_008", Timing.TURN_END, "ターン終了時:敵全体HP-1")
	_register("purple_009", Timing.ON_SUMMON, "登場時:敵1体を2ターン凍結")
	_register("purple_010", Timing.CONSTANT, "相手ターン開始時マナ-1")
	_register("purple_011", Timing.ON_DEATH, "死亡時:敵全体を凍結")
	_register("purple_012", Timing.ON_SUMMON, "登場時:コスト3以下の敵を破壊")
	_register("purple_013", Timing.ON_ATTACK, "攻撃時:対象と自身入れ替え")
	_register("purple_014", Timing.CONSTANT, "敵のドロー枚数-1")

	# ═══════════════════════════════════════════
	# 白カード効果 (回復、防御、蘇生)
	# ═══════════════════════════════════════════
	_register("white_001", Timing.ON_SUMMON, "登場時:自分HP+2")
	_register("white_002", Timing.ON_DEATH, "死亡時:自分HP+3")
	_register("white_003", Timing.TURN_START, "ターン開始時:自分HP+1")
	_register("white_004", Timing.ON_SUMMON, "登場時:味方全体HP+2")
	_register("white_005", Timing.ON_DEFENSE, "防御時:ダメージ無効(1回のみ)")
	_register("white_006", Timing.ON_SUMMON, "登場時:墓地から1体復活")
	_register("white_007", Timing.CONSTANT, "味方全体被ダメ-1")
	_register("white_008", Timing.ON_ATTACK, "攻撃時:味方全体HP+1")
	_register("white_009", Timing.ON_SUMMON, "登場時:自分HP+4")
	_register("white_010", Timing.TURN_END, "ターン終了時:自分HP+2")
	_register("white_011", Timing.ON_DEATH, "死亡時:自分HP全回復")
	_register("white_012", Timing.CONSTANT, "自分への直接ダメージ半減")
	_register("white_013", Timing.ON_SUMMON, "登場時:味方全体の状態異常解除")
	_register("white_014", Timing.ON_DEATH, "死亡時:味方1体HP全回復")
	_register("white_015", Timing.ON_SUMMON, "登場時:自分HP+6")

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

func _can_process_effect(effect_id: String, timing: Timing) -> bool:
	if effect_id == "":
		return false
	return has_timing(effect_id, timing)

func _prepare_timing_effect(card_ui, timing: Timing) -> Dictionary:
	if not card_ui or not card_ui.card_data:
		return {"ok": false, "effect_id": "", "card_name": ""}

	var effect_id: String = card_ui.card_data.effect_id
	if not _can_process_effect(effect_id, timing):
		return {"ok": false, "effect_id": effect_id, "card_name": card_ui.card_data.card_name}

	return {
		"ok": true,
		"effect_id": effect_id,
		"card_name": card_ui.card_data.card_name
	}

func _resolve_timing_card_ui(timing: Timing, payload: Dictionary):
	var keys: Array = TIMING_CARD_UI_KEYS.get(timing, [])
	return _resolve_timing_payload_value(payload, keys, null)

func _resolve_timing_payload_value(payload: Dictionary, keys: Array, default_value):
	for key in keys:
		if payload.has(key):
			return payload[key]
	return default_value

func _dispatch_timing_on_summon(payload: Dictionary, is_player: bool, context: Dictionary):
	return process_summon_effect(
		_resolve_timing_card_ui(Timing.ON_SUMMON, payload),
		is_player,
		context
	)

func _dispatch_timing_on_attack(payload: Dictionary, aliases: Dictionary, is_player: bool, context: Dictionary):
	var defender_ui = _resolve_timing_payload_value(payload, aliases.get("defender_ui", ["defender_ui"]), null)
	return process_attack_effect(
		_resolve_timing_card_ui(Timing.ON_ATTACK, payload),
		defender_ui,
		is_player,
		context
	)

func _dispatch_timing_on_death(payload: Dictionary, is_player: bool, context: Dictionary):
	return process_death_effect(
		_resolve_timing_card_ui(Timing.ON_DEATH, payload),
		is_player,
		context
	)

func _dispatch_timing_on_defense(payload: Dictionary, aliases: Dictionary, is_player: bool, context: Dictionary):
	var damage: int = _resolve_timing_payload_value(payload, aliases.get("damage", ["damage"]), 0)
	return process_defense_effect(
		_resolve_timing_card_ui(Timing.ON_DEFENSE, payload),
		damage,
		is_player,
		context
	)

func _try_dispatch_single_turn_timing_effect(timing: Timing, is_player: bool, context: Dictionary):
	var card_ui = context.get("_timing_single_card_ui", null)
	if not card_ui:
		return []
	var prepared := _prepare_timing_effect(card_ui, timing)
	if not prepared.get("ok", false):
		return []
	var single_result := _dispatch_turn_timing_effect(prepared.get("effect_id", ""), card_ui, is_player, context, prepared.get("card_name", ""), timing)
	if single_result.size() == 0:
		return []
	_emit_effect_trigger_if_logged(prepared.get("effect_id", ""), card_ui, null, single_result)
	return [single_result]

func _dispatch_timing_turn_start(is_player: bool, context: Dictionary):
	var single_result: Array = _try_dispatch_single_turn_timing_effect(Timing.TURN_START, is_player, context)
	if single_result.size() > 0:
		return single_result
	return process_turn_start_effects(is_player, context)

func _dispatch_timing_turn_end(is_player: bool, context: Dictionary):
	var single_result: Array = _try_dispatch_single_turn_timing_effect(Timing.TURN_END, is_player, context)
	if single_result.size() > 0:
		return single_result
	return process_turn_end_effects(is_player, context)

func _dispatch_timing_via_method_table(timing: Timing, payload: Dictionary, aliases: Dictionary, is_player: bool, context: Dictionary):
	var method_name: String = TIMING_DISPATCHER_METHODS.get(timing, "")
	if method_name == "" or not has_method(method_name):
		return null
	match timing:
		Timing.ON_ATTACK, Timing.ON_DEFENSE:
			return call(method_name, payload, aliases, is_player, context)
		Timing.ON_SUMMON, Timing.ON_DEATH:
			return call(method_name, payload, is_player, context)
		Timing.TURN_START, Timing.TURN_END:
			return call(method_name, is_player, context)
		_:
			return null

func process_timing_event(timing: Timing, payload: Dictionary):
	var aliases: Dictionary = TIMING_PAYLOAD_KEYS.get(timing, {})
	var is_player: bool = _resolve_timing_payload_value(payload, aliases.get("is_player", ["is_player"]), true)
	var context: Dictionary = _resolve_timing_payload_value(payload, aliases.get("context", ["context"]), {})

	if timing in [Timing.TURN_START, Timing.TURN_END]:
		var timing_card_ui = _resolve_timing_card_ui(timing, payload)
		if timing_card_ui:
			context = context.duplicate(true)
			context["_timing_single_card_ui"] = timing_card_ui

	var table_dispatched = _dispatch_timing_via_method_table(timing, payload, aliases, is_player, context)
	if table_dispatched != null:
		return table_dispatched

	match timing:
		Timing.ON_DEATH:
			return _dispatch_timing_on_death(payload, is_player, context)
		Timing.ON_DEFENSE:
			return _dispatch_timing_on_defense(payload, aliases, is_player, context)
		Timing.TURN_START:
			return _dispatch_timing_turn_start(is_player, context)
		Timing.TURN_END:
			return _dispatch_timing_turn_end(is_player, context)
		_:
			return {}

func _process_single_card_timing_effect(card_ui, timing: Timing, default_result: Dictionary = {}) -> Dictionary:
	var prepared := _prepare_timing_effect(card_ui, timing)
	if not prepared.get("ok", false):
		return default_result.duplicate(true)
	return prepared

## 登場時効果を処理
func process_summon_effect(card_ui, is_player: bool, context: Dictionary) -> Dictionary:
	var prepared := _process_single_card_timing_effect(card_ui, Timing.ON_SUMMON)
	if not prepared.get("ok", false):
		return {}

	var effect_id: String = prepared.get("effect_id", "")
	var result := {}
	var card_name: String = prepared.get("card_name", "")

	_dispatch_summon_effect(effect_id, card_ui, is_player, context, card_name, result)

	_emit_effect_trigger_if_logged(effect_id, card_ui, null, result)
	return result

func _dispatch_summon_effect(effect_id: String, card_ui, is_player: bool, context: Dictionary, card_name: String, result: Dictionary) -> void:
	match effect_id:
		"blue_001":  # 登場時:敵1体ATK-1
			_apply_targeted_atk_modifier_effect(is_player, context, -1, result, card_name, "cyan", "のATK-1")

		"blue_004":  # 登場時:敵全体ATK-1
			_apply_enemy_aoe_atk_modifier_effect(is_player, context, -1, result, card_name, "cyan", "敵全体のATK-1")

		"blue_007":  # 登場時:敵全体ATK-2
			_apply_enemy_aoe_atk_modifier_effect(is_player, context, -2, result, card_name, "cyan", "敵全体のATK-2")

		"blue_011":  # 登場時:次ダイス+1
			result["dice_bonus"] = 1
			result["log"] = _make_effect_log("cyan", card_name, "次のダイス+1")

		"blue_014":  # 登場時:カード1枚ドロー
			_apply_draw_effect(result, "cyan", card_name, 1)

		"blue_018":  # 登場時:敵全体を1ターン凍結
			var enemies = _get_all_enemies(is_player, context)
			for enemy in enemies:
				enemy.apply_status(StatusEffect.FROZEN, 1)
			if enemies.size() > 0:
				result["log"] = "[color=cyan]%s の効果: 敵全体を凍結[/color]" % card_name

		"green_001":  # 登場時:マナ+1
			_apply_mana_gain_effect(result, "green", card_name, 1)

		"green_004":  # 登場時:マナ+2
			_apply_mana_gain_effect(result, "green", card_name, 2)

		"green_008":  # 登場時:マナ+3
			_apply_mana_gain_effect(result, "green", card_name, 3)

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
			_apply_self_damage_effect(result, card_name, 1)

		"black_003":  # 登場時:自分HP-2
			_apply_self_damage_effect(result, card_name, 2)

		"black_005":  # 登場時:自分HP-3
			_apply_self_damage_effect(result, card_name, 3)

		"black_008":  # 登場時:自分HP-5
			_apply_self_damage_effect(result, card_name, 5)

		"black_014":  # 登場時:自分HP-2,カード1枚ドロー
			result["self_damage"] = 2
			result["draw"] = 1
			result["log"] = "[color=purple]%s の効果: 自分HP-2, 1枚ドロー[/color]" % card_name

		"black_017":  # 登場時:自分HP-4
			_apply_self_damage_effect(result, card_name, 4)

		# ═══════════════════════════════════════════
		# 赤カード登場時効果
		# ═══════════════════════════════════════════
		"red_001":  # 登場時:敵1体HP-2
			_apply_targeted_damage_effect(is_player, context, 2, result, card_name, "red", "にHP-2")

		"red_003":  # 登場時:敵全体HP-1
			var enemies = _get_all_enemies(is_player, context)
			_apply_aoe_damage_effect(enemies, 1, result, card_name, "red", "敵全体HP-1")

		"red_007":  # 登場時:味方全体ATK+1
			var allies = _get_all_allies(is_player, context)
			for ally in allies:
				ally.modify_atk(1)
			result["log"] = "[color=red]%s の効果: 味方全体ATK+1[/color]" % card_name

		"red_011":  # 登場時:敵1体HP-3
			_apply_targeted_damage_effect(is_player, context, 3, result, card_name, "red", "にHP-3")

		"red_015":  # 登場時:敵全体HP-2
			var enemies = _get_all_enemies(is_player, context)
			_apply_aoe_damage_effect(enemies, 2, result, card_name, "red", "敵全体HP-2")

		# ═══════════════════════════════════════════
		# 黄カード登場時効果
		# ═══════════════════════════════════════════
		"yellow_001":  # 登場時:味方1体HP+2
			var target = _get_random_ally(is_player, context)
			if target:
				target.heal(2)
				result["log"] = "[color=yellow]%s の効果: %s のHP+2[/color]" % [card_name, target.card_data.card_name]

		"yellow_003":  # 登場時:手札2枚ドロー
			_apply_draw_effect(result, "yellow", card_name, 2)

		"yellow_006":  # 登場時:味方全体HP+1
			var allies = _get_all_allies(is_player, context)
			for ally in allies:
				ally.heal(1)
			result["log"] = "[color=yellow]%s の効果: 味方全体HP+1[/color]" % card_name

		"yellow_009":  # 登場時:味方1体ATK+2
			var target = _get_random_ally(is_player, context)
			if target:
				target.modify_atk(2)
				result["log"] = "[color=yellow]%s の効果: %s のATK+2[/color]" % [card_name, target.card_data.card_name]

		"yellow_013":  # 登場時:味方全体ATK+1,HP+1
			var allies = _get_all_allies(is_player, context)
			for ally in allies:
				ally.modify_atk(1)
				ally.heal(1)
			result["log"] = "[color=yellow]%s の効果: 味方全体ATK+1,HP+1[/color]" % card_name

		# ═══════════════════════════════════════════
		# 紫カード登場時効果
		# ═══════════════════════════════════════════
		"purple_001":  # 登場時:敵1体のダイス1つ無効化
			result["disable_dice"] = 1
			result["log"] = "[color=magenta]%s の効果: 敵1体のダイス1つ無効[/color]" % card_name

		"purple_003":  # 登場時:相手の手札1枚破棄
			result["discard_opponent"] = 1
			result["log"] = "[color=magenta]%s の効果: 相手手札1枚破棄[/color]" % card_name

		"purple_006":  # 登場時:敵全体ATK-1,HP-1
			var enemies = _get_all_enemies(is_player, context)
			for enemy in enemies:
				enemy.modify_atk(-1)
			_apply_damage_to_targets_and_mark_destroy(enemies, 1, result)
			if enemies.size() > 0:
				result["log"] = "[color=magenta]%s の効果: 敵全体ATK-1,HP-1[/color]" % card_name

		"purple_009":  # 登場時:敵1体を2ターン凍結
			var target = _get_random_enemy(is_player, context)
			if target:
				target.apply_status(StatusEffect.FROZEN, 2)
				result["log"] = "[color=magenta]%s の効果: %s を2ターン凍結[/color]" % [card_name, target.card_data.card_name]

		"purple_012":  # 登場時:コスト3以下の敵を破壊
			var enemies = _get_all_enemies(is_player, context)
			for enemy in enemies:
				if enemy.card_data.mana_cost <= 3:
					_mark_destroy_target(result, enemy)
			if result.has("destroy_targets") and result["destroy_targets"].size() > 0:
				result["log"] = "[color=magenta]%s の効果: コスト3以下の敵を破壊[/color]" % card_name

		# ═══════════════════════════════════════════
		# 白カード登場時効果
		# ═══════════════════════════════════════════
		"white_001":  # 登場時:自分HP+2
			_apply_player_heal_effect(result, "white", card_name, 2)

		"white_004":  # 登場時:味方全体HP+2
			var allies = _get_all_allies(is_player, context)
			for ally in allies:
				ally.heal(2)
			result["log"] = "[color=white]%s の効果: 味方全体HP+2[/color]" % card_name

		"white_006":  # 登場時:墓地から1体復活
			result["revive_from_graveyard"] = 1
			result["log"] = "[color=white]%s の効果: 墓地から1体復活[/color]" % card_name

		"white_009":  # 登場時:自分HP+4
			_apply_player_heal_effect(result, "white", card_name, 4)

		"white_013":  # 登場時:味方全体の状態異常解除
			var allies = _get_all_allies(is_player, context)
			for ally in allies:
				ally.clear_status_effects()
			result["log"] = "[color=white]%s の効果: 味方全体の状態異常解除[/color]" % card_name

		"white_015":  # 登場時:自分HP+6
			_apply_player_heal_effect(result, "white", card_name, 6)

## 攻撃時効果を処理
func process_attack_effect(attacker_ui, defender_ui, is_player: bool, context: Dictionary) -> Dictionary:
	var prepared := _process_single_card_timing_effect(attacker_ui, Timing.ON_ATTACK)
	if not prepared.get("ok", false):
		return {}

	var effect_id: String = prepared.get("effect_id", "")
	var result := {}
	var card_name: String = prepared.get("card_name", "")

	_dispatch_attack_effect(effect_id, attacker_ui, defender_ui, is_player, context, card_name, result)

	_emit_effect_trigger_if_logged(effect_id, attacker_ui, defender_ui, result)
	return result

func _dispatch_attack_effect(effect_id: String, attacker_ui, defender_ui, is_player: bool, context: Dictionary, card_name: String, result: Dictionary) -> void:
	match effect_id:
		"blue_003":  # 攻撃時:対象を凍結
			_apply_status_effect_with_log(defender_ui, StatusEffect.FROZEN, 1, result, "cyan", card_name, "を凍結")

		"blue_008":  # 攻撃時:対象を2ターン凍結
			_apply_status_effect_with_log(defender_ui, StatusEffect.FROZEN, 2, result, "cyan", card_name, "を2ターン凍結")

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
			_apply_status_effect_with_log(defender_ui, StatusEffect.POISON, 99, result, "purple", card_name, "に毒付与")

		"black_007":  # 攻撃時:与ダメ分自身HP回復
			result["lifesteal"] = true
			result["log"] = "[color=purple]%s の効果: 吸血[/color]" % card_name

		"black_015":  # 攻撃時:自身HP-1,ATK+2
			_apply_damage_and_mark_destroy(attacker_ui, 1, result)
			result["atk_bonus"] = 2
			result["log"] = "[color=purple]%s の効果: HP-1, ATK+2[/color]" % card_name

		"black_016":  # 攻撃時:対象の現HP半減
			if defender_ui and defender_ui.current_hp > 0:
				var half_hp_damage := int(ceil(defender_ui.current_hp / 2.0))
				_apply_damage_and_mark_destroy(defender_ui, half_hp_damage, result)
				result["log"] = "[color=purple]%s の効果: %s のHP半減[/color]" % [card_name, defender_ui.card_data.card_name]

		# ═══════════════════════════════════════════
		# 赤カード攻撃時効果
		# ═══════════════════════════════════════════
		"red_002":  # 攻撃時:対象に追加2ダメージ
			if defender_ui:
				_apply_damage_and_mark_destroy(defender_ui, 2, result)
				result["log"] = "[color=red]%s の効果: %s に追加2ダメージ[/color]" % [card_name, defender_ui.card_data.card_name]

		"red_005":  # 攻撃時:自身ATK+1(永続)
			attacker_ui.modify_atk(1)
			result["log"] = "[color=red]%s の効果: 自身ATK+1[/color]" % card_name

		"red_008":  # 攻撃時:2回攻撃
			result["double_attack"] = true
			result["log"] = "[color=red]%s の効果: 2回攻撃[/color]" % card_name

		"red_013":  # 攻撃時:相手HP直接-1
			result["direct_damage"] = 1
			result["log"] = "[color=red]%s の効果: 相手HP-1[/color]" % card_name

		# ═══════════════════════════════════════════
		# 黄カード攻撃時効果
		# ═══════════════════════════════════════════
		"yellow_008":  # 攻撃時:自身HP+1
			attacker_ui.heal(1)
			result["log"] = "[color=yellow]%s の効果: 自身HP+1[/color]" % card_name

		# ═══════════════════════════════════════════
		# 紫カード攻撃時効果
		# ═══════════════════════════════════════════
		"purple_002":  # 攻撃時:対象ATK-2(永続)
			if defender_ui:
				defender_ui.modify_atk(-2)
				result["log"] = "[color=magenta]%s の効果: %s のATK-2[/color]" % [card_name, defender_ui.card_data.card_name]

		"purple_007":  # 攻撃時:対象のダイス2つ無効化
			if defender_ui:
				result["disable_dice"] = 2
				result["log"] = "[color=magenta]%s の効果: %s のダイス2つ無効[/color]" % [card_name, defender_ui.card_data.card_name]

		"purple_013":  # 攻撃時:対象と自身入れ替え
			if defender_ui:
				result["swap_with_target"] = true
				result["log"] = "[color=magenta]%s の効果: %s と位置入れ替え[/color]" % [card_name, defender_ui.card_data.card_name]

		# ═══════════════════════════════════════════
		# 白カード攻撃時効果
		# ═══════════════════════════════════════════
		"white_008":  # 攻撃時:味方全体HP+1
			var allies = _get_all_allies(is_player, context)
			for ally in allies:
				ally.heal(1)
			result["log"] = "[color=white]%s の効果: 味方全体HP+1[/color]" % card_name

## 死亡時効果を処理
func process_death_effect(card_ui, is_player: bool, context: Dictionary) -> Dictionary:
	var prepared := _process_single_card_timing_effect(card_ui, Timing.ON_DEATH)
	if not prepared.get("ok", false):
		return {}

	var effect_id: String = prepared.get("effect_id", "")
	var result := {}
	var card_name: String = prepared.get("card_name", "")

	_dispatch_death_effect(effect_id, card_ui, is_player, context, card_name, result)

	_emit_effect_trigger_if_logged(effect_id, card_ui, null, result)
	return result

func _dispatch_death_effect(effect_id: String, card_ui, is_player: bool, context: Dictionary, card_name: String, result: Dictionary) -> void:
	match effect_id:
		"blue_009":  # 死亡時:敵1体ATK-1
			_apply_targeted_atk_modifier_effect(is_player, context, -1, result, card_name, "cyan", "のATK-1")

		"green_002":  # 死亡時:マナ+1
			result["mana"] = 1
			result["log"] = "[color=green]%s の効果: マナ+1[/color]" % card_name

		"green_005":  # 死亡時:マナ+2
			result["mana"] = 2
			result["log"] = "[color=green]%s の効果: マナ+2[/color]" % card_name

		"green_014":  # 味方死亡時:自身HP+2
			if context.get("ally_died", false):
				var dead_card = context.get("dead_card_ui", null)
				if dead_card != card_ui:
					card_ui.heal(2)
					result["log"] = "[color=green]%s の効果: 味方死亡で自身HP+2[/color]" % card_name

		"black_002":  # 死亡時:敵1体HP-2
			_apply_targeted_damage_effect(is_player, context, 2, result, card_name, "purple", "にHP-2")

		"black_006":  # 死亡時:トークン召喚
			result["spawn_token"] = {"atk": 2, "hp": 2}
			result["log"] = "[color=purple]%s の効果: トークン召喚[/color]" % card_name

		"black_010":  # 死亡時:敵全体HP-1
			var enemies = _get_all_enemies(is_player, context)
			_apply_aoe_damage_effect(enemies, 1, result, card_name, "purple", "敵全体HP-1")

		"black_011":  # 死亡時:HP1で1度だけ復活
			if not card_ui.has_revived:
				result["revive"] = true
				result["log"] = "[color=purple]%s の効果: HP1で復活[/color]" % card_name

		"black_013":  # 死亡時:敵1体ATK-2
			_apply_targeted_atk_modifier_effect(is_player, context, -2, result, card_name, "purple", "のATK-2")

		"black_018":  # 死亡時:敵全体HP-3
			var enemies = _get_all_enemies(is_player, context)
			_apply_aoe_damage_effect(enemies, 3, result, card_name, "purple", "敵全体HP-3")

		# ═══════════════════════════════════════════
		# 赤カード死亡時効果
		# ═══════════════════════════════════════════
		"red_006":  # 死亡時:敵全体HP-2
			var enemies = _get_all_enemies(is_player, context)
			_apply_aoe_damage_effect(enemies, 2, result, card_name, "red", "敵全体HP-2")

		"red_009":  # 死亡時:自爆(敵味方全体HP-2)
			var all_cards := _get_all_enemies(is_player, context) + _get_all_allies(is_player, context)
			_apply_damage_to_targets_and_mark_destroy(all_cards, 2, result)
			result["log"] = "[color=red]%s の効果: 自爆!敵味方全体HP-2[/color]" % card_name

		"red_014":  # 死亡時:敵1体HP-4
			_apply_targeted_damage_effect(is_player, context, 4, result, card_name, "red", "にHP-4")

		# ═══════════════════════════════════════════
		# 黄カード死亡時効果
		# ═══════════════════════════════════════════
		"yellow_011":  # 死亡時:味方全体HP+2
			var allies = _get_all_allies(is_player, context)
			for ally in allies:
				ally.heal(2)
			result["log"] = "[color=yellow]%s の効果: 味方全体HP+2[/color]" % card_name

		# ═══════════════════════════════════════════
		# 紫カード死亡時効果
		# ═══════════════════════════════════════════
		"purple_005":  # 死亡時:敵1体を凍結
			var target = _get_random_enemy(is_player, context)
			if target:
				target.apply_status(StatusEffect.FROZEN, 1)
				result["log"] = "[color=magenta]%s の効果: %s を凍結[/color]" % [card_name, target.card_data.card_name]

		"purple_011":  # 死亡時:敵全体を凍結
			var enemies = _get_all_enemies(is_player, context)
			for enemy in enemies:
				enemy.apply_status(StatusEffect.FROZEN, 1)
			if enemies.size() > 0:
				result["log"] = "[color=magenta]%s の効果: 敵全体を凍結[/color]" % card_name

		# ═══════════════════════════════════════════
		# 白カード死亡時効果
		# ═══════════════════════════════════════════
		"white_002":  # 死亡時:自分HP+3
			_apply_player_heal_effect(result, "white", card_name, 3)

		"white_011":  # 死亡時:自分HP全回復
			result["heal_player_full"] = true
			result["log"] = "[color=white]%s の効果: 自分HP全回復[/color]" % card_name

		"white_014":  # 死亡時:味方1体HP全回復
			var target = _get_random_ally(is_player, context)
			if target:
				target.heal(99)
				result["log"] = "[color=white]%s の効果: %s のHP全回復[/color]" % [card_name, target.card_data.card_name]

## 防御時効果を処理
func process_defense_effect(defender_ui, damage: int, is_player: bool, context: Dictionary) -> Dictionary:
	var prepared := _process_single_card_timing_effect(defender_ui, Timing.ON_DEFENSE, {"final_damage": damage})
	if not prepared.get("ok", false):
		return {"final_damage": damage}

	var effect_id: String = prepared.get("effect_id", "")
	var result := {"final_damage": damage}
	var card_name: String = prepared.get("card_name", "")

	_dispatch_defense_effect(effect_id, defender_ui, damage, card_name, result)

	_emit_effect_trigger_if_logged(effect_id, defender_ui, null, result)
	return result

func _dispatch_defense_effect(effect_id: String, defender_ui, damage: int, card_name: String, result: Dictionary) -> void:
	match effect_id:
		"blue_006":  # 防御時:被ダメージ半減
			result["final_damage"] = int(damage / 2)
			result["log"] = "[color=cyan]%s の効果: ダメージ半減[/color]" % card_name

		"green_012":  # 被ダメージ時:マナ+1
			result["mana"] = 1
			result["log"] = "[color=green]%s の効果: マナ+1[/color]" % card_name

		# ═══════════════════════════════════════════
		# 黄カード防御時効果
		# ═══════════════════════════════════════════
		"yellow_004":  # 防御時:ダメージを1軽減
			result["final_damage"] = max(0, damage - 1)
			result["log"] = "[color=yellow]%s の効果: ダメージ1軽減[/color]" % card_name

		"yellow_014":  # 防御時:攻撃者にダメージ反射
			result["reflect"] = true
			result["log"] = "[color=yellow]%s の効果: ダメージ反射[/color]" % card_name

		# ═══════════════════════════════════════════
		# 白カード防御時効果
		# ═══════════════════════════════════════════
		"white_005":  # 防御時:ダメージ無効(1回のみ)
			var already_used := false
			if "shield_used" in defender_ui:
				already_used = defender_ui.shield_used
			if not already_used:
				result["final_damage"] = 0
				result["shield_consumed"] = true
				result["log"] = "[color=white]%s の効果: ダメージ無効[/color]" % card_name

func _build_turn_start_effect_result(effect_id: String, card_ui, is_player: bool, context: Dictionary, card_name: String) -> Dictionary:
	var result := {}
	match effect_id:
		"blue_010":  # ターン開始時:自身HP+1
			_apply_self_heal_effect(card_ui, result, "cyan", card_name, 1)

		"green_003":  # ターン開始時:自身HP+1
			_apply_self_heal_effect(card_ui, result, "green", card_name, 1)

		"green_009":  # ターン開始時:マナ+1
			_apply_mana_gain_effect(result, "green", card_name, 1)

		# 赤カードターン開始時効果
		"red_010":  # ターン開始時:自身ATK+1
			card_ui.modify_atk(1)
			result["log"] = "[color=red]%s の効果: 自身ATK+1[/color]" % card_name

		# 黄カードターン開始時効果
		"yellow_005":  # ターン開始時:カード1枚ドロー
			_apply_draw_effect(result, "yellow", card_name, 1)

		"yellow_015":  # ターン開始時:味方1体HP+2
			var target = _get_random_ally(is_player, context)
			if target:
				target.heal(2)
				result["log"] = "[color=yellow]%s の効果: %s のHP+2[/color]" % [card_name, target.card_data.card_name]

		# 白カードターン開始時効果
		"white_003":  # ターン開始時:自分HP+1
			_apply_player_heal_effect(result, "white", card_name, 1)

	return result

func _build_turn_end_effect_result(effect_id: String, card_ui, is_player: bool, context: Dictionary, card_name: String) -> Dictionary:
	var result := {}
	match effect_id:
		"green_016":  # ターン終了時:味方全体HP+1
			var allies = _get_all_allies(is_player, context)
			for ally in allies:
				ally.heal(1)
			result["log"] = "[color=green]%s の効果: 味方全体HP+1[/color]" % card_name

		# 黄カードターン終了時効果
		"yellow_010":  # ターン終了時:マナ+1
			_apply_mana_gain_effect(result, "yellow", card_name, 1)

		# 紫カードターン終了時効果
		"purple_008":  # ターン終了時:敵全体HP-1
			var enemies = _get_all_enemies(is_player, context)
			_apply_aoe_damage_effect(enemies, 1, result, card_name, "magenta", "敵全体HP-1")

		# 白カードターン終了時効果
		"white_010":  # ターン終了時:自分HP+2
			_apply_player_heal_effect(result, "white", card_name, 2)

	return result

func _dispatch_turn_timing_effect(effect_id: String, card_ui, is_player: bool, context: Dictionary, card_name: String, timing: Timing) -> Dictionary:
	match timing:
		Timing.TURN_START:
			return _build_turn_start_effect_result(effect_id, card_ui, is_player, context, card_name)
		Timing.TURN_END:
			return _build_turn_end_effect_result(effect_id, card_ui, is_player, context, card_name)
		_:
			return {}

func _process_turn_timing_effects(slots: Array, is_player: bool, context: Dictionary, timing: Timing) -> Array:
	var results := []
	for slot in slots:
		var card_ui = _get_effect_card_from_slot(slot)
		if not card_ui:
			continue

		var prepared := _prepare_timing_effect(card_ui, timing)
		if not prepared.get("ok", false):
			continue

		var effect_id: String = prepared.get("effect_id", "")
		var card_name: String = prepared.get("card_name", "")
		var result := _dispatch_turn_timing_effect(effect_id, card_ui, is_player, context, card_name, timing)

		if result.size() > 0:
			_emit_effect_trigger_if_logged(effect_id, card_ui, null, result)
			results.append(result)

	return results

# turn timing resolver consolidated above

## ターン開始時効果を処理
func process_turn_start_effects(is_player: bool, context: Dictionary) -> Array:
	var slots: Array = _get_slots_by_owner(is_player, context)
	var results := _process_turn_timing_effects(slots, is_player, context, Timing.TURN_START)
	_append_poison_tick_results(slots, results)
	return results

## ターン終了時効果を処理
func _append_poison_tick_results(slots: Array, results: Array) -> void:
	# 毒ダメージ処理（ターン開始時）
	for slot in slots:
		var card_ui = _get_effect_card_from_slot(slot)
		if not card_ui:
			continue
		if card_ui.has_status(StatusEffect.POISON):
			var poison_result := {}
			_apply_damage_and_mark_destroy(card_ui, 1, poison_result)
			poison_result["log"] = "[color=purple]%s は毒で1ダメージ[/color]" % card_ui.card_data.card_name
			_emit_effect_trigger_if_logged("status_poison", card_ui, null, poison_result)
			results.append(poison_result)

func process_turn_end_effects(is_player: bool, context: Dictionary) -> Array:
	var slots: Array = _get_slots_by_owner(is_player, context)
	var results := _process_turn_timing_effects(slots, is_player, context, Timing.TURN_END)

	# 凍結ターン減少
	for slot in slots:
		var card_ui = _get_effect_card_from_slot(slot)
		if card_ui:
			card_ui.tick_status_effects()

	return results

## 常時効果を計算（攻撃力修正など）
func get_constant_atk_modifier(card_ui, is_player: bool, context: Dictionary) -> int:
	var modifier := 0
	var effect_id: String = card_ui.card_data.effect_id

	# 自身の常時効果
	match effect_id:
		"blue_005":  # ダイス5,6の時ATK+2
			if context.has("current_dice") and context["current_dice"] in [5, 6]:
				modifier += 2
		"red_004":  # ATK+1(常時)
			modifier += 1
		"red_012":  # ダイス1でATK+3
			if context.has("current_dice") and context["current_dice"] == 1:
				modifier += 3
		"red_016":  # ATK+2(常時)
			modifier += 2
		"yellow_007":  # 自身への被ダメ-1 (これはダメージ処理で使う)
			pass

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
				"yellow_012":  # 味方全体ATK+1
					modifier += 1

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
				"yellow_002":  # 味方全体ダイス+1追加
					result["bonus"] += 1

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
	var enemy_slots: Array = context["opponent_slots"] if is_player else context["player_slots"]

	# 味方の効果
	for slot in ally_slots:
		if slot and not slot.is_empty():
			var effect_id: String = slot.card_ui.card_data.effect_id
			if effect_id == "green_006":  # 味方召喚コスト-1
				modifier -= 1

	# 敵の効果
	for slot in enemy_slots:
		if slot and not slot.is_empty():
			var effect_id: String = slot.card_ui.card_data.effect_id
			if effect_id == "purple_004":  # 相手の召喚コスト+1
				modifier += 1

	return modifier

# ═══════════════════════════════════════════
# ヘルパー関数
# ═══════════════════════════════════════════

func _make_effect_log(color: String, card_name: String, message: String) -> String:
	return "[color=%s]%s の効果: %s[/color]" % [color, card_name, message]

func _emit_effect_trigger_if_logged(effect_id: String, source_card, target, result: Dictionary) -> void:
	if result.has("log"):
		effect_triggered.emit(effect_id, source_card, target)

func _mark_destroy_target(result: Dictionary, target) -> void:
	if not target:
		return
	result["destroy_targets"] = result.get("destroy_targets", [])
	if target not in result["destroy_targets"]:
		result["destroy_targets"].append(target)

func _apply_damage_and_mark_destroy(target, amount: int, result: Dictionary) -> void:
	if not target or amount <= 0:
		return
	target.take_damage(amount)
	if target.current_hp <= 0:
		_mark_destroy_target(result, target)

func _apply_self_damage_effect(result: Dictionary, card_name: String, amount: int) -> void:
	result["self_damage"] = amount
	result["log"] = _make_effect_log("purple", card_name, "自分HP-%d" % amount)

func _apply_self_heal_effect(card_ui, result: Dictionary, color: String, card_name: String, amount: int) -> void:
	if not card_ui or amount <= 0:
		return
	card_ui.heal(amount)
	result["log"] = _make_effect_log(color, card_name, "自身HP+%d" % amount)

func _apply_player_heal_effect(result: Dictionary, color: String, card_name: String, amount: int) -> void:
	if amount <= 0:
		return
	result["heal_player"] = amount
	result["log"] = _make_effect_log(color, card_name, "自分HP+%d" % amount)

func _apply_mana_gain_effect(result: Dictionary, color: String, card_name: String, amount: int) -> void:
	if amount <= 0:
		return
	result["mana"] = amount
	result["log"] = _make_effect_log(color, card_name, "マナ+%d" % amount)

func _apply_draw_effect(result: Dictionary, color: String, card_name: String, amount: int) -> void:
	if amount <= 0:
		return
	result["draw"] = amount
	result["log"] = _make_effect_log(color, card_name, "%d枚ドロー" % amount)

func _apply_status_effect_with_log(target, status: StatusEffect, duration: int, result: Dictionary, color: String, card_name: String, suffix: String) -> void:
	if not target:
		return
	target.apply_status(status, duration)
	result["log"] = _make_effect_log(color, card_name, "%s%s" % [target.card_data.card_name, suffix])

func _apply_targeted_damage_effect(is_player: bool, context: Dictionary, amount: int, result: Dictionary, card_name: String, color: String, suffix: String) -> void:
	var target = _get_random_enemy(is_player, context)
	if not target:
		return
	_apply_damage_and_mark_destroy(target, amount, result)
	result["log"] = _make_effect_log(color, card_name, "%s%s" % [target.card_data.card_name, suffix])

func _apply_targeted_atk_modifier_effect(is_player: bool, context: Dictionary, amount: int, result: Dictionary, card_name: String, color: String, suffix: String) -> void:
	var target = _get_random_enemy(is_player, context)
	if not target:
		return
	target.modify_atk(amount)
	result["log"] = _make_effect_log(color, card_name, "%s%s" % [target.card_data.card_name, suffix])

func _apply_enemy_aoe_atk_modifier_effect(is_player: bool, context: Dictionary, amount: int, result: Dictionary, card_name: String, color: String, message: String) -> void:
	var enemies = _get_all_enemies(is_player, context)
	for enemy in enemies:
		enemy.modify_atk(amount)
	if enemies.size() > 0:
		result["log"] = _make_effect_log(color, card_name, message)

func _apply_damage_to_targets_and_mark_destroy(targets: Array, amount: int, result: Dictionary) -> void:
	for target in targets:
		_apply_damage_and_mark_destroy(target, amount, result)

func _apply_aoe_damage_effect(targets: Array, amount: int, result: Dictionary, card_name: String, color: String, message: String) -> void:
	_apply_damage_to_targets_and_mark_destroy(targets, amount, result)
	if targets.size() > 0:
		result["log"] = _make_effect_log(color, card_name, message)

func _get_slots_by_owner(is_player: bool, context: Dictionary) -> Array:
	if is_player:
		return context.get("player_slots", [])
	return context.get("opponent_slots", [])

func _get_effect_card_from_slot(slot):
	if not slot or slot.is_empty():
		return null
	var card_ui = slot.card_ui
	if not card_ui or not card_ui.card_data:
		return null
	return card_ui

func _collect_targets(is_player: bool, context: Dictionary, for_enemy: bool) -> Array:
	var slots: Array = []
	if for_enemy:
		slots = context.get("opponent_slots", []) if is_player else context.get("player_slots", [])
	else:
		slots = context.get("player_slots", []) if is_player else context.get("opponent_slots", [])

	var targets := []
	for slot in slots:
		var card_ui = _get_effect_card_from_slot(slot)
		if card_ui:
			targets.append(card_ui)
	return targets

func _pick_random_target(targets: Array):
	if targets.size() == 0:
		return null
	return targets[randi() % targets.size()]

func _get_random_enemy(is_player: bool, context: Dictionary):
	return _pick_random_target(_collect_targets(is_player, context, true))

func _get_all_enemies(is_player: bool, context: Dictionary) -> Array:
	return _collect_targets(is_player, context, true)

func _get_random_ally(is_player: bool, context: Dictionary):
	return _pick_random_target(_collect_targets(is_player, context, false))

func _get_all_allies(is_player: bool, context: Dictionary) -> Array:
	return _collect_targets(is_player, context, false)

func _find_slot_for_card(card_ui, slots: Array):
	for slot in slots:
		if slot and not slot.is_empty() and slot.card_ui == card_ui:
			return slot
	return null
