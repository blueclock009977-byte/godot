# Tsum Puzzle

## Dimension: 2D

## Input Actions

| Action | Keys |
|--------|------|
| touch | Mouse Left Click |

## Scenes

### Main
- **File:** res://scenes/main.tscn
- **Root type:** Node2D
- **Children:** GameField, CanvasLayer(UI)

### Title
- **File:** res://scenes/title.tscn
- **Root type:** Control
- **Children:** VBoxContainer(Title, StartButton, PartyButton)

### GameField
- **File:** res://scenes/game_field.tscn
- **Root type:** Node2D
- **Children:** (Tsums spawned dynamically)

### Tsum
- **File:** res://scenes/tsum.tscn
- **Root type:** RigidBody2D
- **Children:** CollisionShape2D, Sprite2D

### PartyEdit
- **File:** res://scenes/party_edit.tscn
- **Root type:** Control
- **Children:** GridContainer(CharacterSlots), VBoxContainer(PartySlots), StartButton

## Scripts

### Main
- **File:** res://scripts/main.gd
- **Extends:** Node2D
- **Attaches to:** Main:Main
- **Signals received:** GameManager signals

### GameManager (Autoload)
- **File:** res://scripts/game_manager.gd
- **Extends:** Node
- **Signals emitted:** time_updated, score_updated, combo_updated, fever_updated, game_over, skill_gauge_updated

### GameField
- **File:** res://scripts/game_field.gd
- **Extends:** Node2D
- **Attaches to:** GameField:GameField
- **Signals emitted:** chain_completed(chain_length, tsum_type)

### Tsum
- **File:** res://scripts/tsum.gd
- **Extends:** RigidBody2D
- **Attaches to:** Tsum:Tsum
- **Signals emitted:** clicked(tsum), entered(tsum)

### UIManager
- **File:** res://scripts/ui_manager.gd
- **Extends:** Control
- **Attaches to:** Main:CanvasLayer:UI
- **Signals received:** GameManager.time_updated, score_updated, combo_updated, fever_updated, game_over, skill_gauge_updated

### PartyManager (Autoload)
- **File:** res://scripts/party_manager.gd
- **Extends:** Node
- **Signals emitted:** party_changed

### CharacterData (Autoload)
- **File:** res://scripts/data/characters.gd
- **Extends:** Node

### SkillExecutor
- **File:** res://scripts/skills/skill_executor.gd
- **Extends:** RefCounted

### Title
- **File:** res://scripts/title.gd
- **Extends:** Control
- **Attaches to:** Title:Title

### PartyEdit
- **File:** res://scripts/party_edit.gd
- **Extends:** Control
- **Attaches to:** PartyEdit:PartyEdit

## Signal Map

- GameField.chain_completed -> GameManager._on_chain_completed
- GameManager.time_updated -> UIManager._on_time_updated
- GameManager.score_updated -> UIManager._on_score_updated
- GameManager.combo_updated -> UIManager._on_combo_updated
- GameManager.fever_updated -> UIManager._on_fever_updated
- GameManager.game_over -> UIManager._on_game_over
- GameManager.skill_gauge_updated -> UIManager._on_skill_gauge_updated
- Tsum.clicked -> GameField._on_tsum_clicked
- Tsum.entered -> GameField._on_tsum_entered

## Asset Hints

- 5 Tsum character sprites (round cute faces, one per color: red, blue, green, yellow, purple, ~60x60px each)
- Game background (colorful gradient, portrait 540x960)
- Chain line effect (glowing connecting line)
- Fever effect overlay (sparkle/rainbow particles)
- UI elements (skill buttons, gauge frames)
