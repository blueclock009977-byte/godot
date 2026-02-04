# test/scripts/player_data_manager.gd
extends Node
## プレイヤーデータ管理（ゴールド、強化レベル）

const SAVE_PATH := "user://player_data.cfg"

# ゴールド
var gold := 0

# 強化レベル（各0-5）
var upgrades := {
	"sword_damage": 0,      # 剣ダメージ +5/Lv
	"bow_damage": 0,        # 弓ダメージ +3/Lv
	"bow_ammo": 0,          # 弓弾数 +1/Lv
	"attack_speed": 0,      # 攻撃速度 -0.05s/Lv
	"dash_distance": 0,     # ダッシュ距離 +50/Lv
	"dash_cooldown": 0,     # ダッシュCD -0.1s/Lv
	"roll_invincible": 0,   # ローリング無敵 +0.1s/Lv
	"jump_power": 0,        # ジャンプ力 +50/Lv
	"max_hp": 0,            # 最大HP +20/Lv
	"damage_reduction": 0   # 被ダメ軽減 -5%/Lv
}

# 強化コスト
const UPGRADE_COSTS := {
	"sword_damage": [100, 200, 400, 800, 1500],
	"bow_damage": [100, 200, 400, 800, 1500],
	"bow_ammo": [150, 300, 600, 1000, 2000],
	"attack_speed": [200, 400, 800, 1500, 3000],
	"dash_distance": [100, 200, 400, 800, 1500],
	"dash_cooldown": [150, 300, 600, 1000, 2000],
	"roll_invincible": [150, 300, 600, 1000, 2000],
	"jump_power": [100, 200, 400, 800, 1500],
	"max_hp": [100, 200, 400, 800, 1500],
	"damage_reduction": [200, 400, 800, 1500, 3000]
}

func _ready() -> void:
	load_data()

func buy_upgrade(upgrade_name: String) -> bool:
	var level = upgrades.get(upgrade_name, -1)
	if level < 0 or level >= 5:
		return false
	var cost = UPGRADE_COSTS[upgrade_name][level]
	if gold < cost:
		return false
	gold -= cost
	upgrades[upgrade_name] += 1
	save_data()
	return true

func get_upgrade_cost(upgrade_name: String) -> int:
	var level = upgrades.get(upgrade_name, -1)
	if level < 0 or level >= 5:
		return -1
	return UPGRADE_COSTS[upgrade_name][level]

func add_gold(amount: int) -> void:
	gold += amount
	save_data()

# 強化適用後の値を計算
func get_sword_damage() -> int:
	return 25 + upgrades["sword_damage"] * 5

func get_bow_damage() -> int:
	return 10 + upgrades["bow_damage"] * 3

func get_max_arrows() -> int:
	return 5 + upgrades["bow_ammo"]

func get_sword_cooldown() -> float:
	return 0.4 - upgrades["attack_speed"] * 0.05

func get_dash_speed() -> float:
	return 600.0 + upgrades["dash_distance"] * 50.0

func get_dash_cooldown() -> float:
	return 0.5 - upgrades["dash_cooldown"] * 0.1

func get_roll_duration() -> float:
	return 0.4 + upgrades["roll_invincible"] * 0.1

func get_jump_velocity() -> float:
	return -800.0 - upgrades["jump_power"] * 50.0

func get_max_hp() -> int:
	return 100 + upgrades["max_hp"] * 20

func get_damage_reduction() -> float:
	return upgrades["damage_reduction"] * 0.05

func save_data() -> void:
	var config := ConfigFile.new()
	config.set_value("player", "gold", gold)
	for key in upgrades.keys():
		config.set_value("upgrades", key, upgrades[key])
	config.save(SAVE_PATH)

func load_data() -> void:
	var config := ConfigFile.new()
	var err := config.load(SAVE_PATH)
	if err == OK:
		gold = config.get_value("player", "gold", 0)
		for key in upgrades.keys():
			upgrades[key] = config.get_value("upgrades", key, 0)
