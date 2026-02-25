extends Node

var card_pool: Array[CardData] = []

# ON_ATTACK タイミングの効果ID一覧（faces数でスケーリング対象）
const ON_ATTACK_EFFECTS: Array[String] = [
	"blue_003", "blue_008", "blue_012", "blue_017",
	"green_010",
	"black_004", "black_007", "black_015", "black_016",
	"red_002", "red_005", "red_008", "red_013",
	"yellow_008", "yellow_018",
	"purple_002", "purple_007", "purple_013", "purple_016",
	"white_008",
]

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
	# budget = 12 + 8 * cost
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
		[15, "ウォーロード", 4, 7, 5, [2,3,6]],  # 面数 [3,6]->[2,3,6]
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
		[60, "闇のコウモリ", 1, 2, 1, [1,2,3], "black_001"],
		[61, "呪いの人形", 1, 1, 3, [2], "black_002"],
		[62, "疫病ネズミ", 1, 3, 1, [1], "black_010"],
		[63, "闘のインプ", 1, 4, 1, [4], "black_001"],
		# Cost 2 (10-2+selfdam)
		[64, "影の暗殺者", 2, 1, 5, [5,6], "black_003"],
		[65, "毒蛇", 2, 2, 1, [1,2,3,4,6], "black_004"],
		[66, "ゾンビ", 2, 3, 2, [2,3], "black_011"],
		[67, "闇の魔術師", 2, 5, 1, [1,2], "black_012"],
		# Cost 3 (13-3+selfdam)
		[68, "堕天使", 3, 2, 6, [1,4], "black_005"],
		[69, "死霊術師", 3, 3, 3, [3,4,5,6], "black_006"],
		[70, "骸骨剣士", 3, 4, 3, [3,5,6], "black_013"],
		[71, "悪魔の契約者", 3, 7, 2, [3,6], "black_014"],
		# Cost 4 (16-3+selfdam)
		[72, "漆黒の騎士", 4, 2, 8, [1,2,3], "black_005"],
		[73, "吸血鬼", 4, 4, 4, [1,2,4,5], "black_007"],
		[74, "ダークナイト", 4, 6, 3, [1,4,5], "black_015"],
		[75, "死神", 4, 8, 3, [4,5,6], "black_016"],
		# Cost 5 (19-4+selfdam)
		[76, "魔王の影", 5, 3, 10, [5,6], "black_008"],
		[77, "深淵の王", 5, 4, 6, [1,2,3,4,6], "black_009"],
		[78, "堕落の竜", 5, 7, 5, [1,2,3], "black_017"],
		[79, "暗黒神", 5, 9, 4, [1,2], "black_019"],
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
		[140, "聖なる精霊", 1, 2, 5, [2], "white_001"],
		[141, "癒しの光", 1, 2, 7, [3], "white_002"],
		[142, "守護の精霊", 1, 2, 4, [4], "white_003"],
		[143, "祈りの天使", 1, 3, 4, [5], "white_004"],
		[144, "白の戦士", 2, 2, 9, [1,6], "white_005"],
		[145, "癒しの騎士", 2, 2, 5, [1,2,3,4], "white_006"],
		[146, "聖なる盾", 2, 2, 6, [2], "white_007"],
		[147, "祝福の僧侶", 2, 4, 5, [3,4], "white_008"],
		[148, "聖騎士団長", 3, 2, 10, [4,5], "white_009"],
		[149, "癒しの天使長", 3, 2, 7, [1,5,6], "white_010"],
		[150, "聖なる守護者", 3, 3, 7, [1,6], "white_011"],
		[151, "祈りの巫女", 3, 6, 6, [1,2], "white_012"],
		[152, "大聖騎士", 4, 2, 12, [2,3], "white_013"],
		[153, "神聖龍", 4, 3, 8, [3,4,5,6], "white_014"],
		[154, "復活の天使", 4, 5, 7, [4,5,6], "white_015"],
		[155, "聖域の守護者", 4, 7, 7, [5], "white_016"],
		[156, "聖神", 5, 2, 14, [1,6], "white_017"],
		[157, "神聖の化身", 5, 3, 10, [1,2,3,4,5], "white_018"],
		[158, "復活の女神", 5, 6, 9, [2,3], "white_019"],
		[159, "光の創造主", 5, 8, 8, [3,4], "white_020"],
	]

	for d in white_defs:
		_add_card(d[0], d[1], d[2], d[3], d[4], d[5], CardData.ColorType.WHITE, d[6])

func _score_card(card: CardData) -> int:
	var faces := card.attack_dice.size()
	var synergy := (card.atk * faces) / 4
	return 5 * card.hp + 3 * card.atk + 3 * faces + int(synergy)

const MIN_CARD_SCORE := 5  # 1/0/0 相当の最低ステータスコスト

func _base_budget(cost: int) -> int:
	# パパ指定の基礎予算式
	return 12 + 8 * cost

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

func _get_effect_budget_modifier(effect_id: String, faces: int = 3) -> int:
	# アクション単位コスト表（2026-02-25）:
	# ON_ATTACK効果はfaces=3を基準にfaces/3.0でスケール
	# マナ+1(召喚)=-3, ドロー=-7, ダメージ1HP(単体)=-6, ダメージ1HP(全体)=-10
	# 回復1HP(単体)=-2, 回復1HP(全体)=-5, ATK+/-1(単体)=-5, ATK+/-1(全体)=-9
	# 凍結1t(単体)=-4, 凍結1t(全体)=-8, 自傷HP-1=+5
	# タイミング倍率: ON_SUMMON=1.0, ON_ATTACK=0.6, ON_DEATH=0.7,
	#   ON_DEFENSE=0.7, TURN_START/END=1.4, CONSTANT=2.0
	if effect_id == "":
		return 0

	var modifier_by_effect := {
		# ─── BLUE ───
		"blue_001": -5,   # ON_SUMMON 敵1体ATK-1: -5×1.0
		"blue_002": -8,   # CONSTANT ダイス3,4追加: 2面×2.0
		"blue_003": -2,   # ON_ATTACK 凍結1t: -4×0.6
		"blue_004": -9,   # ON_SUMMON 敵全体ATK-1: -9×1.0
		"blue_005": -7,   # CONSTANT ATK+2(ダイス5,6条件): -5×2×2.0×0.33
		"blue_006": -4,   # ON_DEFENSE 被ダメ半減: -5×0.7
		"blue_007": -20,  # ON_SUMMON 敵全体ATK-2: →調整+2
		"blue_008": -5,   # ON_ATTACK 凍結2t: -4×2×0.6
		"blue_009": -4,   # ON_DEATH 敵1体ATK-1: -5×0.7
		"blue_010": -3,   # TURN_START 自身HP+1: -2×1.4
		"blue_011": -2,   # ON_SUMMON 次ダイス+1: 微小効果
		"blue_012": -4,   # ON_ATTACK 追加相手HP-1: -6×0.6
		"blue_013": -4,   # CONSTANT 同列味方被ダメ-1: -2×2.0
		"blue_014": -7,   # ON_SUMMON ドロー1: -7×1.0
		"blue_015": -9,   # CONSTANT 敵前列ATK-1: -9×2.0×0.5
		"blue_016": -20,  # CONSTANT 敵全体ATK-1: →調整+2
		"blue_017": -5,   # ON_ATTACK HP5以下即破壊: 特殊-8×0.6
		"blue_018": -10,  # ON_SUMMON 敵全体凍結1t: -8×1.0(AoEプレミアム)

		# ─── GREEN ───
		"green_001": -3,  # ON_SUMMON マナ+1: -3×1.0
		"green_002": -2,  # ON_DEATH マナ+1: -3×0.7
		"green_003": -3,  # TURN_START 自身HP+1: -2×1.4
		"green_004": -6,  # ON_SUMMON マナ+2: -3×2
		"green_005": -4,  # ON_DEATH マナ+2: -3×2×0.7
		"green_006": -8,  # CONSTANT 味方コスト-1: 特殊(維持)→調整-4
		"green_007": -7,  # CONSTANT 味方全体HP+1: HP効果は弱め→調整-3
		"green_008": -9,  # ON_SUMMON マナ+3: -3×3
		"green_009": -4,  # TURN_START マナ+1: -3×1.4
		"green_010": -2,  # ON_ATTACK マナ+1: -3×0.6
		"green_011": -4,  # ON_SUMMON 味方1体HP+2: -2×2
		"green_012": -2,  # ON_DEFENSE マナ+1: -3×0.7
		"green_013": -7,  # ON_SUMMON マナ全回復: マナ+3相当→調整-3
		"green_014": -3,  # ON_DEATH 自身HP+2(味方死亡時): -2×2×0.7
		"green_015": -8,  # ON_SUMMON マナ+2+自身HP+2: -6+(-2)→調整-2
		"green_016": -5,  # TURN_END 味方全体HP+1: HP効果弱め→調整-2
		"green_017": -8,  # ON_SUMMON 味方全体HP+2: HP弱め→調整-2

		# ─── BLACK ───
		"black_001": 5,   # ON_SUMMON 自分HP-1: +5
		"black_002": -8,  # ON_DEATH 敵1体HP-2: -6×2×0.7
		"black_003": 10,  # ON_SUMMON 自分HP-2: +5×2
		"black_004": -11, # ON_ATTACK 毒(HP-1/t×3turns): -6×3×0.6
		"black_005": 14,  # ON_SUMMON 自分HP-3: +5×3-1
		"black_006": -6,  # ON_DEATH トークン2/2: -8×0.7
		"black_007": -5,  # ON_ATTACK ライフスティール: -2×ATK×0.6≈
		"black_008": 22,  # ON_SUMMON 自分HP-5: +5×5-3
		"black_009": -8,  # CONSTANT 相手ダイス6無効: -4×2.0
		"black_010": -7,  # ON_DEATH 敵全体HP-1: -10×0.7
		"black_011": -6,  # ON_DEATH 自身復活(1回,HP1): 特殊
		"black_012": -8,  # CONSTANT 相手ダイス1無効: -4×2.0
		"black_013": -7,  # ON_DEATH 敵1体ATK-2: -5×2×0.7
		"black_014": 3,   # ON_SUMMON 自分HP-2+ドロー1: +10-7
		"black_015": -3,  # ON_ATTACK 自分HP-1+ATK+2永続: (+5-10)×0.6
		"black_016": -7,  # ON_ATTACK 対象HP半減: -12×0.6
		"black_017": 18,  # ON_SUMMON 自分HP-4: +5×4-2
		"black_018": -21, # ON_DEATH 敵全体HP-3: -10×3×0.7
		"black_019": -16, # CONSTANT 相手ダイス1,6無効: -4×2×2.0

		# ─── RED ───
		"red_001": -7,    # ON_SUMMON 敵1体HP-1: HP15調整+1
		"red_002": -7,    # ON_ATTACK 対象追加2ダメ: -6×2×0.6
		"red_003": -13,   # ON_SUMMON 敵全体HP-1: HP15調整+3
		"red_004": -12,   # CONSTANT ATK+1: →調整+2
		"red_005": -7,    # ON_ATTACK 自身ATK+1永続: 永続ATK強力→調整+2
		"red_006": -14,   # ON_DEATH 敵全体HP-2: -10×2×0.7
		"red_007": -12,   # ON_SUMMON 味方全体ATK+1: -9×1.0→調整+3
		"red_008": -18,   # ON_ATTACK 2回攻撃: 実質ATK×2相当, 大幅増
		"red_009": -7,    # ON_DEATH 敵味方全体HP-2: -10×2×0.7×0.5
		"red_010": -9,    # TURN_START 自身ATK+1: -5×1.4→調整+2
		"red_011": -14,   # ON_SUMMON 敵1体HP-2: HP15調整+2
		"red_012": -5,    # CONSTANT ATK+3(ダイス1条件): -5×3×2.0×0.17
		"red_013": -4,    # ON_ATTACK 相手HP直接-1: -6×0.6
		"red_014": -18,   # ON_DEATH 敵1体HP-4: HP15調整+1
		"red_015": -13,   # ON_SUMMON 敵全体HP-1: HP15調整+3
		"red_016": -22,   # CONSTANT ATK+2: →調整+2
		"red_017": -26,   # ON_SUMMON 敵全体HP-2: HP15で13%ダメ、大幅増
		"red_018": -20,   # CONSTANT 味方全体ATK+1: →調整+2

		# ─── YELLOW ───
		"yellow_001": -4,  # ON_SUMMON 味方1体HP+2: -2×2
		"yellow_002": -10, # CONSTANT 味方全体ダイス+1: -5×2.0
		"yellow_003": -7,  # ON_SUMMON ドロー1: -7
		"yellow_004": -1,  # ON_DEFENSE 被ダメ-1: -2×0.7
		"yellow_005": -10, # TURN_START ドロー1: -7×1.4
		"yellow_006": -5,  # ON_SUMMON 味方全体HP+1: -5×1
		"yellow_007": -4,  # CONSTANT 自身被ダメ-1: -2×2.0
		"yellow_008": -1,  # ON_ATTACK 自身HP+1: -2×0.6
		"yellow_009": -10, # ON_SUMMON 味方1体ATK+2: -5×2
		"yellow_010": -4,  # TURN_END マナ+1: -3×1.4
		"yellow_011": -7,  # ON_DEATH 味方全体HP+2: -5×2×0.7
		"yellow_012": -18, # CONSTANT 味方全体ATK+1: -9×2.0
		"yellow_013": -14, # ON_SUMMON 味方全体ATK+1,HP+1: -9+(-5)
		"yellow_014": -4,  # ON_DEFENSE ダメージ反射: -5×0.7
		"yellow_015": -6,  # TURN_START 味方1体HP+2: -2×2×1.4
		"yellow_016": -18, # ON_SUMMON 味方全体ATK+2: -9×2
		"yellow_017": -10, # CONSTANT 味方全体被ダメ-1: -5×2.0
		"yellow_018": -3,  # ON_ATTACK 味方全体HP+1: -5×0.6
		"yellow_019": -10, # ON_DEATH 味方全体HP+3: -5×3×0.7
		"yellow_020": -18, # CONSTANT 味方全体ATK+2: -9×2×2.0=-36, 上限-18

		# ─── PURPLE ───
		"purple_001": -4,  # ON_SUMMON 敵1体ダイス1つ無効: -4
		"purple_002": -9,  # ON_ATTACK 対象ATK-2永続: -5×2×0.6×1.5
		"purple_003": -5,  # ON_SUMMON 相手手札1枚破棄: -5
		"purple_004": -10, # CONSTANT 相手召喚コスト+1: -5×2.0
		"purple_005": -3,  # ON_DEATH 敵1体凍結: -4×0.7
		"purple_006": -19, # ON_SUMMON 敵全体ATK-1,HP-1: -9+(-10)
		"purple_007": -5,  # ON_ATTACK 対象ダイス2つ無効: -4×2×0.6
		"purple_008": -14, # TURN_END 敵全体HP-1: -10×1.4
		"purple_009": -8,  # ON_SUMMON 敵1体凍結2t: -4×2
		"purple_010": -8,  # CONSTANT 相手マナ-1/t: -3×1.4×2.0
		"purple_011": -6,  # ON_DEATH 敵全体凍結: -8×0.7
		"purple_012": -14, # ON_SUMMON コスト3以下の敵破壊: 特殊
		"purple_013": -3,  # ON_ATTACK 対象と自身入替: 状況依存
		"purple_014": -14, # CONSTANT 敵ドロー-1: -7×2.0
		"purple_015": -12, # ON_SUMMON 敵1体凍結3t: -4×3
		"purple_016": -5,  # ON_ATTACK 敵全体ATK-1: -9×0.6
		"purple_017": -20, # CONSTANT 敵召喚コスト+2: -5×2×2.0
		"purple_018": -19, # ON_SUMMON 敵全体ATK-1,HP-1: -9+(-10), 同効果
		"purple_019": -16, # ON_SUMMON 敵全体凍結2t: -8×2
		"purple_020": -10, # CONSTANT 敵全体ダイス-1: -5×2.0

		# ─── WHITE ───
		"white_001": -3,  # ON_SUMMON 自分HP+2: HP15調整-1
		"white_002": -3,  # ON_DEATH 自分HP+3: HP15調整-1
		"white_003": -2,  # TURN_START 自分HP+1: HP15調整-1
		"white_004": -7,  # ON_SUMMON 味方全体HP+2: HP効果弱め→調整-3
		"white_005": -4,  # ON_DEFENSE 被ダメ無効(1回): -6×0.7
		"white_006": -6,  # ON_SUMMON 墓地から1体復活: 特殊
		"white_007": -8,  # CONSTANT 味方全体被ダメ-1: →調整-2
		"white_008": -3,  # ON_ATTACK 味方全体HP+1: -5×0.6
		"white_009": -5,  # ON_SUMMON 自分HP+4: HP弱め→調整-3
		"white_010": -6,  # TURN_END 自分HP+2: -2×2×1.4
		"white_011": -10, # ON_DEATH 自分HP全回復: -2×7×0.7
		"white_012": -7,  # CONSTANT 直接ダメ半減: 状況依存→調整-3
		"white_013": -3,  # ON_SUMMON 全状態異常解除: 微小効果
		"white_014": -7,  # ON_DEATH 味方1体HP全回復: -2×5×0.7
		"white_015": -8,  # ON_SUMMON 自分HP+6: HP弱め→調整-4
		"white_016": -8,  # CONSTANT 自身被ダメ-2: -2×2×2.0
		"white_017": -12, # CONSTANT 味方全体HP+2: HP効果弱め→調整-4
		"white_018": -8,  # ON_SUMMON 全状態解除+HP+1: -3+(-5)
		"white_019": -8,  # ON_DEATH 墓地から2体復活: -6×2×0.7
		"white_020": -20, # ON_SUMMON 味方全体HP+3,ATK+1: -5×2+(-9)→調整-4
	}

	if not modifier_by_effect.has(effect_id):
		push_error("[CardDatabase] 未分類のeffect_id: %s" % effect_id)
		return 0

	var base := int(modifier_by_effect[effect_id])

	# ON_ATTACK効果: faces/3.0 でスケール（faces=3が基準値）
	if effect_id in ON_ATTACK_EFFECTS and faces != 3:
		base = int(round(base * faces / 3.0))

	return base

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

func _get_color_balance_budget_adjustment(color_type: CardData.ColorType) -> int:
	# 色別調整なし: 効果コストのみでバランス判断
	return 0

func _get_faces_adjustment_for_effect(faces: int) -> int:
	# 効果カード汎用: face数に基づくバジェット調整（多面 = 攻撃機会増）
	# faces=3を基準とし、少ない場合は微ボーナス、多い場合は微ペナルティ
	match faces:
		1: return 2
		2: return 1
		3: return 0
		4: return -2
		5: return -3
		_: return -4  # 6以上

func _balance_effect_card_stats(card: CardData) -> void:
	if card.color_type == CardData.ColorType.GRAY or card.effect_id == "":
		return

	var faces := card.attack_dice.size()
	var base_budget := _base_budget(card.mana_cost)
	var effect_modifier := _get_effect_budget_modifier(card.effect_id, faces)
	var color_adj := _get_color_balance_budget_adjustment(card.color_type)
	var faces_adj := _get_faces_adjustment_for_effect(faces)

	var requested_budget := base_budget + effect_modifier + color_adj + faces_adj
	# 最低ステータス(1/0/0相当=score5)を下回らないようにする
	var budget := maxi(MIN_CARD_SCORE, requested_budget)
	_tune_card_stats_to_budget(card, budget)
	_enforce_effect_min_hp(card)

func _get_gray_category_budget_adjustment(card: CardData) -> int:
	var faces := card.attack_dice.size()

	# 低コスト多面アタッカー（スカウト/アサシン系）をカテゴリ弱体化
	if card.mana_cost == 2 and faces >= 3 and card.atk >= 2:
		return -2

	# 4コスト高耐久多面（アイアンゴーレム系）をカテゴリ弱体化
	if card.mana_cost == 4 and card.hp >= 9 and faces >= 3:
		return -4

	# 4コスト高ATK多面（ウォーロード系）をカテゴリ弱体化
	if card.mana_cost == 4 and card.atk >= 7 and faces >= 3:
		return -4

	# 高コスト多面アタッカー（ブレードマスター系）を軽度弱体化
	if card.mana_cost == 4 and faces == 4 and card.atk >= 3:
		return -2

	return 0

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
		var gray_budget := _base_budget(card.mana_cost) + _get_gray_category_budget_adjustment(card)
		_tune_card_stats_to_budget(card, maxi(MIN_CARD_SCORE, gray_budget))
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
