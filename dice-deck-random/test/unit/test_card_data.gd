extends GutTest

# CardData Resource クラスのテスト

func test_default_values():
	var card := CardData.new()
	assert_eq(card.id, 0, "Default id should be 0")
	assert_eq(card.card_name, "", "Default card_name should be empty")
	assert_eq(card.mana_cost, 1, "Default mana_cost should be 1")
	assert_eq(card.hp, 1, "Default hp should be 1")
	assert_eq(card.atk, 1, "Default atk should be 1")
	assert_eq(card.attack_dice.size(), 0, "Default attack_dice should be empty")
	assert_eq(card.color_type, CardData.ColorType.GRAY, "Default color_type should be GRAY")
	assert_eq(card.effect_id, "", "Default effect_id should be empty")
	assert_eq(card.icon_name, "default", "Default icon_name should be 'default'")

func test_color_type_enum():
	# Enum値が正しいことを確認
	assert_eq(CardData.ColorType.GRAY, 0)
	assert_eq(CardData.ColorType.BLUE, 1)
	assert_eq(CardData.ColorType.GREEN, 2)
	assert_eq(CardData.ColorType.BLACK, 3)
	assert_eq(CardData.ColorType.RED, 4)
	assert_eq(CardData.ColorType.YELLOW, 5)
	assert_eq(CardData.ColorType.PURPLE, 6)
	assert_eq(CardData.ColorType.WHITE, 7)
	# 8色あることを確認
	assert_eq(CardData.ColorType.values().size(), 8, "Should have 8 colors")

func test_get_color_name_gray():
	var card := CardData.new()
	card.color_type = CardData.ColorType.GRAY
	assert_eq(card.get_color_name(), "グレー")

func test_get_color_name_blue():
	var card := CardData.new()
	card.color_type = CardData.ColorType.BLUE
	assert_eq(card.get_color_name(), "青")

func test_get_color_name_green():
	var card := CardData.new()
	card.color_type = CardData.ColorType.GREEN
	assert_eq(card.get_color_name(), "緑")

func test_get_color_name_black():
	var card := CardData.new()
	card.color_type = CardData.ColorType.BLACK
	assert_eq(card.get_color_name(), "黒")

func test_get_color_name_red():
	var card := CardData.new()
	card.color_type = CardData.ColorType.RED
	assert_eq(card.get_color_name(), "赤")

func test_get_color_name_yellow():
	var card := CardData.new()
	card.color_type = CardData.ColorType.YELLOW
	assert_eq(card.get_color_name(), "黄")

func test_get_color_name_purple():
	var card := CardData.new()
	card.color_type = CardData.ColorType.PURPLE
	assert_eq(card.get_color_name(), "紫")

func test_get_color_name_white():
	var card := CardData.new()
	card.color_type = CardData.ColorType.WHITE
	assert_eq(card.get_color_name(), "白")

func test_has_effect_false():
	var card := CardData.new()
	card.effect_id = ""
	assert_false(card.has_effect(), "Card without effect_id should return false")

func test_has_effect_true():
	var card := CardData.new()
	card.effect_id = "blue_001"
	assert_true(card.has_effect(), "Card with effect_id should return true")

func test_duplicate_card_basic():
	var original := CardData.new()
	original.id = 42
	original.card_name = "テストカード"
	original.mana_cost = 3
	original.hp = 5
	original.atk = 4
	original.attack_dice = [1, 3, 6]
	original.color_type = CardData.ColorType.RED
	original.effect_id = "red_001"
	original.icon_name = "test_icon"
	
	var copy := original.duplicate_card()
	
	assert_eq(copy.id, 42)
	assert_eq(copy.card_name, "テストカード")
	assert_eq(copy.mana_cost, 3)
	assert_eq(copy.hp, 5)
	assert_eq(copy.atk, 4)
	assert_eq(copy.attack_dice, [1, 3, 6])
	assert_eq(copy.color_type, CardData.ColorType.RED)
	assert_eq(copy.effect_id, "red_001")
	assert_eq(copy.icon_name, "test_icon")

func test_duplicate_card_independent_arrays():
	var original := CardData.new()
	original.attack_dice = [1, 2, 3]
	
	var copy := original.duplicate_card()
	
	# 配列の変更が元に影響しないことを確認
	copy.attack_dice.append(4)
	assert_eq(original.attack_dice.size(), 3, "Original dice array should be unchanged")
	assert_eq(copy.attack_dice.size(), 4, "Copy dice array should have 4 elements")

func test_all_color_names_are_japanese():
	# 全色の名前が日本語であることを確認（デバッグ表示等で使用）
	for color_type in CardData.ColorType.values():
		var card := CardData.new()
		card.color_type = color_type
		var name: String = card.get_color_name()
		assert_ne(name, "", "Color name should not be empty")
		assert_ne(name, "不明", "Color name should not be '不明'")
