extends GutTest

func test_card_pool_has_160_cards():
	# 8色 × 20枚 = 160枚
	assert_eq(CardDatabase.card_pool.size(), 160, "CardDatabase should have 160 cards (8 colors × 20)")

func test_all_cards_have_valid_cost():
	for card in CardDatabase.card_pool:
		assert_between(card.mana_cost, 1, 5, "%s cost should be 1-5" % card.card_name)

func test_all_cards_have_positive_hp():
	for card in CardDatabase.card_pool:
		assert_gt(card.hp, 0, "%s should have HP > 0" % card.card_name)

func test_all_cards_have_non_negative_atk():
	for card in CardDatabase.card_pool:
		assert_gte(card.atk, 0, "%s should have ATK >= 0" % card.card_name)

func test_all_cards_have_attack_dice():
	for card in CardDatabase.card_pool:
		assert_gt(card.attack_dice.size(), 0, "%s should have at least 1 attack die" % card.card_name)

func test_all_dice_values_valid():
	for card in CardDatabase.card_pool:
		for d in card.attack_dice:
			assert_between(d, 1, 6, "%s dice value should be 1-6" % card.card_name)

func test_all_cards_have_unique_ids():
	var ids := {}
	for card in CardDatabase.card_pool:
		assert_false(ids.has(card.id), "Card ID %d should be unique" % card.id)
		ids[card.id] = true

func test_point_budget_vanilla_cards():
	# バニラ（グレー）カードのみポイントバジェットをチェック
	# budget = 14 + 8*cost
	# score = 5*HP + 3*ATK + 3*面数 + (ATK*面数)//4
	for card in CardDatabase.card_pool:
		if card.color_type != CardData.ColorType.GRAY:
			continue
		var faces := card.attack_dice.size()
		var synergy := (card.atk * faces) / 4
		var score := 5 * card.hp + 3 * card.atk + 3 * faces + int(synergy)
		var budget := 14 + 8 * card.mana_cost
		assert_true(absi(score - budget) <= 4, "%s score=%d budget=%d should be within ±4" % [card.card_name, score, budget])

func test_get_card_by_id():
	var card := CardDatabase.get_card_by_id(0)
	assert_not_null(card, "Card ID 0 should exist")
	assert_eq(card.card_name, "スライム", "Card ID 0 should be スライム")

func test_get_card_by_invalid_id():
	var card := CardDatabase.get_card_by_id(999)
	assert_null(card, "Card ID 999 should not exist")

func test_build_random_deck():
	var deck := CardDatabase.build_random_deck()
	assert_eq(deck.size(), 20, "Random deck should have 20 cards")

func test_build_random_battle_deck_follows_rules():
	var deck := CardDatabase.build_random_battle_deck()
	assert_eq(deck.size(), 20, "Battle random deck should have 20 cards")

	var color_counts := {}
	var id_counts := {}
	for card in deck:
		color_counts[card.color_type] = color_counts.get(card.color_type, 0) + 1
		id_counts[card.id] = id_counts.get(card.id, 0) + 1

	# グレー以外は1色のみ
	var non_gray_colors := 0
	for color in color_counts.keys():
		if int(color) != CardData.ColorType.GRAY and int(color_counts[color]) > 0:
			non_gray_colors += 1
	assert_eq(non_gray_colors, 1, "Battle random deck should contain exactly one non-gray color")

	# 同名2枚まで
	for card_id in id_counts.keys():
		assert_lte(int(id_counts[card_id]), 2, "Card ID %d should appear at most 2 copies" % int(card_id))

func test_each_color_has_20_cards():
	# 各色のカード枚数をカウント
	var color_counts := {}
	for color in CardData.ColorType.values():
		color_counts[color] = 0
	for card in CardDatabase.card_pool:
		color_counts[card.color_type] += 1
	# 各色20枚であることを確認
	for color in CardData.ColorType.values():
		var color_name: String = CardData.ColorType.keys()[color]
		assert_eq(color_counts[color], 20, "%s should have 20 cards" % color_name)

func test_card_ids_are_sequential():
	# カードIDが0-159の連続した値であることを確認
	var ids := []
	for card in CardDatabase.card_pool:
		ids.append(card.id)
	ids.sort()
	for i in range(160):
		assert_true(ids.has(i), "Card ID %d should exist" % i)

func test_effect_cards_have_valid_effect_id():
	# 効果カード（非グレー）はeffect_idを持つべき
	for card in CardDatabase.card_pool:
		if card.color_type == CardData.ColorType.GRAY:
			assert_eq(card.effect_id, "", "%s (vanilla) should have empty effect_id" % card.card_name)
		else:
			assert_ne(card.effect_id, "", "%s (effect card) should have effect_id" % card.card_name)

func test_duplicate_card_creates_copy():
	var original := CardDatabase.get_card_by_id(0)
	var copy := original.duplicate_card()
	# 同じ値を持つ
	assert_eq(copy.id, original.id)
	assert_eq(copy.card_name, original.card_name)
	assert_eq(copy.atk, original.atk)
	assert_eq(copy.hp, original.hp)
	# 別インスタンス
	assert_ne(copy, original, "duplicate should create new instance")
	# 変更しても元に影響しない
	copy.hp = 999
	assert_ne(original.hp, 999, "modifying copy should not affect original")

func test_effect_budget_modifier_covers_all_registered_effect_ids():
	var effect_manager = preload("res://autoload/effect_manager.gd").new()
	effect_manager._register_all_effects()

	for effect_id in effect_manager.effect_definitions.keys():
		var modifier := CardDatabase._get_effect_budget_modifier(String(effect_id))
		assert_ne(modifier, 0, "effect_id %s should be explicitly classified" % String(effect_id))

	effect_manager.free()

func test_effect_budget_modifier_key_rules():
	# ドロー 1枚=-12 / 2枚=-24
	assert_eq(CardDatabase._get_effect_budget_modifier("blue_014"), -12, "draw 1 should be -12")
	assert_eq(CardDatabase._get_effect_budget_modifier("yellow_003"), -12, "draw 1 should be -12")

	# 召喚時1ダメージ相当（red_001: 敵1体HP-2 は強めなので -8）
	assert_lte(CardDatabase._get_effect_budget_modifier("red_001"), -6, "summon damage should be at least as costly as -6")

	# 召喚時HP-2 は +10 回復目安
	assert_eq(CardDatabase._get_effect_budget_modifier("black_003"), 10, "summon self damage 2 should refund about +10")
