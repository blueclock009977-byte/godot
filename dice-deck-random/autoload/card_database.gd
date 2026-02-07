extends Node

const TOTAL_COST := 18.0
const DICE_COST := 1.5

var card_pool: Array[CardData] = []

var effect_defs: Array = [
	[1, "on_summon", "召喚時: ランダムな敵1体に1ダメージ", 3],
	[2, "on_summon", "召喚時: 1枚ドロー", 3],
	[3, "on_summon", "召喚時: 隣接味方ATK+1(永続)", 4],
	[4, "on_summon", "召喚時: 敵の最低HP1体に2ダメージ", 4],
	[5, "on_summon", "召喚時: 隣接味方に攻撃ダイス+1", 5],
	[6, "on_destroy", "破壊時: 1枚ドロー", 3],
	[7, "on_destroy", "破壊時: 破壊した相手に2ダメージ", 4],
	[8, "on_destroy", "破壊時: 敵全体に1ダメージ", 5],
	[9, "on_destroy", "破壊時: トラッシュからランダム1枚回収", 4],
	[10, "on_destroy", "破壊時: 隣接味方HP+2", 4],
	[11, "passive", "常時: 隣接味方ATK+1", 5],
	[12, "passive", "常時: 自身被ダメージ-1(最低1)", 4],
	[13, "passive", "常時: 自ターン開始時HP1回復", 3],
	[14, "passive", "常時: 攻撃時1枚ドロー", 5],
	[15, "passive", "常時: 隣接敵ATK-1(最低0)", 5],
	[16, "auto_trigger", "自動: 相手召喚時そのカードに1ダメージ", 4],
	[17, "auto_trigger", "自動: 隣接味方破壊時自身ATK+1(永続)", 3],
	[18, "auto_trigger", "自動: 被攻撃時追加1ダメージ返し", 4],
]

var card_colors: Array[Color] = [
	Color(0.9, 0.3, 0.3), Color(0.3, 0.5, 0.9), Color(0.3, 0.8, 0.3),
	Color(0.9, 0.6, 0.2), Color(0.7, 0.3, 0.9), Color(0.2, 0.8, 0.8),
	Color(0.9, 0.9, 0.2), Color(0.9, 0.4, 0.7), Color(0.5, 0.8, 0.2),
	Color(0.2, 0.5, 0.8), Color(0.8, 0.3, 0.3), Color(0.3, 0.8, 0.6),
]

func _ready() -> void:
	_generate_card_pool()

func _generate_card_pool() -> void:
	card_pool.clear()
	var id_counter := 0

	# No-effect cards (18 cards) - each totals ~18 cost points
	# Format: [name, hp, atk, summon_count, attack_count]
	var no_effect_cards := [
		["アイアンガード", 8, 4, 2, 2],       # 8+4+3+3=18
		["鋼鉄の壁", 10, 2, 2, 2],            # 10+2+3+3=18
		["フレイムストライカー", 3, 6, 3, 3],  # 3+6+4.5+4.5=18
		["シャドウブレード", 4, 5, 3, 3],      # 4+5+4.5+4.5=18
		["バランスナイト", 5, 4, 3, 3],        # 5+4+4.5+4.5=18
		["スウィフトスカウト", 3, 3, 4, 4],    # 3+3+6+6=18
		["ヘビーゴーレム", 9, 3, 2, 2],        # 9+3+3+3=18
		["ストームランサー", 4, 5, 3, 3],      # 4+5+4.5+4.5=18
		["クリスタルワーデン", 6, 3, 3, 3],    # 6+3+4.5+4.5=18
		["バーサーカー", 2, 7, 3, 3],          # 2+7+4.5+4.5=18
		["フォートレス", 12, 1, 1, 2],         # 12+1+1.5+3=17.5
		["ウインドランナー", 4, 2, 4, 4],      # 4+2+6+6=18
		["バトルアックス", 5, 4, 3, 3],        # 5+4+4.5+4.5=18 (different dice)
		["ダークタイタン", 6, 6, 1, 2],        # 6+6+1.5+3=16.5
		["ライトセイバー", 3, 4, 3, 4],        # 3+4+4.5+6=17.5
		["ストーンセンチネル", 9, 3, 1, 3],    # 9+3+1.5+4.5=18
		["デュアルブレード", 4, 4, 3, 3],      # 4+4+4.5+4.5=17 (close)
		["サンダーフィスト", 2, 5, 3, 4],      # 2+5+4.5+6=17.5
	]

	for template in no_effect_cards:
		var card := CardData.new()
		card.id = id_counter
		card.card_name = template[0]
		card.hp = template[1]
		card.atk = template[2]
		card.summon_dice = _random_dice(template[3])
		card.attack_dice = _random_dice(template[4])
		card.effect_type = "none"
		card.effect_id = 0
		card.effect_description = ""
		card.color = card_colors[id_counter % card_colors.size()]
		card.icon_name = _get_icon_for_index(id_counter)
		card_pool.append(card)
		id_counter += 1

	# Effect cards (12 cards)
	# Format: [name, hp, atk, summon_count, attack_count, effect_index (0-based into effect_defs)]
	var effect_cards := [
		["ファイアインプ", 3, 3, 2, 2, 0],       # 3+3+3+3+3cost=15 (effect cost 3)
		["スカラー", 3, 2, 3, 2, 1],              # 3+2+4.5+3+3=15.5
		["ウォードラマー", 2, 2, 3, 2, 2],        # 2+2+4.5+3+4=15.5
		["スナイパー", 2, 3, 2, 3, 3],            # 2+3+3+4.5+4=16.5
		["エンチャンター", 2, 2, 2, 2, 4],        # 2+2+3+3+5=15
		["フェニックスエッグ", 4, 2, 3, 2, 5],    # 4+2+4.5+3+3=16.5
		["ボムシェル", 2, 3, 2, 2, 6],            # 2+3+3+3+4=15
		["ランドマイン", 1, 1, 3, 3, 7],          # 1+1+4.5+4.5+5=16
		["ネクロマンサー", 3, 2, 2, 2, 8],        # 3+2+3+3+4=15
		["ヒーラー", 3, 1, 3, 2, 9],              # 3+1+4.5+3+4=15.5
		["コマンダー", 2, 2, 2, 2, 10],           # 2+2+3+3+5=15
		["ガーディアン", 4, 1, 3, 2, 11],         # 4+1+4.5+3+4=16.5
	]

	for template in effect_cards:
		var card := CardData.new()
		card.id = id_counter
		card.card_name = template[0]
		card.hp = template[1]
		card.atk = template[2]
		card.summon_dice = _random_dice(template[3])
		card.attack_dice = _random_dice(template[4])
		var eff = effect_defs[template[5]]
		card.effect_type = eff[1]
		card.effect_id = eff[0]
		card.effect_description = eff[2]
		card.color = card_colors[id_counter % card_colors.size()]
		card.icon_name = _get_icon_for_index(id_counter)
		card_pool.append(card)
		id_counter += 1

func _random_dice(count: int) -> Array[int]:
	var available := [1, 2, 3, 4, 5, 6]
	available.shuffle()
	var result: Array[int] = []
	for i in range(mini(count, 6)):
		result.append(available[i])
	result.sort()
	return result

func _get_icon_for_index(idx: int) -> String:
	var icons := ["sword", "shield", "star", "flame", "bolt", "heart", "skull", "crown", "gem", "arrow"]
	return icons[idx % icons.size()]

func get_card_by_id(id: int) -> CardData:
	for card in card_pool:
		if card.id == id:
			return card
	return null

func get_all_cards() -> Array[CardData]:
	return card_pool

func build_random_deck() -> Array[CardData]:
	var deck: Array[CardData] = []
	var pool_copy := card_pool.duplicate()
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
