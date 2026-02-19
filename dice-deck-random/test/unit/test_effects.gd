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

func test_summon_effect_blue_011_uses_unified_log_format() -> void:
	var mock_card_ui = _create_mock_card_ui("blue_011")
	var context := _create_empty_context()
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	var expected := EffectManager._make_effect_log("cyan", mock_card_ui.card_data.card_name, "次のダイス+1")
	assert_eq(result.get("log", ""), expected, "blue_011 should use unified effect log format helper")

func test_summon_effect_blue_018_uses_unified_log_format() -> void:
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("\"blue_018\""), -1, "blue_018 summon handler should exist")
	assert_ne(script_text.find("_make_effect_log(\"cyan\", card_name, \"敵全体を凍結\")"), -1,
		"blue_018 should use shared log helper for unified formatting")

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

func test_attack_effect_black_015_marks_self_destroy_when_hp_zero() -> void:
	var attacker = _create_mock_card_ui("black_015")
	attacker.current_hp = 1
	var defender = _create_mock_card_ui("")
	var context := _create_empty_context()
	var result := EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_true(result.has("destroy_targets"), "black_015 should mark destroy_targets when self HP <= 0")
	assert_eq(result["destroy_targets"].size(), 1, "black_015 should mark exactly one destroyed attacker")
	assert_eq(result["destroy_targets"][0], attacker, "black_015 should mark attacker as destroyed target")

func test_attack_effect_black_016_halves_odd_hp_and_marks_destroy_on_hp1() -> void:
	var attacker = _create_mock_card_ui("black_016")
	var defender = _create_mock_card_ui("")
	defender.current_hp = 1
	var context := _create_empty_context()
	var result := EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_eq(defender.current_hp, 0, "black_016 should reduce HP 1 target to 0 (half with ceil damage)")
	assert_true(result.has("destroy_targets"), "black_016 should mark destroy_targets when target HP <= 0")
	assert_eq(result["destroy_targets"].size(), 1, "black_016 should mark exactly one destroyed defender")
	assert_eq(result["destroy_targets"][0], defender, "black_016 should mark defender as destroyed target")

func test_attack_effect_blue_017_sets_instant_kill_for_low_hp_target() -> void:
	var attacker = _create_mock_card_ui("blue_017")
	var defender = _create_mock_card_ui("")
	defender.current_hp = 5
	var context := _create_empty_context()
	var result := EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_true(result.get("instant_kill", false), "blue_017 should produce instant_kill flag for HP5以下 target")

func test_death_effect_red_014_marks_destroy_target_when_hp_zero() -> void:
	var mock_card_ui = _create_mock_card_ui("red_014")
	var enemy_slot = _create_mock_slot_with_ui("")
	enemy_slot.card_ui.current_hp = 4
	var context := {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [enemy_slot, null, null, null, null, null],
		"current_dice": 1
	}
	var result := EffectManager.process_death_effect(mock_card_ui, true, context)
	assert_true(result.has("destroy_targets"), "red_014 should mark destroy_targets when target HP <= 0")
	assert_eq(result["destroy_targets"].size(), 1, "red_014 should mark exactly 1 destroyed target")

func test_death_effect_mana_green_002() -> void:
	# green_002: 死亡時マナ+1
	var mock_card_ui = _create_mock_card_ui("green_002")
	var context := _create_empty_context()
	var result := EffectManager.process_death_effect(mock_card_ui, true, context)
	assert_eq(result.get("mana", 0), 1, "green_002 should give mana +1 on death")

func test_death_effect_green_014_triggers_on_ally_death() -> void:
	# green_014: 味方死亡時に自身HP+2
	var watcher = _create_mock_card_ui("green_014")
	watcher.current_hp = 3
	var context := _create_empty_context()
	context["ally_died"] = true
	context["dead_card_ui"] = _create_mock_card_ui("")
	var result := EffectManager.process_death_effect(watcher, true, context)
	assert_eq(watcher.current_hp, 5, "green_014 should heal itself by 2 when ally dies")
	assert_true(result.has("log"), "green_014 ally death trigger should produce log")

func test_death_effect_spawn_token_black_006() -> void:
	# black_006: 死亡時トークン召喚
	var mock_card_ui = _create_mock_card_ui("black_006")
	var context := _create_empty_context()
	var result := EffectManager.process_death_effect(mock_card_ui, true, context)
	assert_true(result.has("spawn_token"), "black_006 should spawn token on death")
	var token = result.get("spawn_token", {})
	assert_eq(token.get("atk", 0), 2, "Token should have 2 ATK")
	assert_eq(token.get("hp", 0), 2, "Token should have 2 HP")

func test_death_effect_black_010_marks_destroy_targets_when_hp_zero() -> void:
	var mock_card_ui = _create_mock_card_ui("black_010")
	var enemy1 = _create_mock_slot_with_ui("")
	var enemy2 = _create_mock_slot_with_ui("")
	enemy1.card_ui.current_hp = 1
	enemy2.card_ui.current_hp = 3
	var context := {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [enemy1, enemy2, null, null, null, null],
		"current_dice": 1
	}
	var result := EffectManager.process_death_effect(mock_card_ui, true, context)
	assert_true(result.has("destroy_targets"), "black_010 should mark destroyed enemies")
	assert_eq(result["destroy_targets"].size(), 1, "black_010 should mark only enemies reduced to HP <= 0")

func test_death_effect_black_002_marks_destroy_target_when_hp_zero() -> void:
	var mock_card_ui = _create_mock_card_ui("black_002")
	var enemy_slot = _create_mock_slot_with_ui("")
	enemy_slot.card_ui.current_hp = 2
	var context := {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [enemy_slot, null, null, null, null, null],
		"current_dice": 1
	}
	var result := EffectManager.process_death_effect(mock_card_ui, true, context)
	assert_true(result.has("destroy_targets"), "black_002 should mark destroy_targets when target HP <= 0")
	assert_eq(result["destroy_targets"].size(), 1, "black_002 should mark exactly 1 destroyed target")

func test_defense_effect_half_damage_blue_006() -> void:
	# blue_006: 防御時被ダメージ半減
	var defender = _create_mock_card_ui("blue_006")
	var context := _create_empty_context()
	var result := EffectManager.process_defense_effect(defender, 10, true, context)
	assert_eq(result.get("final_damage", 10), 5, "blue_006 should halve damage")

func test_defense_effect_half_damage_blue_006_rounds_down_and_keeps_int() -> void:
	var defender = _create_mock_card_ui("blue_006")
	var context := _create_empty_context()
	var result := EffectManager.process_defense_effect(defender, 5, true, context)
	assert_eq(typeof(result.get("final_damage")), TYPE_INT, "blue_006 final_damage should stay int")
	assert_eq(result.get("final_damage", 5), 2, "blue_006 should floor half damage for odd values")

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
	# 敵がいない場合は効果なし
	assert_true(result.size() == 0, "red_001 should be empty when no enemies")

func test_summon_effect_red_001_marks_destroy_target_when_hp_zero() -> void:
	var mock_card_ui = _create_mock_card_ui("red_001")
	var enemy_slot = _create_mock_slot_with_ui("")
	enemy_slot.card_ui.current_hp = 2
	var context := {
		"player_slots": [null, null, null, null, null, null],
		"opponent_slots": [enemy_slot, null, null, null, null, null],
		"current_dice": 1
	}
	var result := EffectManager.process_summon_effect(mock_card_ui, true, context)
	assert_true(result.has("destroy_targets"), "red_001 should mark destroy_targets when target HP <= 0")
	assert_eq(result["destroy_targets"].size(), 1, "red_001 should mark exactly 1 destroyed target")

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

func test_attack_effect_red_002_marks_destroy_target_when_hp_zero() -> void:
	var attacker = _create_mock_card_ui("red_002")
	var defender = _create_mock_card_ui("")
	defender.current_hp = 2
	var context := _create_empty_context()
	var result := EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_true(result.has("destroy_targets"), "red_002 should mark destroy_targets when target HP <= 0")
	assert_eq(result["destroy_targets"].size(), 1, "red_002 should mark exactly 1 destroyed target")

func test_attack_effect_red_002_tracks_damaged_target_for_post_damage_finalize() -> void:
	var attacker = _create_mock_card_ui("red_002")
	var defender = _create_mock_card_ui("")
	defender.current_hp = 3
	var context := _create_empty_context()
	var result := EffectManager.process_attack_effect(attacker, defender, true, context)
	assert_true(result.has("damaged_targets"), "red_002 should record damaged_targets for centralized post-damage handling")
	assert_eq(result["damaged_targets"].size(), 1, "red_002 should track exactly one damaged target")
	assert_eq(result["damaged_targets"][0], defender, "red_002 damaged_targets should include defender")

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

func test_turn_end_effects_purple_008_marks_destroy_target_when_hp_zero() -> void:
	var mock_slot = _create_mock_slot("purple_008")
	var enemy = _create_mock_slot_with_ui("")
	enemy.card_ui.current_hp = 1
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [enemy, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_end_effects(true, context)
	assert_eq(results.size(), 1, "purple_008 should produce one turn-end result")
	assert_true(results[0].has("destroy_targets"), "purple_008 should mark destroy_targets")
	assert_eq(results[0]["destroy_targets"].size(), 1, "purple_008 should mark destroyed enemy")

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

func test_turn_start_effects_skips_malformed_slot_and_continues() -> void:
	# 先頭スロットが壊れていても後続カードの効果発動が漏れないこと
	var malformed_slot = MockFieldSlot.new()
	malformed_slot._is_empty = false
	malformed_slot.card_ui = null
	var valid_slot = _create_mock_slot("green_009")
	var context := {
		"player_slots": [malformed_slot, valid_slot, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	assert_eq(results.size(), 1, "Malformed slot should be skipped and valid slot effect should still trigger")
	assert_eq(results[0].get("mana", 0), 1, "green_009 should still give mana +1")

func test_turn_start_no_effect_vanilla() -> void:
	# バニラカードは効果なし
	var mock_slot = _create_mock_slot("")
	var context := {
		"player_slots": [mock_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	assert_eq(results.size(), 0, "Vanilla card should have no turn start effect")

func test_turn_start_poison_damage_marks_destroy_target_when_hp_zero() -> void:
	var poisoned = _create_mock_slot_with_ui("")
	poisoned.card_ui.current_hp = 1
	poisoned.card_ui._status = EffectManager.StatusEffect.POISON
	poisoned.card_ui._status_duration = 99
	var context := {
		"player_slots": [poisoned, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var results: Array = EffectManager.process_turn_start_effects(true, context)
	var poison_result: Dictionary = {}
	for r in results:
		if r.get("log", "").find("毒で1ダメージ") != -1:
			poison_result = r
			break
	assert_true(poison_result.has("destroy_targets"), "Poison tick should mark destroy_targets when HP <= 0")
	assert_eq(poison_result["destroy_targets"].size(), 1, "Poison tick should mark exactly one destroyed target")

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

func test_process_timing_event_dispatch_on_summon() -> void:
	var summon_card = _create_mock_card_ui("green_001")
	var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_SUMMON, {
		"card_ui": summon_card,
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.get("mana", 0), 1, "Dispatcher should route ON_SUMMON to summon handler")

func test_process_timing_event_dispatch_on_summon_with_summon_card_ui_fallback() -> void:
	var summon_card = _create_mock_card_ui("green_001")
	var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_SUMMON, {
		"summon_card_ui": summon_card,
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.get("mana", 0), 1, "ON_SUMMON should accept unified summon_card_ui payload")

func test_process_timing_event_dispatch_on_attack() -> void:
	var atk_card = _create_mock_card_ui("blue_012")
	var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_ATTACK, {
		"attacker_ui": atk_card,
		"defender_ui": _create_mock_card_ui(""),
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.get("direct_damage", 0), 1, "Dispatcher should route ON_ATTACK to attack handler")

func test_process_timing_event_dispatch_on_attack_with_generic_card_ui() -> void:
	var atk_card = _create_mock_card_ui("blue_012")
	var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_ATTACK, {
		"card_ui": atk_card,
		"defender_ui": _create_mock_card_ui(""),
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.get("direct_damage", 0), 1, "ON_ATTACK should accept unified card_ui payload")

func test_process_timing_event_dispatch_on_attack_with_attack_card_ui_alias() -> void:
	# 再現: ON_ATTACK payload が attack_card_ui だと attacker解決できず効果発動漏れ
	var atk_card = _create_mock_card_ui("blue_012")
	var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_ATTACK, {
		"attack_card_ui": atk_card,
		"defender_ui": _create_mock_card_ui(""),
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.get("direct_damage", 0), 1, "ON_ATTACK should accept attack_card_ui payload alias")

func test_timing_dispatch_method_table_routes_all_event_timings() -> void:
	var summon_result = EffectManager._dispatch_timing_via_method_table(
		EffectManager.Timing.ON_SUMMON,
		{"card_ui": _create_mock_card_ui("green_001")},
		{},
		true,
		_create_empty_context()
	)
	assert_eq(summon_result.get("mana", 0), 1, "method table should route ON_SUMMON through summon dispatcher")

	var attack_result = EffectManager._dispatch_timing_via_method_table(
		EffectManager.Timing.ON_ATTACK,
		{"attacker_ui": _create_mock_card_ui("blue_012"), "defender_ui": _create_mock_card_ui("")},
		{"defender_ui": ["defender_ui"]},
		true,
		_create_empty_context()
	)
	assert_eq(attack_result.get("direct_damage", 0), 1, "method table should route ON_ATTACK through attack dispatcher")

	var death_result = EffectManager._dispatch_timing_via_method_table(
		EffectManager.Timing.ON_DEATH,
		{"card_ui": _create_mock_card_ui("green_002")},
		{},
		true,
		_create_empty_context()
	)
	assert_eq(death_result.get("mana", 0), 1, "method table should route ON_DEATH through death dispatcher")

	var defense_result = EffectManager._dispatch_timing_via_method_table(
		EffectManager.Timing.ON_DEFENSE,
		{"defender_ui": _create_mock_card_ui("yellow_004"), "damage": 5},
		{"damage": ["damage"]},
		true,
		_create_empty_context()
	)
	assert_eq(defense_result.get("final_damage", 5), 4, "method table should route ON_DEFENSE through defense dispatcher")

	var turn_start_context := {
		"player_slots": [_create_mock_slot("green_009"), null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var turn_start_result = EffectManager._dispatch_timing_via_method_table(
		EffectManager.Timing.TURN_START,
		{},
		{},
		true,
		turn_start_context
	)
	assert_eq(turn_start_result.size(), 1, "method table should route TURN_START through turn-start dispatcher")

	var turn_end_context := {
		"player_slots": [_create_mock_slot("yellow_010"), null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var turn_end_result = EffectManager._dispatch_timing_via_method_table(
		EffectManager.Timing.TURN_END,
		{},
		{},
		true,
		turn_end_context
	)
	assert_eq(turn_end_result.size(), 1, "method table should route TURN_END through turn-end dispatcher")

func test_dispatch_timing_via_fallback_match_covers_on_summon_and_on_attack() -> void:
	var summon_result: Dictionary = EffectManager._dispatch_timing_via_fallback_match(
		EffectManager.Timing.ON_SUMMON,
		{"card_ui": _create_mock_card_ui("green_001")},
		{},
		true,
		_create_empty_context()
	)
	assert_eq(summon_result.get("mana", 0), 1, "fallback dispatcher should route ON_SUMMON")

	var attack_result: Dictionary = EffectManager._dispatch_timing_via_fallback_match(
		EffectManager.Timing.ON_ATTACK,
		{"attacker_ui": _create_mock_card_ui("blue_012"), "defender_ui": _create_mock_card_ui("")},
		{"defender_ui": ["defender_ui"]},
		true,
		_create_empty_context()
	)
	assert_eq(attack_result.get("direct_damage", 0), 1, "fallback dispatcher should route ON_ATTACK")

func test_process_timing_event_dispatch_on_death() -> void:
	var death_card = _create_mock_card_ui("green_002")
	var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_DEATH, {
		"card_ui": death_card,
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.get("mana", 0), 1, "Dispatcher should route ON_DEATH to death handler")

func test_process_timing_event_dispatch_on_death_with_dead_card_ui_fallback() -> void:
	var death_card = _create_mock_card_ui("green_002")
	var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_DEATH, {
		"dead_card_ui": death_card,
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.get("mana", 0), 1, "ON_DEATH should accept unified dead_card_ui payload")

func test_process_timing_event_dispatch_on_defense() -> void:
	var defender = _create_mock_card_ui("yellow_004")
	var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_DEFENSE, {
		"defender_ui": defender,
		"damage": 5,
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.get("final_damage", 5), 4, "Dispatcher should route ON_DEFENSE to defense handler")

func test_process_timing_event_dispatch_on_defense_with_generic_card_ui() -> void:
	var defender = _create_mock_card_ui("yellow_004")
	var result: Dictionary = EffectManager.process_timing_event(EffectManager.Timing.ON_DEFENSE, {
		"card_ui": defender,
		"damage": 5,
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.get("final_damage", 5), 4, "ON_DEFENSE should accept unified card_ui payload")

func test_process_timing_event_dispatch_on_turn_start() -> void:
	var context := {
		"player_slots": [_create_mock_slot("green_009"), null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var result: Array = EffectManager.process_timing_event(EffectManager.Timing.TURN_START, {
		"is_player": true,
		"context": context
	})
	assert_eq(result.size(), 1, "Dispatcher should route TURN_START to turn-start handler")
	assert_eq(result[0].get("mana", 0), 1, "TURN_START dispatcher should preserve handler result")

func test_process_timing_event_dispatch_on_turn_start_with_card_ui_payload() -> void:
	var card_ui = _create_mock_card_ui("green_009")
	var result: Array = EffectManager.process_timing_event(EffectManager.Timing.TURN_START, {
		"card_ui": card_ui,
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.size(), 1, "TURN_START should accept unified card_ui payload for single-card dispatch")
	assert_eq(result[0].get("mana", 0), 1, "TURN_START single-card dispatch should use effect_id handler")

func test_process_timing_event_turn_start_single_card_payload_does_not_trigger_board_wide_scan() -> void:
	# 再現: card_ui 指定イベント時に盤面スキャンまで走ると効果が二重/誤発火する
	var board_slot = _create_mock_slot("yellow_005")
	var context := {
		"player_slots": [board_slot, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var result: Array = EffectManager.process_timing_event(EffectManager.Timing.TURN_START, {
		"card_ui": _create_mock_card_ui("green_009"),
		"is_player": true,
		"context": context
	})
	assert_eq(result.size(), 1, "single-card TURN_START payload should return only one result")
	assert_eq(result[0].get("mana", 0), 1, "single-card TURN_START payload should apply payload card effect")
	assert_false(result[0].has("draw"), "single-card TURN_START payload should not also include board slot draw effect")

func test_process_timing_event_dispatch_on_turn_end() -> void:
	var context := {
		"player_slots": [_create_mock_slot("yellow_010"), null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	var result: Array = EffectManager.process_timing_event(EffectManager.Timing.TURN_END, {
		"is_player": true,
		"context": context
	})
	assert_eq(result.size(), 1, "Dispatcher should route TURN_END to turn-end handler")
	assert_eq(result[0].get("mana", 0), 1, "TURN_END dispatcher should preserve handler result")

func test_process_timing_event_dispatch_on_turn_end_with_turn_end_card_ui_alias() -> void:
	# 再現: TURN_END の event payload が turn_end_card_ui の場合、単体ディスパッチされず効果漏れする
	var card_ui = _create_mock_card_ui("yellow_010")
	var result: Array = EffectManager.process_timing_event(EffectManager.Timing.TURN_END, {
		"turn_end_card_ui": card_ui,
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(result.size(), 1, "TURN_END should accept turn_end_card_ui payload alias for single-card dispatch")
	assert_eq(result[0].get("mana", 0), 1, "TURN_END turn_end_card_ui alias should dispatch effect_id handler")

func test_process_timing_event_missing_required_payload_is_safe() -> void:
	var summon_result = EffectManager.process_timing_event(EffectManager.Timing.ON_SUMMON, {
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(summon_result, {}, "ON_SUMMON without card_ui should safely return empty result")

	var attack_result = EffectManager.process_timing_event(EffectManager.Timing.ON_ATTACK, {
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(attack_result, {}, "ON_ATTACK without attacker_ui should safely return empty result")

	var defense_result = EffectManager.process_timing_event(EffectManager.Timing.ON_DEFENSE, {
		"damage": 5,
		"is_player": true,
		"context": _create_empty_context()
	})
	assert_eq(defense_result.get("final_damage", -1), 5, "ON_DEFENSE without defender_ui should keep incoming damage")

	var turn_start_result = EffectManager.process_timing_event(EffectManager.Timing.TURN_START, {
		"is_player": true
	})
	assert_eq(turn_start_result, [], "TURN_START without context should safely return empty results")

	var turn_end_result = EffectManager.process_timing_event(EffectManager.Timing.TURN_END, {
		"is_player": true
	})
	assert_eq(turn_end_result, [], "TURN_END without context should safely return empty results")

func test_process_summon_effect_with_missing_slot_context_is_safe() -> void:
	var summon_card = _create_mock_card_ui("red_001")
	var result := EffectManager.process_summon_effect(summon_card, true, {})
	assert_eq(result, {}, "Targeted summon effects should safely no-op when slot arrays are missing from context")

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

func test_summon_effect_emits_effect_triggered_signal() -> void:
	watch_signals(EffectManager)
	var summon_card = _create_mock_card_ui("green_001")
	EffectManager.process_summon_effect(summon_card, true, _create_empty_context())
	assert_signal_emit_count(EffectManager, "effect_triggered", 1, "Summon timing effect should emit effect_triggered once")

func test_attack_effect_emits_effect_triggered_signal() -> void:
	watch_signals(EffectManager)
	var attacker = _create_mock_card_ui("green_010")
	EffectManager.process_attack_effect(attacker, _create_mock_card_ui(""), true, _create_empty_context())
	assert_signal_emit_count(EffectManager, "effect_triggered", 1, "Attack timing effect should emit effect_triggered once")

func test_defense_effect_emits_effect_triggered_signal() -> void:
	watch_signals(EffectManager)
	var defender = _create_mock_card_ui("yellow_004")
	EffectManager.process_defense_effect(defender, 3, true, _create_empty_context())
	assert_signal_emit_count(EffectManager, "effect_triggered", 1, "Defense timing effect should emit effect_triggered once")

func test_death_effect_emits_effect_triggered_signal() -> void:
	watch_signals(EffectManager)
	var dead_card = _create_mock_card_ui("green_002")
	EffectManager.process_death_effect(dead_card, true, _create_empty_context())
	assert_signal_emit_count(EffectManager, "effect_triggered", 1, "Death timing effect should emit effect_triggered once")

func test_turn_start_effect_emits_effect_triggered_signal() -> void:
	watch_signals(EffectManager)
	var context := {
		"player_slots": [_create_mock_slot("green_009"), null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	EffectManager.process_turn_start_effects(true, context)
	assert_signal_emit_count(EffectManager, "effect_triggered", 1, "Turn start effect should emit effect_triggered once")

func test_turn_end_effect_emits_effect_triggered_signal() -> void:
	watch_signals(EffectManager)
	var context := {
		"player_slots": [_create_mock_slot("yellow_010"), null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	EffectManager.process_turn_end_effects(true, context)
	assert_signal_emit_count(EffectManager, "effect_triggered", 1, "Turn end effect should emit effect_triggered once")

func test_turn_start_poison_tick_emits_effect_triggered_signal() -> void:
	watch_signals(EffectManager)
	var poisoned = _create_mock_slot_with_ui("")
	poisoned.card_ui._status = EffectManager.StatusEffect.POISON
	poisoned.card_ui._status_duration = 99
	var context := {
		"player_slots": [poisoned, null, null, null, null, null],
		"opponent_slots": [null, null, null, null, null, null],
	}
	EffectManager.process_turn_start_effects(true, context)
	assert_signal_emit_count(EffectManager, "effect_triggered", 1, "Poison tick should emit effect_triggered once")

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

func test_detect_unimplemented_on_death_effect_ids() -> void:
	# ON_DEATHの効果IDで、処理が未実装のものを検出する
	# green_014 は「他の味方死亡時」トリガーのため除外
	var context := {
		"player_slots": [_create_mock_slot_with_ui(""), null, null, null, null, null],
		"opponent_slots": [_create_mock_slot_with_ui(""), null, null, null, null, null],
		"current_dice": 1
	}
	var exclude := {"green_014": true}
	var missing: Array[String] = []

	for effect_id in EffectManager.effect_definitions.keys():
		if EffectManager.get_effect_timing(effect_id) != EffectManager.Timing.ON_DEATH:
			continue
		if exclude.has(effect_id):
			continue
		var result: Dictionary = EffectManager.process_death_effect(_create_mock_card_ui(effect_id), true, context)
		if result.size() == 0:
			missing.append(effect_id)

	assert_eq(missing, [], "ON_DEATH未実装: %s" % [", ".join(missing)])

func test_detect_unimplemented_on_defense_effect_ids() -> void:
	# ON_DEFENSEの効果IDで、処理が未実装のものを検出する
	var context := _create_empty_context()
	var missing: Array[String] = []

	for effect_id in EffectManager.effect_definitions.keys():
		if EffectManager.get_effect_timing(effect_id) != EffectManager.Timing.ON_DEFENSE:
			continue
		var result: Dictionary = EffectManager.process_defense_effect(_create_mock_card_ui(effect_id), 5, true, context)
		if not result.has("log"):
			missing.append(effect_id)

	assert_eq(missing, [], "ON_DEFENSE未実装: %s" % [", ".join(missing)])

func test_detect_unimplemented_turn_start_effect_ids() -> void:
	# TURN_STARTの効果IDで、処理が未実装のものを検出する
	var missing: Array[String] = []

	for effect_id in EffectManager.effect_definitions.keys():
		if EffectManager.get_effect_timing(effect_id) != EffectManager.Timing.TURN_START:
			continue
		var context := {
			"player_slots": [_create_mock_slot(effect_id), _create_mock_slot_with_ui(""), null, null, null, null],
			"opponent_slots": [_create_mock_slot_with_ui(""), null, null, null, null, null],
		}
		var results: Array = EffectManager.process_turn_start_effects(true, context)
		if results.size() == 0:
			missing.append(effect_id)

	assert_eq(missing, [], "TURN_START未実装: %s" % [", ".join(missing)])

func test_detect_unimplemented_turn_end_effect_ids() -> void:
	# TURN_ENDの効果IDで、処理が未実装のものを検出する
	var missing: Array[String] = []

	for effect_id in EffectManager.effect_definitions.keys():
		if EffectManager.get_effect_timing(effect_id) != EffectManager.Timing.TURN_END:
			continue
		var context := {
			"player_slots": [_create_mock_slot(effect_id), _create_mock_slot_with_ui(""), null, null, null, null],
			"opponent_slots": [_create_mock_slot_with_ui(""), null, null, null, null, null],
		}
		var results: Array = EffectManager.process_turn_end_effects(true, context)
		if results.size() == 0:
			missing.append(effect_id)

	assert_eq(missing, [], "TURN_END未実装: %s" % [", ".join(missing)])

func test_summon_effect_uses_prepare_helper_for_entry_guard() -> void:
	# 段階リファクタ開始: ON_SUMMON の入口前処理を共通化
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("var prepared := _process_single_card_timing_effect(card_ui, Timing.ON_SUMMON)"), -1,
		"process_summon_effect should use _process_single_card_timing_effect")

func test_attack_effect_uses_prepare_helper_for_entry_guard() -> void:
	# ON_ATTACK も共通入口ヘルパーに寄せる
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("var prepared := _process_single_card_timing_effect(attacker_ui, Timing.ON_ATTACK)"), -1,
		"process_attack_effect should use _process_single_card_timing_effect")

func test_death_effect_uses_prepare_helper_for_entry_guard() -> void:
	# ON_DEATH も共通入口ヘルパーに寄せる
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("var prepared := _process_single_card_timing_effect(card_ui, Timing.ON_DEATH)"), -1,
		"process_death_effect should use _process_single_card_timing_effect")

func test_defense_effect_uses_prepare_helper_for_entry_guard() -> void:
	# ON_DEFENSE も共通入口ヘルパーに寄せる
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("var prepared := _process_single_card_timing_effect(defender_ui, Timing.ON_DEFENSE, {\"final_damage\": damage})"), -1,
		"process_defense_effect should use _process_single_card_timing_effect")

func test_single_card_timing_effect_helper_is_used_for_all_single_card_timings() -> void:
	# 段階リファクタ: 召喚/攻撃/死亡/防御の入口を1つのヘルパーで統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _process_single_card_timing_effect"), -1,
		"effect_manager should define _process_single_card_timing_effect")
	assert_ne(script_text.find("var prepared := _process_single_card_timing_effect(card_ui, Timing.ON_SUMMON)"), -1,
		"process_summon_effect should route via unified single-card timing helper")
	assert_ne(script_text.find("var prepared := _process_single_card_timing_effect(attacker_ui, Timing.ON_ATTACK)"), -1,
		"process_attack_effect should route via unified single-card timing helper")
	assert_ne(script_text.find("var prepared := _process_single_card_timing_effect(card_ui, Timing.ON_DEATH)"), -1,
		"process_death_effect should route via unified single-card timing helper")
	assert_ne(script_text.find("var prepared := _process_single_card_timing_effect(defender_ui, Timing.ON_DEFENSE, {\"final_damage\": damage})"), -1,
		"process_defense_effect should route via unified single-card timing helper")

func test_turn_timing_effect_helper_is_used_for_turn_start_and_end() -> void:
	# 段階リファクタ: TURN_START/TURN_END の入口も1つのヘルパーで統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _process_turn_timing_effects"), -1,
		"effect_manager should define _process_turn_timing_effects")
	assert_ne(script_text.find("var results := _process_turn_timing_effects(slots, is_player, context, Timing.TURN_START)"), -1,
		"process_turn_start_effects should route via unified turn timing helper")
	assert_ne(script_text.find("var results := _process_turn_timing_effects(slots, is_player, context, Timing.TURN_END)"), -1,
		"process_turn_end_effects should route via unified turn timing helper")

func test_turn_timing_effect_helper_has_single_definition_and_uses_prepare_guard() -> void:
	# TURN_START/TURN_END ヘルパーの重複定義防止 + 入口ガード統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_eq(script_text.count("func _process_turn_timing_effects"), 1,
		"_process_turn_timing_effects should have exactly one definition")
	assert_ne(script_text.find("var prepared := _prepare_timing_effect(card_ui, timing)"), -1,
		"_process_turn_timing_effects should use _prepare_timing_effect guard")

func test_target_collection_helper_is_shared_by_ally_enemy_getters() -> void:
	# 段階リファクタ: 対象取得(敵/味方・単体/複数)を1ヘルパーで統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _collect_targets"), -1,
		"effect_manager should define _collect_targets")
	assert_ne(script_text.find("func _pick_random_target"), -1,
		"effect_manager should define _pick_random_target")
	assert_ne(script_text.find("return _pick_random_target(_collect_targets(is_player, context, true))"), -1,
		"_get_random_enemy should delegate to shared helpers")
	assert_ne(script_text.find("return _collect_targets(is_player, context, true)"), -1,
		"_get_all_enemies should delegate to shared helper")
	assert_ne(script_text.find("return _pick_random_target(_collect_targets(is_player, context, false))"), -1,
		"_get_random_ally should delegate to shared helpers")
	assert_ne(script_text.find("return _collect_targets(is_player, context, false)"), -1,
		"_get_all_allies should delegate to shared helper")

func test_aoe_damage_helper_is_shared_for_death_damage_effects() -> void:
	# 次の段階リファクタ: 敵全体ダメージ+死亡判定+ログ付与を1ヘルパーで統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_aoe_damage_effect"), -1,
		"effect_manager should define _apply_aoe_damage_effect")
	assert_ne(script_text.find("_apply_aoe_damage_effect(enemies, 1, result, card_name, \"purple\", \"敵全体HP-1\")"), -1,
		"black_010 should delegate to shared AOE helper")
	assert_ne(script_text.find("_apply_aoe_damage_effect(enemies, 3, result, card_name, \"purple\", \"敵全体HP-3\")"), -1,
		"black_018 should delegate to shared AOE helper")
	assert_ne(script_text.find("_apply_aoe_damage_effect(enemies, 2, result, card_name, \"red\", \"敵全体HP-2\")"), -1,
		"red_006 should delegate to shared AOE helper")
	assert_ne(script_text.find("_apply_aoe_damage_effect(enemies, 1, result, card_name, \"magenta\", \"敵全体HP-1\")"), -1,
		"purple_008 should delegate to shared AOE helper")

func test_self_damage_helper_is_shared_for_black_summon_effects() -> void:
	# 次の段階リファクタ: 自傷+ログ生成を1ヘルパーで統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_self_damage_effect"), -1,
		"effect_manager should define _apply_self_damage_effect")
	assert_ne(script_text.find("_apply_self_damage_effect(result, card_name, 1)"), -1,
		"black_001 should delegate to shared self-damage helper")
	assert_ne(script_text.find("_apply_self_damage_effect(result, card_name, 2)"), -1,
		"black_003 should delegate to shared self-damage helper")
	assert_ne(script_text.find("_apply_self_damage_effect(result, card_name, 3)"), -1,
		"black_005 should delegate to shared self-damage helper")
	assert_ne(script_text.find("_apply_self_damage_effect(result, card_name, 5)"), -1,
		"black_008 should delegate to shared self-damage helper")
	assert_ne(script_text.find("_apply_self_damage_effect(result, card_name, 4)"), -1,
		"black_017 should delegate to shared self-damage helper")

func test_summon_effect_dispatcher_helper_is_used() -> void:
	# 次の段階リファクタ: ON_SUMMONのeffect_id分岐を専用ディスパッチ関数に隔離
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _dispatch_summon_effect"), -1,
		"effect_manager should define _dispatch_summon_effect")
	assert_ne(script_text.find("_dispatch_summon_effect(effect_id, card_ui, is_player, context, card_name, result)"), -1,
		"process_summon_effect should delegate to _dispatch_summon_effect")

func test_attack_effect_dispatcher_helper_is_used() -> void:
	# 次の段階リファクタ: ON_ATTACKのeffect_id分岐を専用ディスパッチ関数に隔離
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _dispatch_attack_effect"), -1,
		"effect_manager should define _dispatch_attack_effect")
	assert_ne(script_text.find("_dispatch_attack_effect(effect_id, attacker_ui, defender_ui, is_player, context, card_name, result)"), -1,
		"process_attack_effect should delegate to _dispatch_attack_effect")

func test_death_effect_dispatcher_helper_is_used() -> void:
	# 次の段階リファクタ: ON_DEATHのeffect_id分岐も専用ディスパッチ関数へ分離
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _dispatch_death_effect"), -1,
		"effect_manager should define _dispatch_death_effect")
	assert_ne(script_text.find("_dispatch_death_effect(effect_id, card_ui, is_player, context, card_name, result)"), -1,
		"process_death_effect should delegate to _dispatch_death_effect")

func test_defense_effect_dispatcher_helper_is_used() -> void:
	# 次の段階リファクタ: ON_DEFENSEのeffect_id分岐も専用ディスパッチ関数へ分離
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _dispatch_defense_effect"), -1,
		"effect_manager should define _dispatch_defense_effect")
	assert_ne(script_text.find("_dispatch_defense_effect(effect_id, defender_ui, damage, card_name, result)"), -1,
		"process_defense_effect should delegate to _dispatch_defense_effect")

func test_summon_targeted_damage_helper_is_shared_for_red_summon_effects() -> void:
	# 次のリファクタ候補: ON_SUMMONの単体ダメージ+死亡判定+ログを1ヘルパーへ統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_targeted_damage_effect"), -1,
		"effect_manager should define _apply_targeted_damage_effect")
	assert_ne(script_text.find("_apply_targeted_damage_effect(is_player, context, 2, result, card_name, \"red\", \"にHP-2\")"), -1,
		"red_001 should delegate to targeted damage helper")
	assert_ne(script_text.find("_apply_targeted_damage_effect(is_player, context, 3, result, card_name, \"red\", \"にHP-3\")"), -1,
		"red_011 should delegate to targeted damage helper")

func test_death_targeted_damage_helper_is_shared_for_single_target_death_damage_effects() -> void:
	# 次のリファクタ候補: ON_DEATHの単体ダメージ+死亡判定+ログを1ヘルパーへ統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_targeted_damage_effect"), -1,
		"effect_manager should define _apply_targeted_damage_effect")
	assert_ne(script_text.find("_apply_targeted_damage_effect(is_player, context, 2, result, card_name, \"purple\", \"にHP-2\")"), -1,
		"black_002 should delegate to targeted damage helper")
	assert_ne(script_text.find("_apply_targeted_damage_effect(is_player, context, 4, result, card_name, \"red\", \"にHP-4\")"), -1,
		"red_014 should delegate to targeted damage helper")

func test_summon_aoe_damage_helper_is_shared_for_red_summon_effects() -> void:
	# 次の段階リファクタ: ON_SUMMONの全体ダメージ+死亡判定+ログを1ヘルパーに統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("_apply_aoe_damage_effect(enemies, 1, result, card_name, \"red\", \"敵全体HP-1\")"), -1,
		"red_003 should delegate to shared AOE helper")
	assert_ne(script_text.find("_apply_aoe_damage_effect(enemies, 2, result, card_name, \"red\", \"敵全体HP-2\")"), -1,
		"red_015 should delegate to shared AOE helper")

func test_destroy_mark_helper_is_shared_for_lethal_and_instant_destroy_paths() -> void:
	# 次の段階リファクタ: HP<=0破壊登録を1ヘルパーへ集約（ダメージ経由/即時破壊経由の両方）
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _mark_destroy_target"), -1,
		"effect_manager should define _mark_destroy_target")
	assert_ne(script_text.find("_mark_destroy_target(result, target)"), -1,
		"_apply_damage_and_mark_destroy should delegate lethal registration to _mark_destroy_target")
	assert_ne(script_text.find("_mark_destroy_target(result, enemy)"), -1,
		"purple_012 instant destroy should delegate target registration to _mark_destroy_target")

func test_targeted_atk_modifier_helper_is_shared_for_single_target_atk_debuff_effects() -> void:
	# 次の段階リファクタ: 単体ATK増減+ログ生成を1ヘルパーへ統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_targeted_atk_modifier_effect"), -1,
		"effect_manager should define _apply_targeted_atk_modifier_effect")
	var debuff_call := "_apply_targeted_atk_modifier_effect(is_player, context, -1, result, card_name, \"cyan\", \"のATK-1\")"
	assert_true(script_text.count(debuff_call) >= 2,
		"blue_001 and blue_009 should delegate to targeted ATK modifier helper")
	assert_ne(script_text.find("_apply_targeted_atk_modifier_effect(is_player, context, -2, result, card_name, \"purple\", \"のATK-2\")"), -1,
		"black_013 should delegate to targeted ATK modifier helper")

func test_turn_start_self_heal_helper_is_shared_for_blue_010_and_green_003() -> void:
	# 次の段階リファクタ: ターン開始時の自身回復+ログ生成を1ヘルパーへ統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_self_heal_effect"), -1,
		"effect_manager should define _apply_self_heal_effect")
	assert_ne(script_text.find("_apply_self_heal_effect(card_ui, result, \"cyan\", card_name, 1)"), -1,
		"blue_010 should delegate to self-heal helper")
	assert_ne(script_text.find("_apply_self_heal_effect(card_ui, result, \"green\", card_name, 1)"), -1,
		"green_003 should delegate to self-heal helper")

func test_summon_mana_gain_helper_is_shared_for_green_001_004_008() -> void:
	# 次の段階リファクタ: 登場時の単純マナ加算+ログ生成を1ヘルパーへ統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_mana_gain_effect"), -1,
		"effect_manager should define _apply_mana_gain_effect")
	assert_ne(script_text.find("_apply_mana_gain_effect(result, \"green\", card_name, 1)"), -1,
		"green_001 should delegate to mana-gain helper")
	assert_ne(script_text.find("_apply_mana_gain_effect(result, \"green\", card_name, 2)"), -1,
		"green_004 should delegate to mana-gain helper")
	assert_ne(script_text.find("_apply_mana_gain_effect(result, \"green\", card_name, 3)"), -1,
		"green_008 should delegate to mana-gain helper")

func test_turn_mana_gain_helper_is_shared_for_green_009_and_yellow_010() -> void:
	# 次の段階リファクタ: TURN_START/TURN_END の単純マナ加算+ログ生成を共通ヘルパーへ統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_mana_gain_effect"), -1,
		"effect_manager should define _apply_mana_gain_effect")
	assert_ne(script_text.find("\"green_009\":  # ターン開始時:マナ+1\n\t\t\t_apply_mana_gain_effect(result, \"green\", card_name, 1)"), -1,
		"green_009 should delegate to mana-gain helper")
	assert_ne(script_text.find("\"yellow_010\":  # ターン終了時:マナ+1\n\t\t\t_apply_mana_gain_effect(result, \"yellow\", card_name, 1)"), -1,
		"yellow_010 should delegate to mana-gain helper")

func test_turn_dispatch_helper_exists_and_is_used_for_start_end() -> void:
	# 次の段階リファクタ: TURN_START/TURN_END のdispatchを1関数に集約
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _dispatch_turn_timing_effect"), -1,
		"effect_manager should define _dispatch_turn_timing_effect helper")
	assert_ne(script_text.find("var result := _dispatch_turn_timing_effect(effect_id, card_ui, is_player, context, card_name, timing)"), -1,
		"_process_turn_timing_effects should route via unified turn dispatch helper")

func test_summon_enemy_aoe_atk_debuff_helper_is_shared_for_blue_004_007() -> void:
	# 次の段階リファクタ: 敵全体ATKデバフ+ログ生成を1ヘルパーへ統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_enemy_aoe_atk_modifier_effect"), -1,
		"effect_manager should define _apply_enemy_aoe_atk_modifier_effect")
	assert_ne(script_text.find("_apply_enemy_aoe_atk_modifier_effect(is_player, context, -1, result, card_name, \"cyan\", \"敵全体のATK-1\")"), -1,
		"blue_004 should delegate to enemy aoe atk modifier helper")
	assert_ne(script_text.find("_apply_enemy_aoe_atk_modifier_effect(is_player, context, -2, result, card_name, \"cyan\", \"敵全体のATK-2\")"), -1,
		"blue_007 should delegate to enemy aoe atk modifier helper")

func test_player_heal_helper_is_shared_for_white_heal_effects() -> void:
	# 次の段階リファクタ: 自分HP回復系（登場/死亡/ターン）を1ヘルパーへ統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_player_heal_effect"), -1,
		"effect_manager should define _apply_player_heal_effect")
	assert_ne(script_text.find("_apply_player_heal_effect(result, \"white\", card_name, 2)"), -1,
		"white_001 should delegate to player-heal helper")
	assert_ne(script_text.find("_apply_player_heal_effect(result, \"white\", card_name, 4)"), -1,
		"white_009 should delegate to player-heal helper")
	assert_ne(script_text.find("_apply_player_heal_effect(result, \"white\", card_name, 6)"), -1,
		"white_015 should delegate to player-heal helper")
	assert_ne(script_text.find("_apply_player_heal_effect(result, \"white\", card_name, 3)"), -1,
		"white_002 should delegate to player-heal helper")
	assert_ne(script_text.find("_apply_player_heal_effect(result, \"white\", card_name, 1)"), -1,
		"white_003 should delegate to player-heal helper")
	assert_ne(script_text.find("_apply_player_heal_effect(result, \"white\", card_name, 2)"), -1,
		"white_010 should delegate to player-heal helper")

func test_draw_effect_helper_is_shared_for_basic_draw_effects() -> void:
	# 次の具体的リファクタ候補: 単純ドロー+ログ生成を共通ヘルパーへ統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_draw_effect"), -1,
		"effect_manager should define _apply_draw_effect helper")
	assert_ne(script_text.find("_apply_draw_effect(result, \"cyan\", card_name, 1)"), -1,
		"blue_014 should delegate to draw helper")
	assert_ne(script_text.find("_apply_draw_effect(result, \"yellow\", card_name, 2)"), -1,
		"yellow_003 should delegate to draw helper")
	assert_ne(script_text.find("_apply_draw_effect(result, \"yellow\", card_name, 1)"), -1,
		"yellow_005 should delegate to draw helper")

func test_timing_payload_value_helper_is_used_for_attack_defense_and_turn_context() -> void:
	# 次の段階リファクタ: process_timing_event の payload値解決を小ヘルパーで共通化
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _resolve_timing_payload_value"), -1,
		"effect_manager should define _resolve_timing_payload_value helper")
	assert_ne(script_text.find("_resolve_timing_payload_value(payload, aliases.get(\"defender_ui\", [\"defender_ui\"]), null)"), -1,
		"ON_ATTACK should resolve defender_ui via payload helper")
	assert_ne(script_text.find("_resolve_timing_payload_value(payload, aliases.get(\"damage\", [\"damage\"]), 0)"), -1,
		"ON_DEFENSE should resolve damage via payload helper")
	assert_ne(script_text.find("var context: Dictionary = _resolve_timing_payload_value(payload, aliases.get(\"context\", [\"context\"]), {})"), -1,
		"context should be resolved once via payload helper and reused for all timing routes")

func test_timing_payload_alias_table_is_used_by_resolvers() -> void:
	# 次の段階リファクタ: timingごとのpayload aliasを辞書テーブル化して参照を一元化
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("const TIMING_CARD_UI_KEYS :="), -1,
		"effect_manager should define TIMING_CARD_UI_KEYS alias table")
	assert_ne(script_text.find("const TIMING_PAYLOAD_KEYS :="), -1,
		"effect_manager should define TIMING_PAYLOAD_KEYS alias table")
	assert_ne(script_text.find("var keys: Array = TIMING_CARD_UI_KEYS.get(timing, [])"), -1,
		"_resolve_timing_card_ui should read aliases from TIMING_CARD_UI_KEYS")
	assert_ne(script_text.find("TIMING_PAYLOAD_KEYS.get(timing, {})"), -1,
		"process_timing_event should read payload aliases from TIMING_PAYLOAD_KEYS")

func test_timing_dispatcher_helper_handles_on_summon_route() -> void:
	# 次の段階リファクタ: ON_SUMMON の分岐を private dispatcher helper に切り出し
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _dispatch_timing_on_summon"), -1,
		"effect_manager should define _dispatch_timing_on_summon helper")
	assert_true(
		script_text.find("Timing.ON_SUMMON:\n\t\t\treturn _dispatch_timing_on_summon(payload, is_player, context)") != -1
		or script_text.find("_dispatch_timing_via_method_table") != -1,
		"process_timing_event should delegate ON_SUMMON routing via helper (direct or method table)")
	assert_ne(script_text.find("func _dispatch_timing_on_summon(payload: Dictionary, is_player: bool, context: Dictionary):"), -1,
		"ON_SUMMON dispatcher helper should preserve typed routing signature")

func test_timing_dispatcher_helper_handles_on_attack_route() -> void:
	# 次の段階リファクタ: ON_ATTACK の分岐も private dispatcher helper に切り出し
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _dispatch_timing_on_attack"), -1,
		"effect_manager should define _dispatch_timing_on_attack helper")
	assert_true(
		script_text.find("Timing.ON_ATTACK:\n\t\t\treturn _dispatch_timing_on_attack(payload, aliases, is_player, context)") != -1
		or script_text.find("_dispatch_timing_via_method_table") != -1,
		"process_timing_event should delegate ON_ATTACK routing via helper (direct or method table)")
	assert_ne(script_text.find("func _dispatch_timing_on_attack(payload: Dictionary, aliases: Dictionary, is_player: bool, context: Dictionary):"), -1,
		"ON_ATTACK dispatcher helper should preserve typed routing signature")

func test_timing_dispatcher_helpers_cover_all_event_routes() -> void:
	# 次の段階リファクタ: timing 入口分岐を全て private dispatcher helper に統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _dispatch_timing_on_attack"), -1,
		"effect_manager should define _dispatch_timing_on_attack helper")
	assert_ne(script_text.find("func _dispatch_timing_on_death"), -1,
		"effect_manager should define _dispatch_timing_on_death helper")
	assert_ne(script_text.find("func _dispatch_timing_on_defense"), -1,
		"effect_manager should define _dispatch_timing_on_defense helper")
	assert_ne(script_text.find("func _dispatch_timing_turn_start"), -1,
		"effect_manager should define _dispatch_timing_turn_start helper")
	assert_ne(script_text.find("func _dispatch_timing_turn_end"), -1,
		"effect_manager should define _dispatch_timing_turn_end helper")
	assert_true(
		script_text.find("Timing.ON_ATTACK:\n\t\t\treturn _dispatch_timing_on_attack(payload, aliases, is_player, context)") != -1
		or script_text.find("_dispatch_timing_via_method_table") != -1,
		"process_timing_event should delegate ON_ATTACK routing via helper (direct or method table)")
	assert_ne(script_text.find("Timing.ON_DEATH:\n\t\t\treturn _dispatch_timing_on_death(payload, is_player, context)"), -1,
		"process_timing_event should delegate ON_DEATH routing to helper")
	assert_ne(script_text.find("Timing.ON_DEFENSE:\n\t\t\treturn _dispatch_timing_on_defense(payload, aliases, is_player, context)"), -1,
		"process_timing_event should delegate ON_DEFENSE routing to helper")
	assert_ne(script_text.find("Timing.TURN_START:\n\t\t\treturn _dispatch_timing_turn_start(is_player, context)"), -1,
		"process_timing_event should delegate TURN_START routing to helper")
	assert_ne(script_text.find("Timing.TURN_END:\n\t\t\treturn _dispatch_timing_turn_end(is_player, context)"), -1,
		"process_timing_event should delegate TURN_END routing to helper")

func test_turn_start_poison_tick_processing_is_extracted_to_helper() -> void:
	# 次のリファクタ候補: ターン開始時の毒処理を専用helperへ分離
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _append_poison_tick_results"), -1,
		"effect_manager should define _append_poison_tick_results helper")
	assert_ne(script_text.find("_append_poison_tick_results(slots, results)"), -1,
		"process_turn_start_effects should delegate poison tick loop to helper")

func test_status_apply_helper_is_shared_for_freeze_and_poison_attack_effects() -> void:
	# 次のリファクタ候補: 状態異常付与（凍結/毒）を共通helperで統一
	var script_text := FileAccess.get_file_as_string("res://autoload/effect_manager.gd")
	assert_ne(script_text.find("func _apply_status_effect_with_log"), -1,
		"effect_manager should define _apply_status_effect_with_log helper")
	assert_ne(script_text.find("_apply_status_effect_with_log(defender_ui, StatusEffect.FROZEN, 1, result, \"cyan\", card_name, \"を凍結\")"), -1,
		"blue_003 should delegate status application to shared helper")
	assert_ne(script_text.find("_apply_status_effect_with_log(defender_ui, StatusEffect.FROZEN, 2, result, \"cyan\", card_name, \"を2ターン凍結\")"), -1,
		"blue_008 should delegate status application to shared helper")
	assert_ne(script_text.find("_apply_status_effect_with_log(defender_ui, StatusEffect.POISON, 99, result, \"purple\", card_name, \"に毒付与\")"), -1,
		"black_004 should delegate status application to shared helper")

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
	var has_revived: bool = false
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
