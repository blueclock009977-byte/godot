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

func test_red_effects_registered() -> void:
	# 赤効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("red_001"), "red_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("red_016"), "red_016 should be registered")

func test_yellow_effects_registered() -> void:
	# 黄効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("yellow_001"), "yellow_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("yellow_015"), "yellow_015 should be registered")

func test_purple_effects_registered() -> void:
	# 紫効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("purple_001"), "purple_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("purple_014"), "purple_014 should be registered")

func test_white_effects_registered() -> void:
	# 白効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("white_001"), "white_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("white_015"), "white_015 should be registered")

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
# Phase 3: 効果処理結果テスト
# ═══════════════════════════════════════════

func test_summon_effect_mana_green_001() -> void:
	# green_001: 登場時マナ+1
	var mock_card_ui = _create_mock_card_ui("green_001")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.get("mana", 0), 1, "green_001 should give mana +1")

func test_summon_effect_mana_green_004() -> void:
	# green_004: 登場時マナ+2
	var mock_card_ui = _create_mock_card_ui("green_004")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.get("mana", 0), 2, "green_004 should give mana +2")

func test_summon_effect_self_damage_black() -> void:
	# black_001: 登場時自分HP-1
	var mock_card_ui = _create_mock_card_ui("black_001")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.get("self_damage", 0), 1, "black_001 should deal 1 self damage")

func test_summon_effect_draw_blue_014() -> void:
	# blue_014: 登場時1枚ドロー
	var mock_card_ui = _create_mock_card_ui("blue_014")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.get("draw", 0), 1, "blue_014 should draw 1 card")

func test_summon_effect_draw_and_damage_black_014() -> void:
	# black_014: 登場時自分HP-2, 1枚ドロー
	var mock_card_ui = _create_mock_card_ui("black_014")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.get("self_damage", 0), 2, "black_014 should deal 2 self damage")
	assert_eq(result.get("draw", 0), 1, "black_014 should draw 1 card")

func test_attack_effect_direct_damage_blue_012() -> void:
	# blue_012: 攻撃時追加で相手HP-1
	var attacker = _create_mock_card_ui("blue_012")
	var defender = _create_mock_card_ui("")
	var context := _create_empty_context()
	var result := EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_eq(result.get("direct_damage", 0), 1, "blue_012 should deal 1 direct damage")

func test_attack_effect_mana_green_010() -> void:
	# green_010: 攻撃時マナ+1
	var attacker = _create_mock_card_ui("green_010")
	var defender = _create_mock_card_ui("")
	var context := _create_empty_context()
	var result := EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_eq(result.get("mana", 0), 1, "green_010 should give mana +1 on attack")

func test_attack_effect_lifesteal_black_007() -> void:
	# black_007: 攻撃時与ダメ分自身HP回復
	var attacker = _create_mock_card_ui("black_007")
	var defender = _create_mock_card_ui("")
	var context := _create_empty_context()
	var result := EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_true(result.get("lifesteal", false), "black_007 should have lifesteal")

func test_death_effect_mana_green_002() -> void:
	# green_002: 死亡時マナ+1
	var mock_card_ui = _create_mock_card_ui("green_002")
	var context := _create_empty_context()
	var result := EffectManager.process_death_effect(mock_card_ui, true, context)
	assert_eq(result.get("mana", 0), 1, "green_002 should give mana +1 on death")

func test_death_effect_spawn_token_black_006() -> void:
	# black_006: 死亡時トークン召喚
	var mock_card_ui = _create_mock_card_ui("black_006")
	var context := _create_empty_context()
	var result := EffectManager.process_death_effect(mock_card_ui, true, context)
	assert_true(result.has("spawn_token"), "black_006 should spawn token on death")
	var token = result.get("spawn_token", {})
	assert_eq(token.get("atk", 0), 2, "Token should have 2 ATK")
	assert_eq(token.get("hp", 0), 2, "Token should have 2 HP")

func test_defense_effect_half_damage_blue_006() -> void:
	# blue_006: 防御時被ダメージ半減
	var defender = _create_mock_card_ui("blue_006")
	var context := _create_empty_context()
	var result := EffectManager.process_defense_effect(defender, 10, true, context)
	assert_eq(result.get("final_damage", 10), 5, "blue_006 should halve damage")

func test_defense_effect_mana_on_damage_green_012() -> void:
	# green_012: 被ダメージ時マナ+1
	var defender = _create_mock_card_ui("green_012")
	var context := _create_empty_context()
	var result := EffectManager.process_defense_effect(defender, 5, true, context)
	assert_eq(result.get("mana", 0), 1, "green_012 should give mana +1 on defense")

func test_no_effect_vanilla_card() -> void:
	# バニラカードは効果なし
	var mock_card_ui = _create_mock_card_ui("")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.size(), 0, "Vanilla card should have no summon effect")

func test_multiple_cost_modifiers() -> void:
	# 複数のgreen_006が場にいる場合
	var slot1 = _create_mock_slot("green_006")
	var slot2 = _create_mock_slot("green_006")
	var context := {
		"player_slots": [slot1, slot2, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var modifier := EffectManager.get_summon_cost_modifier(true, context)
	assert_eq(modifier, -2, "Two green_006 should reduce cost by 2")

# ═══════════════════════════════════════════
# Phase 4: 赤・黄・紫・白 効果テスト
# ═══════════════════════════════════════════

func test_summon_effect_red_001() -> void:
	# red_001: 登場時敵1体HP-2
	var mock_card_ui = _create_mock_card_ui("red_001")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	# 敵がいない場合は効果なし、または target_enemy_damage
	# result構造を確認（実装依存）
	assert_true(result.has("target_enemy_damage") or result.size() == 0, "red_001 should have target_enemy_damage or be empty")

func test_summon_effect_yellow_001() -> void:
	# yellow_001: 登場時味方1体HP+2
	var mock_card_ui = _create_mock_card_ui("yellow_001")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_true(result.has("target_ally_heal") or result.size() == 0, "yellow_001 should have target_ally_heal or be empty")

func test_summon_effect_yellow_003() -> void:
	# yellow_003: 登場時手札2枚ドロー
	var mock_card_ui = _create_mock_card_ui("yellow_003")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.get("draw", 0), 2, "yellow_003 should draw 2 cards")

func test_summon_effect_white_001() -> void:
	# white_001: 登場時自分HP+2
	var mock_card_ui = _create_mock_card_ui("white_001")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.get("heal_player", 0), 2, "white_001 should heal_player 2 HP")

func test_summon_effect_white_009() -> void:
	# white_009: 登場時自分HP+4
	var mock_card_ui = _create_mock_card_ui("white_009")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.get("heal_player", 0), 4, "white_009 should heal_player 4 HP")

func test_attack_effect_red_013() -> void:
	# red_013: 攻撃時相手HP直接-1
	var attacker = _create_mock_card_ui("red_013")
	var defender = _create_mock_card_ui("")
	var context := _create_empty_context()
	var result := EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_eq(result.get("direct_damage", 0), 1, "red_013 should deal 1 direct damage")

func test_death_effect_white_002() -> void:
	# white_002: 死亡時自分HP+3
	var mock_card_ui = _create_mock_card_ui("white_002")
	var context := _create_empty_context()
	var result := EffectManager.process_death_effect(mock_card_ui, true, context)
	assert_eq(result.get("heal_player", 0), 3, "white_002 should heal_player 3 HP on death")

func test_defense_effect_yellow_004() -> void:
	# yellow_004: 防御時ダメージを1軽減
	var defender = _create_mock_card_ui("yellow_004")
	var context := _create_empty_context()
	var result := EffectManager.process_defense_effect(defender, 5, true, context)
	assert_eq(result.get("final_damage", 5), 4, "yellow_004 should reduce damage by 1")

func test_cost_modifier_purple_004() -> void:
	# purple_004: 相手の召喚コスト+1
	var mock_slot = _create_mock_slot("purple_004")
	var context := {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [mock_slot, null, null, null, null, null],
	}
	var modifier := EffectManager.get_summon_cost_modifier(true, context)
	assert_eq(modifier, 1, "purple_004 should increase player summon cost by 1")

# ═══════════════════════════════════════════
# Phase 5: ターン開始/終了効果テスト
# ═══════════════════════════════════════════

func test_turn_start_effects_mana_green_009() -> void:
	# green_009: ターン開始時マナ+1
	var mock_slot = _create_mock_slot("green_009")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	assert_eq(results.size(), 1, "Should have 1 turn start effect result")
	assert_eq(results[0].get("mana", 0), 1, "green_009 should give mana +1 at turn start")

func test_turn_start_effects_draw_yellow_005() -> void:
	# yellow_005: ターン開始時カード1枚ドロー
	var mock_slot = _create_mock_slot("yellow_005")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	assert_eq(results.size(), 1, "Should have 1 turn start effect result")
	assert_eq(results[0].get("draw", 0), 1, "yellow_005 should draw 1 card at turn start")

func test_turn_start_effects_heal_player_white_003() -> void:
	# white_003: ターン開始時自分HP+1
	var mock_slot = _create_mock_slot("white_003")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	assert_eq(results.size(), 1, "Should have 1 turn start effect result")
	assert_eq(results[0].get("heal_player", 0), 1, "white_003 should heal player 1 HP at turn start")

func test_turn_start_effects_self_heal_blue_010() -> void:
	# blue_010: ターン開始時自身HP+1
	var mock_slot = _create_mock_slot("blue_010")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	assert_eq(results.size(), 1, "Should have 1 turn start effect result")
	# blue_010はcard_ui.heal(1)を直接呼ぶのでlogのみ返る
	assert_true(results[0].has("log"), "blue_010 should have log")

func test_turn_start_effects_atk_up_red_010() -> void:
	# red_010: ターン開始時自身ATK+1
	var mock_slot = _create_mock_slot("red_010")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	assert_eq(results.size(), 1, "Should have 1 turn start effect result")
	# red_010はcard_ui.modify_atk(1)を直接呼ぶのでlogのみ返る
	assert_true(results[0].has("log"), "red_010 should have log")

func test_turn_end_effects_mana_yellow_010() -> void:
	# yellow_010: ターン終了時マナ+1
	var mock_slot = _create_mock_slot("yellow_010")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_end_effects(true, context)
	assert_eq(results.size(), 1, "Should have 1 turn end effect result")
	assert_eq(results[0].get("mana", 0), 1, "yellow_010 should give mana +1 at turn end")

func test_turn_end_effects_heal_player_white_010() -> void:
	# white_010: ターン終了時自分HP+2
	var mock_slot = _create_mock_slot("white_010")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_end_effects(true, context)
	assert_eq(results.size(), 1, "Should have 1 turn end effect result")
	assert_eq(results[0].get("heal_player", 0), 2, "white_010 should heal player 2 HP at turn end")

func test_turn_start_effects_multiple_cards() -> void:
	# 複数カードの効果が同時に発動するか
	var slot1 = _create_mock_slot("green_009")  # マナ+1
	var slot2 = _create_mock_slot("yellow_005")  # 1枚ドロー
	var context := {
		"player_slots": [slot1, slot2, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	assert_eq(results.size(), 2, "Should have 2 turn start effect results")

func test_turn_start_no_effect_vanilla() -> void:
	# バニラカードは効果なし
	var mock_slot = _create_mock_slot("")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	assert_eq(results.size(), 0, "Vanilla card should have no turn start effect")

# ═══════════════════════════════════════════
# Phase 6: 状態異常テスト
# ═══════════════════════════════════════════

func test_attack_effect_freeze_blue_003() -> void:
	# blue_003: 攻撃時対象を凍結
	var attacker = _create_mock_card_ui("blue_003")
	var defender = _create_mock_card_ui("")
	var context := _create_empty_context()
	EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_eq(defender._status, EffectManager.StatusEffect.FROZEN, "blue_003 should freeze defender")
	assert_eq(defender._status_duration, 1, "blue_003 freeze should last 1 turn")

func test_attack_effect_freeze_2turn_blue_008() -> void:
	# blue_008: 攻撃時対象を2ターン凍結
	var attacker = _create_mock_card_ui("blue_008")
	var defender = _create_mock_card_ui("")
	var context := _create_empty_context()
	EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_eq(defender._status, EffectManager.StatusEffect.FROZEN, "blue_008 should freeze defender")
	assert_eq(defender._status_duration, 2, "blue_008 freeze should last 2 turns")

func test_attack_effect_poison_black_004() -> void:
	# black_004: 攻撃時対象に毒
	var attacker = _create_mock_card_ui("black_004")
	var defender = _create_mock_card_ui("")
	var context := _create_empty_context()
	EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_eq(defender._status, EffectManager.StatusEffect.POISON, "black_004 should poison defender")

func test_summon_effect_freeze_all_blue_018() -> void:
	# blue_018: 登場時敵全体を1ターン凍結
	var mock_card_ui = _create_mock_card_ui("blue_018")
	var enemy1 = _create_mock_slot_with_ui("")
	var enemy2 = _create_mock_slot_with_ui("")
	var context := {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [enemy1, enemy2, null, null, null, null],
	}
	EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(enemy1.card_ui._status, EffectManager.StatusEffect.FROZEN, "blue_018 should freeze enemy1")
	assert_eq(enemy2.card_ui._status, EffectManager.StatusEffect.FROZEN, "blue_018 should freeze enemy2")

func test_summon_effect_purple_001() -> void:
	# purple_001: 登場時敵1体のダイス1つ無効化
	var mock_card_ui = _create_mock_card_ui("purple_001")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(result.get("disable_dice", 0), 1, "purple_001 should disable 1 enemy dice")

func test_summon_effect_freeze_one_purple_009() -> void:
	# purple_009: 登場時敵1体を2ターン凍結
	var mock_card_ui = _create_mock_card_ui("purple_009")
	var enemy1 = _create_mock_slot_with_ui("")
	var context := {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [enemy1, null, null, null, null, null],
	}
	EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(enemy1.card_ui._status, EffectManager.StatusEffect.FROZEN, "purple_009 should freeze enemy")
	assert_eq(enemy1.card_ui._status_duration, 2, "purple_009 freeze should last 2 turns")

func test_summon_effect_clear_status_white_013() -> void:
	# white_013: 登場時味方全体の状態異常解除
	var mock_card_ui = _create_mock_card_ui("white_013")
	var ally1 = _create_mock_slot_with_ui("")
	ally1.card_ui._status = EffectManager.StatusEffect.FROZEN
	ally1.card_ui._status_duration = 2
	var ally2 = _create_mock_slot_with_ui("")
	ally2.card_ui._status = EffectManager.StatusEffect.POISON
	ally2.card_ui._status_duration = 99
	var context := {
		"player_slots": [ally1, ally2, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_eq(ally1.card_ui._status, 0, "white_013 should clear ally1 status")
	assert_eq(ally2.card_ui._status, 0, "white_013 should clear ally2 status")

func test_death_effect_freeze_purple_005() -> void:
	# purple_005: 死亡時敵1体を凍結
	var mock_card_ui = _create_mock_card_ui("purple_005")
	var enemy1 = _create_mock_slot_with_ui("")
	var context := {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [enemy1, null, null, null, null, null],
	}
	EffectManager.process_death_effect(mock_card_ui, true, context)
	assert_eq(enemy1.card_ui._status, EffectManager.StatusEffect.FROZEN, "purple_005 should freeze enemy on death")

# ═══════════════════════════════════════════
# Phase 7: 効果発動スモークテスト（発動有無の見える化）
# ═══════════════════════════════════════════

func test_smoke_effects_trigger_on_each_timing() -> void:
	# ON_SUMMON
	var summon_card = _create_mock_card_ui("green_001")
	var summon_result: Dictionary = EffectManager.process_summon_effect(summon_card, true, _create_empty_context())
	assert_eq(summon_result.get("mana", 0), 1, "ON_SUMMON effect should trigger")

	# ON_ATTACK
	var atk_card = _create_mock_card_ui("blue_012")
	var atk_result: Dictionary = EffectManager.process_attack_effect(atk_card, _create_mock_card_ui(""), true, _create_empty_context())
	assert_eq(atk_result.get("direct_damage", 0), 1, "ON_ATTACK effect should trigger")

	# ON_DEATH
	var death_card = _create_mock_card_ui("green_002")
	var death_result: Dictionary = EffectManager.process_death_effect(death_card, true, _create_empty_context())
	assert_eq(death_result.get("mana", 0), 1, "ON_DEATH effect should trigger")

	# ON_DEFENSE
	var def_card = _create_mock_card_ui("yellow_004")
	var def_result: Dictionary = EffectManager.process_defense_effect(def_card, 5, true, _create_empty_context())
	assert_eq(def_result.get("final_damage", 5), 4, "ON_DEFENSE effect should trigger")

func test_smoke_summon_effect_returns_log_as_activation_evidence() -> void:
	var summon_card = _create_mock_card_ui("green_001")
	var result: Dictionary = EffectManager.process_summon_effect(summon_card, true, _create_empty_context())
	assert_true(result.has("log"), "Summon effect should return log when triggered")
	assert_eq(result.get("mana", 0), 1, "green_001 activation result should include mana +1")

func test_detect_unimplemented_on_summon_effect_ids() -> void:
	# ON_SUMMONの効果IDで、処理が未実装のものを検出する
	var context := {
		"player_slots": [_create_mock_slot_with_ui(""), null, null, null, null, null],
		"opponent_slots": [_create_mock_slot_with_ui(""), null, null, null, null, null],
		"current_dice": 1
	}
	var missing: Array[String] = []

	for effect_id in EffectManager.effect_definitions.keys():
		if EffectManager.get_effect_timing(effect_id) != EffectManager.Timing.ON_SUMMON:
			continue
		var result: Dictionary = EffectManager.process_summon_effect(_create_mock_card_ui(effect_id), true, context)
		if result.size() == 0:
			missing.append(effect_id)

	assert_eq(missing, [], "ON_SUMMON未実装: %s" % [", ".join(missing)])

func test_detect_unimplemented_on_attack_effect_ids() -> void:
	# ON_ATTACKの効果IDで、処理が未実装のものを検出する
	var context := _create_empty_context()
	var missing: Array[String] = []

	for effect_id in EffectManager.effect_definitions.keys():
		if EffectManager.get_effect_timing(effect_id) != EffectManager.Timing.ON_ATTACK:
			continue
		var attacker = _create_mock_card_ui(effect_id)
		var defender = _create_mock_card_ui("")
		var result: Dictionary = EffectManager.process_attack_effect(attacker, defender, true, context)
		if result.size() == 0:
			missing.append(effect_id)

	assert_eq(missing, [], "ON_ATTACK未実装: %s" % [", ".join(missing)])

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

func _create_mock_slot_with_ui(effect_id: String):
	# カードUIを持つモックスロットを作成（状態異常テスト用）
	var mock_slot = MockFieldSlot.new()
	mock_slot.card_ui = MockCardUI.new()
	mock_slot.card_ui.card_data = MockCardData.new()
	mock_slot.card_ui.card_data.effect_id = effect_id
	mock_slot.card_ui.card_data.card_name = "TestCard_" + effect_id
	mock_slot._is_empty = false
	return mock_slot

func _create_mock_card_ui(effect_id: String):
	# モックCardUIを作成
	var mock = MockCardUI.new()
	mock.card_data = MockCardData.new()
	mock.card_data.effect_id = effect_id
	mock.card_data.card_name = "TestCard_" + effect_id
	return mock

func _create_empty_context() -> Dictionary:
	return {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
		"current_dice": 1
	}

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
	var _status: int = 0  # StatusEffect.NONE
	var _status_duration: int = 0
	var shield_used: bool = false
	var healed_amount: int = 0
	var atk_modified: int = 0
	var damage_taken: int = 0

	func heal(amount: int) -> void:
		healed_amount += amount
		current_hp += amount

	func modify_atk(delta: int) -> void:
		atk_modified += delta
		current_atk += delta

	func take_damage(amount: int) -> void:
		damage_taken += amount
		current_hp -= amount

	func has_status(status: int) -> bool:
		return _status == status

	func apply_status(status: int, duration: int) -> void:
		_status = status
		_status_duration = duration

	func clear_status_effects() -> void:
		_status = 0
		_status_duration = 0

	func tick_status_effects() -> void:
		# モックなので何もしない
		pass

class MockCardData:
	var effect_id: String = ""
	var card_name: String = "MockCard"
	var mana_cost: int = 1

	func has_effect() -> bool:
		return effect_id != ""
