extends GutTest

## 効果発動の統合テスト
## 実際の効果発動フローをテスト

var effect_manager: Node

func before_each() -> void:
	effect_manager = EffectManager

# ═══════════════════════════════════════════
# 召喚時効果テスト
# ═══════════════════════════════════════════

func test_summon_effect_blue_001_atk_debuff() -> void:
	# blue_001: 登場時:敵1体ATK-1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "blue_001"
	card_ui.card_data.card_name = "氷の精霊"
	
	var enemy := MockCardUI.new()
	var enemy_slot := MockSlot.new()
	enemy_slot._card_ui = enemy
	enemy_slot._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot]
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(enemy._atk_modifier, -1, "Enemy ATK should be reduced by 1")
	assert_true(result.has("log"), "Result should have log")

func test_summon_effect_green_001_mana_gain() -> void:
	# green_001: 登場時:マナ+1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "green_001"
	card_ui.card_data.card_name = "森の妖精"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(result.get("mana", 0), 1, "Mana should be +1")
	assert_true(result.has("log"), "Result should have log")

func test_summon_effect_green_004_mana_gain_2() -> void:
	# green_004: 登場時:マナ+2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "green_004"
	card_ui.card_data.card_name = "森の守護者"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(result.get("mana", 0), 2, "Mana should be +2")

func test_summon_effect_black_001_self_damage() -> void:
	# black_001: 登場時:自分HP-1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "black_001"
	card_ui.card_data.card_name = "闇のコウモリ"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(result.get("self_damage", 0), 1, "Self damage should be 1")

func test_summon_effect_red_001_direct_damage() -> void:
	# red_001: 登場時:敵1体HP-2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "red_001"
	card_ui.card_data.card_name = "火の精霊"
	
	var enemy := MockCardUI.new()
	enemy.current_hp = 5
	var enemy_slot := MockSlot.new()
	enemy_slot._card_ui = enemy
	enemy_slot._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot]
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(enemy.current_hp, 3, "Enemy HP should be reduced by 2")
	assert_true(result.has("log"), "Result should have log")

func test_summon_effect_red_017_aoe_damage() -> void:
	# red_017: 登場時:敵全体HP-3
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "red_017"
	card_ui.card_data.card_name = "灼熱の魔王"
	
	var enemy1 := MockCardUI.new()
	enemy1.current_hp = 6
	var enemy_slot1 := MockSlot.new()
	enemy_slot1._card_ui = enemy1
	enemy_slot1._empty = false
	
	var enemy2 := MockCardUI.new()
	enemy2.current_hp = 4
	var enemy_slot2 := MockSlot.new()
	enemy_slot2._card_ui = enemy2
	enemy_slot2._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot1, enemy_slot2]
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(enemy1.current_hp, 3, "Enemy1 HP should be 6-3=3")
	assert_eq(enemy2.current_hp, 1, "Enemy2 HP should be 4-3=1")

func test_summon_effect_yellow_016_ally_atk_buff() -> void:
	# yellow_016: 登場時:味方全体ATK+2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "yellow_016"
	card_ui.card_data.card_name = "祝福の精霊王"
	
	var ally := MockCardUI.new()
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = ally
	ally_slot._empty = false
	
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(ally._atk_modifier, 2, "Ally ATK should be +2")

func test_summon_effect_purple_019_aoe_freeze() -> void:
	# purple_019: 登場時:敵全体を2ターン凍結
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "purple_019"
	card_ui.card_data.card_name = "影の帝王"
	
	var enemy1 := MockCardUI.new()
	var enemy_slot1 := MockSlot.new()
	enemy_slot1._card_ui = enemy1
	enemy_slot1._empty = false
	
	var enemy2 := MockCardUI.new()
	var enemy_slot2 := MockSlot.new()
	enemy_slot2._card_ui = enemy2
	enemy_slot2._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot1, enemy_slot2]
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_true(enemy1.has_status(EffectManager.StatusEffect.FROZEN), "Enemy1 should be frozen")
	assert_true(enemy2.has_status(EffectManager.StatusEffect.FROZEN), "Enemy2 should be frozen")

func test_summon_effect_white_020_ally_buff() -> void:
	# white_020: 登場時:味方全体HP+3,ATK+1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "white_020"
	card_ui.card_data.card_name = "光の創造主"
	
	var ally := MockCardUI.new()
	ally.current_hp = 4
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = ally
	ally_slot._empty = false
	
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(ally.current_hp, 7, "Ally HP should be 4+3=7")
	assert_eq(ally._atk_modifier, 1, "Ally ATK should be +1")

# ═══════════════════════════════════════════
# 攻撃時効果テスト
# ═══════════════════════════════════════════

func test_attack_effect_blue_003_freeze() -> void:
	# blue_003: 攻撃時:対象を凍結
	var attacker := MockCardUI.new()
	attacker.card_data.effect_id = "blue_003"
	attacker.card_data.card_name = "霧の狼"
	
	var defender := MockCardUI.new()
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_attack_effect(attacker, defender, true, context)
	
	assert_true(defender.has_status(EffectManager.StatusEffect.FROZEN), "Defender should be frozen")

func test_attack_effect_black_004_poison() -> void:
	# black_004: 攻撃時:対象に毒
	var attacker := MockCardUI.new()
	attacker.card_data.effect_id = "black_004"
	attacker.card_data.card_name = "毒蛇"
	
	var defender := MockCardUI.new()
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_attack_effect(attacker, defender, true, context)
	
	assert_true(defender.has_status(EffectManager.StatusEffect.POISON), "Defender should be poisoned")

func test_attack_effect_black_007_lifesteal() -> void:
	# black_007: 攻撃時:与ダメ分自身HP回復
	var attacker := MockCardUI.new()
	attacker.card_data.effect_id = "black_007"
	attacker.card_data.card_name = "吸血鬼"
	
	var defender := MockCardUI.new()
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_attack_effect(attacker, defender, true, context)
	
	assert_true(result.get("lifesteal", false), "Lifesteal should be true")

func test_attack_effect_red_002_extra_damage() -> void:
	# red_002: 攻撃時:対象に追加2ダメージ
	var attacker := MockCardUI.new()
	attacker.card_data.effect_id = "red_002"
	attacker.card_data.card_name = "炎のネズミ"
	
	var defender := MockCardUI.new()
	defender.current_hp = 5
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_attack_effect(attacker, defender, true, context)
	
	assert_eq(defender.current_hp, 3, "Defender HP should be 5-2=3")

func test_attack_effect_red_008_double_attack() -> void:
	# red_008: 攻撃時:2回攻撃
	var attacker := MockCardUI.new()
	attacker.card_data.effect_id = "red_008"
	attacker.card_data.card_name = "ファイアドラゴン"
	
	var defender := MockCardUI.new()
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_attack_effect(attacker, defender, true, context)
	
	assert_true(result.get("double_attack", false), "Double attack should be true")

func test_attack_effect_yellow_018_ally_heal() -> void:
	# yellow_018: 攻撃時:味方全体HP+1
	var attacker := MockCardUI.new()
	attacker.card_data.effect_id = "yellow_018"
	attacker.card_data.card_name = "天空龍"
	
	var defender := MockCardUI.new()
	
	var ally := MockCardUI.new()
	ally.current_hp = 3
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = ally
	ally_slot._empty = false
	
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_attack_effect(attacker, defender, true, context)
	
	assert_eq(ally.current_hp, 4, "Ally HP should be 3+1=4")

func test_attack_effect_purple_016_enemy_atk_debuff() -> void:
	# purple_016: 攻撃時:敵全体ATK-1
	var attacker := MockCardUI.new()
	attacker.card_data.effect_id = "purple_016"
	attacker.card_data.card_name = "悪夢の王"
	
	var defender := MockCardUI.new()
	
	var enemy := MockCardUI.new()
	var enemy_slot := MockSlot.new()
	enemy_slot._card_ui = enemy
	enemy_slot._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot]
	}
	
	var result: Dictionary = effect_manager.process_attack_effect(attacker, defender, true, context)
	
	assert_eq(enemy._atk_modifier, -1, "Enemy ATK should be -1")

# ═══════════════════════════════════════════
# 死亡時効果テスト
# ═══════════════════════════════════════════

func test_death_effect_green_002_mana_gain() -> void:
	# green_002: 死亡時:マナ+1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "green_002"
	card_ui.card_data.card_name = "若木のトレント"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(result.get("mana", 0), 1, "Mana should be +1")

func test_death_effect_black_002_enemy_damage() -> void:
	# black_002: 死亡時:敵1体HP-2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "black_002"
	card_ui.card_data.card_name = "呪いの人形"
	
	var enemy := MockCardUI.new()
	enemy.current_hp = 5
	var enemy_slot := MockSlot.new()
	enemy_slot._card_ui = enemy
	enemy_slot._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot]
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(enemy.current_hp, 3, "Enemy HP should be 5-2=3")

func test_death_effect_black_011_revive() -> void:
	# black_011: 死亡時:HP1で1度だけ復活
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "black_011"
	card_ui.card_data.card_name = "ゾンビ"
	card_ui.has_revived = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_true(result.get("revive", false), "Revive should be true")

func test_death_effect_black_011_no_revive_if_already_revived() -> void:
	# black_011: 既に復活済みなら効果なし
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "black_011"
	card_ui.card_data.card_name = "ゾンビ"
	card_ui.has_revived = true
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_false(result.get("revive", false), "Revive should be false if already revived")

func test_death_effect_red_006_aoe_damage() -> void:
	# red_006: 死亡時:敵全体HP-2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "red_006"
	card_ui.card_data.card_name = "火の鳥"
	
	var enemy1 := MockCardUI.new()
	enemy1.current_hp = 5
	var enemy_slot1 := MockSlot.new()
	enemy_slot1._card_ui = enemy1
	enemy_slot1._empty = false
	
	var enemy2 := MockCardUI.new()
	enemy2.current_hp = 3
	var enemy_slot2 := MockSlot.new()
	enemy_slot2._card_ui = enemy2
	enemy_slot2._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot1, enemy_slot2]
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(enemy1.current_hp, 3, "Enemy1 HP should be 5-2=3")
	assert_eq(enemy2.current_hp, 1, "Enemy2 HP should be 3-2=1")

func test_death_effect_yellow_019_ally_heal() -> void:
	# yellow_019: 死亡時:味方全体HP+3
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "yellow_019"
	card_ui.card_data.card_name = "希望の女神"
	
	var ally := MockCardUI.new()
	ally.current_hp = 3
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = ally
	ally_slot._empty = false
	
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(ally.current_hp, 6, "Ally HP should be 3+3=6")

func test_death_effect_purple_011_aoe_freeze() -> void:
	# purple_011: 死亡時:敵全体を凍結
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "purple_011"
	card_ui.card_data.card_name = "影の龍"
	
	var enemy1 := MockCardUI.new()
	var enemy_slot1 := MockSlot.new()
	enemy_slot1._card_ui = enemy1
	enemy_slot1._empty = false
	
	var enemy2 := MockCardUI.new()
	var enemy_slot2 := MockSlot.new()
	enemy_slot2._card_ui = enemy2
	enemy_slot2._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot1, enemy_slot2]
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_true(enemy1.has_status(EffectManager.StatusEffect.FROZEN), "Enemy1 should be frozen")
	assert_true(enemy2.has_status(EffectManager.StatusEffect.FROZEN), "Enemy2 should be frozen")

func test_death_effect_white_019_revive_from_graveyard() -> void:
	# white_019: 死亡時:墓地から2体復活
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "white_019"
	card_ui.card_data.card_name = "復活の女神"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(result.get("revive_from_graveyard", 0), 2, "Revive from graveyard should be 2")

# ═══════════════════════════════════════════
# 防御時効果テスト
# ═══════════════════════════════════════════

func test_defense_effect_blue_006_half_damage() -> void:
	# blue_006: 防御時:被ダメージ半減
	var defender := MockCardUI.new()
	defender.card_data.effect_id = "blue_006"
	defender.card_data.card_name = "海神の守護者"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_defense_effect(defender, 6, true, context)
	
	assert_eq(result.get("final_damage", 6), 3, "Damage should be halved from 6 to 3")

func test_defense_effect_yellow_004_reduce_damage() -> void:
	# yellow_004: 防御時:ダメージを1軽減
	var defender := MockCardUI.new()
	defender.card_data.effect_id = "yellow_004"
	defender.card_data.card_name = "星の欠片"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_defense_effect(defender, 3, true, context)
	
	assert_eq(result.get("final_damage", 3), 2, "Damage should be reduced from 3 to 2")

func test_defense_effect_yellow_014_reflect() -> void:
	# yellow_014: 防御時:攻撃者にダメージ反射
	var defender := MockCardUI.new()
	defender.card_data.effect_id = "yellow_014"
	defender.card_data.card_name = "光の龍"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_defense_effect(defender, 4, true, context)
	
	assert_true(result.get("reflect", false), "Reflect should be true")

func test_defense_effect_white_005_shield() -> void:
	# white_005: 防御時:ダメージ無効(1回のみ)
	var defender := MockCardUI.new()
	defender.card_data.effect_id = "white_005"
	defender.card_data.card_name = "癒しの騎士"
	defender.shield_used = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_defense_effect(defender, 5, true, context)
	
	assert_eq(result.get("final_damage", 5), 0, "Damage should be blocked")
	assert_true(result.get("shield_consumed", false), "Shield should be consumed")

# ═══════════════════════════════════════════
# 効果なしカードのテスト
# ═══════════════════════════════════════════

func test_no_effect_on_vanilla_card() -> void:
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = ""
	card_ui.card_data.card_name = "スライム"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var summon_result := effect_manager.process_summon_effect(card_ui, true, context)
	var attack_result := effect_manager.process_attack_effect(card_ui, MockCardUI.new(), true, context)
	var death_result := effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(summon_result.size(), 0, "Vanilla card should have no summon effect")
	assert_eq(attack_result.size(), 0, "Vanilla card should have no attack effect")
	assert_eq(death_result.size(), 0, "Vanilla card should have no death effect")

# ═══════════════════════════════════════════
# 追加テスト: purple_015, purple_017, purple_018, purple_020, white_018
# ═══════════════════════════════════════════

func test_summon_effect_purple_015_single_freeze() -> void:
	# purple_015: 登場時:敵1体を3ターン凍結
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "purple_015"
	card_ui.card_data.card_name = "氷結の魔女"
	
	var enemy := MockCardUI.new()
	var enemy_slot := MockSlot.new()
	enemy_slot._card_ui = enemy
	enemy_slot._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot]
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_true(enemy.has_status(1), "Enemy should be frozen (status 1)")
	assert_eq(enemy._status_duration.get(1, 0), 3, "Freeze should last 3 turns")

func test_summon_effect_purple_018_aoe_atk_hp_debuff() -> void:
	# purple_018: 登場時:敵全体ATK-2,HP-2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "purple_018"
	card_ui.card_data.card_name = "闇の支配者"
	
	var enemy1 := MockCardUI.new()
	enemy1.current_hp = 5
	var enemy_slot1 := MockSlot.new()
	enemy_slot1._card_ui = enemy1
	enemy_slot1._empty = false
	
	var enemy2 := MockCardUI.new()
	enemy2.current_hp = 6
	var enemy_slot2 := MockSlot.new()
	enemy_slot2._card_ui = enemy2
	enemy_slot2._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot1, enemy_slot2]
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(enemy1._atk_modifier, -2, "Enemy1 ATK should be -2")
	assert_eq(enemy1.current_hp, 3, "Enemy1 HP should be reduced by 2")
	assert_eq(enemy2._atk_modifier, -2, "Enemy2 ATK should be -2")
	assert_eq(enemy2.current_hp, 4, "Enemy2 HP should be reduced by 2")

func test_summon_effect_white_018_clear_status_and_heal() -> void:
	# white_018: 登場時:味方全体状態異常解除+HP+2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "white_018"
	card_ui.card_data.card_name = "浄化の天使"
	
	var ally := MockCardUI.new()
	ally.current_hp = 3
	ally.apply_status(1, 2)  # 凍結状態
	ally.apply_status(2, 3)  # 毒状態
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = ally
	ally_slot._empty = false
	
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_false(ally.has_status(1), "Ally should not be frozen")
	assert_false(ally.has_status(2), "Ally should not be poisoned")
	assert_eq(ally.current_hp, 5, "Ally HP should be +2")

func test_constant_effect_purple_017_enemy_summon_cost() -> void:
	# purple_017: 常時:敵の召喚コスト+2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "purple_017"
	
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = card_ui
	ally_slot._empty = false
	
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	
	var modifier := effect_manager.get_summon_cost_modifier(false, context)
	
	assert_eq(modifier, 2, "Enemy summon cost should be +2")

func test_constant_effect_purple_020_enemy_dice_penalty() -> void:
	# purple_020: 常時:敵全体ダイス-1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "purple_020"
	
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = card_ui
	ally_slot._empty = false
	
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	
	var dice_mod := effect_manager.get_dice_modifier(false, context)
	
	assert_eq(dice_mod, -1, "Enemy dice should be -1")

# ═══════════════════════════════════════════
# 追加テスト: 未カバー効果
# ═══════════════════════════════════════════

func test_death_effect_black_013_enemy_atk_debuff() -> void:
	# black_013: 死亡時:敵1体ATK-2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "black_013"
	card_ui.card_data.card_name = "闘士の魂"
	
	var enemy := MockCardUI.new()
	var enemy_slot := MockSlot.new()
	enemy_slot._card_ui = enemy
	enemy_slot._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot]
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(enemy._atk_modifier, -2, "Enemy ATK should be -2")

func test_death_effect_black_018_aoe_damage() -> void:
	# black_018: 死亡時:敵全体HP-3
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "black_018"
	card_ui.card_data.card_name = "闇の大魔王"
	
	var enemy1 := MockCardUI.new()
	enemy1.current_hp = 5
	var enemy_slot1 := MockSlot.new()
	enemy_slot1._card_ui = enemy1
	enemy_slot1._empty = false
	
	var enemy2 := MockCardUI.new()
	enemy2.current_hp = 6
	var enemy_slot2 := MockSlot.new()
	enemy_slot2._card_ui = enemy2
	enemy_slot2._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot1, enemy_slot2]
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(enemy1.current_hp, 2, "Enemy1 HP should be reduced by 3")
	assert_eq(enemy2.current_hp, 3, "Enemy2 HP should be reduced by 3")

func test_summon_effect_yellow_006_ally_heal() -> void:
	# yellow_006: 登場時:味方全体HP+1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "yellow_006"
	card_ui.card_data.card_name = "光の使者"
	
	var ally := MockCardUI.new()
	ally.current_hp = 3
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = ally
	ally_slot._empty = false
	
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(ally.current_hp, 4, "Ally HP should be +1")

func test_summon_effect_purple_006_enemy_debuff() -> void:
	# purple_006: 登場時:敵全体ATK-1,HP-1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "purple_006"
	card_ui.card_data.card_name = "呪いの魔術師"
	
	var enemy := MockCardUI.new()
	enemy.current_hp = 4
	var enemy_slot := MockSlot.new()
	enemy_slot._card_ui = enemy
	enemy_slot._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot]
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(enemy._atk_modifier, -1, "Enemy ATK should be -1")
	assert_eq(enemy.current_hp, 3, "Enemy HP should be -1")

func test_attack_effect_yellow_008_self_heal() -> void:
	# yellow_008: 攻撃時:自身HP+1
	var attacker := MockCardUI.new()
	attacker.card_data.effect_id = "yellow_008"
	attacker.card_data.card_name = "回復の戦士"
	attacker.current_hp = 3
	
	var defender := MockCardUI.new()
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_attack_effect(attacker, defender, true, context)
	
	assert_eq(attacker.current_hp, 4, "Attacker HP should be +1")

func test_summon_effect_blue_004_enemy_aoe_atk_debuff() -> void:
	# blue_004: 登場時:敵全体ATK-1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "blue_004"
	card_ui.card_data.card_name = "氷の魔導士"
	
	var enemy1 := MockCardUI.new()
	var enemy_slot1 := MockSlot.new()
	enemy_slot1._card_ui = enemy1
	enemy_slot1._empty = false
	
	var enemy2 := MockCardUI.new()
	var enemy_slot2 := MockSlot.new()
	enemy_slot2._card_ui = enemy2
	enemy_slot2._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot1, enemy_slot2]
	}
	
	var result: Dictionary = effect_manager.process_summon_effect(card_ui, true, context)
	
	assert_eq(enemy1._atk_modifier, -1, "Enemy1 ATK should be -1")
	assert_eq(enemy2._atk_modifier, -1, "Enemy2 ATK should be -1")

func test_death_effect_blue_009_single_atk_debuff() -> void:
	# blue_009: 死亡時:敵1体ATK-1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "blue_009"
	card_ui.card_data.card_name = "氷の精"
	
	var enemy := MockCardUI.new()
	var enemy_slot := MockSlot.new()
	enemy_slot._card_ui = enemy
	enemy_slot._empty = false
	
	var context := {
		"player_slots": [],
		"opponent_slots": [enemy_slot]
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(enemy._atk_modifier, -1, "Enemy ATK should be -1")

func test_death_effect_green_005_mana_gain() -> void:
	# green_005: 死亡時:マナ+2
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "green_005"
	card_ui.card_data.card_name = "森の生贄"
	
	var context := {
		"player_slots": [],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_death_effect(card_ui, true, context)
	
	assert_eq(result.get("mana", 0), 2, "Mana should be +2")

func test_turn_start_effect_green_003_self_heal() -> void:
	# green_003: ターン開始時:自身HP+1
	var card_ui := MockCardUI.new()
	card_ui.card_data.effect_id = "green_003"
	card_ui.card_data.card_name = "生命の樹"
	card_ui.current_hp = 4
	
	var ally_slot := MockSlot.new()
	ally_slot._card_ui = card_ui
	ally_slot._empty = false
	
	var context := {
		"player_slots": [ally_slot],
		"opponent_slots": []
	}
	
	var result: Dictionary = effect_manager.process_turn_start_effect(card_ui, true, context)
	
	assert_eq(card_ui.current_hp, 5, "Self HP should be +1")

# ═══════════════════════════════════════════
# Mocks
# ═══════════════════════════════════════════

class MockCardData:
	var card_name: String = "MockCard"
	var effect_id: String = ""
	var mana_cost: int = 1

class MockCardUI:
	var card_data := MockCardData.new()
	var current_hp: int = 5
	var has_revived: bool = false
	var shield_used: bool = false
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
