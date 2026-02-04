# 死にゲー MVP 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** ボス1体と戦えるプロトタイプを作成する

**Architecture:** Godot 4.6のシーン構成。プレイヤー(CharacterBody2D)とボス(CharacterBody2D)がバトルシーンで戦う。状態管理はステートマシンパターン。

**Tech Stack:** Godot 4.6, GDScript, 2D Physics

---

## プロジェクト構造

```
test/
├── project.godot
├── scenes/
│   ├── main_menu.tscn      # メインメニュー
│   ├── battle.tscn         # バトルシーン
│   ├── player/
│   │   └── player.tscn     # プレイヤー
│   ├── boss/
│   │   └── boss.tscn       # ボス
│   └── ui/
│       ├── hud.tscn        # バトル中のUI
│       └── game_over.tscn  # ゲームオーバー画面
├── scripts/
│   ├── player/
│   │   └── player.gd
│   ├── boss/
│   │   └── boss.gd
│   └── ui/
│       ├── hud.gd
│       └── game_over.gd
└── assets/
    ├── sprites/
    │   ├── player/         # プレイヤースプライト（後で追加）
    │   └── boss/           # ボススプライト
    └── fonts/              # UI用フォント
```

---

## Task 1: プロジェクト構造のセットアップ

**Files:**
- Create: `test/scenes/` ディレクトリ構造
- Create: `test/scripts/` ディレクトリ構造
- Create: `test/assets/` ディレクトリ構造

**Step 1: ディレクトリ構造を作成**

```bash
cd /Users/masashi_shigekiyo/godot/test
mkdir -p scenes/player scenes/boss scenes/ui
mkdir -p scripts/player scripts/boss scripts/ui
mkdir -p assets/sprites/player assets/sprites/boss assets/fonts
```

**Step 2: ボススプライトをコピー**

```bash
cp /Users/masashi_shigekiyo/godot/mokemo_dot/MonstersPixelPack_vol01/Enemy1.png \
   /Users/masashi_shigekiyo/godot/test/assets/sprites/boss/boss1.png
```

**Step 3: コミット**

```bash
git add -A
git commit -m "chore: MVP用のディレクトリ構造をセットアップ"
```

---

## Task 2: プレイヤーの基本移動（左右移動・ジャンプ）

**Files:**
- Create: `test/scenes/player/player.tscn`
- Create: `test/scripts/player/player.gd`

**Step 1: プレイヤーシーンを作成**

Godotエディタで作成するか、以下の内容で `player.tscn` を作成:

```gdscript
# test/scenes/player/player.tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/player/player.gd" id="1_player"]

[node name="Player" type="CharacterBody2D"]
script = ExtResource("1_player")

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]
shape = SubResource("RectangleShape2D_shape")

[node name="Sprite2D" type="Sprite2D" parent="."]
```

**Step 2: プレイヤースクリプトの基本移動を実装**

```gdscript
# test/scripts/player/player.gd
extends CharacterBody2D

# 移動パラメータ
const SPEED = 300.0
const JUMP_VELOCITY = -500.0
const GRAVITY = 1200.0

func _physics_process(delta: float) -> void:
    # 重力
    if not is_on_floor():
        velocity.y += GRAVITY * delta

    # ジャンプ
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = JUMP_VELOCITY

    # 左右移動
    var direction := Input.get_axis("ui_left", "ui_right")
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)

    move_and_slide()
```

**Step 3: テストシーンで動作確認**

`test/main.tscn` にプレイヤーをインスタンス化して、F5で実行。
矢印キーで左右移動、スペースでジャンプできることを確認。

**Step 4: コミット**

```bash
git add scenes/player/player.tscn scripts/player/player.gd
git commit -m "feat: プレイヤーの基本移動（左右・ジャンプ）を実装"
```

---

## Task 3: プレイヤーの剣攻撃

**Files:**
- Modify: `test/scripts/player/player.gd`
- Create: `test/scenes/player/sword_hitbox.tscn`

**Step 1: 入力マッピングを追加（project.godot または Godotエディタ）**

Project Settings > Input Map で以下を追加:
- `attack_sword`: Zキー
- `attack_bow`: Xキー
- `dash`: Cキー
- `roll`: Vキー

**Step 2: 剣攻撃のヒットボックスシーンを作成**

```gdscript
# test/scenes/player/sword_hitbox.tscn
[gd_scene format=3]

[node name="SwordHitbox" type="Area2D"]

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]
shape = SubResource("RectangleShape2D_sword")
disabled = true

[node name="Timer" type="Timer" parent="."]
wait_time = 0.2
one_shot = true
```

**Step 3: プレイヤースクリプトに剣攻撃を追加**

```gdscript
# test/scripts/player/player.gd に追加

# 攻撃パラメータ
const SWORD_DAMAGE = 10
var can_attack := true
var is_attacking := false
var facing_right := true

@onready var sword_hitbox: Area2D = $SwordHitbox

func _physics_process(delta: float) -> void:
    # 既存のコード...

    # 向きの更新
    if direction > 0:
        facing_right = true
        $Sprite2D.flip_h = false
    elif direction < 0:
        facing_right = false
        $Sprite2D.flip_h = true

    # 剣攻撃
    if Input.is_action_just_pressed("attack_sword") and can_attack:
        _sword_attack()

    move_and_slide()

func _sword_attack() -> void:
    is_attacking = true
    can_attack = false

    # ヒットボックスの位置を向きに合わせる
    sword_hitbox.position.x = 40 if facing_right else -40
    sword_hitbox.get_node("CollisionShape2D").disabled = false

    # ヒット判定
    for body in sword_hitbox.get_overlapping_bodies():
        if body.has_method("take_damage"):
            body.take_damage(SWORD_DAMAGE)

    # 攻撃終了タイマー
    await get_tree().create_timer(0.3).timeout
    sword_hitbox.get_node("CollisionShape2D").disabled = true
    is_attacking = false

    await get_tree().create_timer(0.2).timeout
    can_attack = true
```

**Step 4: 動作確認**

Zキーで剣を振る動作（まだアニメーションはないが、ヒットボックスが出る）を確認。

**Step 5: コミット**

```bash
git add -A
git commit -m "feat: プレイヤーの剣攻撃を実装"
```

---

## Task 4: プレイヤーの弓攻撃

**Files:**
- Modify: `test/scripts/player/player.gd`
- Create: `test/scenes/player/arrow.tscn`
- Create: `test/scripts/player/arrow.gd`

**Step 1: 矢のシーンを作成**

```gdscript
# test/scenes/player/arrow.tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/player/arrow.gd" id="1_arrow"]

[node name="Arrow" type="Area2D"]
script = ExtResource("1_arrow")

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]

[node name="Sprite2D" type="Sprite2D" parent="."]
```

**Step 2: 矢のスクリプト**

```gdscript
# test/scripts/player/arrow.gd
extends Area2D

const SPEED = 600.0
const DAMAGE = 5
var direction := 1

func _ready() -> void:
    # 画面外で消える
    var timer = get_tree().create_timer(3.0)
    timer.timeout.connect(queue_free)

func _physics_process(delta: float) -> void:
    position.x += SPEED * direction * delta

func _on_body_entered(body: Node2D) -> void:
    if body.has_method("take_damage"):
        body.take_damage(DAMAGE)
    queue_free()
```

**Step 3: プレイヤースクリプトに弓攻撃を追加**

```gdscript
# test/scripts/player/player.gd に追加

const MAX_ARROWS = 5
const ARROW_RELOAD_TIME = 2.0
var current_arrows := MAX_ARROWS

@export var arrow_scene: PackedScene

func _physics_process(delta: float) -> void:
    # 既存のコード...

    # 弓攻撃
    if Input.is_action_just_pressed("attack_bow") and current_arrows > 0:
        _bow_attack()

func _bow_attack() -> void:
    current_arrows -= 1

    var arrow = arrow_scene.instantiate()
    arrow.global_position = global_position
    arrow.direction = 1 if facing_right else -1
    arrow.rotation = 0 if facing_right else PI
    get_parent().add_child(arrow)

    # 矢の回復
    await get_tree().create_timer(ARROW_RELOAD_TIME).timeout
    current_arrows = min(current_arrows + 1, MAX_ARROWS)
```

**Step 4: コミット**

```bash
git add -A
git commit -m "feat: プレイヤーの弓攻撃を実装"
```

---

## Task 5: プレイヤーのダッシュとローリング

**Files:**
- Modify: `test/scripts/player/player.gd`

**Step 1: ダッシュとローリングを実装**

```gdscript
# test/scripts/player/player.gd に追加

# ダッシュパラメータ
const DASH_SPEED = 600.0
const DASH_DURATION = 0.15
const DASH_COOLDOWN = 0.5
var can_dash := true
var is_dashing := false

# ローリングパラメータ
const ROLL_SPEED = 400.0
const ROLL_DURATION = 0.4
const ROLL_COOLDOWN = 0.8
var can_roll := true
var is_rolling := false

# 無敵状態
var is_invincible := false

func _physics_process(delta: float) -> void:
    # ダッシュ・ローリング中は通常移動をスキップ
    if is_dashing or is_rolling:
        move_and_slide()
        return

    # 既存のコード...

    # ダッシュ
    if Input.is_action_just_pressed("dash") and can_dash:
        _dash()

    # ローリング
    if Input.is_action_just_pressed("roll") and can_roll and is_on_floor():
        _roll()

func _dash() -> void:
    is_dashing = true
    can_dash = false
    is_invincible = true

    var dash_direction = 1 if facing_right else -1
    velocity.x = DASH_SPEED * dash_direction
    velocity.y = 0

    await get_tree().create_timer(DASH_DURATION).timeout
    is_dashing = false
    is_invincible = false

    await get_tree().create_timer(DASH_COOLDOWN).timeout
    can_dash = true

func _roll() -> void:
    is_rolling = true
    can_roll = false
    is_invincible = true

    var roll_direction = 1 if facing_right else -1
    velocity.x = ROLL_SPEED * roll_direction

    await get_tree().create_timer(ROLL_DURATION).timeout
    is_rolling = false
    is_invincible = false

    await get_tree().create_timer(ROLL_COOLDOWN).timeout
    can_roll = true
```

**Step 2: コミット**

```bash
git add scripts/player/player.gd
git commit -m "feat: プレイヤーのダッシュとローリングを実装"
```

---

## Task 6: プレイヤーのHP・ダメージ処理

**Files:**
- Modify: `test/scripts/player/player.gd`

**Step 1: HP管理とダメージ処理を追加**

```gdscript
# test/scripts/player/player.gd に追加

signal health_changed(current_hp, max_hp)
signal player_died

const MAX_HP = 100
var current_hp := MAX_HP

func _ready() -> void:
    current_hp = MAX_HP

func take_damage(amount: int) -> void:
    if is_invincible:
        return

    current_hp -= amount
    health_changed.emit(current_hp, MAX_HP)

    # ダメージ時の無敵時間
    is_invincible = true
    # ヒットフラッシュ（点滅）
    _hit_flash()
    await get_tree().create_timer(0.5).timeout
    is_invincible = false

    if current_hp <= 0:
        _die()

func _hit_flash() -> void:
    for i in range(3):
        $Sprite2D.modulate.a = 0.3
        await get_tree().create_timer(0.1).timeout
        $Sprite2D.modulate.a = 1.0
        await get_tree().create_timer(0.1).timeout

func _die() -> void:
    player_died.emit()
    # 入力を無効化
    set_physics_process(false)
```

**Step 2: コミット**

```bash
git add scripts/player/player.gd
git commit -m "feat: プレイヤーのHP・ダメージ処理を実装"
```

---

## Task 7: ボスの基本実装

**Files:**
- Create: `test/scenes/boss/boss.tscn`
- Create: `test/scripts/boss/boss.gd`

**Step 1: ボスシーンを作成**

```gdscript
# test/scenes/boss/boss.tscn
[gd_scene load_steps=3 format=3]

[ext_resource type="Script" path="res://scripts/boss/boss.gd" id="1_boss"]
[ext_resource type="Texture2D" path="res://assets/sprites/boss/boss1.png" id="2_sprite"]

[node name="Boss" type="CharacterBody2D"]
script = ExtResource("1_boss")

[node name="CollisionShape2D" type="CollisionShape2D" parent="."]

[node name="Sprite2D" type="Sprite2D" parent="."]
texture = ExtResource("2_sprite")
scale = Vector2(4, 4)

[node name="Hitbox" type="Area2D" parent="."]

[node name="HitboxShape" type="CollisionShape2D" parent="Hitbox"]
```

**Step 2: ボススクリプト**

```gdscript
# test/scripts/boss/boss.gd
extends CharacterBody2D

signal health_changed(current_hp, max_hp)
signal boss_died

const MAX_HP = 500
const GRAVITY = 800.0

var current_hp := MAX_HP
var player: Node2D = null

# 攻撃パターン
enum State { IDLE, ATTACK_CHARGE, ATTACK_JUMP, COOLDOWN }
var current_state := State.IDLE
var state_timer := 0.0

func _ready() -> void:
    current_hp = MAX_HP
    # プレイヤーを探す
    await get_tree().process_frame
    player = get_tree().get_first_node_in_group("player")

func _physics_process(delta: float) -> void:
    # 重力
    if not is_on_floor():
        velocity.y += GRAVITY * delta

    # 状態管理
    state_timer -= delta
    match current_state:
        State.IDLE:
            _state_idle()
        State.ATTACK_CHARGE:
            _state_attack_charge()
        State.ATTACK_JUMP:
            _state_attack_jump()
        State.COOLDOWN:
            _state_cooldown()

    move_and_slide()

func _state_idle() -> void:
    if state_timer <= 0:
        _choose_attack()

func _choose_attack() -> void:
    # ランダムに攻撃を選択
    var attack = randi() % 2
    match attack:
        0:
            _start_charge_attack()
        1:
            _start_jump_attack()

func _start_charge_attack() -> void:
    current_state = State.ATTACK_CHARGE
    state_timer = 0.5  # 予備動作
    # 予備動作のビジュアル（後で追加）

func _state_attack_charge() -> void:
    if state_timer <= 0:
        # 突進
        var direction = sign(player.global_position.x - global_position.x)
        velocity.x = direction * 400
        current_state = State.COOLDOWN
        state_timer = 1.0

func _start_jump_attack() -> void:
    current_state = State.ATTACK_JUMP
    velocity.y = -600
    var direction = sign(player.global_position.x - global_position.x)
    velocity.x = direction * 200
    state_timer = 0.5

func _state_attack_jump() -> void:
    if is_on_floor() and state_timer <= 0:
        current_state = State.COOLDOWN
        state_timer = 1.5
        velocity.x = 0

func _state_cooldown() -> void:
    velocity.x = move_toward(velocity.x, 0, 300 * get_physics_process_delta_time())
    if state_timer <= 0:
        current_state = State.IDLE
        state_timer = 1.0

func take_damage(amount: int) -> void:
    current_hp -= amount
    health_changed.emit(current_hp, MAX_HP)

    # ダメージフラッシュ
    $Sprite2D.modulate = Color.RED
    await get_tree().create_timer(0.1).timeout
    $Sprite2D.modulate = Color.WHITE

    if current_hp <= 0:
        _die()

func _die() -> void:
    boss_died.emit()
    queue_free()
```

**Step 3: コミット**

```bash
git add -A
git commit -m "feat: ボスの基本AI（突進・ジャンプ攻撃）を実装"
```

---

## Task 8: ボスの当たり判定（プレイヤーへのダメージ）

**Files:**
- Modify: `test/scripts/boss/boss.gd`

**Step 1: ヒットボックスでプレイヤーにダメージを与える**

```gdscript
# test/scripts/boss/boss.gd に追加

const CONTACT_DAMAGE = 20

func _ready() -> void:
    # 既存のコード...
    $Hitbox.body_entered.connect(_on_hitbox_body_entered)

func _on_hitbox_body_entered(body: Node2D) -> void:
    if body.is_in_group("player") and body.has_method("take_damage"):
        body.take_damage(CONTACT_DAMAGE)
```

**Step 2: コミット**

```bash
git add scripts/boss/boss.gd
git commit -m "feat: ボスの接触ダメージを実装"
```

---

## Task 9: バトルシーンの作成

**Files:**
- Create: `test/scenes/battle.tscn`

**Step 1: バトルシーンを作成**

```gdscript
# test/scenes/battle.tscn
[gd_scene load_steps=4 format=3]

[ext_resource type="PackedScene" path="res://scenes/player/player.tscn" id="1_player"]
[ext_resource type="PackedScene" path="res://scenes/boss/boss.tscn" id="2_boss"]
[ext_resource type="PackedScene" path="res://scenes/ui/hud.tscn" id="3_hud"]

[node name="Battle" type="Node2D"]

[node name="Floor" type="StaticBody2D" parent="."]
position = Vector2(640, 650)

[node name="FloorShape" type="CollisionShape2D" parent="Floor"]

[node name="FloorSprite" type="ColorRect" parent="Floor"]
offset_left = -640
offset_top = -20
offset_right = 640
offset_bottom = 100
color = Color(0.3, 0.3, 0.3)

[node name="Player" parent="." instance=ExtResource("1_player")]
position = Vector2(200, 500)

[node name="Boss" parent="." instance=ExtResource("2_boss")]
position = Vector2(1000, 500)

[node name="HUD" parent="." instance=ExtResource("3_hud")]
```

**Step 2: コミット**

```bash
git add scenes/battle.tscn
git commit -m "feat: バトルシーンを作成"
```

---

## Task 10: HUD（体力バー）の作成

**Files:**
- Create: `test/scenes/ui/hud.tscn`
- Create: `test/scripts/ui/hud.gd`

**Step 1: HUDシーンを作成**

```gdscript
# test/scenes/ui/hud.tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/ui/hud.gd" id="1_hud"]

[node name="HUD" type="CanvasLayer"]
script = ExtResource("1_hud")

[node name="PlayerHP" type="ProgressBar" parent="."]
offset_left = 20
offset_top = 20
offset_right = 220
offset_bottom = 40
value = 100.0

[node name="PlayerHPLabel" type="Label" parent="."]
offset_left = 20
offset_top = 45
offset_right = 220
offset_bottom = 65
text = "PLAYER"

[node name="BossHP" type="ProgressBar" parent="."]
offset_left = 340
offset_top = 20
offset_right = 940
offset_bottom = 50
value = 100.0

[node name="BossHPLabel" type="Label" parent="."]
offset_left = 600
offset_top = 55
offset_right = 700
offset_bottom = 75
text = "BOSS"

[node name="ArrowCount" type="Label" parent="."]
offset_left = 20
offset_top = 680
offset_right = 150
offset_bottom = 700
text = "Arrows: 5/5"
```

**Step 2: HUDスクリプト**

```gdscript
# test/scripts/ui/hud.gd
extends CanvasLayer

@onready var player_hp_bar: ProgressBar = $PlayerHP
@onready var boss_hp_bar: ProgressBar = $BossHP
@onready var arrow_count: Label = $ArrowCount

func _ready() -> void:
    # プレイヤーとボスのシグナルに接続
    await get_tree().process_frame

    var player = get_tree().get_first_node_in_group("player")
    if player:
        player.health_changed.connect(_on_player_health_changed)

    var boss = get_tree().get_first_node_in_group("boss")
    if boss:
        boss.health_changed.connect(_on_boss_health_changed)

func _on_player_health_changed(current: int, max_hp: int) -> void:
    player_hp_bar.value = (float(current) / max_hp) * 100

func _on_boss_health_changed(current: int, max_hp: int) -> void:
    boss_hp_bar.value = (float(current) / max_hp) * 100

func update_arrow_count(current: int, max_arrows: int) -> void:
    arrow_count.text = "Arrows: %d/%d" % [current, max_arrows]
```

**Step 3: コミット**

```bash
git add -A
git commit -m "feat: HUD（HP表示・矢の数）を実装"
```

---

## Task 11: ゲームオーバー画面

**Files:**
- Create: `test/scenes/ui/game_over.tscn`
- Create: `test/scripts/ui/game_over.gd`

**Step 1: ゲームオーバーシーンを作成**

```gdscript
# test/scenes/ui/game_over.tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/ui/game_over.gd" id="1_go"]

[node name="GameOver" type="CanvasLayer"]
script = ExtResource("1_go")

[node name="Panel" type="ColorRect" parent="."]
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
color = Color(0, 0, 0, 0.7)
visible = false

[node name="Label" type="Label" parent="Panel"]
anchors_preset = 8
anchor_left = 0.5
anchor_top = 0.5
anchor_right = 0.5
anchor_bottom = 0.5
offset_left = -100
offset_top = -100
offset_right = 100
offset_bottom = -50
text = "YOU DIED"
horizontal_alignment = 1

[node name="RetryButton" type="Button" parent="Panel"]
offset_left = 540
offset_top = 400
offset_right = 740
offset_bottom = 450
text = "RETRY"

[node name="MenuButton" type="Button" parent="Panel"]
offset_left = 540
offset_top = 470
offset_right = 740
offset_bottom = 520
text = "MENU"
```

**Step 2: ゲームオーバースクリプト**

```gdscript
# test/scripts/ui/game_over.gd
extends CanvasLayer

@onready var panel: ColorRect = $Panel

func _ready() -> void:
    panel.visible = false
    $Panel/RetryButton.pressed.connect(_on_retry)
    $Panel/MenuButton.pressed.connect(_on_menu)

func show_game_over() -> void:
    panel.visible = true
    get_tree().paused = true

func show_victory() -> void:
    $Panel/Label.text = "VICTORY!"
    panel.visible = true
    get_tree().paused = true

func _on_retry() -> void:
    get_tree().paused = false
    get_tree().reload_current_scene()

func _on_menu() -> void:
    get_tree().paused = false
    get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
```

**Step 3: コミット**

```bash
git add -A
git commit -m "feat: ゲームオーバー・勝利画面を実装"
```

---

## Task 12: メインメニュー

**Files:**
- Create: `test/scenes/main_menu.tscn`
- Create: `test/scripts/main_menu.gd`

**Step 1: メインメニューシーンを作成**

```gdscript
# test/scenes/main_menu.tscn
[gd_scene load_steps=2 format=3]

[ext_resource type="Script" path="res://scripts/main_menu.gd" id="1_menu"]

[node name="MainMenu" type="Control"]
layout_mode = 3
anchors_preset = 15
anchor_right = 1.0
anchor_bottom = 1.0
script = ExtResource("1_menu")

[node name="Title" type="Label" parent="."]
layout_mode = 1
offset_left = 440
offset_top = 150
offset_right = 840
offset_bottom = 250
text = "DEATH BOSS"
horizontal_alignment = 1

[node name="StartButton" type="Button" parent="."]
layout_mode = 1
offset_left = 540
offset_top = 350
offset_right = 740
offset_bottom = 400
text = "START"

[node name="QuitButton" type="Button" parent="."]
layout_mode = 1
offset_left = 540
offset_top = 420
offset_right = 740
offset_bottom = 470
text = "QUIT"
```

**Step 2: メインメニュースクリプト**

```gdscript
# test/scripts/main_menu.gd
extends Control

func _ready() -> void:
    $StartButton.pressed.connect(_on_start)
    $QuitButton.pressed.connect(_on_quit)

func _on_start() -> void:
    get_tree().change_scene_to_file("res://scenes/battle.tscn")

func _on_quit() -> void:
    get_tree().quit()
```

**Step 3: project.godotのメインシーンを更新**

```ini
# project.godot の [application] セクションに追加
run/main_scene="res://scenes/main_menu.tscn"
```

**Step 4: コミット**

```bash
git add -A
git commit -m "feat: メインメニューを実装"
```

---

## Task 13: バトルシーンのゲーム管理

**Files:**
- Create: `test/scripts/battle_manager.gd`
- Modify: `test/scenes/battle.tscn`

**Step 1: バトル管理スクリプト**

```gdscript
# test/scripts/battle_manager.gd
extends Node2D

@onready var game_over_ui: CanvasLayer = $GameOver

func _ready() -> void:
    var player = $Player
    var boss = $Boss

    player.add_to_group("player")
    boss.add_to_group("boss")

    player.player_died.connect(_on_player_died)
    boss.boss_died.connect(_on_boss_died)

func _on_player_died() -> void:
    game_over_ui.show_game_over()

func _on_boss_died() -> void:
    game_over_ui.show_victory()
```

**Step 2: battle.tscnにスクリプトをアタッチし、GameOverシーンを追加**

**Step 3: コミット**

```bash
git add -A
git commit -m "feat: バトル管理（勝敗判定）を実装"
```

---

## Task 14: 入力マッピングの設定

**Files:**
- Modify: `test/project.godot`

**Step 1: project.godotに入力マッピングを追加**

```ini
[input]

move_left={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194319,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)
]
}
move_right={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194321,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)
]
}
jump={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":32,"key_label":0,"unicode":32,"location":0,"echo":false,"script":null)
]
}
attack_sword={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":90,"key_label":0,"unicode":122,"location":0,"echo":false,"script":null)
]
}
attack_bow={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":88,"key_label":0,"unicode":120,"location":0,"echo":false,"script":null)
]
}
dash={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":67,"key_label":0,"unicode":99,"location":0,"echo":false,"script":null)
]
}
roll={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":86,"key_label":0,"unicode":118,"location":0,"echo":false,"script":null)
]
}
```

**操作一覧:**
- 矢印キー左右: 移動
- スペース: ジャンプ
- Z: 剣攻撃
- X: 弓攻撃
- C: ダッシュ
- V: ローリング

**Step 2: コミット**

```bash
git add project.godot
git commit -m "feat: 入力マッピングを設定"
```

---

## Task 15: 統合テスト・調整

**Step 1: ゲームを実行して確認**

- メインメニューからバトルに遷移できるか
- プレイヤーが操作できるか（移動、ジャンプ、攻撃、回避）
- ボスが攻撃してくるか
- ダメージ判定が機能するか
- HP表示が更新されるか
- 勝敗が正しく判定されるか

**Step 2: 問題があれば修正**

**Step 3: 最終コミット**

```bash
git add -A
git commit -m "feat: MVP完成 - ボス1体と戦えるプロトタイプ"
```

---

## 完了チェックリスト

- [ ] Task 1: プロジェクト構造のセットアップ
- [ ] Task 2: プレイヤーの基本移動
- [ ] Task 3: プレイヤーの剣攻撃
- [ ] Task 4: プレイヤーの弓攻撃
- [ ] Task 5: プレイヤーのダッシュとローリング
- [ ] Task 6: プレイヤーのHP・ダメージ処理
- [ ] Task 7: ボスの基本実装
- [ ] Task 8: ボスの当たり判定
- [ ] Task 9: バトルシーンの作成
- [ ] Task 10: HUD（体力バー）の作成
- [ ] Task 11: ゲームオーバー画面
- [ ] Task 12: メインメニュー
- [ ] Task 13: バトルシーンのゲーム管理
- [ ] Task 14: 入力マッピングの設定
- [ ] Task 15: 統合テスト・調整
