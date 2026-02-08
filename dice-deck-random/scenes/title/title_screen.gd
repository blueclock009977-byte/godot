extends Control

func _ready() -> void:
	# Dark background
	var bg := ColorRect.new()
	bg.color = Color(0.1, 0.1, 0.15)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	var vbox := VBoxContainer.new()
	vbox.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	vbox.offset_left = -200
	vbox.offset_right = 200
	vbox.offset_top = -250
	vbox.offset_bottom = 250
	vbox.add_theme_constant_override("separation", 40)
	add_child(vbox)

	var title := Label.new()
	title.text = "Dice Deck Random"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 48)
	vbox.add_child(title)

	var spacer := Control.new()
	spacer.custom_minimum_size.y = 60
	vbox.add_child(spacer)

	var npc_btn := Button.new()
	npc_btn.text = "NPC Battle"
	npc_btn.custom_minimum_size.y = 80
	npc_btn.add_theme_font_size_override("font_size", 28)
	npc_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/battle/battle.tscn"))
	vbox.add_child(npc_btn)

	var deck_btn := Button.new()
	deck_btn.text = "Deck Edit"
	deck_btn.custom_minimum_size.y = 80
	deck_btn.add_theme_font_size_override("font_size", 28)
	deck_btn.pressed.connect(func(): GameManager.change_scene("res://scenes/deck_editor/deck_editor.tscn"))
	vbox.add_child(deck_btn)

	var rules_btn := Button.new()
	rules_btn.text = "Rules"
	rules_btn.custom_minimum_size.y = 80
	rules_btn.add_theme_font_size_override("font_size", 28)
	rules_btn.pressed.connect(_show_rules)
	vbox.add_child(rules_btn)

func _show_rules() -> void:
	# Simple popup with rules
	var popup := AcceptDialog.new()
	popup.title = "Rules"
	popup.dialog_text = """1vs1 Card Game
- HP: 20 each
- Deck: 20 cards, hand starts at 4
- Each turn: Roll dice -> Draw 2 -> Main Phase
- Summon: dice matches card's summon number
- Attack: dice matches card's attack number
- Drag or Tap cards to summon/attack
- Protect: front 2 slots block back row
- Destroy opponent's HP to win!"""
	popup.size = Vector2(800, 600)
	add_child(popup)
	popup.popup_centered()
