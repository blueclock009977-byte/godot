# Dice Deck Random Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 1vs1 dice-based card game with NPC AI battle and deck editor in Godot 4.6, mobile-first (portrait 9:16).

**Architecture:** Autoload singletons for game state and card database. Scene-based UI with battle field, hand, and card components. Card data as GDScript Resource. Effect system as strategy pattern. NPC AI as priority-based decision tree.

**Tech Stack:** Godot 4.6, GDScript, GL Compatibility renderer, 1080x1920 portrait

---

## Phase 1: Foundation

### Task 1: Project Setup

**Files:**
- Modify: `project.godot`
- Create: `autoload/game_manager.gd`
- Create: `autoload/card_database.gd`

**Step 1: Configure project.godot for mobile portrait**

Add to `project.godot`:
```
[display]
window/size/viewport_width=1080
window/size/viewport_height=1920
window/stretch/mode="canvas_items"
window/stretch/aspect="keep_width"
window/handheld/orientation=1
```

**Step 2: Create folder structure**

```bash
mkdir -p autoload cards scenes/battle scenes/title scenes/deck_editor scenes/result effects ai
```

**Step 3: Create GameManager autoload**

Create `autoload/game_manager.gd`:
```gdscript
extends Node

enum GameState { TITLE, DECK_EDIT, BATTLE, RESULT }

var current_state: GameState = GameState.TITLE
var player_deck: Array[Resource] = []
var battle_result: String = ""  # "win" or "lose"

func change_scene(scene_path: String) -> void:
	get_tree().change_scene_to_file(scene_path)
```

**Step 4: Create CardDatabase autoload (empty for now)**

Create `autoload/card_database.gd`:
```gdscript
extends Node

var card_pool: Array[Resource] = []

func _ready() -> void:
	_generate_card_pool()

func _generate_card_pool() -> void:
	pass  # Will be implemented in Task 3

func get_card_by_id(id: int) -> Resource:
	for card in card_pool:
		if card.id == id:
			return card
	return null
```

**Step 5: Register autoloads in project.godot**

Add to `project.godot`:
```
[autoload]
GameManager="*res://autoload/game_manager.gd"
CardDatabase="*res://autoload/card_database.gd"
```

**Step 6: Verify** - Open project in Godot editor, confirm no errors, screen size is 1080x1920.

**Step 7: Commit**
```bash
git add -A && git commit -m "feat: project setup with autoloads and mobile config"
```

---

### Task 2: Card Data Resource

**Files:**
- Create: `cards/card_data.gd`
- Create: `cards/effect_data.gd`

**Step 1: Create CardData resource**

Create `cards/card_data.gd`:
```gdscript
class_name CardData
extends Resource

@export var id: int = 0
@export var card_name: String = ""
@export var hp: int = 1
@export var atk: int = 1
@export var summon_dice: Array[int] = []
@export var attack_dice: Array[int] = []
@export var effect_type: String = "none"  # "none", "on_summon", "on_destroy", "passive", "auto_trigger"
@export var effect_id: int = 0
@export var effect_description: String = ""
@export var color: Color = Color.WHITE
@export var icon_name: String = "default"

func duplicate_card() -> CardData:
	var copy := CardData.new()
	copy.id = id
	copy.card_name = card_name
	copy.hp = hp
	copy.atk = atk
	copy.summon_dice = summon_dice.duplicate()
	copy.attack_dice = attack_dice.duplicate()
	copy.effect_type = effect_type
	copy.effect_id = effect_id
	copy.effect_description = effect_description
	copy.color = color
	copy.icon_name = icon_name
	return copy
```

**Step 2: Commit**
```bash
git add -A && git commit -m "feat: add CardData resource class"
```

---

### Task 3: Card Pool Generation (30 cards)

**Files:**
- Modify: `autoload/card_database.gd`

**Step 1: Implement card pool generation with cost-balancing**

Replace `autoload/card_database.gd`:
```gdscript
extends Node

const TOTAL_COST := 18.0
const DICE_COST := 1.5

var card_pool: Array[CardData] = []

# Effect definitions: [id, type, description, cost]
var effect_defs: Array = [
	[1, "on_summon", "Summon: 1 dmg to random enemy", 3],
	[2, "on_summon", "Summon: Draw 1", 3],
	[3, "on_summon", "Summon: Adjacent ally ATK+1", 4],
	[4, "on_summon", "Summon: 2 dmg to lowest HP enemy", 4],
	[5, "on_summon", "Summon: Adjacent ally +1 atk die", 5],
	[6, "on_destroy", "Destroy: Draw 1", 3],
	[7, "on_destroy", "Destroy: 2 dmg to destroyer", 4],
	[8, "on_destroy", "Destroy: 1 dmg to all enemies", 5],
	[9, "on_destroy", "Destroy: Recover 1 from trash", 4],
	[10, "on_destroy", "Destroy: Adjacent allies HP+2", 4],
	[11, "passive", "Passive: Adjacent allies ATK+1", 5],
	[12, "passive", "Passive: Self dmg taken -1 (min 1)", 4],
	[13, "passive", "Passive: Turn start heal 1 HP", 3],
	[14, "passive", "Passive: On attack draw 1", 5],
	[15, "passive", "Passive: Adjacent enemies ATK-1", 5],
	[16, "auto_trigger", "Auto: 1 dmg to opponent's summoned card", 4],
	[17, "auto_trigger", "Auto: Adj ally destroyed -> self ATK+1", 3],
	[18, "auto_trigger", "Auto: When attacked, 1 extra dmg back", 4],
]

var card_colors: Array[Color] = [
	Color.RED, Color.BLUE, Color.GREEN, Color.ORANGE, Color.PURPLE,
	Color.CYAN, Color.YELLOW, Color.PINK, Color(0.5, 0.8, 0.2),
	Color(0.2, 0.5, 0.8), Color(0.8, 0.3, 0.3), Color(0.3, 0.8, 0.6),
]

var card_icons: Array[String] = [
	"sword", "shield", "star", "flame", "bolt",
	"heart", "skull", "crown", "gem", "arrow",
]

func _ready() -> void:
	_generate_card_pool()

func _generate_card_pool() -> void:
	card_pool.clear()
	var id_counter := 0

	# --- No-effect cards (18 cards) ---
	var no_effect_templates := [
		# [name, hp, atk, summon_count, attack_count]
		["Iron Guard", 8, 4, 2, 2],        # Tank: 8+4+3+3=18
		["Steel Wall", 10, 2, 2, 2],       # Wall: 10+2+3+3=18
		["Flame Striker", 3, 6, 3, 3],     # Fire: 3+6+4.5+4.5=18
		["Shadow Blade", 2, 7, 2, 3],      # Glass cannon: 2+7+3+4.5=16.5->adjust
		["Balanced Knight", 5, 4, 3, 3],   # Balance: 5+4+4.5+4.5=18
		["Swift Scout", 3, 3, 4, 4],       # Speed: 3+3+6+6=18
		["Heavy Golem", 7, 5, 1, 2],       # Slow power: 7+5+1.5+3=16.5->adjust
		["Storm Lancer", 4, 5, 3, 3],      # Atk focus: 4+5+4.5+4.5=18
		["Crystal Warden", 6, 3, 3, 3],    # HP focus: 6+3+4.5+4.5=18
		["Berserker", 1, 8, 2, 3],         # Extreme glass: 1+8+3+4.5=16.5->adjust
		["Fortress", 12, 1, 1, 2],         # Extreme wall: 12+1+1.5+3=17.5->adjust
		["Wind Runner", 4, 2, 4, 4],       # Very fast: 4+2+6+6=18
		["Battle Axe", 5, 5, 2, 3],        # Power balance: 5+5+3+4.5=17.5
		["Dark Titan", 6, 6, 1, 2],        # Strong but slow: 6+6+1.5+3=16.5
		["Light Saber", 3, 4, 3, 4],       # Atk easy: 3+4+4.5+6=17.5
		["Stone Sentinel", 9, 3, 1, 3],    # Super tank: 9+3+1.5+4.5=18
		["Dual Blade", 4, 4, 3, 4],        # All-round: 4+4+4.5+6=18.5->adjust
		["Thunder Fist", 2, 5, 3, 4],      # Burst: 2+5+4.5+6=17.5
	]

	for template in no_effect_templates:
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
		card.icon_name = card_icons[id_counter % card_icons.size()]
		card_pool.append(card)
		id_counter += 1

	# --- Effect cards (12 cards) ---
	var effect_templates := [
		# [name, hp, atk, summon_count, attack_count, effect_index]
		["Fire Imp", 3, 3, 2, 2, 0],       # 3+3+3+3+3=15 +3cost effect=18
		["Scholar", 3, 2, 3, 2, 1],         # 3+2+4.5+3+3=15.5 draw
		["War Drummer", 2, 2, 3, 2, 2],     # 2+2+4.5+3+4=15.5 adj atk+1
		["Sniper", 2, 3, 2, 3, 3],          # 2+3+3+4.5+4=16.5 2dmg lowest
		["Enchanter", 2, 2, 2, 2, 4],       # 2+2+3+3+5=15 adj +1 die
		["Phoenix Egg", 4, 2, 3, 2, 5],     # 4+2+4.5+3+3=16.5 destroy draw
		["Bomb Shell", 2, 3, 2, 2, 6],      # 2+3+3+3+4=15 destroy 2dmg
		["Landmine", 1, 1, 3, 3, 7],        # 1+1+4.5+4.5+5=16 destroy all 1dmg
		["Necromancer", 3, 2, 2, 2, 8],     # 3+2+3+3+4=15 recover trash
		["Healer", 3, 1, 3, 2, 9],          # 3+1+4.5+3+4=15.5 adj hp+2
		["Commander", 2, 2, 2, 2, 10],      # 2+2+3+3+5=15 passive adj atk+1
		["Guardian", 4, 1, 3, 2, 11],       # 4+1+4.5+3+4=16.5 passive -1dmg
		["Regenerator", 5, 2, 2, 2, 12],    # 5+2+3+3+3=16 passive heal
		["Looter", 2, 3, 2, 3, 13],         # 2+3+3+4.5+5=17.5 atk draw
		["Suppressor", 3, 2, 2, 2, 14],     # 3+2+3+3+5=16 passive adj enemy -1
		["Interceptor", 3, 3, 2, 2, 15],    # 3+3+3+3+4=16 auto dmg summon
		["Avenger", 4, 2, 2, 3, 16],        # 4+2+3+4.5+3=16.5 auto adj destroy
		["Thorns", 3, 3, 2, 2, 17],         # 3+3+3+3+4=16 auto counter
	]

	for template in effect_templates:
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
		card.icon_name = card_icons[id_counter % card_icons.size()]
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
	var count_map := {}  # card_id -> count
	for card in pool_copy:
		var current_count: int = count_map.get(card.id, 0)
		if current_count < 2 and deck.size() < 20:
			deck.append(card.duplicate_card())
			count_map[card.id] = current_count + 1
	# If not enough, fill with duplicates
	while deck.size() < 20:
		var pick: CardData = pool_copy[randi() % pool_copy.size()]
		var current_count: int = count_map.get(pick.id, 0)
		if current_count < 2:
			deck.append(pick.duplicate_card())
			count_map[pick.id] = current_count + 1
	deck.shuffle()
	return deck
```

**Step 2: Verify** - Run project, check Output for no errors.

**Step 3: Commit**
```bash
git add -A && git commit -m "feat: card data model and 30-card pool generation"
```

---

## Phase 2: Battle Core

### Task 4: Card UI Scene

**Files:**
- Create: `scenes/battle/card_ui.tscn`
- Create: `scenes/battle/card_ui.gd`

**Step 1: Create card visual scene**

Create `scenes/battle/card_ui.tscn` - a Control node based card:
- Root: `Control` (CardUI) - 140x200 pixels
  - `Panel` (Background) - full rect
  - `Label` (NameLabel) - top, card name
  - `Label` (StatsLabel) - center, "HP:X ATK:Y"
  - `Label` (DiceLabel) - lower, dice numbers
  - `Label` (EffectLabel) - bottom, effect text (small)
  - `ColorRect` (GlowEffect) - overlay for attack-ready/summonable glow

**Step 2: Create card_ui.gd script**

Create `scenes/battle/card_ui.gd`:
```gdscript
class_name CardUI
extends Control

signal card_clicked(card_ui: CardUI)
signal card_drag_started(card_ui: CardUI)
signal card_drag_ended(card_ui: CardUI, target_position: Vector2)

@onready var background: Panel = $Background
@onready var name_label: Label = $NameLabel
@onready var stats_label: Label = $StatsLabel
@onready var dice_label: Label = $DiceLabel
@onready var effect_label: Label = $EffectLabel
@onready var glow_effect: ColorRect = $GlowEffect

var card_data: CardData
var current_hp: int = 0
var current_atk: int = 0
var is_attack_ready: bool = false
var is_summonable: bool = false
var is_selected: bool = false
var is_face_down: bool = false
var is_dragging: bool = false
var drag_offset: Vector2 = Vector2.ZERO
var original_position: Vector2 = Vector2.ZERO
var bonus_attack_dice: Array[int] = []

func setup(data: CardData) -> void:
	card_data = data
	current_hp = data.hp
	current_atk = data.atk
	_update_display()

func _update_display() -> void:
	if is_face_down:
		name_label.text = "???"
		stats_label.text = ""
		dice_label.text = ""
		effect_label.text = ""
		var style := StyleBoxFlat.new()
		style.bg_color = Color(0.3, 0.3, 0.4)
		background.add_theme_stylebox_override("panel", style)
		glow_effect.visible = false
		return

	name_label.text = card_data.card_name
	stats_label.text = "HP:%d ATK:%d" % [current_hp, current_atk]

	var s_dice := ""
	for d in card_data.summon_dice:
		s_dice += str(d) + " "
	var a_dice := ""
	var all_atk_dice := get_all_attack_dice()
	for d in all_atk_dice:
		a_dice += str(d) + " "
	dice_label.text = "S[%s] A[%s]" % [s_dice.strip_edges(), a_dice.strip_edges()]

	if card_data.effect_description != "":
		effect_label.text = card_data.effect_description
	else:
		effect_label.text = ""

	var style := StyleBoxFlat.new()
	style.bg_color = card_data.color.darkened(0.3)
	style.border_width_left = 2
	style.border_width_right = 2
	style.border_width_top = 2
	style.border_width_bottom = 2
	style.border_color = card_data.color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	background.add_theme_stylebox_override("panel", style)

	# Glow
	glow_effect.visible = is_attack_ready or is_summonable or is_selected
	if is_selected:
		glow_effect.color = Color(1, 1, 0, 0.3)
	elif is_attack_ready:
		glow_effect.color = Color(1, 0.3, 0.3, 0.25)
	elif is_summonable:
		glow_effect.color = Color(0.3, 1, 0.3, 0.25)

func get_all_attack_dice() -> Array[int]:
	var result: Array[int] = card_data.attack_dice.duplicate()
	for d in bonus_attack_dice:
		if d not in result:
			result.append(d)
	result.sort()
	return result

func take_damage(amount: int) -> int:
	var actual := amount
	current_hp -= actual
	_update_display()
	return current_hp

func heal(amount: int) -> void:
	current_hp += amount
	_update_display()

func set_attack_ready(ready: bool) -> void:
	is_attack_ready = ready
	_update_display()

func set_summonable(summonable: bool) -> void:
	is_summonable = summonable
	_update_display()

func set_selected(selected: bool) -> void:
	is_selected = selected
	_update_display()

func set_face_down(face_down: bool) -> void:
	is_face_down = face_down
	_update_display()

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				card_clicked.emit(self)
				is_dragging = true
				drag_offset = event.position
				original_position = global_position
				card_drag_started.emit(self)
			else:
				if is_dragging:
					is_dragging = false
					card_drag_ended.emit(self, global_position)
	elif event is InputEventMouseMotion:
		if is_dragging:
			global_position = event.global_position - drag_offset

	if event is InputEventScreenTouch:
		if event.pressed:
			card_clicked.emit(self)
			is_dragging = true
			drag_offset = event.position
			original_position = global_position
			card_drag_started.emit(self)
		else:
			if is_dragging:
				is_dragging = false
				card_drag_ended.emit(self, global_position)
	elif event is InputEventScreenDrag:
		if is_dragging:
			global_position = event.position - drag_offset
```

**Step 3: Build the .tscn in editor or via script** - Create the scene with proper node hierarchy and anchors.

**Step 4: Commit**
```bash
git add -A && git commit -m "feat: card UI scene with drag and tap support"
```

---

### Task 5: Field Slot Scene

**Files:**
- Create: `scenes/battle/field_slot.tscn`
- Create: `scenes/battle/field_slot.gd`

**Step 1: Create field slot**

Create `scenes/battle/field_slot.gd`:
```gdscript
class_name FieldSlot
extends Control

signal slot_clicked(slot: FieldSlot)

@onready var background: Panel = $Background
@onready var card_container: Control = $CardContainer

var slot_index: int = 0  # 0-4 for each player
var is_player_side: bool = true
var card_ui: CardUI = null
var forward_slots: Array[FieldSlot] = []  # The 2 slots in front of this one

func _ready() -> void:
	_update_display()

func is_empty() -> bool:
	return card_ui == null

func place_card(card: CardUI) -> void:
	card_ui = card
	card.reparent(card_container)
	card.position = Vector2.ZERO
	_update_display()

func remove_card() -> CardUI:
	var card := card_ui
	card_ui = null
	_update_display()
	return card

func is_protected() -> bool:
	for slot in forward_slots:
		if slot.is_empty():
			return false
	return forward_slots.size() > 0

func _update_display() -> void:
	var style := StyleBoxFlat.new()
	if card_ui != null:
		style.bg_color = Color(0, 0, 0, 0)
	else:
		style.bg_color = Color(1, 1, 1, 0.1)
		style.border_width_left = 1
		style.border_width_right = 1
		style.border_width_top = 1
		style.border_width_bottom = 1
		style.border_color = Color(1, 1, 1, 0.3)
		style.corner_radius_top_left = 8
		style.corner_radius_top_right = 8
		style.corner_radius_bottom_left = 8
		style.corner_radius_bottom_right = 8
	background.add_theme_stylebox_override("panel", style)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			slot_clicked.emit(self)
	if event is InputEventScreenTouch:
		if event.pressed:
			slot_clicked.emit(self)
```

**Step 2: Commit**
```bash
git add -A && git commit -m "feat: field slot with protection logic"
```

---

### Task 6: Battle Scene Layout

**Files:**
- Create: `scenes/battle/battle.tscn`
- Create: `scenes/battle/battle.gd`

**Step 1: Create battle scene structure**

`scenes/battle/battle.tscn` node hierarchy:
```
Battle (Control) - full rect
  ├─ OpponentArea (VBoxContainer)
  │   └─ OpponentHand (HBoxContainer) - face-down cards
  ├─ Field (Control) - center area
  │   ├─ OpponentPlayer (Control) - HP display
  │   ├─ OpponentBackRow (HBoxContainer) - 2 slots [O1][O2]
  │   ├─ OpponentFrontRow (HBoxContainer) - 3 slots [O3][O4][O5]
  │   ├─ CenterLine (Control)
  │   │   ├─ DiceDisplay (Label) - left
  │   │   └─ EndTurnButton (Button) - right
  │   ├─ PlayerFrontRow (HBoxContainer) - 3 slots [P1][P2][P3]
  │   ├─ PlayerBackRow (HBoxContainer) - 2 slots [P4][P5]
  │   └─ PlayerArea (Control) - HP display
  ├─ PlayerHand (HBoxContainer) - player's hand cards
  └─ PhaseLabel (Label) - shows current phase
```

**Step 2: Create battle.gd - main battle controller**

Create `scenes/battle/battle.gd`:
```gdscript
extends Control

enum Phase { DICE_ROLL, DRAW, MAIN, END_TURN, OPPONENT_TURN, GAME_OVER }
enum Owner { PLAYER, OPPONENT }

# Node references
@onready var opponent_hand_container: HBoxContainer = $OpponentArea/OpponentHand
@onready var opponent_player_label: Label = $Field/OpponentPlayer/HPLabel
@onready var opponent_back_row: HBoxContainer = $Field/OpponentBackRow
@onready var opponent_front_row: HBoxContainer = $Field/OpponentFrontRow
@onready var dice_display: Label = $Field/CenterLine/DiceDisplay
@onready var end_turn_button: Button = $Field/CenterLine/EndTurnButton
@onready var player_front_row: HBoxContainer = $Field/PlayerFrontRow
@onready var player_back_row: HBoxContainer = $Field/PlayerBackRow
@onready var player_label: Label = $Field/PlayerArea/HPLabel
@onready var player_hand_container: HBoxContainer = $PlayerHand
@onready var phase_label: Label = $PhaseLabel

const CardUIScene := preload("res://scenes/battle/card_ui.tscn")
const FieldSlotScene := preload("res://scenes/battle/field_slot.tscn")

# Game state
var current_phase: Phase = Phase.DICE_ROLL
var current_dice: int = 0
var is_player_turn: bool = true

var player_hp: int = 20
var opponent_hp: int = 20

var player_deck: Array[CardData] = []
var opponent_deck: Array[CardData] = []
var player_hand: Array[CardUI] = []
var opponent_hand: Array[CardUI] = []
var player_trash: Array[CardData] = []
var opponent_trash: Array[CardData] = []

var player_field_slots: Array[FieldSlot] = []  # [front0, front1, front2, back0, back1]
var opponent_field_slots: Array[FieldSlot] = []

var selected_card: CardUI = null

func _ready() -> void:
	_setup_field()
	_setup_decks()
	_draw_initial_hands()
	_start_player_turn()

func _setup_field() -> void:
	# Create player field slots: 3 front + 2 back
	for i in range(3):
		var slot: FieldSlot = FieldSlotScene.instantiate()
		slot.slot_index = i
		slot.is_player_side = true
		player_front_row.add_child(slot)
		player_field_slots.append(slot)
		slot.slot_clicked.connect(_on_slot_clicked)
	for i in range(2):
		var slot: FieldSlot = FieldSlotScene.instantiate()
		slot.slot_index = i + 3
		slot.is_player_side = true
		player_back_row.add_child(slot)
		player_field_slots.append(slot)
		slot.slot_clicked.connect(_on_slot_clicked)

	# Create opponent field slots: 3 front + 2 back
	for i in range(3):
		var slot: FieldSlot = FieldSlotScene.instantiate()
		slot.slot_index = i
		slot.is_player_side = false
		opponent_front_row.add_child(slot)
		opponent_field_slots.append(slot)
		slot.slot_clicked.connect(_on_slot_clicked)
	for i in range(2):
		var slot: FieldSlot = FieldSlotScene.instantiate()
		slot.slot_index = i + 3
		slot.is_player_side = false
		opponent_back_row.add_child(slot)
		opponent_field_slots.append(slot)
		slot.slot_clicked.connect(_on_slot_clicked)

	# Set up protection mapping
	# Player: back0(idx3) protected by front0+front1, back1(idx4) protected by front1+front2
	player_field_slots[3].forward_slots = [player_field_slots[0], player_field_slots[1]]
	player_field_slots[4].forward_slots = [player_field_slots[1], player_field_slots[2]]
	# Opponent: same structure
	opponent_field_slots[3].forward_slots = [opponent_field_slots[0], opponent_field_slots[1]]
	opponent_field_slots[4].forward_slots = [opponent_field_slots[1], opponent_field_slots[2]]

	end_turn_button.pressed.connect(_on_end_turn_pressed)

func _setup_decks() -> void:
	# Player deck from GameManager, opponent random
	if GameManager.player_deck.size() > 0:
		player_deck = []
		for card in GameManager.player_deck:
			player_deck.append(card.duplicate_card())
	else:
		player_deck = CardDatabase.build_random_deck()
	opponent_deck = CardDatabase.build_random_deck()
	player_deck.shuffle()
	opponent_deck.shuffle()

func _draw_initial_hands() -> void:
	for i in range(4):
		_draw_card(Owner.PLAYER)
		_draw_card(Owner.OPPONENT)

func _draw_card(owner: Owner) -> void:
	if owner == Owner.PLAYER:
		if player_deck.size() == 0:
			return
		var card_data: CardData = player_deck.pop_front()
		var card_ui: CardUI = CardUIScene.instantiate()
		player_hand_container.add_child(card_ui)
		card_ui.setup(card_data)
		card_ui.card_clicked.connect(_on_hand_card_clicked)
		card_ui.card_drag_ended.connect(_on_card_drag_ended)
		player_hand.append(card_ui)
	else:
		if opponent_deck.size() == 0:
			return
		var card_data: CardData = opponent_deck.pop_front()
		var card_ui: CardUI = CardUIScene.instantiate()
		opponent_hand_container.add_child(card_ui)
		card_ui.setup(card_data)
		card_ui.set_face_down(true)
		opponent_hand.append(card_ui)

# --- Turn Flow ---

func _start_player_turn() -> void:
	is_player_turn = true
	_trigger_turn_start_effects(Owner.PLAYER)
	_roll_dice()

func _roll_dice() -> void:
	current_phase = Phase.DICE_ROLL
	current_dice = randi_range(1, 6)
	dice_display.text = "Dice: %d" % current_dice
	phase_label.text = "Dice: %d!" % current_dice

	# Brief delay then draw
	await get_tree().create_timer(0.8).timeout
	_do_draw_phase()

func _do_draw_phase() -> void:
	current_phase = Phase.DRAW
	if is_player_turn:
		_draw_card(Owner.PLAYER)
		_draw_card(Owner.PLAYER)
	else:
		_draw_card(Owner.OPPONENT)
		_draw_card(Owner.OPPONENT)

	await get_tree().create_timer(0.3).timeout
	_start_main_phase()

func _start_main_phase() -> void:
	current_phase = Phase.MAIN
	phase_label.text = "Main Phase"
	_update_summonable_cards()
	_update_attack_ready_cards()
	end_turn_button.disabled = false

	if not is_player_turn:
		_execute_npc_turn()

func _update_summonable_cards() -> void:
	var hand := player_hand if is_player_turn else opponent_hand
	for card_ui in hand:
		var can_summon: bool = current_dice in card_ui.card_data.summon_dice
		card_ui.set_summonable(can_summon)

func _update_attack_ready_cards() -> void:
	var slots := player_field_slots if is_player_turn else opponent_field_slots
	for slot in slots:
		if slot.card_ui != null:
			var dice_match: bool = current_dice in slot.card_ui.get_all_attack_dice()
			if dice_match:
				slot.card_ui.set_attack_ready(true)
			# Keep existing attack_ready if already true (carry over)

func _on_end_turn_pressed() -> void:
	if current_phase != Phase.MAIN or not is_player_turn:
		return
	_end_current_turn()

func _end_current_turn() -> void:
	current_phase = Phase.END_TURN
	end_turn_button.disabled = true
	_deselect_card()

	if is_player_turn:
		# Start opponent turn
		is_player_turn = false
		_trigger_turn_start_effects(Owner.OPPONENT)
		_roll_dice()
	else:
		# Start player turn
		is_player_turn = true
		_trigger_turn_start_effects(Owner.PLAYER)
		_roll_dice()

# --- Card Interaction ---

func _on_hand_card_clicked(card_ui: CardUI) -> void:
	if current_phase != Phase.MAIN or not is_player_turn:
		return

	if card_ui.is_summonable:
		if selected_card == card_ui:
			_deselect_card()
		else:
			_deselect_card()
			selected_card = card_ui
			card_ui.set_selected(true)

func _on_slot_clicked(slot: FieldSlot) -> void:
	if current_phase != Phase.MAIN or not is_player_turn:
		return

	if selected_card != null:
		# Trying to summon or attack
		if selected_card in player_hand and slot.is_player_side and slot.is_empty():
			_summon_card(selected_card, slot, Owner.PLAYER)
		elif selected_card not in player_hand and not slot.is_player_side and slot.card_ui != null:
			_attack_card(selected_card, slot.card_ui, slot)
		_deselect_card()

func _on_field_card_clicked(card_ui: CardUI) -> void:
	if current_phase != Phase.MAIN or not is_player_turn:
		return

	# If clicking own field card that is attack-ready
	if card_ui.is_attack_ready:
		if selected_card == card_ui:
			_deselect_card()
		else:
			_deselect_card()
			selected_card = card_ui
			card_ui.set_selected(true)

func _on_opponent_player_clicked() -> void:
	if current_phase != Phase.MAIN or not is_player_turn:
		return
	if selected_card != null and selected_card.is_attack_ready:
		if _can_attack_player(Owner.OPPONENT):
			_attack_player(selected_card, Owner.OPPONENT)
			_deselect_card()

func _on_card_drag_ended(card_ui: CardUI, target_pos: Vector2) -> void:
	if current_phase != Phase.MAIN or not is_player_turn:
		card_ui.global_position = card_ui.original_position
		return

	var landed := false

	# Check if dragged to a field slot
	if card_ui in player_hand and card_ui.is_summonable:
		for slot in player_field_slots:
			if slot.is_empty() and slot.get_global_rect().has_point(target_pos):
				_summon_card(card_ui, slot, Owner.PLAYER)
				landed = true
				break

	# Check if dragged to attack
	if not landed and card_ui.is_attack_ready:
		for slot in opponent_field_slots:
			if slot.card_ui != null and not slot.is_protected() and slot.get_global_rect().has_point(target_pos):
				_attack_card(card_ui, slot.card_ui, slot)
				landed = true
				break
		# Check drag to opponent player
		if not landed and _can_attack_player(Owner.OPPONENT):
			var opp_rect: Rect2 = $Field/OpponentPlayer.get_global_rect()
			if opp_rect.has_point(target_pos):
				_attack_player(card_ui, Owner.OPPONENT)
				landed = true

	if not landed:
		card_ui.global_position = card_ui.original_position

func _deselect_card() -> void:
	if selected_card != null:
		selected_card.set_selected(false)
		selected_card = null

# --- Game Actions ---

func _summon_card(card_ui: CardUI, slot: FieldSlot, owner: Owner) -> void:
	var hand := player_hand if owner == Owner.PLAYER else opponent_hand
	hand.erase(card_ui)
	card_ui.set_summonable(false)
	card_ui.set_face_down(false)
	slot.place_card(card_ui)

	# Reconnect signals for field card
	if card_ui.card_clicked.is_connected(_on_hand_card_clicked):
		card_ui.card_clicked.disconnect(_on_hand_card_clicked)
	if not card_ui.card_clicked.is_connected(_on_field_card_clicked):
		card_ui.card_clicked.connect(_on_field_card_clicked)

	# Check if summoned card can attack this turn
	if current_dice in card_ui.get_all_attack_dice():
		card_ui.set_attack_ready(true)

	# Trigger summon effects
	_trigger_summon_effects(card_ui, owner)
	# Trigger opponent's auto-trigger on summon (effect 16)
	_trigger_opponent_summon_reaction(card_ui, owner)

func _attack_card(attacker: CardUI, defender: CardUI, defender_slot: FieldSlot) -> void:
	if defender_slot.is_protected():
		return

	attacker.set_attack_ready(false)
	attacker.set_selected(false)

	# Trigger counter effects (effect 18)
	var counter_dmg := _get_counter_damage(defender)

	# Battle: mutual damage
	var def_remaining := defender.take_damage(attacker.current_atk)
	var atk_remaining := attacker.take_damage(defender.current_atk + counter_dmg)

	# Check destruction
	if def_remaining <= 0:
		_destroy_card(defender, defender_slot, attacker)
	if atk_remaining <= 0:
		var atk_slot := _find_slot_for_card(attacker)
		if atk_slot:
			_destroy_card(attacker, atk_slot, defender)

	_check_game_over()

func _attack_player(attacker: CardUI, target_owner: Owner) -> void:
	attacker.set_attack_ready(false)
	attacker.set_selected(false)

	if target_owner == Owner.OPPONENT:
		opponent_hp -= attacker.current_atk
		opponent_player_label.text = "HP: %d" % opponent_hp
	else:
		player_hp -= attacker.current_atk
		player_label.text = "HP: %d" % player_hp

	_check_game_over()

func _can_attack_player(target_owner: Owner) -> bool:
	var back_slots: Array[FieldSlot] = []
	if target_owner == Owner.OPPONENT:
		back_slots = [opponent_field_slots[3], opponent_field_slots[4]]
	else:
		back_slots = [player_field_slots[3], player_field_slots[4]]

	for slot in back_slots:
		if slot.is_empty():
			return true
	return false  # Both back slots filled = player protected

func _destroy_card(card_ui: CardUI, slot: FieldSlot, destroyer: CardUI) -> void:
	var owner := Owner.PLAYER if slot.is_player_side else Owner.OPPONENT
	_trigger_destroy_effects(card_ui, owner, destroyer)
	_trigger_adjacent_destroy_reaction(card_ui, slot, owner)
	slot.remove_card()
	var trash := player_trash if owner == Owner.PLAYER else opponent_trash
	trash.append(card_ui.card_data)
	card_ui.queue_free()

func _find_slot_for_card(card_ui: CardUI) -> FieldSlot:
	for slot in player_field_slots:
		if slot.card_ui == card_ui:
			return slot
	for slot in opponent_field_slots:
		if slot.card_ui == card_ui:
			return slot
	return null

# --- Effects ---

func _trigger_summon_effects(card_ui: CardUI, owner: Owner) -> void:
	if card_ui.card_data.effect_type != "on_summon":
		return
	var enemy_slots := opponent_field_slots if owner == Owner.PLAYER else player_field_slots
	match card_ui.card_data.effect_id:
		1:  # 1 dmg to random enemy
			var targets := _get_occupied_slots(enemy_slots)
			if targets.size() > 0:
				var target: FieldSlot = targets[randi() % targets.size()]
				var remaining := target.card_ui.take_damage(1)
				if remaining <= 0:
					_destroy_card(target.card_ui, target, card_ui)
		2:  # Draw 1
			_draw_card(owner)
		3:  # Adjacent ally ATK+1
			var slot := _find_slot_for_card(card_ui)
			if slot:
				for adj in _get_adjacent_ally_slots(slot, owner):
					if adj.card_ui:
						adj.card_ui.current_atk += 1
						adj.card_ui._update_display()
		4:  # 2 dmg to lowest HP enemy
			var targets := _get_occupied_slots(enemy_slots)
			if targets.size() > 0:
				var lowest: FieldSlot = targets[0]
				for t in targets:
					if t.card_ui.current_hp < lowest.card_ui.current_hp:
						lowest = t
				var remaining := lowest.card_ui.take_damage(2)
				if remaining <= 0:
					_destroy_card(lowest.card_ui, lowest, card_ui)
		5:  # Adjacent ally +1 attack die
			var slot := _find_slot_for_card(card_ui)
			if slot:
				for adj in _get_adjacent_ally_slots(slot, owner):
					if adj.card_ui:
						var new_die := randi_range(1, 6)
						adj.card_ui.bonus_attack_dice.append(new_die)
						adj.card_ui._update_display()

func _trigger_destroy_effects(card_ui: CardUI, owner: Owner, destroyer: CardUI) -> void:
	if card_ui.card_data.effect_type != "on_destroy":
		return
	var enemy_slots := opponent_field_slots if owner == Owner.PLAYER else player_field_slots
	match card_ui.card_data.effect_id:
		6:  # Draw 1
			_draw_card(owner)
		7:  # 2 dmg to destroyer
			if destroyer and is_instance_valid(destroyer):
				var remaining := destroyer.take_damage(2)
				if remaining <= 0:
					var dslot := _find_slot_for_card(destroyer)
					if dslot:
						_destroy_card(destroyer, dslot, card_ui)
		8:  # 1 dmg to all enemies
			for slot in enemy_slots:
				if slot.card_ui:
					var remaining := slot.card_ui.take_damage(1)
					if remaining <= 0:
						_destroy_card(slot.card_ui, slot, card_ui)
		9:  # Recover random from trash
			var trash := player_trash if owner == Owner.PLAYER else opponent_trash
			if trash.size() > 0:
				var idx := randi() % trash.size()
				var recovered: CardData = trash[idx]
				trash.remove_at(idx)
				var new_card: CardUI = CardUIScene.instantiate()
				var hand_container = player_hand_container if owner == Owner.PLAYER else opponent_hand_container
				hand_container.add_child(new_card)
				new_card.setup(recovered)
				if owner == Owner.PLAYER:
					new_card.card_clicked.connect(_on_hand_card_clicked)
					new_card.card_drag_ended.connect(_on_card_drag_ended)
					player_hand.append(new_card)
				else:
					new_card.set_face_down(true)
					opponent_hand.append(new_card)
		10:  # Adjacent allies HP+2
			var slot := _find_slot_for_card(card_ui)
			if slot:
				for adj in _get_adjacent_ally_slots(slot, owner):
					if adj.card_ui:
						adj.card_ui.heal(2)

func _trigger_turn_start_effects(owner: Owner) -> void:
	var slots := player_field_slots if owner == Owner.PLAYER else opponent_field_slots
	for slot in slots:
		if slot.card_ui and slot.card_ui.card_data.effect_type == "passive":
			match slot.card_ui.card_data.effect_id:
				13:  # Heal 1 HP at turn start
					slot.card_ui.heal(1)

func _trigger_opponent_summon_reaction(summoned_card: CardUI, summoner_owner: Owner) -> void:
	# Effect 16: when opponent summons, deal 1 damage
	var reactor_slots := player_field_slots if summoner_owner == Owner.OPPONENT else opponent_field_slots
	for slot in reactor_slots:
		if slot.card_ui and slot.card_ui.card_data.effect_type == "auto_trigger" and slot.card_ui.card_data.effect_id == 16:
			var remaining := summoned_card.take_damage(1)
			if remaining <= 0:
				var s := _find_slot_for_card(summoned_card)
				if s:
					_destroy_card(summoned_card, s, slot.card_ui)

func _trigger_adjacent_destroy_reaction(destroyed_card: CardUI, destroyed_slot: FieldSlot, owner: Owner) -> void:
	# Effect 17: when adjacent ally destroyed, ATK+1
	var ally_slots := player_field_slots if owner == Owner.PLAYER else opponent_field_slots
	for adj in _get_adjacent_ally_slots(destroyed_slot, owner):
		if adj.card_ui and adj.card_ui.card_data.effect_type == "auto_trigger" and adj.card_ui.card_data.effect_id == 17:
			adj.card_ui.current_atk += 1
			adj.card_ui._update_display()

func _get_counter_damage(defender: CardUI) -> int:
	# Effect 18: when attacked, 1 extra damage back
	if defender.card_data.effect_type == "auto_trigger" and defender.card_data.effect_id == 18:
		return 1
	return 0

func _apply_passive_atk_modifiers() -> void:
	# Effect 11: Adjacent allies ATK+1 (applied continuously)
	# Effect 12: Self damage -1 (handled in take_damage)
	# Effect 15: Adjacent enemies ATK-1 (applied continuously)
	pass  # These are handled during battle resolution

# --- Utility ---

func _get_occupied_slots(slots: Array) -> Array[FieldSlot]:
	var result: Array[FieldSlot] = []
	for slot in slots:
		if slot is FieldSlot and slot.card_ui != null:
			result.append(slot)
	return result

func _get_adjacent_ally_slots(slot: FieldSlot, owner: Owner) -> Array[FieldSlot]:
	var slots := player_field_slots if owner == Owner.PLAYER else opponent_field_slots
	var result: Array[FieldSlot] = []
	var idx := slot.slot_index
	# Front row: 0,1,2 - adjacent means index +/-1
	# Back row: 3,4 - adjacent means index +/-1 within back, plus connected front
	if idx < 3:
		if idx > 0 and slots[idx - 1].card_ui:
			result.append(slots[idx - 1])
		if idx < 2 and slots[idx + 1].card_ui:
			result.append(slots[idx + 1])
		# Back row connections: front0-back0, front1-back0, front1-back1, front2-back1
		if idx == 0 or idx == 1:
			if slots[3].card_ui:
				result.append(slots[3])
		if idx == 1 or idx == 2:
			if slots[4].card_ui:
				result.append(slots[4])
	else:
		# Back row
		var other_back := 4 if idx == 3 else 3
		if slots[other_back].card_ui:
			result.append(slots[other_back])
		# Connected front slots
		if idx == 3:
			for fi in [0, 1]:
				if slots[fi].card_ui:
					result.append(slots[fi])
		else:
			for fi in [1, 2]:
				if slots[fi].card_ui:
					result.append(slots[fi])
	return result

func _check_game_over() -> void:
	if player_hp <= 0:
		current_phase = Phase.GAME_OVER
		GameManager.battle_result = "lose"
		GameManager.change_scene("res://scenes/result/result.tscn")
	elif opponent_hp <= 0:
		current_phase = Phase.GAME_OVER
		GameManager.battle_result = "win"
		GameManager.change_scene("res://scenes/result/result.tscn")

# --- NPC AI ---

func _execute_npc_turn() -> void:
	await get_tree().create_timer(0.5).timeout
	var actions_taken := true
	while actions_taken:
		actions_taken = false
		# Priority 1 & 2: Attack player or killable card
		if _npc_try_attack():
			actions_taken = true
			await get_tree().create_timer(0.4).timeout
			continue
		# Priority 4 & 5: Summon
		if _npc_try_summon():
			actions_taken = true
			await get_tree().create_timer(0.4).timeout
			# After summon, check attack again
			_update_attack_ready_cards()
			continue
		break
	await get_tree().create_timer(0.3).timeout
	_end_current_turn()

func _npc_try_attack() -> bool:
	var attackers: Array[CardUI] = []
	for slot in opponent_field_slots:
		if slot.card_ui and slot.card_ui.is_attack_ready:
			attackers.append(slot.card_ui)
	if attackers.size() == 0:
		return false

	# Priority 1: Attack player
	if _can_attack_player(Owner.PLAYER):
		attackers.shuffle()
		_attack_player(attackers[0], Owner.PLAYER)
		return true

	# Priority 2: Kill a card
	var killable: Array = []
	for atk_card in attackers:
		for slot in player_field_slots:
			if slot.card_ui and not slot.is_protected() and atk_card.current_atk >= slot.card_ui.current_hp:
				killable.append([atk_card, slot])
	if killable.size() > 0:
		killable.shuffle()
		_attack_card(killable[0][0], killable[0][1].card_ui, killable[0][1])
		return true

	# Priority 3: Best trade
	var best_trade = null
	var best_ratio := -999.0
	for atk_card in attackers:
		for slot in player_field_slots:
			if slot.card_ui and not slot.is_protected():
				var ratio: float = float(atk_card.current_atk) / float(maxi(slot.card_ui.current_atk, 1))
				if ratio > best_ratio:
					best_ratio = ratio
					best_trade = [atk_card, slot]
	if best_trade:
		_attack_card(best_trade[0], best_trade[1].card_ui, best_trade[1])
		return true

	return false

func _npc_try_summon() -> bool:
	var summonable: Array[CardUI] = []
	for card_ui in opponent_hand:
		if card_ui.is_summonable:
			summonable.append(card_ui)
	if summonable.size() == 0:
		return false

	# Priority: front row first, then back
	for slot in opponent_field_slots.slice(0, 3):
		if slot.is_empty() and summonable.size() > 0:
			var card: CardUI = summonable.pop_front()
			_summon_card(card, slot, Owner.OPPONENT)
			return true
	for slot in opponent_field_slots.slice(3, 5):
		if slot.is_empty() and summonable.size() > 0:
			var card: CardUI = summonable.pop_front()
			_summon_card(card, slot, Owner.OPPONENT)
			return true
	return false
```

**Step 3: Verify** - Run battle scene, check field layout displays correctly.

**Step 4: Commit**
```bash
git add -A && git commit -m "feat: battle scene with full game logic, effects, and NPC AI"
```

---

## Phase 3: Passive Effect Resolution

### Task 7: Passive Effects (11, 12, 14, 15)

**Files:**
- Modify: `scenes/battle/battle.gd`

**Step 1: Add passive effect resolution to battle**

Add to `battle.gd` - modify `_attack_card` to apply passives:
```gdscript
func _get_effective_atk(card_ui: CardUI, owner: Owner) -> int:
	var atk := card_ui.current_atk
	var ally_slots := player_field_slots if owner == Owner.PLAYER else opponent_field_slots
	var enemy_slots := opponent_field_slots if owner == Owner.PLAYER else player_field_slots
	var slot := _find_slot_for_card(card_ui)
	if not slot:
		return atk

	# Effect 11: Adjacent allies ATK+1
	for adj in _get_adjacent_ally_slots(slot, owner):
		if adj.card_ui and adj.card_ui.card_data.effect_type == "passive" and adj.card_ui.card_data.effect_id == 11:
			atk += 1

	# Effect 15: check if enemy has adjacent debuff
	var enemy_owner := Owner.OPPONENT if owner == Owner.PLAYER else Owner.PLAYER
	# Need to find what enemy slots are adjacent to this card's opposing slot
	for eslot in enemy_slots:
		if eslot.card_ui and eslot.card_ui.card_data.effect_type == "passive" and eslot.card_ui.card_data.effect_id == 15:
			# Check if this card is "adjacent" to that enemy card (across the field)
			atk = maxi(atk - 1, 0)

	return atk

func _get_effective_damage_taken(card_ui: CardUI, damage: int) -> int:
	# Effect 12: Self damage -1 (min 1)
	if card_ui.card_data.effect_type == "passive" and card_ui.card_data.effect_id == 12:
		return maxi(damage - 1, 1)
	return damage

func _trigger_attack_effects(attacker: CardUI, owner: Owner) -> void:
	# Effect 14: On attack draw 1
	if attacker.card_data.effect_type == "passive" and attacker.card_data.effect_id == 14:
		_draw_card(owner)
```

**Step 2: Update `_attack_card` to use effective values**

Update `_attack_card`:
```gdscript
func _attack_card(attacker: CardUI, defender: CardUI, defender_slot: FieldSlot) -> void:
	if defender_slot.is_protected():
		return

	var atk_owner := Owner.PLAYER if _find_slot_for_card(attacker).is_player_side else Owner.OPPONENT
	var def_owner := Owner.PLAYER if defender_slot.is_player_side else Owner.OPPONENT

	attacker.set_attack_ready(false)
	attacker.set_selected(false)

	var atk_power := _get_effective_atk(attacker, atk_owner)
	var def_power := _get_effective_atk(defender, def_owner)
	var counter_dmg := _get_counter_damage(defender)

	var dmg_to_defender := _get_effective_damage_taken(defender, atk_power)
	var dmg_to_attacker := _get_effective_damage_taken(attacker, def_power + counter_dmg)

	_trigger_attack_effects(attacker, atk_owner)

	var def_remaining := defender.take_damage(dmg_to_defender)
	var atk_remaining := attacker.take_damage(dmg_to_attacker)

	if def_remaining <= 0:
		_destroy_card(defender, defender_slot, attacker)
	if atk_remaining <= 0:
		var atk_slot := _find_slot_for_card(attacker)
		if atk_slot:
			_destroy_card(attacker, atk_slot, defender)

	_check_game_over()
```

**Step 3: Commit**
```bash
git add -A && git commit -m "feat: passive effect resolution in battle"
```

---

## Phase 4: Screens

### Task 8: Title Screen

**Files:**
- Create: `scenes/title/title_screen.tscn`
- Create: `scenes/title/title_screen.gd`

**Step 1: Create title screen**

Create `scenes/title/title_screen.gd`:
```gdscript
extends Control

@onready var npc_battle_button: Button = $VBoxContainer/NPCBattleButton
@onready var deck_edit_button: Button = $VBoxContainer/DeckEditButton
@onready var rules_button: Button = $VBoxContainer/RulesButton

func _ready() -> void:
	npc_battle_button.pressed.connect(_on_npc_battle)
	deck_edit_button.pressed.connect(_on_deck_edit)
	rules_button.pressed.connect(_on_rules)

func _on_npc_battle() -> void:
	GameManager.change_scene("res://scenes/battle/battle.tscn")

func _on_deck_edit() -> void:
	GameManager.change_scene("res://scenes/deck_editor/deck_editor.tscn")

func _on_rules() -> void:
	pass  # Show rules popup
```

**Step 2: Build .tscn** - Control root with centered VBoxContainer, title label, 3 buttons.

**Step 3: Update project.godot main scene to title screen.**

**Step 4: Commit**
```bash
git add -A && git commit -m "feat: title screen"
```

---

### Task 9: Deck Editor

**Files:**
- Create: `scenes/deck_editor/deck_editor.tscn`
- Create: `scenes/deck_editor/deck_editor.gd`

**Step 1: Create deck editor**

Create `scenes/deck_editor/deck_editor.gd`:
```gdscript
extends Control

@onready var card_list: VBoxContainer = $ScrollContainer/CardList
@onready var deck_list: VBoxContainer = $DeckPanel/ScrollContainer/DeckList
@onready var deck_count_label: Label = $DeckPanel/DeckCountLabel
@onready var save_button: Button = $DeckPanel/SaveButton
@onready var back_button: Button = $BackButton

var deck: Array[CardData] = []
const MAX_DECK_SIZE := 20
const MAX_COPIES := 2

func _ready() -> void:
	save_button.pressed.connect(_on_save)
	back_button.pressed.connect(_on_back)
	_populate_card_list()
	_update_deck_display()

func _populate_card_list() -> void:
	for card in CardDatabase.get_all_cards():
		var btn := Button.new()
		btn.text = "%s | HP:%d ATK:%d S:%s A:%s %s" % [
			card.card_name, card.hp, card.atk,
			str(card.summon_dice), str(card.attack_dice),
			card.effect_description
		]
		btn.pressed.connect(_on_card_selected.bind(card))
		card_list.add_child(btn)

func _on_card_selected(card: CardData) -> void:
	if deck.size() >= MAX_DECK_SIZE:
		return
	var count := 0
	for c in deck:
		if c.id == card.id:
			count += 1
	if count >= MAX_COPIES:
		return
	deck.append(card.duplicate_card())
	_update_deck_display()

func _update_deck_display() -> void:
	for child in deck_list.get_children():
		child.queue_free()
	for i in range(deck.size()):
		var card: CardData = deck[i]
		var hbox := HBoxContainer.new()
		var label := Label.new()
		label.text = "%s HP:%d ATK:%d" % [card.card_name, card.hp, card.atk]
		var remove_btn := Button.new()
		remove_btn.text = "X"
		remove_btn.pressed.connect(_on_remove_card.bind(i))
		hbox.add_child(label)
		hbox.add_child(remove_btn)
		deck_list.add_child(hbox)
	deck_count_label.text = "Deck: %d / %d" % [deck.size(), MAX_DECK_SIZE]

func _on_remove_card(index: int) -> void:
	deck.remove_at(index)
	_update_deck_display()

func _on_save() -> void:
	if deck.size() == MAX_DECK_SIZE:
		GameManager.player_deck = deck.duplicate()

func _on_back() -> void:
	GameManager.change_scene("res://scenes/title/title_screen.tscn")
```

**Step 2: Build .tscn** - Split screen: left ScrollContainer for card pool, right panel for deck.

**Step 3: Commit**
```bash
git add -A && git commit -m "feat: deck editor screen"
```

---

### Task 10: Result Screen

**Files:**
- Create: `scenes/result/result.tscn`
- Create: `scenes/result/result.gd`

**Step 1: Create result screen**

Create `scenes/result/result.gd`:
```gdscript
extends Control

@onready var result_label: Label = $VBoxContainer/ResultLabel
@onready var back_button: Button = $VBoxContainer/BackButton

func _ready() -> void:
	if GameManager.battle_result == "win":
		result_label.text = "YOU WIN!"
	else:
		result_label.text = "YOU LOSE..."
	back_button.pressed.connect(_on_back)

func _on_back() -> void:
	GameManager.change_scene("res://scenes/title/title_screen.tscn")
```

**Step 2: Build .tscn** - Centered VBoxContainer with result label and button.

**Step 3: Commit**
```bash
git add -A && git commit -m "feat: result screen"
```

---

## Phase 5: Scene Building & Integration

### Task 11: Build All .tscn Files

Build each .tscn file programmatically or in editor with proper node hierarchy, sizes, and anchors for 1080x1920 portrait. Card size: 140x200. Field slot size: 150x210. Proper spacing and centering.

**Step 1: card_ui.tscn**
**Step 2: field_slot.tscn**
**Step 3: battle.tscn (the largest)**
**Step 4: title_screen.tscn**
**Step 5: deck_editor.tscn**
**Step 6: result.tscn**
**Step 7: Update main.tscn to load title screen**
**Step 8: Verify all scenes load without error**
**Step 9: Commit**
```bash
git add -A && git commit -m "feat: all scene files built and integrated"
```

---

### Task 12: Integration Testing & Polish

**Step 1:** Run full game flow: Title -> Deck Editor -> Save -> NPC Battle -> Result -> Title
**Step 2:** Verify card summoning works (drag and tap)
**Step 3:** Verify attack works (drag and tap)
**Step 4:** Verify protection logic
**Step 5:** Verify NPC AI plays correctly
**Step 6:** Verify effects trigger
**Step 7:** Fix any bugs found
**Step 8:** Commit
```bash
git add -A && git commit -m "fix: integration testing and bug fixes"
```

---

### Task 13: Visual Polish

**Step 1:** Add glow animations for attack-ready/summonable cards
**Step 2:** Add dice roll animation (brief number cycling)
**Step 3:** Add damage numbers popup
**Step 4:** Add card destruction animation (fade out)
**Step 5:** Ensure touch targets are large enough for mobile
**Step 6:** Commit
```bash
git add -A && git commit -m "feat: visual polish and animations"
```
