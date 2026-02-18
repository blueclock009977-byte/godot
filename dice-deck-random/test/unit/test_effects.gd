extends GutTest

func test_effect_manager_exists() -> void:
	# EffectManagerがautoloadとして存在するか
	assert_not_null(EffectManager, "EffectManager should exist as autoload")

func test_effect_definitions_registered() -> void:
	# 効果定義が登録されているか
	assert_true(EffectManager.effect_definitions.size() > 0, "Should have effect definitions")

func test_blue_effects_registered() -> void:
	# 青効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("blue_001"), "blue_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("blue_018"), "blue_018 should be registered")

func test_green_effects_registered() -> void:
	# 緑効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("green_001"), "green_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("green_016"), "green_016 should be registered")

func test_black_effects_registered() -> void:
	# 黒効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("black_001"), "black_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("black_019"), "black_019 should be registered")

func test_get_effect_description() -> void:
	# 効果説明を取得できるか
	var desc := EffectManager.get_effect_description("blue_001")
	assert_eq(desc, "登場時:敵1体ATK-1", "Should return correct description")

func test_get_effect_timing() -> void:
	# 効果タイミングを取得できるか
	var timing := EffectManager.get_effect_timing("blue_001")
	assert_eq(timing, EffectManager.Timing.ON_SUMMON, "blue_001 should be ON_SUMMON")

	timing = EffectManager.get_effect_timing("blue_003")
	assert_eq(timing, EffectManager.Timing.ON_ATTACK, "blue_003 should be ON_ATTACK")

	timing = EffectManager.get_effect_timing("green_002")
	assert_eq(timing, EffectManager.Timing.ON_DEATH, "green_002 should be ON_DEATH")

func test_has_timing() -> void:
	# タイミング判定が正しいか
	assert_true(EffectManager.has_timing("blue_001", EffectManager.Timing.ON_SUMMON))
	assert_false(EffectManager.has_timing("blue_001", EffectManager.Timing.ON_ATTACK))

func test_unknown_effect() -> void:
	# 未知の効果IDの場合
	var desc := EffectManager.get_effect_description("unknown_effect")
	assert_eq(desc, "", "Unknown effect should return empty string")

# ═══════════════════════════════════════════
# Phase 2: 効果処理テスト
# ═══════════════════════════════════════════

func test_dice_modifier_blue_002() -> void:
	# blue_002: ダイス3,4でも攻撃可
	var mock_slot = _create_mock_slot("blue_002")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
		"current_dice": 3
	}
	var modifier := EffectManager.get_dice_modifier(true, context)
	assert_true(3 in modifier.get("extra_dice", []), "blue_002 should add dice 3")
	assert_true(4 in modifier.get("extra_dice", []), "blue_002 should add dice 4")

func test_dice_modifier_black_009() -> void:
	# black_009: 相手のダイス6を無効化
	var mock_slot = _create_mock_slot("black_009")
	var context := {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [mock_slot, null, null, null, null, null],
		"current_dice": 6
	}
	# プレイヤー側のダイス修正を確認（相手がblack_009持ち）
	var modifier := EffectManager.get_dice_modifier(true, context)
	assert_true(6 in modifier.get("blocked_dice", []), "black_009 should block dice 6")

func test_summon_cost_modifier_green_006() -> void:
	# green_006: 味方召喚コスト-1
	var mock_slot = _create_mock_slot("green_006")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
		"current_dice": 1
	}
	var modifier := EffectManager.get_summon_cost_modifier(true, context)
	assert_eq(modifier, -1, "green_006 should reduce summon cost by 1")

func test_all_timings_covered() -> void:
	# 全タイミングが少なくとも1つの効果で使われているか
	var timings_used := {}
	for effect_id in EffectManager.effect_definitions:
		var timing := EffectManager.get_effect_timing(effect_id)
		timings_used[timing] = true

	assert_true(timings_used.has(EffectManager.Timing.ON_SUMMON), "ON_SUMMON should be used")
	assert_true(timings_used.has(EffectManager.Timing.ON_ATTACK), "ON_ATTACK should be used")
	assert_true(timings_used.has(EffectManager.Timing.ON_DEATH), "ON_DEATH should be used")
	assert_true(timings_used.has(EffectManager.Timing.ON_DEFENSE), "ON_DEFENSE should be used")
	assert_true(timings_used.has(EffectManager.Timing.CONSTANT), "CONSTANT should be used")
	assert_true(timings_used.has(EffectManager.Timing.TURN_START), "TURN_START should be used")
	assert_true(timings_used.has(EffectManager.Timing.TURN_END), "TURN_END should be used")

func test_effect_count() -> void:
	# 効果定義が適切な数あるか（青18+緑17+黒19 = 54）
	var count := EffectManager.effect_definitions.size()
	assert_true(count >= 50, "Should have at least 50 effects registered, got %d" % count)

# ═══════════════════════════════════════════
# ヘルパー関数
# ═══════════════════════════════════════════

func _create_mock_slot(effect_id: String):
	# モックスロットを作成
	var mock_slot = MockFieldSlot.new()
	mock_slot.card_ui = MockCardUI.new()
	mock_slot.card_ui.card_data = MockCardData.new()
	mock_slot.card_ui.card_data.effect_id = effect_id
	mock_slot._is_empty = false
	return mock_slot

# モッククラス
class MockFieldSlot:
	var card_ui = null
	var _is_empty: bool = true

	func is_empty() -> bool:
		return _is_empty

class MockCardUI:
	var card_data = null
	var current_atk: int = 1
	var current_hp: int = 1

class MockCardData:
	var effect_id: String = ""
	var card_name: String = "MockCard"

	func has_effect() -> bool:
		return effect_id != ""
