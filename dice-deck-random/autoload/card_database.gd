extends Node

var card_pool: Array[CardData] = []

# 色ごとのカラー定義
var color_by_type: Dictionary = {
	CardData.ColorType.GRAY: Color(0.5, 0.5, 0.55),
	CardData.ColorType.BLUE: Color(0.3, 0.5, 0.9),
	CardData.ColorType.GREEN: Color(0.3, 0.8, 0.3),
	CardData.ColorType.BLACK: Color(0.3, 0.2, 0.3),
}

func _ready() -> void:
	_generate_card_pool()

func _generate_card_pool() -> void:
	card_pool.clear()

	# ═══════════════════════════════════════════
	# グレー（バニラ）カード - ID 0-19
	# ═══════════════════════════════════════════
	var gray_defs := [
		# [id, name, cost, atk, hp, dice_array]
		# Cost 1 (budget 6)
		[0, "スライム", 1, 1, 1, [1,2,3,4]],
		[1, "ストーンウォール", 1, 1, 4, [3]],
		[2, "ゴブリン", 1, 2, 2, [2,5]],
		[3, "ナイフィンプ", 1, 3, 1, [1,6]],
		# Cost 2 (budget 9)
		[4, "シールドナイト", 2, 2, 5, [3,4]],
		[5, "スカウト", 2, 2, 2, [1,2,3,4,5]],
		[6, "ウォリアー", 2, 3, 3, [1,3,5]],
		[7, "アサシン", 2, 4, 2, [2,4,6]],
		# Cost 3 (budget 12)
		[8, "フォートレス", 3, 2, 7, [2,4,6]],
		[9, "ストライカー", 3, 5, 3, [1,3,4,6]],
		[10, "パラディン", 3, 4, 5, [1,3,5]],
		[11, "バーサーカー", 3, 6, 2, [1,2,5,6]],
		# Cost 4 (budget 15)
		[12, "アイアンゴーレム", 4, 3, 9, [1,4,5]],
		[13, "ブレードマスター", 4, 5, 5, [1,2,3,4,5]],
		[14, "ドラゴンナイト", 4, 7, 4, [2,3,5,6]],
		[15, "ウォーロード", 4, 5, 7, [1,3,6]],
		# Cost 5 (budget 18)
		[16, "タイタン", 5, 4, 8, [1,2,3,4,5,6]],
		[17, "ドラゴン", 5, 7, 8, [2,4,6]],
		[18, "デスブリンガー", 5, 9, 4, [1,2,3,5,6]],
		[19, "エンシェント", 5, 6, 6, [1,2,3,4,5,6]],
	]

	for d in gray_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.GRAY, "")

	# ═══════════════════════════════════════════
	# 青カード - ID 20-39
	# ═══════════════════════════════════════════
	var blue_defs := [
		# [id, name, cost, atk, hp, dice, effect_id]
		# Cost 1 (budget 6, -2 for effect = 4)
		[20, "氷の精霊", 1, 1, 1, [1,2], "blue_001"],  # 登場時:敵1体ATK-1
		[21, "フロストバット", 1, 1, 1, [3,4], "blue_002"],  # ダイス3,4でも攻撃可
		[22, "氷のネズミ", 1, 2, 1, [5], "blue_009"],  # 死亡時:敵1体ATK-1
		[23, "霜の妖精", 1, 1, 2, [1,6], "blue_001"],  # 登場時:敵1体ATK-1
		# Cost 2 (budget 9, -2 = 7)
		[24, "水の使い", 2, 1, 3, [2,3,4], "blue_001"],  # 登場時:敵1体ATK-1
		[25, "霧の狼", 2, 2, 2, [1,4,6], "blue_003"],  # 攻撃時:凍結
		[26, "氷の彫刻家", 2, 2, 3, [3,5], "blue_011"],  # 登場時:ダイス+1
		[27, "海のスライム", 2, 1, 4, [2,4], "blue_010"],  # ターン開始時HP+1
		# Cost 3 (budget 12, -2~3 = 9~10)
		[28, "氷結の騎士", 3, 2, 4, [2,3,4], "blue_004"],  # 登場時:敵全体ATK-1
		[29, "深海魚", 3, 2, 2, [5,6], "blue_005"],  # ダイス5,6でATK+2
		[30, "吹雪の魔術師", 3, 3, 3, [1,3,5], "blue_003"],  # 攻撃時:凍結
		[31, "氷の壁", 3, 1, 6, [1,2,3], "blue_013"],  # 同列味方被ダメ-1
		# Cost 4 (budget 15, -3 = 12)
		[32, "吹雪のドラゴン", 4, 3, 5, [1,2,3,4], "blue_004"],  # 登場時:敵全体ATK-1
		[33, "海神の守護者", 4, 3, 6, [3,4,5], "blue_006"],  # 防御時:被ダメ半減
		[34, "海賊船長", 4, 4, 4, [2,3,4,5], "blue_014"],  # 登場時:手札+1
		[35, "北風の精", 4, 2, 6, [1,2,3,4], "blue_015"],  # 敵前列ATK-1
		# Cost 5 (budget 18, -4 = 14)
		[36, "氷帝", 5, 4, 6, [1,2,3,4], "blue_007"],  # 登場時:敵全体ATK-2
		[37, "凍てつく巨人", 5, 5, 5, [5,6], "blue_008"],  # 攻撃時:2ターン凍結
		[38, "氷山", 5, 2, 8, [1,2,3,4], "blue_016"],  # 常時:敵全体ATK-1
		[39, "絶対零度", 5, 4, 6, [1,2,3,4], "blue_018"],  # 登場時:敵全体1ターン凍結
	]

	for d in blue_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.BLUE, d[6])

	# ═══════════════════════════════════════════
	# 緑カード - ID 40-59
	# ═══════════════════════════════════════════
	var green_defs := [
		# Cost 1 (budget 6, -2 = 4)
		[40, "森の妖精", 1, 1, 1, [1,2], "green_001"],  # 登場時:マナ+1
		[41, "若木のトレント", 1, 1, 1, [3,4], "green_002"],  # 死亡時:マナ+1
		[42, "花のスプライト", 1, 1, 2, [5], "green_001"],  # 登場時:マナ+1
		[43, "種まき", 1, 2, 1, [1,6], "green_002"],  # 死亡時:マナ+1
		# Cost 2 (budget 9, -2 = 7)
		[44, "草原の狩人", 2, 1, 3, [2,3,4], "green_001"],  # 登場時:マナ+1
		[45, "花の精", 2, 1, 3, [1,4,5], "green_003"],  # ターン開始時HP+1
		[46, "蔦の魔術師", 2, 2, 2, [2,4,6], "green_001"],  # 登場時:マナ+1
		[47, "木こりオーク", 2, 2, 2, [1,3,5], "green_010"],  # 攻撃時:マナ+1
		# Cost 3 (budget 12, -3 = 9)
		[48, "森の守護者", 3, 2, 3, [2,3,4], "green_004"],  # 登場時:マナ+2
		[49, "大樹の戦士", 3, 3, 3, [1,5,6], "green_005"],  # 死亡時:マナ+2
		[50, "ドリアードの巫女", 3, 1, 5, [2,4,6], "green_011"],  # 登場時:味方1体HP+2
		[51, "森の巨人", 3, 3, 3, [1,3,5], "green_012"],  # 被ダメ時:マナ+1
		# Cost 4 (budget 15, -3 = 12)
		[52, "エルフの賢者", 4, 2, 6, [2,3,4,5], "green_006"],  # 召喚コスト-1
		[53, "古代樹", 4, 1, 7, [1,2,3,4], "green_007"],  # 味方全体HP+1
		[54, "春風の使者", 4, 3, 5, [2,3,4,5], "green_013"],  # 登場時:マナ全回復
		[55, "苔の巨人", 4, 2, 7, [1,2,3], "green_014"],  # 味方死亡時:自身HP+2
		# Cost 5 (budget 18, -4 = 14)
		[56, "森林王", 5, 3, 7, [1,2,3,4], "green_008"],  # 登場時:マナ+3
		[57, "世界樹の化身", 5, 4, 6, [3,4,5,6], "green_009"],  # ターン開始時:マナ+1
		[58, "大地の精霊", 5, 3, 7, [2,3,4,5], "green_015"],  # 登場時:マナ+2,HP+2
		[59, "生命の木", 5, 3, 7, [1,2,3,4], "green_016"],  # ターン終了時:味方全体HP+1
	]

	for d in green_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.GREEN, d[6])

	# ═══════════════════════════════════════════
	# 黒カード - ID 60-79
	# ═══════════════════════════════════════════
	var black_defs := [
		# Cost 1 (budget 6 + 1 demerit bonus = 7)
		[60, "闇のコウモリ", 1, 3, 2, [1,2], "black_001"],  # 登場時:自分HP-1
		[61, "呪いの人形", 1, 1, 1, [4,5], "black_002"],  # 死亡時:敵1体HP-2
		[62, "疫病ネズミ", 1, 1, 1, [1,3], "black_010"],  # 死亡時:敵全体HP-1
		[63, "闇のインプ", 1, 2, 2, [2,6], "black_001"],  # 登場時:自分HP-1
		# Cost 2 (budget 9)
		[64, "影の暗殺者", 2, 4, 3, [5,6], "black_003"],  # 登場時:自分HP-2
		[65, "毒蛇", 2, 1, 3, [1,3,5], "black_004"],  # 攻撃時:毒付与
		[66, "ゾンビ", 2, 2, 2, [2,4,6], "black_011"],  # 死亡時:HP1で復活
		[67, "闇の魔術師", 2, 1, 3, [3,5,6], "black_012"],  # 相手ダイス1無効
		# Cost 3 (budget 12)
		[68, "堕天使", 3, 5, 5, [3,4,5], "black_005"],  # 登場時:自分HP-3
		[69, "死霊術師", 3, 2, 4, [2,4,6], "black_006"],  # 死亡時:トークン召喚
		[70, "骸骨剣士", 3, 3, 3, [1,3,5,6], "black_013"],  # 死亡時:敵1体ATK-2
		[71, "悪魔の契約者", 3, 4, 4, [2,4], "black_014"],  # 登場時:自分HP-2,手札+1
		# Cost 4 (budget 15)
		[72, "漆黒の騎士", 4, 6, 6, [1,2,3,4], "black_005"],  # 登場時:自分HP-3
		[73, "吸血鬼", 4, 4, 4, [4,5,6], "black_007"],  # 攻撃時:吸血
		[74, "ダークナイト", 4, 4, 5, [1,2,3,4], "black_015"],  # 攻撃時:自HP-1,ATK+2
		[75, "死神", 4, 4, 5, [5,6], "black_016"],  # 攻撃時:対象HP半減
		# Cost 5 (budget 18)
		[76, "魔王の影", 5, 8, 8, [1,2,3,4], "black_008"],  # 登場時:自分HP-5
		[77, "深淵の王", 5, 5, 5, [2,3,4,5,6], "black_009"],  # 相手ダイス6無効
		[78, "堕落の竜", 5, 8, 7, [1,2,3,4], "black_017"],  # 登場時:自分HP-4
		[79, "暗黒神", 5, 5, 5, [1,2,3,4,5,6], "black_019"],  # 相手ダイス1,6無効
	]

	for d in black_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.BLACK, d[6])

func _add_card(id: int, card_name: String, cost: int, atk: int, hp: int, dice_arr: Array, color_type: CardData.ColorType, effect_id: String) -> void:
	var card := CardData.new()
	card.id = id
	card.card_name = card_name
	card.mana_cost = cost
	card.atk = atk
	card.hp = hp
	var dice: Array[int] = []
	for v in dice_arr:
		dice.append(v)
	card.attack_dice = dice
	card.color_type = color_type
	card.color = color_by_type.get(color_type, Color(0.5, 0.5, 0.55))
	card.effect_id = effect_id
	card.icon_name = ["sword", "shield", "star", "flame", "bolt", "heart", "skull", "crown", "gem", "arrow"][id % 10]
	card_pool.append(card)

func get_card_by_id(id: int) -> CardData:
	for card in card_pool:
		if card.id == id:
			return card
	return null

func get_all_cards() -> Array[CardData]:
	return card_pool

func get_cards_by_color(color_type: CardData.ColorType) -> Array[CardData]:
	var result: Array[CardData] = []
	for card in card_pool:
		if card.color_type == color_type:
			result.append(card)
	return result

func build_random_deck() -> Array[CardData]:
	# バニラのみでランダムデッキを作成
	var deck: Array[CardData] = []
	var gray_cards := get_cards_by_color(CardData.ColorType.GRAY)
	var pool_copy := gray_cards.duplicate()
	pool_copy.shuffle()
	var count_map := {}
	for card in pool_copy:
		var current_count: int = count_map.get(card.id, 0)
		if current_count < 2 and deck.size() < 20:
			deck.append(card.duplicate_card())
			count_map[card.id] = current_count + 1
	while deck.size() < 20:
		var pick: CardData = pool_copy[randi() % pool_copy.size()]
		var current_count: int = count_map.get(pick.id, 0)
		if current_count < 2:
			deck.append(pick.duplicate_card())
			count_map[pick.id] = current_count + 1
	deck.shuffle()
	return deck

func is_valid_deck(deck: Array) -> bool:
	if deck.size() != 20:
		return false
	# 色チェック: グレー以外は1色のみ
	var non_gray_colors := {}
	for card in deck:
		if card is CardData and card.color_type != CardData.ColorType.GRAY:
			non_gray_colors[card.color_type] = true
	return non_gray_colors.size() <= 1

func get_deck_color(deck: Array) -> CardData.ColorType:
	for card in deck:
		if card is CardData and card.color_type != CardData.ColorType.GRAY:
			return card.color_type
	return CardData.ColorType.GRAY
