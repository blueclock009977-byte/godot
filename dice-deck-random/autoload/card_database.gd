extends Node

var card_pool: Array[CardData] = []

# 色ごとのカラー定義
var color_by_type: Dictionary = {
	CardData.ColorType.GRAY: Color(0.5, 0.5, 0.55),
	CardData.ColorType.BLUE: Color(0.3, 0.5, 0.9),
	CardData.ColorType.GREEN: Color(0.3, 0.8, 0.3),
	CardData.ColorType.BLACK: Color(0.3, 0.2, 0.3),
	CardData.ColorType.RED: Color(0.9, 0.3, 0.2),
	CardData.ColorType.YELLOW: Color(0.95, 0.85, 0.2),
	CardData.ColorType.PURPLE: Color(0.6, 0.3, 0.7),
	CardData.ColorType.WHITE: Color(0.95, 0.95, 0.9),
}

func _ready() -> void:
	_generate_card_pool()

func _generate_card_pool() -> void:
	card_pool.clear()

	# ═══════════════════════════════════════════
	# バランス計算式（2026-02-20再調整）:
	# budget = 14 + 8 * cost
	# score = 5*HP + 3*ATK + 3*面数 + (ATK*面数)//4
	# 効果カードは効果強度で予算補正（強い効果は大きく減算、デメリットは加算）
	# 2026-02-20 調整方針:
	# - 召喚時/常時 > 死亡時 > 攻撃時 の順で重くする
	# - ドロー/コスト/ダイス操作は高コスト
	# - デメリット効果（例: 召喚時HP-2）は予算回復を大きめに
	# ═══════════════════════════════════════════

	# ═══════════════════════════════════════════
	# グレー（バニラ）カード - ID 0-19
	# ═══════════════════════════════════════════
	var gray_defs := [
		# Cost 1 (budget 22)
		[0, "スライム", 1, 1, 3, [1,2]],
		[1, "ストーンウォール", 1, 1, 4, [1]],
		[2, "ゴブリン", 1, 2, 2, [1,2]],
		[3, "ナイフィンプ", 1, 3, 2, [6]],
		# Cost 2 (budget 32)
		[4, "シールドナイト", 2, 2, 5, [3,4]],
		[5, "スカウト", 2, 2, 3, [1,2,3,4]],
		[6, "ウォリアー", 2, 3, 4, [1,2]],
		[7, "アサシン", 2, 4, 2, [4,5,6]],
		# Cost 3 (budget 42)
		[8, "フォートレス", 3, 2, 7, [1,2]],
		[9, "ストライカー", 3, 3, 5, [1,2,3]],
		[10, "パラディン", 3, 4, 4, [1,2,3]],
		[11, "バーサーカー", 3, 7, 3, [2,5]],
		# Cost 4 (budget 52)
		[12, "アイアンゴーレム", 4, 2, 9, [1,2,3]],
		[13, "ブレードマスター", 4, 3, 7, [1,2,3,4]],
		[14, "ドラゴンナイト", 4, 5, 6, [2,4,6]],
		[15, "ウォーロード", 4, 7, 5, [3,6]],
		# Cost 5 (budget 62)
		[16, "タイタン", 5, 3, 11, [1,2]],
		[17, "ドラゴン", 5, 3, 8, [1,2,3,4,5]],
		[18, "デスブリンガー", 5, 6, 7, [2,4,6]],
		[19, "エンシェント", 5, 8, 7, [3,6]],
	]

	for d in gray_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.GRAY, "")

	# ═══════════════════════════════════════════
	# 青カード - ID 20-39 (コントロール・デバフ)
	# ═══════════════════════════════════════════
	var blue_defs := [
		# Cost 1 (7-2=5)
		[20, "氷の精霊", 1, 1, 3, [2,3], "blue_001"],
		[21, "フロストバット", 1, 1, 5, [3,4], "blue_002"],
		[22, "氷のネズミ", 1, 2, 2, [4], "blue_009"],
		[23, "霜の妖精", 1, 3, 2, [5], "blue_001"],
		# Cost 2 (10-2=8)
		[24, "水の使い", 2, 1, 7, [1,2,6], "blue_001"],
		[25, "霧の狼", 2, 1, 3, [1,2,3,4], "blue_003"],
		[26, "氷の彫刻家", 2, 2, 4, [2,3], "blue_011"],
		[27, "海のスライム", 2, 4, 3, [3,4,5], "blue_010"],
		# Cost 3 (13-3=10)
		[28, "氷結の騎士", 3, 1, 8, [4,5], "blue_004"],
		[29, "深海魚", 3, 2, 5, [1,2,5,6], "blue_005"],
		[30, "吹雪の魔術師", 3, 3, 5, [1,2,6], "blue_003"],
		[31, "氷の壁", 3, 6, 4, [1,2], "blue_013"],
		# Cost 4 (16-3=13)
		[32, "吹雪のドラゴン", 4, 1, 10, [2,3,4], "blue_004"],
		[33, "海神の守護者", 4, 3, 6, [1,3,4,5,6], "blue_006"],
		[34, "海賊船長", 4, 5, 5, [4,5,6], "blue_014"],
		[35, "北風の精", 4, 7, 5, [5,6], "blue_015"],
		# Cost 5 (19-4=15)
		[36, "氷帝", 5, 2, 12, [1,2,6], "blue_007"],
		[37, "凍てつく巨人", 5, 3, 8, [1,2,3,4,5], "blue_008"],
		[38, "氷山", 5, 6, 7, [2,3,4], "blue_016"],
		[39, "絶対零度", 5, 8, 6, [3,4,5], "blue_018"],
	]

	for d in blue_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.BLUE, d[6])

	# ═══════════════════════════════════════════
	# 緑カード - ID 40-59 (マナ加速・回復)
	# ═══════════════════════════════════════════
	var green_defs := [
		# Cost 1 (7-2=5)
		[40, "森の妖精", 1, 1, 4, [3,4,5], "green_001"],
		[41, "若木のトレント", 1, 1, 6, [4], "green_002"],
		[42, "花のスプライト", 1, 2, 3, [5], "green_001"],
		[43, "種まき", 1, 3, 3, [6], "green_002"],
		# Cost 2 (10-2=8)
		[44, "草原の狩人", 2, 1, 8, [1,2,3], "green_001"],
		[45, "花の精", 2, 1, 4, [2,3,4,5], "green_003"],
		[46, "蔦の魔術師", 2, 2, 5, [3,4], "green_001"],
		[47, "木こりオーク", 2, 4, 4, [4,5], "green_010"],
		# Cost 3 (13-3=10)
		[48, "森の守護者", 3, 1, 9, [1,5,6], "green_004"],
		[49, "大樹の戦士", 3, 2, 6, [1,2,3,6], "green_005"],
		[50, "ドリアードの巫女", 3, 3, 6, [1,2], "green_011"],
		[51, "森の巨人", 3, 6, 5, [2,3], "green_012"],
		# Cost 4 (16-3=13)
		[52, "エルフの賢者", 4, 1, 11, [3,4,5,6], "green_006"],
		[53, "古代樹", 4, 3, 7, [1,4,5,6], "green_007"],
		[54, "春風の使者", 4, 5, 6, [1,5,6], "green_013"],
		[55, "苔の巨人", 4, 7, 6, [1,6], "green_014"],
		# Cost 5 (19-4=15)
		[56, "森林王", 5, 2, 13, [1,2,3], "green_008"],
		[57, "世界樹の化身", 5, 3, 9, [2,3,4,5,6], "green_009"],
		[58, "大地の精霊", 5, 6, 8, [3,4,5], "green_015"],
		[59, "生命の木", 5, 8, 7, [4,5], "green_016"],
	]

	for d in green_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.GREEN, d[6])

	# ═══════════════════════════════════════════
	# 黒カード - ID 60-79 (自傷・ハイリスクハイリターン)
	# ═══════════════════════════════════════════
	var black_defs := [
		# Cost 1 (7-2+selfdam)
		[60, "闇のコウモリ", 1, 3, 1, [1,2,3], "black_001"],
		[61, "呪いの人形", 1, 2, 3, [2], "black_002"],
		[62, "疫病ネズミ", 1, 4, 1, [1], "black_010"],
		[63, "闇のインプ", 1, 5, 1, [4], "black_001"],
		# Cost 2 (10-2+selfdam)
		[64, "影の暗殺者", 2, 2, 5, [5,6], "black_003"],
		[65, "毒蛇", 2, 3, 1, [1,2,3,4,6], "black_004"],
		[66, "ゾンビ", 2, 4, 2, [2,3], "black_011"],
		[67, "闇の魔術師", 2, 6, 1, [1,2], "black_012"],
		# Cost 3 (13-3+selfdam)
		[68, "堕天使", 3, 3, 6, [1,4], "black_005"],
		[69, "死霊術師", 3, 4, 3, [3,4,5,6], "black_006"],
		[70, "骸骨剣士", 3, 5, 3, [3,5,6], "black_013"],
		[71, "悪魔の契約者", 3, 8, 2, [3,6], "black_014"],
		# Cost 4 (16-3+selfdam)
		[72, "漆黒の騎士", 4, 3, 8, [1,2,3], "black_005"],
		[73, "吸血鬼", 4, 5, 4, [1,2,4,5], "black_007"],
		[74, "ダークナイト", 4, 7, 3, [1,4,5], "black_015"],
		[75, "死神", 4, 9, 3, [4,5,6], "black_016"],
		# Cost 5 (19-4+selfdam)
		[76, "魔王の影", 5, 4, 10, [5,6], "black_008"],
		[77, "深淵の王", 5, 5, 6, [1,2,3,4,6], "black_009"],
		[78, "堕落の竜", 5, 8, 5, [1,2,3], "black_017"],
		[79, "暗黒神", 5, 10, 4, [1,2], "black_019"],
	]

	for d in black_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.BLACK, d[6])

	# ═══════════════════════════════════════════
	# 赤カード - ID 80-99 (攻撃特化・直接ダメージ)
	# ═══════════════════════════════════════════
	var red_defs := [
		[80, "火の精霊", 1, 4, 1, [1,2], "red_001"],
		[81, "炎のネズミ", 1, 3, 2, [1], "red_002"],
		[82, "火花インプ", 1, 5, 1, [3], "red_001"],
		[83, "溶岩スライム", 1, 6, 1, [4], "red_003"],
		[84, "炎の戦士", 2, 3, 4, [5,6], "red_001"],
		[85, "火炎魔術師", 2, 4, 1, [1,2,3,6], "red_004"],
		[86, "バーニングナイト", 2, 5, 1, [1,2], "red_005"],
		[87, "火の鳥", 2, 7, 1, [1,3], "red_006"],
		[88, "炎の騎士", 3, 4, 5, [3,4], "red_007"],
		[89, "ファイアドラゴン", 3, 5, 2, [2,4,5,6], "red_008"],
		[90, "溶岩巨人", 3, 6, 2, [5,6], "red_009"],
		[91, "業火の魔人", 3, 9, 1, [2,6], "red_010"],
		[92, "炎帝", 4, 4, 7, [1,2,3], "red_011"],
		[93, "フェニックス", 4, 6, 3, [1,3,4,5], "red_012"],
		[94, "地獄の番犬", 4, 8, 2, [3,4,5], "red_013"],
		[95, "火山龍", 4, 10, 2, [4,5], "red_014"],
		[96, "炎神", 5, 5, 9, [5,6], "red_015"],
		[97, "メテオドラゴン", 5, 6, 5, [1,2,3,4,6], "red_016"],
		[98, "灼熱の魔王", 5, 9, 4, [1,2,3], "red_017"],
		[99, "太陽神", 5, 11, 3, [1,3], "red_018"],
	]

	for d in red_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.RED, d[6])

	# ═══════════════════════════════════════════
	# 黄カード - ID 100-119 (サポート・バフ)
	# ═══════════════════════════════════════════
	var yellow_defs := [
		[100, "光の精霊", 1, 1, 3, [1,6], "yellow_001"],
		[101, "聖なる小鳥", 1, 1, 5, [1], "yellow_002"],
		[102, "祝福のスプライト", 1, 2, 2, [3,5], "yellow_003"],
		[103, "星の欠片", 1, 3, 2, [5], "yellow_004"],
		[104, "光の戦士", 2, 1, 7, [2,4], "yellow_005"],
		[105, "癒しの天使", 2, 1, 3, [1,3,4,6], "yellow_006"],
		[106, "守護の騎士", 2, 2, 4, [1,6], "yellow_007"],
		[107, "光のスライム", 2, 4, 3, [1,3], "yellow_008"],
		[108, "聖騎士", 3, 1, 8, [2,3,5], "yellow_009"],
		[109, "光の魔術師", 3, 2, 5, [2,4,5,6], "yellow_010"],
		[110, "天使", 3, 3, 5, [2,4], "yellow_011"],
		[111, "希望の使者", 3, 6, 4, [4,6], "yellow_012"],
		[112, "大天使", 4, 1, 10, [1,3,6], "yellow_013"],
		[113, "光の龍", 4, 3, 6, [1,2,3,5], "yellow_014"],
		[114, "聖者", 4, 5, 5, [2,3,4,5], "yellow_015"],
		[115, "祝福の精霊王", 4, 7, 5, [2,5], "yellow_016"],
		[116, "光神", 5, 2, 12, [2,4], "yellow_017"],
		[117, "天空龍", 5, 3, 8, [1,3,4,5,6], "yellow_018"],
		[118, "希望の女神", 5, 6, 7, [1,3,6], "yellow_019"],
		[119, "太陽の化身", 5, 8, 6, [1,3], "yellow_020"],
	]

	for d in yellow_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.YELLOW, d[6])

	# ═══════════════════════════════════════════
	# 紫カード - ID 120-139 (コントロール・妨害)
	# ═══════════════════════════════════════════
	var purple_defs := [
		[120, "闇の精霊", 1, 2, 2, [1,6], "purple_001"],
		[121, "呪いのコウモリ", 1, 1, 4, [6], "purple_002"],
		[122, "影のネズミ", 1, 3, 1, [2,5], "purple_003"],
		[123, "夜の蝶", 1, 4, 1, [5], "purple_004"],
		[124, "闇の魔術師", 2, 1, 6, [3,4], "purple_005"],
		[125, "呪術師", 2, 2, 2, [1,2,4,6], "purple_006"],
		[126, "影の狼", 2, 3, 3, [1,2,6], "purple_007"],
		[127, "夢魔", 2, 5, 2, [2,6], "purple_008"],
		[128, "闇の騎士", 3, 2, 7, [2,5], "purple_009"],
		[129, "呪いの魔女", 3, 3, 4, [1,3,4,5], "purple_010"],
		[130, "影の龍", 3, 4, 4, [1,3,4], "purple_011"],
		[131, "悪夢の使者", 3, 7, 3, [1,4], "purple_012"],
		[132, "闇の王", 4, 2, 9, [1,2,6], "purple_013"],
		[133, "呪いの竜", 4, 4, 5, [2,3,5,6], "purple_014"],
		[134, "影の支配者", 4, 6, 4, [2,3,4,5], "purple_015"],
		[135, "悪夢の王", 4, 8, 4, [3,5], "purple_016"],
		[136, "闇神", 5, 3, 11, [3,4], "purple_017"],
		[137, "呪いの神", 5, 4, 7, [1,2,4,5,6], "purple_018"],
		[138, "影の帝王", 5, 7, 6, [1,2,5,6], "purple_019"],
		[139, "虚無の王", 5, 9, 5, [2,6], "purple_020"],
	]

	for d in purple_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.PURPLE, d[6])

	# ═══════════════════════════════════════════
	# 白カード - ID 140-159 (回復・防御・蘇生)
	# ═══════════════════════════════════════════
	var white_defs := [
		[140, "聖なる精霊", 1, 1, 5, [2], "white_001"],
		[141, "癒しの光", 1, 1, 7, [3], "white_002"],
		[142, "守護の精霊", 1, 1, 4, [4], "white_003"],
		[143, "祈りの天使", 1, 2, 4, [5], "white_004"],
		[144, "白の戦士", 2, 1, 9, [1,6], "white_005"],
		[145, "癒しの騎士", 2, 1, 5, [1,2,3,4], "white_006"],
		[146, "聖なる盾", 2, 1, 6, [2], "white_007"],
		[147, "祝福の僧侶", 2, 3, 5, [3,4], "white_008"],
		[148, "聖騎士団長", 3, 1, 10, [4,5], "white_009"],
		[149, "癒しの天使長", 3, 1, 7, [1,5,6], "white_010"],
		[150, "聖なる守護者", 3, 2, 7, [1,6], "white_011"],
		[151, "祈りの巫女", 3, 5, 6, [1,2], "white_012"],
		[152, "大聖騎士", 4, 1, 12, [2,3], "white_013"],
		[153, "神聖龍", 4, 2, 8, [3,4,5,6], "white_014"],
		[154, "復活の天使", 4, 4, 7, [4,5,6], "white_015"],
		[155, "聖域の守護者", 4, 6, 7, [5], "white_016"],
		[156, "聖神", 5, 1, 14, [1,6], "white_017"],
		[157, "神聖の化身", 5, 2, 10, [1,2,3,4,5], "white_018"],
		[158, "復活の女神", 5, 5, 9, [2,3], "white_019"],
		[159, "光の創造主", 5, 7, 8, [3,4], "white_020"],
	]

	for d in white_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.WHITE, d[6])

func _score_card(card: CardData) -> int:
	var faces := card.attack_dice.size()
	var synergy := (card.atk * faces) / 4
	return 5 * card.hp + 3 * card.atk + 3 * faces + int(synergy)

func _base_budget(cost: int) -> int:
	return 14 + 8 * cost

func _tune_card_stats_to_budget(card: CardData, budget: int) -> void:
	for _i in range(64):
		var score := _score_card(card)
		var delta := budget - score
		if abs(delta) <= 1:
			return

		if delta > 0:
			# 予算不足: まずHPを上げ、次にATKで微調整
			if delta >= 4:
				card.hp += 1
			else:
				card.atk += 1
		else:
			# 予算超過: まずHPを下げ、次にATKを下げる
			if card.hp > 1 and -delta >= 4:
				card.hp -= 1
			elif card.atk > 0 and -delta >= 3:
				card.atk -= 1
			elif card.hp > 1:
				card.hp -= 1
			elif card.atk > 0:
				card.atk -= 1
			else:
				return
func _get_effect_budget_modifier(effect_id: String) -> int:
	# 効果が強いほどマイナス（ステータス予算を消費）
	# デメリット効果はプラス（ステータス予算を追加）
	# ルーブリック:
	# - 基準: 召喚時1ダメージ ≒ -6
	# - ドロー: 1枚=-12 / 2枚=-24
	# - 重要度: 召喚時/常時 > 死亡時 > 攻撃時
	# - 召喚時自傷は +5/1HP（HP-2 で +10 回復目安）
	if effect_id == "":
		return 0

	var modifier_by_effect := {
		# blue
		"blue_001": -8, "blue_002": -12, "blue_003": -5, "blue_004": -10, "blue_005": -8, "blue_006": -8,
		"blue_007": -12, "blue_008": -7, "blue_009": -7, "blue_010": -8, "blue_011": -8, "blue_012": -4,
		"blue_013": -9, "blue_014": -12, "blue_015": -9, "blue_016": -11, "blue_017": -10, "blue_018": -12,

		# green
		"green_001": -8, "green_002": -6, "green_003": -7, "green_004": -10, "green_005": -8, "green_006": -12,
		"green_007": -10, "green_008": -12, "green_009": -10, "green_010": -4, "green_011": -8, "green_012": -5,
		"green_013": -14, "green_014": -7, "green_015": -12, "green_016": -10, "green_017": -12,

		# black
		"black_001": 5, "black_002": -7, "black_003": 10, "black_004": -6, "black_005": 15, "black_006": -8,
		"black_007": -6, "black_008": 25, "black_009": -12, "black_010": -9, "black_011": -9, "black_012": -10,
		"black_013": -8, "black_014": -2, "black_015": -3, "black_016": -8, "black_017": 20, "black_018": -11,
		"black_019": -14,

		# red
		"red_001": -8, "red_002": -6, "red_003": -12, "red_004": -9, "red_005": -5, "red_006": -10,
		"red_007": -10, "red_008": -8, "red_009": 6, "red_010": -7, "red_011": -10, "red_012": -8,
		"red_013": -4, "red_014": -9, "red_015": -13, "red_016": -11, "red_017": -14, "red_018": -12,

		# yellow
		"yellow_001": -8, "yellow_002": -12, "yellow_003": -24, "yellow_004": -5, "yellow_005": -12, "yellow_006": -9,
		"yellow_007": -8, "yellow_008": -4, "yellow_009": -9, "yellow_010": -8, "yellow_011": -9, "yellow_012": -10,
		"yellow_013": -12, "yellow_014": -6, "yellow_015": -8, "yellow_016": -12, "yellow_017": -11,
		"yellow_018": -6, "yellow_019": -11, "yellow_020": -13,

		# purple
		"purple_001": -9, "purple_002": -5, "purple_003": -10, "purple_004": -12, "purple_005": -7, "purple_006": -12,
		"purple_007": -8, "purple_008": -9, "purple_009": -10, "purple_010": -11, "purple_011": -11, "purple_012": -12,
		"purple_013": -6, "purple_014": -11, "purple_015": -12, "purple_016": -7, "purple_017": -14,
		"purple_018": -14, "purple_019": -13, "purple_020": -13,

		# white
		"white_001": -8, "white_002": -7, "white_003": -7, "white_004": -11, "white_005": -11, "white_006": -12,
		"white_007": -11, "white_008": -6, "white_009": -10, "white_010": -9, "white_011": -11, "white_012": -9,
		"white_013": -8, "white_014": -9, "white_015": -12, "white_016": -11, "white_017": -12,
		"white_018": -12, "white_019": -13, "white_020": -14,
	}

	if modifier_by_effect.has(effect_id):
		return int(modifier_by_effect[effect_id])

	push_error("[CardDatabase] 未分類のeffect_id: %s" % effect_id)
	return 0

func _get_required_min_hp_for_effect(effect_id: String) -> int:
	match effect_id:
		"black_001":
			return 2  # 召喚時HP-1
		"black_003":
			return 3  # 召喚時HP-2
		"black_005":
			return 4  # 召喚時HP-3
		"black_008":
			return 6  # 召喚時HP-5
		"black_014":
			return 3  # 召喚時HP-2
		"black_017":
			return 5  # 召喚時HP-4
		_:
			return 1

func _enforce_effect_min_hp(card: CardData) -> void:
	var required_min_hp := _get_required_min_hp_for_effect(card.effect_id)
	if card.hp < required_min_hp:
		card.hp = required_min_hp

func _balance_effect_card_stats(card: CardData) -> void:
	if card.color_type == CardData.ColorType.GRAY or card.effect_id == "":
		return

	var budget := _base_budget(card.mana_cost) + _get_effect_budget_modifier(card.effect_id)
	_tune_card_stats_to_budget(card, budget)
	_enforce_effect_min_hp(card)

func _add_card(id: int, card_name: String, cost: int, atk: int, hp: int, dice_arr: Array, color_type: CardData.ColorType, effect_id: String) -> void:
	var card := CardData.new()
	card.id = id
	card.card_name = card_name
	card.mana_cost = cost
	card.atk = atk
	card.hp = hp
	card.attack_dice = []
	for d in dice_arr:
		card.attack_dice.append(d)
	card.color_type = color_type
	card.color = color_by_type.get(color_type, Color.WHITE)
	card.effect_id = effect_id
	if color_type == CardData.ColorType.GRAY or effect_id == "":
		_tune_card_stats_to_budget(card, _base_budget(card.mana_cost))
	else:
		_balance_effect_card_stats(card)
	card.icon_name = ["sword", "shield", "star", "flame", "bolt", "heart", "skull", "crown", "gem", "arrow"][id % 10]
	card_pool.append(card)

func get_card_by_id(id: int) -> CardData:
	for card in card_pool:
		if card.id == id:
			return card
	return null

func get_cards_by_color(color_type: CardData.ColorType) -> Array[CardData]:
	var result: Array[CardData] = []
	for card in card_pool:
		if card.color_type == color_type:
			result.append(card)
	return result

func get_all_cards() -> Array[CardData]:
	return card_pool

func get_deck_colors(deck: Array) -> Array:
	"""デッキに含まれる色のリストを取得（グレーを除く）"""
	var colors := []
	for card in deck:
		if card is CardData and card.color_type != CardData.ColorType.GRAY:
			if card.color_type not in colors:
				colors.append(card.color_type)
	return colors

func get_initial_hand_size(deck: Array) -> int:
	"""デッキの色数に応じた初期手札枚数を取得
	0〜1色=4枚、2色=3枚、3色=2枚、4色=1枚、5色以上=0枚"""
	var color_count := get_deck_colors(deck).size()
	if color_count <= 1:
		return 4
	elif color_count == 2:
		return 3
	elif color_count == 3:
		return 2
	elif color_count == 4:
		return 1
	else:
		return 0

func to_card_data_array(arr: Array) -> Array[CardData]:
	"""汎用配列をArray[CardData]に変換するユーティリティ関数"""
	var result: Array[CardData] = []
	for item in arr:
		result.append(item)
	return result

func _get_non_gray_colors() -> Array:
	var colors: Array = []
	for card in card_pool:
		if card.color_type == CardData.ColorType.GRAY:
			continue
		if card.color_type not in colors:
			colors.append(card.color_type)
	return colors

func build_random_battle_deck() -> Array[CardData]:
	"""バトル用のランダムデッキを生成。
	ルール: 20枚、同名2枚まで、グレー+ランダム1色のみ。"""
	var deck: Array[CardData] = []
	var non_gray_colors := _get_non_gray_colors()
	if non_gray_colors.is_empty():
		return build_random_deck()

	var selected_color = non_gray_colors[randi() % non_gray_colors.size()]
	var candidates: Array[CardData] = []
	for card in card_pool:
		if card.color_type == CardData.ColorType.GRAY or card.color_type == selected_color:
			# 同名2枚まで
			candidates.append(card)
			candidates.append(card)

	candidates.shuffle()
	for i in range(mini(20, candidates.size())):
		deck.append(candidates[i].duplicate_card())

	# 何らかの理由で不足した場合の保険
	if deck.size() < 20:
		return build_random_deck()

	return deck

func build_random_deck() -> Array[CardData]:
	"""ランダムなデッキを生成（汎用/テスト用）"""
	var deck: Array[CardData] = []
	var all_cards := get_all_cards()
	all_cards.shuffle()
	for i in range(mini(20, all_cards.size())):
		deck.append(all_cards[i].duplicate_card())
	return deck
