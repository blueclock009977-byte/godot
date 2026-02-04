# 死にゲー 完全実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 企画書の全機能を実装（強化システム、報酬G、ボス追加パターン、セーブ/ロード）

**Architecture:** StageManagerとPlayerDataManager（新規Autoload）でゲーム状態を管理。強化はプレイヤーのパラメータに直接影響。

**Tech Stack:** Godot 4.6, GDScript

---

## Part 1: 強化システム基盤

### Task 1: PlayerDataManager（Autoload）作成

**Files:**
- Create: `test/scripts/player_data_manager.gd`
- Modify: `test/project.godot`

**実装内容:**

```gdscript
# test/scripts/player_data_manager.gd
extends Node
## プレイヤーデータ管理（ゴールド、強化レベル）

const SAVE_PATH := "user://player_data.cfg"

# ゴールド
var gold := 0

# 強化レベル（各0-5）
var upgrades := {
	# 攻撃系
	"sword_damage": 0,      # 剣ダメージ +5/Lv
	"bow_damage": 0,        # 弓ダメージ +3/Lv
	"bow_ammo": 0,          # 弓弾数 +1/Lv
	"attack_speed": 0,      # 攻撃速度 -0.05s/Lv
	# 回避系
	"dash_distance": 0,     # ダッシュ距離 +50/Lv
	"dash_cooldown": 0,     # ダッシュCD -0.1s/Lv
	"roll_invincible": 0,   # ローリング無敵 +0.1s/Lv
	"jump_power": 0,        # ジャンプ力 +50/Lv
	# 生存系
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


## 強化を購入
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


## 次のレベルのコストを取得
func get_upgrade_cost(upgrade_name: String) -> int:
	var level = upgrades.get(upgrade_name, -1)
	if level < 0 or level >= 5:
		return -1
	return UPGRADE_COSTS[upgrade_name][level]


## ゴールドを追加
func add_gold(amount: int) -> void:
	gold += amount
	save_data()


## 強化適用後の値を計算
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


## セーブ
func save_data() -> void:
	var config := ConfigFile.new()
	config.set_value("player", "gold", gold)
	for key in upgrades.keys():
		config.set_value("upgrades", key, upgrades[key])
	config.save(SAVE_PATH)


## ロード
func load_data() -> void:
	var config := ConfigFile.new()
	var err := config.load(SAVE_PATH)
	if err == OK:
		gold = config.get_value("player", "gold", 0)
		for key in upgrades.keys():
			upgrades[key] = config.get_value("upgrades", key, 0)
```

**project.godotに追加:**
```ini
[autoload]
StageManager="*res://scripts/stage_manager.gd"
PlayerDataManager="*res://scripts/player_data_manager.gd"
```

---

### Task 2: プレイヤーに強化を適用

**Files:**
- Modify: `test/scripts/player/player.gd`

**変更内容:**
- const値を動的に取得するように変更
- _ready()でPlayerDataManagerから値を取得

```gdscript
# constを削除して変数に変更
var max_hp := 100
var sword_damage := 25
var sword_cooldown_time := 0.4
var dash_speed := 600.0
var dash_cooldown_time := 0.5
var roll_duration := 0.4
var jump_velocity := -800.0
var max_arrows := 5

func _ready() -> void:
	add_to_group("player")
	# 強化を適用
	_apply_upgrades()
	current_hp = max_hp
	current_arrows = max_arrows

func _apply_upgrades() -> void:
	max_hp = PlayerDataManager.get_max_hp()
	sword_damage = PlayerDataManager.get_sword_damage()
	sword_cooldown_time = PlayerDataManager.get_sword_cooldown()
	dash_speed = PlayerDataManager.get_dash_speed()
	dash_cooldown_time = PlayerDataManager.get_dash_cooldown()
	roll_duration = PlayerDataManager.get_roll_duration()
	jump_velocity = PlayerDataManager.get_jump_velocity()
	max_arrows = PlayerDataManager.get_max_arrows()

func take_damage(amount: int) -> void:
	if is_invincible:
		return
	# ダメージ軽減を適用
	var reduction = PlayerDataManager.get_damage_reduction()
	var actual_damage = int(amount * (1.0 - reduction))
	current_hp -= actual_damage
	# ...
```

---

### Task 3: 矢のダメージを強化対応

**Files:**
- Modify: `test/scripts/player/arrow.gd`

**変更内容:**
```gdscript
# constを変数に変更
var damage := 10

func _ready() -> void:
	damage = PlayerDataManager.get_bow_damage()
	# ...
```

---

## Part 2: 報酬Gシステム

### Task 4: StageManagerに報酬G追加

**Files:**
- Modify: `test/scripts/stage_manager.gd`

**変更内容:**
各ステージのデータに `reward_gold` を追加:

```gdscript
var stage_data := [
	# Stage 1
	{
		"boss_hp": 300,
		"boss_speed": 300,
		"boss_damage": 15,
		"reward_gold": 100,  # 追加
		# ...
	},
	# Stage 2
	{
		"reward_gold": 150,
		# ...
	},
	# ... Stage 10まで (100, 150, 200, 250, 300, 400, 500, 650, 800, 1000)
]
```

---

### Task 5: ボス撃破時にG獲得

**Files:**
- Modify: `test/scripts/battle_manager.gd`
- Modify: `test/scripts/ui/game_over.gd`

**battle_manager.gd:**
```gdscript
func _on_boss_died() -> void:
	# 報酬G獲得
	var stage_data = StageManager.get_current_stage_data()
	var reward = stage_data.get("reward_gold", 100)
	PlayerDataManager.add_gold(reward)

	StageManager.advance_stage()

	if StageManager.current_stage > 10:
		game_over_ui.show_ending(reward)
	else:
		game_over_ui.show_victory(reward)
```

**game_over.gd:**
```gdscript
func show_victory(reward_gold: int = 0) -> void:
	_is_ending = false
	$Panel/Label.text = "STAGE " + str(StageManager.current_stage - 1) + " CLEAR!\n+" + str(reward_gold) + "G"
	# ...
```

---

## Part 3: 強化ショップ画面

### Task 6: 強化ショップシーン作成

**Files:**
- Create: `test/scenes/upgrade_shop.tscn`
- Create: `test/scripts/ui/upgrade_shop.gd`

**upgrade_shop.gd:**
```gdscript
extends Control

@onready var gold_label: Label = $GoldLabel
@onready var item_container: VBoxContainer = $ScrollContainer/ItemContainer

const UPGRADE_NAMES := {
	"sword_damage": "剣ダメージ",
	"bow_damage": "弓ダメージ",
	"bow_ammo": "弓弾数",
	"attack_speed": "攻撃速度",
	"dash_distance": "ダッシュ距離",
	"dash_cooldown": "ダッシュ回復",
	"roll_invincible": "ローリング無敵",
	"jump_power": "ジャンプ力",
	"max_hp": "最大HP",
	"damage_reduction": "被ダメ軽減"
}

func _ready() -> void:
	_update_display()
	$BackButton.pressed.connect(_on_back_pressed)


func _update_display() -> void:
	gold_label.text = "所持G: " + str(PlayerDataManager.gold)

	# 既存のアイテムをクリア
	for child in item_container.get_children():
		child.queue_free()

	# 強化アイテムを生成
	for key in UPGRADE_NAMES.keys():
		var item = _create_upgrade_item(key, UPGRADE_NAMES[key])
		item_container.add_child(item)


func _create_upgrade_item(key: String, display_name: String) -> HBoxContainer:
	var container = HBoxContainer.new()
	container.custom_minimum_size.y = 50

	var name_label = Label.new()
	name_label.text = display_name
	name_label.custom_minimum_size.x = 200
	container.add_child(name_label)

	var level_label = Label.new()
	var level = PlayerDataManager.upgrades[key]
	level_label.text = "Lv." + str(level) + "/5"
	level_label.custom_minimum_size.x = 80
	container.add_child(level_label)

	var buy_button = Button.new()
	if level >= 5:
		buy_button.text = "MAX"
		buy_button.disabled = true
	else:
		var cost = PlayerDataManager.get_upgrade_cost(key)
		buy_button.text = str(cost) + "G"
		buy_button.disabled = PlayerDataManager.gold < cost
		buy_button.pressed.connect(_on_buy_pressed.bind(key))
	buy_button.custom_minimum_size.x = 100
	container.add_child(buy_button)

	return container


func _on_buy_pressed(upgrade_key: String) -> void:
	if PlayerDataManager.buy_upgrade(upgrade_key):
		_update_display()


func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
```

**upgrade_shop.tscn:**
```
[gd_scene load_steps=2 format=3 uid="uid://upgrade_shop_001"]

[ext_resource type="Script" path="res://scripts/ui/upgrade_shop.gd" id="1_shop"]

[node name="UpgradeShop" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("1_shop")

[node name="Title" type="Label" parent="."]
offset_left = 440.0
offset_top = 50.0
offset_right = 840.0
offset_bottom = 100.0
theme_override_font_sizes/font_size = 48
text = "強化ショップ"
horizontal_alignment = 1

[node name="GoldLabel" type="Label" parent="."]
offset_left = 440.0
offset_top = 120.0
offset_right = 840.0
offset_bottom = 160.0
theme_override_font_sizes/font_size = 32
text = "所持G: 0"
horizontal_alignment = 1

[node name="ScrollContainer" type="ScrollContainer" parent="."]
offset_left = 200.0
offset_top = 180.0
offset_right = 1080.0
offset_bottom = 550.0

[node name="ItemContainer" type="VBoxContainer" parent="ScrollContainer"]
custom_minimum_size = Vector2(880, 0)
size_flags_horizontal = 3

[node name="BackButton" type="Button" parent="."]
offset_left = 540.0
offset_top = 580.0
offset_right = 740.0
offset_bottom = 630.0
text = "戻る"
```

---

### Task 7: メインメニューに強化ボタン追加

**Files:**
- Modify: `test/scenes/main_menu.tscn`
- Modify: `test/scripts/main_menu.gd`

**main_menu.tscn に追加:**
```
[node name="UpgradeButton" type="Button" parent="."]
offset_left = 540.0
offset_top = 350.0
offset_right = 740.0
offset_bottom = 400.0
text = "強化"

[node name="StartButton" ...]
offset_top = 420.0  # 位置調整
offset_bottom = 470.0

[node name="GoldLabel" type="Label" parent="."]
offset_left = 540.0
offset_top = 280.0
offset_right = 740.0
offset_bottom = 320.0
text = "所持G: 0"
horizontal_alignment = 1
```

**main_menu.gd:**
```gdscript
extends Control

func _ready() -> void:
	$StartButton.pressed.connect(_on_start)
	$UpgradeButton.pressed.connect(_on_upgrade)
	$QuitButton.pressed.connect(_on_quit)
	_update_gold_display()

func _update_gold_display() -> void:
	$GoldLabel.text = "所持G: " + str(PlayerDataManager.gold)

func _on_start() -> void:
	get_tree().change_scene_to_file("res://scenes/stage_select.tscn")

func _on_upgrade() -> void:
	get_tree().change_scene_to_file("res://scenes/upgrade_shop.tscn")

func _on_quit() -> void:
	get_tree().quit()
```

---

## Part 4: ボス追加パターン

### Task 8: 三段ジャンプ実装

**Files:**
- Modify: `test/scripts/boss/boss.gd`

**変更内容:**
```gdscript
@export var triple_jump_enabled := false
var jump_count := 0
const MAX_JUMPS := 3

func _state_attack_jump() -> void:
	# 多段ジャンプ処理
	if not is_on_floor() and velocity.y > 0:
		if double_jump_enabled and jump_count < 2:
			velocity.y = -500
			if player:
				var direction = sign(player.global_position.x - global_position.x)
				velocity.x = direction * 200
			jump_count += 1
		elif triple_jump_enabled and jump_count < 3:
			velocity.y = -400
			if player:
				var direction = sign(player.global_position.x - global_position.x)
				velocity.x = direction * 150
			jump_count += 1

	if is_on_floor():
		jump_count = 0
		if state_timer <= 0:
			current_state = State.COOLDOWN
			state_timer = 1.5
			velocity.x = 0
```

---

### Task 9: 連続攻撃パターン実装

**Files:**
- Modify: `test/scripts/boss/boss.gd`

**変更内容:**
```gdscript
@export var continuous_attack := false
var combo_count := 0

func _state_cooldown() -> void:
	velocity.x = move_toward(velocity.x, 0, 300 * get_physics_process_delta_time())
	if state_timer <= 0:
		# 連続攻撃: 50%の確率で続けて攻撃
		if continuous_attack and combo_count < 2 and randf() < 0.5:
			combo_count += 1
			_choose_attack()
		else:
			combo_count = 0
			current_state = State.IDLE
			state_timer = 1.0
```

---

### Task 10: 怒りモード実装

**Files:**
- Modify: `test/scripts/boss/boss.gd`

**変更内容:**
```gdscript
@export var rage_mode_enabled := false
var is_enraged := false
var base_charge_speed: float

func _ready() -> void:
	# ...
	base_charge_speed = charge_speed

func _physics_process(delta: float) -> void:
	# 怒りモードチェック
	if rage_mode_enabled and not is_enraged and current_hp <= max_hp / 2:
		_enter_rage_mode()
	# ...

func _enter_rage_mode() -> void:
	is_enraged = true
	charge_speed = base_charge_speed * 1.3
	vulnerable_duration *= 0.7
	print("[Boss] RAGE MODE ACTIVATED!")
```

---

### Task 11: 壁反射突進実装

**Files:**
- Modify: `test/scripts/boss/boss.gd`

**変更内容:**
```gdscript
@export var charge_reflects := false
var reflect_count := 0

func _state_vulnerable() -> void:
	# 壁反射チェック
	if charge_reflects and reflect_count < 2:
		if is_on_wall():
			velocity.x = -velocity.x
			reflect_count += 1
			state_timer = vulnerable_duration  # 隙をリセット
			return

	velocity.x = move_toward(velocity.x, 0, 300 * get_physics_process_delta_time())
	if state_timer <= 0:
		reflect_count = 0
		current_state = State.COOLDOWN
		state_timer = 1.0
```

---

### Task 12: battle_managerでボス追加パラメータ適用

**Files:**
- Modify: `test/scripts/battle_manager.gd`

**変更内容:**
```gdscript
func _ready() -> void:
	# ...
	var stage_data = StageManager.get_current_stage_data()
	boss.max_hp = stage_data.boss_hp
	boss.contact_damage = stage_data.boss_damage
	boss.charge_speed = float(stage_data.boss_speed)
	boss.vulnerable_duration = stage_data.vulnerable_duration
	boss.double_jump_enabled = stage_data.double_jump_enabled
	boss.triple_jump_enabled = stage_data.get("triple_jump_enabled", false)
	boss.continuous_attack = stage_data.get("continuous_attack", false)
	boss.rage_mode_enabled = stage_data.get("rage_mode_enabled", false)
	boss.charge_reflects = stage_data.get("charge_reflects", false)
	boss.current_hp = boss.max_hp
```

---

## Part 5: ステージ選択画面改善

### Task 13: ステージ選択に報酬G表示

**Files:**
- Modify: `test/scripts/ui/stage_select.gd`
- Modify: `test/scenes/stage_select.tscn`

**stage_select.gd:**
```gdscript
func _update_button_states() -> void:
	var max_unlocked := StageManager.max_unlocked_stage

	for i in range(STAGE_COUNT):
		var button := stage_buttons[i]
		var stage_num := i + 1
		var stage_data = StageManager.stage_data[i]
		var reward = stage_data.get("reward_gold", 100)

		if stage_num <= max_unlocked:
			button.disabled = false
			button.text = "Stage " + str(stage_num) + "\n" + str(reward) + "G"
			if stage_num < max_unlocked:
				button.modulate = Color(0.5, 1.0, 0.5)
			else:
				button.modulate = Color(1.0, 1.0, 1.0)
		else:
			button.disabled = true
			button.text = "Stage " + str(stage_num) + "\n???"
			button.modulate = Color(0.5, 0.5, 0.5)
```

---

## 完了チェックリスト

- [ ] Task 1: PlayerDataManager作成
- [ ] Task 2: プレイヤーに強化適用
- [ ] Task 3: 矢のダメージ強化対応
- [ ] Task 4: StageManagerに報酬G追加
- [ ] Task 5: ボス撃破時にG獲得
- [ ] Task 6: 強化ショップシーン作成
- [ ] Task 7: メインメニューに強化ボタン
- [ ] Task 8: 三段ジャンプ実装
- [ ] Task 9: 連続攻撃パターン
- [ ] Task 10: 怒りモード
- [ ] Task 11: 壁反射突進
- [ ] Task 12: ボス追加パラメータ適用
- [ ] Task 13: ステージ選択に報酬G表示
