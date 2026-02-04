extends Node
## ステージ管理システム
## ステージ進行とボスパラメータを管理するAutoload

# 現在のステージ
var current_stage := 1

# アンロック済み最大ステージ
var max_unlocked_stage := 1

# セーブファイルパス
const SAVE_PATH := "user://stage_progress.cfg"

# 各ステージのボスパラメータ定義
var stage_data := [
	# Stage 1: 基本パターンのみ
	{
		"boss_hp": 300,
		"boss_speed": 300,
		"boss_damage": 15,
		"reward_gold": 100,
		"double_jump_enabled": false,
		"triple_jump_enabled": false,
		"vulnerable_duration": 1.0,
		"charge_reflects": false,
		"rage_mode_enabled": false,
		"continuous_attack": false,
		"speed_multiplier": 1.0
	},
	# Stage 2: 突進が少し速い
	{
		"boss_hp": 350,
		"boss_speed": 320,
		"boss_damage": 16,
		"reward_gold": 150,
		"double_jump_enabled": false,
		"triple_jump_enabled": false,
		"vulnerable_duration": 1.0,
		"charge_reflects": false,
		"rage_mode_enabled": false,
		"continuous_attack": false,
		"speed_multiplier": 1.0
	},
	# Stage 3: 二段ジャンプ追加
	{
		"boss_hp": 400,
		"boss_speed": 340,
		"boss_damage": 17,
		"reward_gold": 200,
		"double_jump_enabled": true,
		"triple_jump_enabled": false,
		"vulnerable_duration": 1.0,
		"charge_reflects": false,
		"rage_mode_enabled": false,
		"continuous_attack": false,
		"speed_multiplier": 1.0
	},
	# Stage 4: 突進後の隙が短い
	{
		"boss_hp": 450,
		"boss_speed": 360,
		"boss_damage": 18,
		"reward_gold": 250,
		"double_jump_enabled": true,
		"triple_jump_enabled": false,
		"vulnerable_duration": 0.7,
		"charge_reflects": false,
		"rage_mode_enabled": false,
		"continuous_attack": false,
		"speed_multiplier": 1.0
	},
	# Stage 5: 連続攻撃パターン
	{
		"boss_hp": 500,
		"boss_speed": 380,
		"boss_damage": 20,
		"reward_gold": 300,
		"double_jump_enabled": true,
		"triple_jump_enabled": false,
		"vulnerable_duration": 0.7,
		"charge_reflects": false,
		"rage_mode_enabled": false,
		"continuous_attack": true,
		"speed_multiplier": 1.0
	},
	# Stage 6: HP50%で怒りモード
	{
		"boss_hp": 550,
		"boss_speed": 400,
		"boss_damage": 22,
		"reward_gold": 400,
		"double_jump_enabled": true,
		"triple_jump_enabled": false,
		"vulnerable_duration": 0.7,
		"charge_reflects": false,
		"rage_mode_enabled": true,
		"continuous_attack": true,
		"speed_multiplier": 1.0
	},
	# Stage 7: 三段ジャンプ
	{
		"boss_hp": 600,
		"boss_speed": 420,
		"boss_damage": 24,
		"reward_gold": 500,
		"double_jump_enabled": true,
		"triple_jump_enabled": true,
		"vulnerable_duration": 0.7,
		"charge_reflects": false,
		"rage_mode_enabled": true,
		"continuous_attack": true,
		"speed_multiplier": 1.0
	},
	# Stage 8: 突進が壁で反射
	{
		"boss_hp": 650,
		"boss_speed": 440,
		"boss_damage": 26,
		"reward_gold": 650,
		"double_jump_enabled": true,
		"triple_jump_enabled": true,
		"vulnerable_duration": 0.7,
		"charge_reflects": true,
		"rage_mode_enabled": true,
		"continuous_attack": true,
		"speed_multiplier": 1.0
	},
	# Stage 9: 全パターン高速
	{
		"boss_hp": 700,
		"boss_speed": 460,
		"boss_damage": 28,
		"reward_gold": 800,
		"double_jump_enabled": true,
		"triple_jump_enabled": true,
		"vulnerable_duration": 0.5,
		"charge_reflects": true,
		"rage_mode_enabled": true,
		"continuous_attack": true,
		"speed_multiplier": 1.3
	},
	# Stage 10: 最終ボス
	{
		"boss_hp": 800,
		"boss_speed": 500,
		"boss_damage": 30,
		"reward_gold": 1000,
		"double_jump_enabled": true,
		"triple_jump_enabled": true,
		"vulnerable_duration": 0.5,
		"charge_reflects": true,
		"rage_mode_enabled": true,
		"continuous_attack": true,
		"speed_multiplier": 1.5
	}
]


func _ready() -> void:
	load_progress()


## 現在ステージのデータを返す
func get_current_stage_data() -> Dictionary:
	var index := current_stage - 1
	if index >= 0 and index < stage_data.size():
		return stage_data[index]
	return stage_data[0]


## 次ステージへ進行
func advance_stage() -> void:
	if current_stage < stage_data.size():
		current_stage += 1
		if current_stage > max_unlocked_stage:
			max_unlocked_stage = current_stage
		save_progress()


## 進行状況をセーブ
func save_progress() -> void:
	var config := ConfigFile.new()
	config.set_value("progress", "max_unlocked_stage", max_unlocked_stage)
	config.save(SAVE_PATH)


## 進行状況をロード
func load_progress() -> void:
	var config := ConfigFile.new()
	var err := config.load(SAVE_PATH)
	if err == OK:
		max_unlocked_stage = config.get_value("progress", "max_unlocked_stage", 1)
