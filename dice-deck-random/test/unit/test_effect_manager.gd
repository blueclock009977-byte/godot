extends GutTest

## EffectManager テスト
## 効果定義とヘルパー関数のテスト

var effect_manager: Node

func before_each() -> void:
	effect_manager = EffectManager

# ═══════════════════════════════════════════
# Timing Enum テスト
# ═══════════════════════════════════════════

func test_timing_enum_values() -> void:
	assert_eq(EffectManager.Timing.ON_SUMMON, 0, "ON_SUMMON should be 0")
	assert_eq(EffectManager.Timing.ON_ATTACK, 1, "ON_ATTACK should be 1")
	assert_eq(EffectManager.Timing.ON_DEATH, 2, "ON_DEATH should be 2")
	assert_eq(EffectManager.Timing.ON_DEFENSE, 3, "ON_DEFENSE should be 3")
	assert_eq(EffectManager.Timing.CONSTANT, 4, "CONSTANT should be 4")
	assert_eq(EffectManager.Timing.TURN_START, 5, "TURN_START should be 5")
	assert_eq(EffectManager.Timing.TURN_END, 6, "TURN_END should be 6")

func test_status_effect_enum_values() -> void:
	assert_eq(EffectManager.StatusEffect.NONE, 0, "NONE should be 0")
	assert_eq(EffectManager.StatusEffect.FROZEN, 1, "FROZEN should be 1")
	assert_eq(EffectManager.StatusEffect.POISON, 2, "POISON should be 2")

# ═══════════════════════════════════════════
# 効果定義テスト
# ═══════════════════════════════════════════

func test_effect_definitions_exist() -> void:
	assert_true(effect_manager.effect_definitions.size() > 0, "Effect definitions should exist")

func test_blue_effects_registered() -> void:
	assert_true(effect_manager.effect_definitions.has("blue_001"), "blue_001 should be registered")
	assert_true(effect_manager.effect_definitions.has("blue_018"), "blue_018 should be registered")

func test_green_effects_registered() -> void:
	assert_true(effect_manager.effect_definitions.has("green_001"), "green_001 should be registered")
	assert_true(effect_manager.effect_definitions.has("green_017"), "green_017 should be registered")

func test_black_effects_registered() -> void:
	assert_true(effect_manager.effect_definitions.has("black_001"), "black_001 should be registered")
	assert_true(effect_manager.effect_definitions.has("black_019"), "black_019 should be registered")

func test_red_effects_registered() -> void:
	assert_true(effect_manager.effect_definitions.has("red_001"), "red_001 should be registered")
	assert_true(effect_manager.effect_definitions.has("red_016"), "red_016 should be registered")

func test_yellow_effects_registered() -> void:
	assert_true(effect_manager.effect_definitions.has("yellow_001"), "yellow_001 should be registered")
	assert_true(effect_manager.effect_definitions.has("yellow_015"), "yellow_015 should be registered")

func test_purple_effects_registered() -> void:
	assert_true(effect_manager.effect_definitions.has("purple_001"), "purple_001 should be registered")
	assert_true(effect_manager.effect_definitions.has("purple_014"), "purple_014 should be registered")

func test_white_effects_registered() -> void:
	assert_true(effect_manager.effect_definitions.has("white_001"), "white_001 should be registered")
	assert_true(effect_manager.effect_definitions.has("white_015"), "white_015 should be registered")

# ═══════════════════════════════════════════
# get_effect_description() テスト
# ═══════════════════════════════════════════

func test_get_effect_description_blue_001() -> void:
	var desc: String = effect_manager.get_effect_description("blue_001")
	assert_eq(desc, "登場時:敵1体ATK-1")

func test_get_effect_description_green_001() -> void:
	var desc: String = effect_manager.get_effect_description("green_001")
	assert_eq(desc, "登場時:マナ+1")

func test_get_effect_description_black_004() -> void:
	var desc: String = effect_manager.get_effect_description("black_004")
	assert_eq(desc, "攻撃時:対象に毒(毎ターンHP-1)")

func test_get_effect_description_invalid() -> void:
	var desc: String = effect_manager.get_effect_description("invalid_effect")
	assert_eq(desc, "", "Invalid effect should return empty string")

# ═══════════════════════════════════════════
# get_effect_timing() テスト
# ═══════════════════════════════════════════

func test_get_effect_timing_on_summon() -> void:
	var timing: int = effect_manager.get_effect_timing("blue_001")
	assert_eq(timing, EffectManager.Timing.ON_SUMMON)

func test_get_effect_timing_on_attack() -> void:
	var timing: int = effect_manager.get_effect_timing("blue_003")
	assert_eq(timing, EffectManager.Timing.ON_ATTACK)

func test_get_effect_timing_on_death() -> void:
	var timing: int = effect_manager.get_effect_timing("black_002")
	assert_eq(timing, EffectManager.Timing.ON_DEATH)

func test_get_effect_timing_on_defense() -> void:
	var timing: int = effect_manager.get_effect_timing("blue_006")
	assert_eq(timing, EffectManager.Timing.ON_DEFENSE)

func test_get_effect_timing_constant() -> void:
	var timing: int = effect_manager.get_effect_timing("blue_002")
	assert_eq(timing, EffectManager.Timing.CONSTANT)

func test_get_effect_timing_turn_start() -> void:
	var timing: int = effect_manager.get_effect_timing("blue_010")
	assert_eq(timing, EffectManager.Timing.TURN_START)

func test_get_effect_timing_turn_end() -> void:
	var timing: int = effect_manager.get_effect_timing("green_016")
	assert_eq(timing, EffectManager.Timing.TURN_END)

# ═══════════════════════════════════════════
# has_timing() テスト
# ═══════════════════════════════════════════

func test_has_timing_true() -> void:
	assert_true(effect_manager.has_timing("blue_001", EffectManager.Timing.ON_SUMMON))
	assert_true(effect_manager.has_timing("blue_003", EffectManager.Timing.ON_ATTACK))
	assert_true(effect_manager.has_timing("black_002", EffectManager.Timing.ON_DEATH))

func test_has_timing_false() -> void:
	assert_false(effect_manager.has_timing("blue_001", EffectManager.Timing.ON_ATTACK))
	assert_false(effect_manager.has_timing("blue_003", EffectManager.Timing.ON_SUMMON))

# ═══════════════════════════════════════════
# 召喚コスト修正テスト
# ═══════════════════════════════════════════

func test_get_summon_cost_modifier_no_effects() -> void:
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	var modifier: int = effect_manager.get_summon_cost_modifier(true, context)
	assert_eq(modifier, 0, "No effects should return 0 modifier")

# ═══════════════════════════════════════════
# ダイス修正テスト
# ═══════════════════════════════════════════

func test_get_dice_modifier_no_effects() -> void:
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	var result: Dictionary = effect_manager.get_dice_modifier(true, context)
	assert_eq(result["bonus"], 0, "No effects should return 0 bonus")
	assert_eq(result["extra_dice"].size(), 0, "No effects should return empty extra_dice")
	assert_eq(result["blocked_dice"].size(), 0, "No effects should return empty blocked_dice")

func test_make_effect_log_format() -> void:
	var log: String = effect_manager._make_effect_log("green", "TestCard", "マナ+2")
	assert_eq(log, "[color=green]TestCard の効果: マナ+2[/color]", "_make_effect_log should build unified effect log format")

# ═══════════════════════════════════════════
# get_constant_hp_bonus() テスト
# ═══════════════════════════════════════════

func test_get_constant_hp_bonus_no_allies() -> void:
	var card_ui := MockCardUI.new()
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	var bonus: int = effect_manager.get_constant_hp_bonus(card_ui, true, context)
	assert_eq(bonus, 0, "No allies should return 0 HP bonus")

func test_get_constant_hp_bonus_green_007() -> void:
	# green_007: 味方全体のHP+1
	var target_ui := MockCardUI.new()
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = MockCardUI.new()
	ally_slot._card_ui.card_data.effect_id = "green_007"
	ally_slot._empty = false
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	var bonus: int = effect_manager.get_constant_hp_bonus(target_ui, true, context)
	assert_eq(bonus, 1, "green_007 should give +1 HP bonus")

func test_get_constant_hp_bonus_white_017() -> void:
	# white_017: 味方全体HP+2
	var target_ui := MockCardUI.new()
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = MockCardUI.new()
	ally_slot._card_ui.card_data.effect_id = "white_017"
	ally_slot._empty = false
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	var bonus: int = effect_manager.get_constant_hp_bonus(target_ui, true, context)
	assert_eq(bonus, 2, "white_017 should give +2 HP bonus")

func test_get_constant_hp_bonus_multiple_buffs() -> void:
	# green_007 + white_017 = +3
	var target_ui := MockCardUI.new()
	var ally1 := MockSlot.new()
	ally1._card_ui = MockCardUI.new()
	ally1._card_ui.card_data.effect_id = "green_007"
	ally1._empty = false
	var ally2 := MockSlot.new()
	ally2._card_ui = MockCardUI.new()
	ally2._card_ui.card_data.effect_id = "white_017"
	ally2._empty = false
	var context := {
		"player_slots": [ally1, ally2],
		"opponent_slots": []
	}
	var bonus: int = effect_manager.get_constant_hp_bonus(target_ui, true, context)
	assert_eq(bonus, 3, "Multiple HP buffs should stack")

# ═══════════════════════════════════════════
# get_damage_reduction_for_card() テスト
# ═══════════════════════════════════════════

func test_get_damage_reduction_no_effects() -> void:
	var card_ui := MockCardUI.new()
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	var reduction: int = effect_manager.get_damage_reduction_for_card(card_ui, true, context)
	assert_eq(reduction, 0, "No effects should return 0 reduction")

func test_get_damage_reduction_yellow_007() -> void:
	# yellow_007: 自身への被ダメ-1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "yellow_007"
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	var reduction: int = effect_manager.get_damage_reduction_for_card(card_ui, true, context)
	assert_eq(reduction, 1, "yellow_007 should give -1 damage reduction")

func test_get_damage_reduction_white_016() -> void:
	# white_016: 自身への被ダメ-2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "white_016"
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	var reduction: int = effect_manager.get_damage_reduction_for_card(card_ui, true, context)
	assert_eq(reduction, 2, "white_016 should give -2 damage reduction")

func test_get_damage_reduction_white_007_ally() -> void:
	# white_007: 味方全体被ダメ-1
	var target_ui := MockCardUI.new()
	var target_slot := MockSlot.new()
	target_slot._card_ui = target_ui
	target_slot._empty = false
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = MockCardUI.new()
	ally_slot._card_ui.card_data.effect_id = "white_007"
	ally_slot._empty = false
	var context := {
		"player_slots": [target_slot, ally_slot],
		"opponent_slots": []
	}
	var reduction: int = effect_manager.get_damage_reduction_for_card(target_ui, true, context)
	assert_eq(reduction, 1, "white_007 ally should give -1 damage reduction")

func test_get_damage_reduction_yellow_017_ally() -> void:
	# yellow_017: 味方全体被ダメ-1
	var target_ui := MockCardUI.new()
	var target_slot := MockSlot.new()
	target_slot._card_ui = target_ui
	target_slot._empty = false
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = MockCardUI.new()
	ally_slot._card_ui.card_data.effect_id = "yellow_017"
	ally_slot._empty = false
	var context := {
		"player_slots": [target_slot, ally_slot],
		"opponent_slots": []
	}
	var reduction: int = effect_manager.get_damage_reduction_for_card(target_ui, true, context)
	assert_eq(reduction, 1, "yellow_017 ally should give -1 damage reduction")

# ═══════════════════════════════════════════
# Mocks for effect manager tests
# ═══════════════════════════════════════════

class MockCardData:
	var card_name: String = "MockCard"
	var effect_id: String = ""
	var mana_cost: int = 1

class MockCardUI:
	var card_data := MockCardData.new()
	var current_hp: int = 5
	var has_revived: bool = false
	var _atk_modifier: int = 0
	var _status := {}
	var _status_duration := {}

	func heal(amount: int) -> void:
		current_hp += amount
	func modify_atk(amount: int) -> void:
		_atk_modifier += amount
	func take_damage(amount: int) -> void:
		current_hp -= amount
	func has_status(status: int) -> bool:
		return _status.get(status, false)
	func apply_status(status: int, duration: int) -> void:
		_status[status] = true
		_status_duration[status] = duration
	func tick_status_effects() -> void:
		for s in _status_duration.keys():
			_status_duration[s] -= 1
			if _status_duration[s] <= 0:
				_status.erase(s)
				_status_duration.erase(s)
	func clear_status_effects() -> void:
		_status.clear()
		_status_duration.clear()

class MockSlot:
	var _empty: bool = true
	var _card_ui = null
	var is_front_row: bool = true

	func is_empty() -> bool:
		return _empty
	var card_ui:
		get:
			return _card_ui
