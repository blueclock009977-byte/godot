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
	# budget = cost × 3 + 4, ATK=1pt, HP=1pt, ダイス目=2pt
	for card in CardDatabase.card_pool:
		if card.color_type != CardData.ColorType.GRAY:
			continue
		var total := card.atk + card.hp + card.attack_dice.size() * 2
		var expected := card.mana_cost * 3 + 4
		assert_eq(total, expected, "%s budget: atk(%d)+hp(%d)+dice(%d×2)=%d should be %d" % [card.card_name, card.atk, card.hp, card.attack_dice.size(), total, expected])

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
