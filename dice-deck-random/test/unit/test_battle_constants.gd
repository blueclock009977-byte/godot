extends GutTest

## BattleConstants テスト
## 共通定数とヘルパー関数のテスト

# ═══════════════════════════════════════════
# 定数テスト
# ═══════════════════════════════════════════

func test_max_hp_is_15() -> void:
	assert_eq(BattleConstants.MAX_HP, 15, "MAX_HP should be 15")

func test_max_mana_cap_is_5() -> void:
	assert_eq(BattleConstants.MAX_MANA_CAP, 5, "MAX_MANA_CAP should be 5")

func test_move_cost_is_1() -> void:
	assert_eq(BattleConstants.MOVE_COST, 1, "MOVE_COST should be 1")

func test_default_starting_hand_is_4() -> void:
	assert_eq(BattleConstants.DEFAULT_STARTING_HAND, 4, "DEFAULT_STARTING_HAND should be 4")

func test_card_size_hand_is_120() -> void:
	assert_eq(BattleConstants.CARD_SIZE_HAND, 120, "CARD_SIZE_HAND should be 120")

func test_card_size_field_is_175() -> void:
	assert_eq(BattleConstants.CARD_SIZE_FIELD, 175, "CARD_SIZE_FIELD should be 175")

func test_card_size_preview_is_300() -> void:
	assert_eq(BattleConstants.CARD_SIZE_PREVIEW, 300, "CARD_SIZE_PREVIEW should be 300")

# ═══════════════════════════════════════════
# Phase Enum テスト
# ═══════════════════════════════════════════

func test_phase_enum_values() -> void:
	assert_eq(BattleConstants.Phase.MAIN1, 0, "MAIN1 should be 0")
	assert_eq(BattleConstants.Phase.DICE, 1, "DICE should be 1")
	assert_eq(BattleConstants.Phase.DRAW, 2, "DRAW should be 2")
	assert_eq(BattleConstants.Phase.MAIN2, 3, "MAIN2 should be 3")
	assert_eq(BattleConstants.Phase.END, 4, "END should be 4")

# ═══════════════════════════════════════════
# SelectMode Enum テスト
# ═══════════════════════════════════════════

func test_select_mode_enum_values() -> void:
	assert_eq(BattleConstants.SelectMode.NONE, 0, "NONE should be 0")
	assert_eq(BattleConstants.SelectMode.SUMMON_SELECT_SLOT, 1, "SUMMON_SELECT_SLOT should be 1")
	assert_eq(BattleConstants.SelectMode.MOVE_SELECT_SLOT, 2, "MOVE_SELECT_SLOT should be 2")

# ═══════════════════════════════════════════
# get_phase_name() テスト
# ═══════════════════════════════════════════

func test_get_phase_name_main1() -> void:
	assert_eq(BattleConstants.get_phase_name(BattleConstants.Phase.MAIN1), "メイン1")

func test_get_phase_name_dice() -> void:
	assert_eq(BattleConstants.get_phase_name(BattleConstants.Phase.DICE), "ダイス")

func test_get_phase_name_draw() -> void:
	assert_eq(BattleConstants.get_phase_name(BattleConstants.Phase.DRAW), "ドロー&1マナ回復")

func test_get_phase_name_main2() -> void:
	assert_eq(BattleConstants.get_phase_name(BattleConstants.Phase.MAIN2), "メイン2")

func test_get_phase_name_end() -> void:
	assert_eq(BattleConstants.get_phase_name(BattleConstants.Phase.END), "終了")

func test_get_phase_name_invalid() -> void:
	assert_eq(BattleConstants.get_phase_name(999), "?", "Invalid phase should return ?")
