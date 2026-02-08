extends Control

# ==============================================================================
# Battle Controller - Dice Deck Random
# ==============================================================================
# Full battle scene: UI creation, game flow, effects, NPC AI, drag & tap support
# Layout: 1080x1920 portrait
# ==============================================================================

const CardUIScene := preload("res://scenes/battle/card_ui.tscn")
const FieldSlotScene := preload("res://scenes/battle/field_slot.tscn")

# --- Game State ---
enum Phase { DICE_ROLL, DRAW, MAIN, ATTACK_TARGET, END_TURN, GAME_OVER }
enum Turn { PLAYER, OPPONENT }

var current_phase: Phase = Phase.DICE_ROLL
var current_turn: Turn = Turn.PLAYER
var current_dice: int = 0
var turn_number: int = 0

# --- HP ---
var player_hp: int = 20
var opponent_hp: int = 20

# --- Decks, Hands, Trash ---
var player_deck: Array = []
var player_hand: Array = []  # Array of CardUI
var player_trash: Array = []  # Array of CardData

var opponent_deck: Array = []
var opponent_hand: Array = []  # Array of CardUI
var opponent_trash: Array = []  # Array of CardData

# --- Field Slots ---
var player_slots: Array = []  # Array of FieldSlot [front0,front1,front2,back3,back4]
var opponent_slots: Array = []

# --- Selection State ---
var selected_hand_card: Control = null  # CardUI from hand for summoning
var selected_attacker: FieldSlot = null  # FieldSlot with attack-ready card

# --- Log ---
var battle_log_messages: Array[String] = []

# --- UI References ---
var background: ColorRect
var main_vbox: VBoxContainer

var opponent_hand_container: HBoxContainer
var opponent_hp_label: Label
var opponent_back_row: HBoxContainer
var opponent_front_row: HBoxContainer

var center_panel: HBoxContainer
var dice_label: Label
var dice_roll_button: Button
var end_turn_button: Button

var player_front_row: HBoxContainer
var player_back_row: HBoxContainer
var player_hp_label: Label
var player_hand_scroll: ScrollContainer
var player_hand_container: HBoxContainer

var phase_label: Label
var log_label: Label

var animation_timer: Timer
var is_animating: bool = false

# ==============================================================================
# INITIALIZATION
# ==============================================================================

func _ready() -> void:
	_build_ui()
	_setup_game()
	_start_battle()

func _build_ui() -> void:
	# Full-screen dark background
	background = ColorRect.new()
	background.color = Color(0.08, 0.08, 0.12)
	background.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	background.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(background)

	# Main vertical layout
	main_vbox = VBoxContainer.new()
	main_vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	main_vbox.add_theme_constant_override("separation", 4)
	add_child(main_vbox)

	# --- Opponent Hand Area ---
	var opp_hand_panel := PanelContainer.new()
	opp_hand_panel.custom_minimum_size = Vector2(0, 100)
	var opp_hand_style := StyleBoxFlat.new()
	opp_hand_style.bg_color = Color(0.12, 0.12, 0.18)
	opp_hand_panel.add_theme_stylebox_override("panel", opp_hand_style)
	main_vbox.add_child(opp_hand_panel)

	var opp_hand_scroll := ScrollContainer.new()
	opp_hand_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	opp_hand_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	opp_hand_panel.add_child(opp_hand_scroll)

	opponent_hand_container = HBoxContainer.new()
	opponent_hand_container.add_theme_constant_override("separation", 4)
	opponent_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	opp_hand_scroll.add_child(opponent_hand_container)

	# --- Opponent HP ---
	opponent_hp_label = Label.new()
	opponent_hp_label.text = "OPPONENT HP: 20"
	opponent_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	opponent_hp_label.add_theme_font_size_override("font_size", 28)
	opponent_hp_label.add_theme_color_override("font_color", Color(1, 0.4, 0.4))
	opponent_hp_label.mouse_filter = Control.MOUSE_FILTER_STOP
	opponent_hp_label.gui_input.connect(_on_opponent_hp_clicked)
	main_vbox.add_child(opponent_hp_label)

	# --- Opponent Back Row (2 slots, centered) ---
	var opp_back_center := CenterContainer.new()
	opp_back_center.custom_minimum_size = Vector2(0, 220)
	main_vbox.add_child(opp_back_center)
	opponent_back_row = HBoxContainer.new()
	opponent_back_row.add_theme_constant_override("separation", 20)
	opp_back_center.add_child(opponent_back_row)

	# --- Opponent Front Row (3 slots, centered) ---
	var opp_front_center := CenterContainer.new()
	opp_front_center.custom_minimum_size = Vector2(0, 220)
	main_vbox.add_child(opp_front_center)
	opponent_front_row = HBoxContainer.new()
	opponent_front_row.add_theme_constant_override("separation", 10)
	opp_front_center.add_child(opponent_front_row)

	# --- Center Divider with Dice + End Turn ---
	var center_container := CenterContainer.new()
	center_container.custom_minimum_size = Vector2(0, 80)
	main_vbox.add_child(center_container)
	center_panel = HBoxContainer.new()
	center_panel.add_theme_constant_override("separation", 40)
	center_container.add_child(center_panel)

	# Dice display
	var dice_vbox := VBoxContainer.new()
	dice_vbox.add_theme_constant_override("separation", 4)
	center_panel.add_child(dice_vbox)

	dice_label = Label.new()
	dice_label.text = "Dice: -"
	dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_label.add_theme_font_size_override("font_size", 36)
	dice_label.add_theme_color_override("font_color", Color(1, 1, 0.6))
	dice_vbox.add_child(dice_label)

	dice_roll_button = Button.new()
	dice_roll_button.text = "Roll Dice"
	dice_roll_button.custom_minimum_size = Vector2(200, 60)
	dice_roll_button.add_theme_font_size_override("font_size", 24)
	dice_roll_button.pressed.connect(_on_dice_roll_pressed)
	dice_vbox.add_child(dice_roll_button)

	# End Turn button
	end_turn_button = Button.new()
	end_turn_button.text = "End Turn"
	end_turn_button.custom_minimum_size = Vector2(200, 80)
	end_turn_button.add_theme_font_size_override("font_size", 26)
	end_turn_button.pressed.connect(_on_end_turn_pressed)
	center_panel.add_child(end_turn_button)

	# --- Player Front Row (3 slots, centered) ---
	var pl_front_center := CenterContainer.new()
	pl_front_center.custom_minimum_size = Vector2(0, 220)
	main_vbox.add_child(pl_front_center)
	player_front_row = HBoxContainer.new()
	player_front_row.add_theme_constant_override("separation", 10)
	pl_front_center.add_child(player_front_row)

	# --- Player Back Row (2 slots, centered) ---
	var pl_back_center := CenterContainer.new()
	pl_back_center.custom_minimum_size = Vector2(0, 220)
	main_vbox.add_child(pl_back_center)
	player_back_row = HBoxContainer.new()
	player_back_row.add_theme_constant_override("separation", 20)
	pl_back_center.add_child(player_back_row)

	# --- Player HP ---
	player_hp_label = Label.new()
	player_hp_label.text = "PLAYER HP: 20"
	player_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	player_hp_label.add_theme_font_size_override("font_size", 28)
	player_hp_label.add_theme_color_override("font_color", Color(0.4, 0.8, 1))
	main_vbox.add_child(player_hp_label)

	# --- Player Hand Area ---
	var pl_hand_panel := PanelContainer.new()
	pl_hand_panel.custom_minimum_size = Vector2(0, 130)
	pl_hand_panel.size_flags_vertical = Control.SIZE_EXPAND_FILL
	var pl_hand_style := StyleBoxFlat.new()
	pl_hand_style.bg_color = Color(0.1, 0.1, 0.16)
	pl_hand_panel.add_theme_stylebox_override("panel", pl_hand_style)
	main_vbox.add_child(pl_hand_panel)

	player_hand_scroll = ScrollContainer.new()
	player_hand_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	player_hand_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	pl_hand_panel.add_child(player_hand_scroll)

	player_hand_container = HBoxContainer.new()
	player_hand_container.add_theme_constant_override("separation", 6)
	player_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	player_hand_scroll.add_child(player_hand_container)

	# --- Phase Label (overlay) ---
	phase_label = Label.new()
	phase_label.text = ""
	phase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	phase_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	phase_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	phase_label.offset_top = 460
	phase_label.add_theme_font_size_override("font_size", 40)
	phase_label.add_theme_color_override("font_color", Color(1, 1, 1, 0.9))
	phase_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	phase_label.z_index = 10
	add_child(phase_label)

	# --- Log Label (bottom overlay) ---
	log_label = Label.new()
	log_label.text = ""
	log_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	log_label.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	log_label.offset_bottom = -10
	log_label.offset_top = -60
	log_label.add_theme_font_size_override("font_size", 16)
	log_label.add_theme_color_override("font_color", Color(1, 1, 0.7, 0.8))
	log_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	log_label.z_index = 10
	log_label.autowrap_mode = TextServer.AUTOWRAP_WORD
	add_child(log_label)

	# --- Create Field Slots ---
	_create_field_slots()

	# --- Animation timer ---
	animation_timer = Timer.new()
	animation_timer.one_shot = true
	add_child(animation_timer)

func _create_field_slots() -> void:
	# Player front row: slots 0,1,2
	for i in range(3):
		var slot: FieldSlot = FieldSlotScene.instantiate()
		slot.slot_index = i
		slot.is_player_side = true
		player_front_row.add_child(slot)
		player_slots.append(slot)
		slot.slot_clicked.connect(_on_slot_clicked)

	# Player back row: slots 3,4
	for i in range(2):
		var slot: FieldSlot = FieldSlotScene.instantiate()
		slot.slot_index = 3 + i
		slot.is_player_side = true
		player_back_row.add_child(slot)
		player_slots.append(slot)
		slot.slot_clicked.connect(_on_slot_clicked)

	# Opponent front row: slots 0,1,2
	for i in range(3):
		var slot: FieldSlot = FieldSlotScene.instantiate()
		slot.slot_index = i
		slot.is_player_side = false
		opponent_front_row.add_child(slot)
		opponent_slots.append(slot)
		slot.slot_clicked.connect(_on_slot_clicked)

	# Opponent back row: slots 3,4
	for i in range(2):
		var slot: FieldSlot = FieldSlotScene.instantiate()
		slot.slot_index = 3 + i
		slot.is_player_side = false
		opponent_back_row.add_child(slot)
		opponent_slots.append(slot)
		slot.slot_clicked.connect(_on_slot_clicked)

	# Set up forward_slots for protection mapping
	# Player back slot 3 protected by front 0,1
	player_slots[3].forward_slots = [player_slots[0], player_slots[1]]
	# Player back slot 4 protected by front 1,2
	player_slots[4].forward_slots = [player_slots[1], player_slots[2]]

	# Opponent back slot 3 protected by front 0,1
	opponent_slots[3].forward_slots = [opponent_slots[0], opponent_slots[1]]
	# Opponent back slot 4 protected by front 1,2
	opponent_slots[4].forward_slots = [opponent_slots[1], opponent_slots[2]]

func _setup_game() -> void:
	# Set up player deck
	if GameManager.player_deck.size() > 0:
		player_deck = []
		for card_data in GameManager.player_deck:
			player_deck.append(card_data.duplicate_card())
		player_deck.shuffle()
	else:
		player_deck = CardDatabase.build_random_deck()

	# Build opponent deck
	opponent_deck = CardDatabase.build_random_deck()

	player_hp = 20
	opponent_hp = 20
	_update_hp_display()

func _start_battle() -> void:
	# Draw initial hands (5 cards each)
	for i in range(5):
		_draw_card_player()
		_draw_card_opponent()
	_update_hand_display()
	_update_opponent_hand_display()

	# Player goes first
	current_turn = Turn.PLAYER
	turn_number = 1
	_start_player_turn()

# ==============================================================================
# TURN FLOW
# ==============================================================================

func _start_player_turn() -> void:
	current_turn = Turn.PLAYER
	_add_log("--- Player Turn %d ---" % turn_number)

	# Passive effect 13: turn start heal 1 for player cards
	_apply_turn_start_passives(true)

	current_phase = Phase.DICE_ROLL
	_update_phase_display()
	_update_buttons()
	_clear_selection()

func _start_opponent_turn() -> void:
	current_turn = Turn.OPPONENT
	_add_log("--- Opponent Turn %d ---" % turn_number)

	# Passive effect 13: turn start heal 1 for opponent cards
	_apply_turn_start_passives(false)

	# AI handles everything
	await _ai_turn()

	turn_number += 1
	_start_player_turn()

func _apply_turn_start_passives(is_player: bool) -> void:
	var slots := player_slots if is_player else opponent_slots
	for slot in slots:
		if not slot.is_empty():
			var card_ui: CardUI = slot.card_ui
			if card_ui.card_data.effect_type == "passive" and card_ui.card_data.effect_id == 13:
				card_ui.heal(1)
				_spawn_heal_popup(card_ui, 1)
				_add_log("%s: HP1回復 (パッシブ)" % card_ui.card_data.card_name)

# ==============================================================================
# DICE ROLLING
# ==============================================================================

func _on_dice_roll_pressed() -> void:
	if current_phase != Phase.DICE_ROLL or current_turn != Turn.PLAYER:
		return
	is_animating = true
	_roll_dice()
	await _roll_dice_animated()
	current_phase = Phase.DRAW
	_update_phase_display()

	# Draw 2 cards
	_draw_card_player()
	_draw_card_player()
	_update_hand_display()
	_add_log("2枚ドロー")

	# After draw, go to main phase
	is_animating = false
	await get_tree().create_timer(0.3).timeout
	current_phase = Phase.MAIN
	_update_phase_display()
	_update_summonable_indicators()
	_update_attack_ready_indicators()
	_update_buttons()

func _roll_dice() -> int:
	current_dice = randi_range(1, 6)
	_add_log("ダイス: %d" % current_dice)
	return current_dice

func _roll_dice_animated() -> void:
	# Cycling animation before showing final result
	for i in range(8):
		var fake := randi_range(1, 6)
		dice_label.text = "Dice: %d" % fake
		dice_label.add_theme_font_size_override("font_size", 40)
		await get_tree().create_timer(0.06).timeout
	dice_label.text = "Dice: %d" % current_dice
	dice_label.add_theme_font_size_override("font_size", 36)
	# Brief scale punch on dice label
	var tween := create_tween()
	tween.tween_property(dice_label, "scale", Vector2(1.3, 1.3), 0.1)
	tween.tween_property(dice_label, "scale", Vector2(1.0, 1.0), 0.15)
	await tween.finished

# ==============================================================================
# MAIN PHASE - SUMMONING
# ==============================================================================

func _update_summonable_indicators() -> void:
	for card_ui in player_hand:
		var can_summon := _can_summon_card(card_ui, true)
		card_ui.set_summonable(can_summon)

func _can_summon_card(card_ui: CardUI, is_player: bool) -> bool:
	if current_dice in card_ui.card_data.summon_dice:
		var slots := player_slots if is_player else opponent_slots
		for slot in slots:
			if slot.is_empty():
				return true
	return false

func _update_attack_ready_indicators() -> void:
	for slot in player_slots:
		if not slot.is_empty():
			var card_ui: CardUI = slot.card_ui
			# Check if dice matches attack_dice (including bonus)
			var all_dice := card_ui.get_all_attack_dice()
			if current_dice in all_dice and not card_ui.is_attack_ready:
				card_ui.set_attack_ready(true)
				_add_log("%s: 攻撃可能!" % card_ui.card_data.card_name)
			# If already attack_ready from previous turn, keep it
			card_ui._update_display()

# ==============================================================================
# CARD INTERACTION - TAP & DRAG
# ==============================================================================

func _on_card_clicked(card_ui: CardUI) -> void:
	if current_turn != Turn.PLAYER or current_phase == Phase.DICE_ROLL or current_phase == Phase.GAME_OVER:
		return
	if is_animating:
		return

	if current_phase == Phase.MAIN:
		# Check if card is in hand (for summoning)
		if card_ui in player_hand:
			_handle_hand_card_tap(card_ui)
			return
		# Check if card is on field (for attacking)
		var slot := _find_slot_for_card(card_ui, true)
		if slot != null and card_ui.is_attack_ready:
			_handle_field_card_tap(card_ui, slot)
			return

	elif current_phase == Phase.ATTACK_TARGET:
		# Cancel selection if tapping same card
		if selected_attacker != null and selected_attacker.card_ui == card_ui:
			_clear_selection()
			current_phase = Phase.MAIN
			_update_phase_display()
			return

func _handle_hand_card_tap(card_ui: CardUI) -> void:
	if not card_ui.is_summonable:
		return

	if selected_hand_card == card_ui:
		# Deselect
		card_ui.set_selected(false)
		selected_hand_card = null
		return

	# Select this card
	if selected_hand_card != null:
		selected_hand_card.set_selected(false)
	if selected_attacker != null:
		selected_attacker.card_ui.set_selected(false)
		selected_attacker = null

	card_ui.set_selected(true)
	selected_hand_card = card_ui

func _handle_field_card_tap(card_ui: CardUI, slot: FieldSlot) -> void:
	if selected_hand_card != null:
		selected_hand_card.set_selected(false)
		selected_hand_card = null

	if selected_attacker != null:
		selected_attacker.card_ui.set_selected(false)

	card_ui.set_selected(true)
	selected_attacker = slot
	current_phase = Phase.ATTACK_TARGET
	_update_phase_display()

func _on_card_drag_ended(card_ui: CardUI, target_position: Vector2) -> void:
	if current_turn != Turn.PLAYER or is_animating:
		card_ui.reset_position()
		return

	if current_phase == Phase.MAIN or current_phase == Phase.ATTACK_TARGET:
		# Check if card from hand is dragged onto an empty player slot
		if card_ui in player_hand and card_ui.is_summonable:
			var target_slot := _find_slot_at_position(target_position, true)
			if target_slot != null and target_slot.is_empty() and target_slot.is_player_side:
				_summon_card_to_slot(card_ui, target_slot)
				return

		# Check if field card dragged onto enemy slot or enemy area (attack)
		var attacker_slot := _find_slot_for_card(card_ui, true)
		if attacker_slot != null and card_ui.is_attack_ready:
			# Try to find target
			var target_slot := _find_slot_at_position(target_position, false)
			if target_slot != null:
				if not target_slot.is_empty() and not target_slot.is_player_side:
					if not target_slot.is_protected():
						_execute_attack(attacker_slot, target_slot, null)
						return
			# Check if dragged to opponent HP area
			if _is_position_in_opponent_hp_area(target_position):
				if _can_attack_player(false):
					_execute_attack(attacker_slot, null, null)
					return

	card_ui.reset_position()

func _on_slot_clicked(slot: FieldSlot) -> void:
	if current_turn != Turn.PLAYER or is_animating:
		return

	if current_phase == Phase.MAIN:
		# If we have a hand card selected and slot is empty player slot
		if selected_hand_card != null and slot.is_empty() and slot.is_player_side:
			_summon_card_to_slot(selected_hand_card, slot)
			return

	if current_phase == Phase.ATTACK_TARGET:
		if selected_attacker != null:
			# Clicking an enemy slot
			if not slot.is_player_side:
				if not slot.is_empty() and not slot.is_protected():
					_execute_attack(selected_attacker, slot, null)
					return
				elif slot.is_empty():
					# Maybe they're trying to attack through? Ignore
					pass
			# Clicking own slot = cancel
			if slot.is_player_side:
				_clear_selection()
				current_phase = Phase.MAIN
				_update_phase_display()
				return

	# Click on opponent HP label area for direct attack
	# (handled separately via the HP label click)

func _on_opponent_hp_clicked(_event: InputEvent) -> void:
	if not (_event is InputEventMouseButton or _event is InputEventScreenTouch):
		return
	if _event is InputEventMouseButton and not _event.pressed:
		return
	if _event is InputEventScreenTouch and not _event.pressed:
		return

	if current_phase == Phase.ATTACK_TARGET and selected_attacker != null:
		if _can_attack_player(false):
			_execute_attack(selected_attacker, null, null)

func _on_player_hp_clicked(_event: InputEvent) -> void:
	# For opponent AI: not used directly
	pass

# ==============================================================================
# SUMMONING
# ==============================================================================

func _summon_card_to_slot(card_ui: CardUI, slot: FieldSlot) -> void:
	if not slot.is_empty():
		card_ui.reset_position()
		return
	if not (current_dice in card_ui.card_data.summon_dice):
		card_ui.reset_position()
		return

	var is_player := card_ui in player_hand

	# Remove from hand
	if is_player:
		player_hand.erase(card_ui)
	else:
		opponent_hand.erase(card_ui)

	# Remove from parent container
	if card_ui.get_parent():
		card_ui.get_parent().remove_child(card_ui)

	# Set face up
	card_ui.set_face_down(false)

	# Place in slot
	slot.place_card(card_ui)
	_add_log("%s を召喚!" % card_ui.card_data.card_name)

	# Apply on_summon effects
	_apply_on_summon(card_ui, slot)

	# Auto_trigger effect 16: opponent has card that deals 1 dmg to summoned card
	var enemy_slots := opponent_slots if is_player else player_slots
	for eslot in enemy_slots:
		if not eslot.is_empty():
			var ec: CardUI = eslot.card_ui
			if ec.card_data.effect_type == "auto_trigger" and ec.card_data.effect_id == 16:
				var remaining := card_ui.take_damage(1)
				card_ui.play_damage_flash()
				_spawn_damage_popup(card_ui, 1)
				_add_log("%s: 相手召喚に反応し1ダメージ!" % ec.card_data.card_name)
				if remaining <= 0:
					await _destroy_card(slot, is_player, null)
					# Update displays
					if is_player:
						_update_hand_display()
					else:
						_update_opponent_hand_display()
					_update_summonable_indicators()
					return

	# Clear selection
	selected_hand_card = null
	card_ui.set_selected(false)
	card_ui.set_summonable(false)

	# Refresh displays
	if is_player:
		_update_hand_display()
		_update_summonable_indicators()
		_update_attack_ready_indicators()
	else:
		_update_opponent_hand_display()

# ==============================================================================
# ATTACK EXECUTION
# ==============================================================================

func _execute_attack(attacker_slot: FieldSlot, target_slot: FieldSlot, _extra) -> void:
	var attacker_card: CardUI = attacker_slot.card_ui
	if attacker_card == null or not attacker_card.is_attack_ready:
		_clear_selection()
		current_phase = Phase.MAIN
		_update_phase_display()
		return

	var is_player_attacking := attacker_slot.is_player_side
	is_animating = true

	# Consume attack ready
	attacker_card.set_attack_ready(false)
	attacker_card.set_selected(false)

	# Passive effect 14: on attack draw 1
	if attacker_card.card_data.effect_type == "passive" and attacker_card.card_data.effect_id == 14:
		if is_player_attacking:
			_draw_card_player()
			_update_hand_display()
		else:
			_draw_card_opponent()
			_update_opponent_hand_display()
		_add_log("%s: 攻撃時1枚ドロー!" % attacker_card.card_data.card_name)

	if target_slot == null:
		# Direct attack on player/opponent
		var atk := _get_effective_atk(attacker_card, attacker_slot)
		if is_player_attacking:
			opponent_hp -= atk
			_add_log("%s がプレイヤーに%dダメージ!" % [attacker_card.card_data.card_name, atk])
			_spawn_hp_damage_popup(false, atk)
		else:
			player_hp -= atk
			_add_log("%s がプレイヤーに%dダメージ!" % [attacker_card.card_data.card_name, atk])
			_spawn_hp_damage_popup(true, atk)
		_update_hp_display()
		await _check_game_over()
	else:
		# Battle with another card
		var defender_card: CardUI = target_slot.card_ui
		if defender_card == null:
			is_animating = false
			_clear_selection()
			current_phase = Phase.MAIN
			_update_phase_display()
			return

		var atk_atk := _get_effective_atk(attacker_card, attacker_slot)
		var def_atk := _get_effective_atk(defender_card, target_slot)

		_add_log("%s (ATK:%d) vs %s (ATK:%d)" % [
			attacker_card.card_data.card_name, atk_atk,
			defender_card.card_data.card_name, def_atk
		])

		# Apply damage reduction (passive 12)
		var atk_damage_to_def := atk_atk
		var def_damage_to_atk := def_atk

		if defender_card.card_data.effect_type == "passive" and defender_card.card_data.effect_id == 12:
			atk_damage_to_def = maxi(atk_damage_to_def - 1, 1)
		if attacker_card.card_data.effect_type == "passive" and attacker_card.card_data.effect_id == 12:
			def_damage_to_atk = maxi(def_damage_to_atk - 1, 1)

		# Auto trigger 18: when attacked, deal 1 extra damage back
		if defender_card.card_data.effect_type == "auto_trigger" and defender_card.card_data.effect_id == 18:
			def_damage_to_atk += 1
			_add_log("%s: 被攻撃時+1反撃!" % defender_card.card_data.card_name)

		# Apply mutual damage
		var atk_remaining := attacker_card.take_damage(def_damage_to_atk)
		var def_remaining := defender_card.take_damage(atk_damage_to_def)
		attacker_card.play_damage_flash()
		defender_card.play_damage_flash()
		_spawn_damage_popup(attacker_card, def_damage_to_atk)
		_spawn_damage_popup(defender_card, atk_damage_to_def)

		_add_log("  -> %s HP: %d, %s HP: %d" % [
			attacker_card.card_data.card_name, atk_remaining,
			defender_card.card_data.card_name, def_remaining
		])

		await get_tree().create_timer(0.3).timeout

		# Check destruction (defender first, then attacker)
		if def_remaining <= 0:
			await _destroy_card(target_slot, not is_player_attacking, attacker_slot)
		if atk_remaining <= 0:
			await _destroy_card(attacker_slot, is_player_attacking, target_slot)

	is_animating = false
	_clear_selection()

	if current_phase != Phase.GAME_OVER:
		current_phase = Phase.MAIN
		_update_phase_display()
		if is_player_attacking:
			_update_summonable_indicators()

func _get_effective_atk(card_ui: CardUI, slot: FieldSlot) -> int:
	var base_atk := card_ui.current_atk
	# Passive 11: adjacent allies ATK+1
	# Passive 15: adjacent enemies ATK-1 (min 0)
	var adj_slots := _get_adjacent_slots(slot)
	for adj_slot in adj_slots:
		if not adj_slot.is_empty():
			var adj_card: CardUI = adj_slot.card_ui
			# Allied passive 11
			if adj_card.card_data.effect_type == "passive" and adj_card.card_data.effect_id == 11:
				if adj_slot.is_player_side == slot.is_player_side:
					base_atk += 1
	# Check enemy adjacent for passive 15
	var enemy_slots := opponent_slots if slot.is_player_side else player_slots
	for eslot in enemy_slots:
		if not eslot.is_empty():
			var ec: CardUI = eslot.card_ui
			if ec.card_data.effect_type == "passive" and ec.card_data.effect_id == 15:
				# Check if this enemy card is adjacent to the card being calculated
				# "Adjacent enemy" means in adjacent slot positions
				var ec_adj := _get_adjacent_slots(eslot)
				# For cross-side adjacency: front-row cards face each other
				# We use a simpler mapping: front slots face each other directly
				if _are_facing(slot, eslot):
					base_atk = maxi(base_atk - 1, 0)
	return base_atk

func _are_facing(slot_a: FieldSlot, slot_b: FieldSlot) -> bool:
	# Two slots from different sides "face" each other if they're in similar positions
	if slot_a.is_player_side == slot_b.is_player_side:
		return false
	# Front row cards face front row cards in same column
	if slot_a.slot_index < 3 and slot_b.slot_index < 3:
		return slot_a.slot_index == slot_b.slot_index
	return false

# ==============================================================================
# DESTRUCTION & EFFECTS
# ==============================================================================

func _destroy_card(slot: FieldSlot, is_player_card: bool, killer_slot: FieldSlot) -> void:
	var card_ui: CardUI = slot.card_ui
	if card_ui == null:
		return

	_add_log("%s 破壊!" % card_ui.card_data.card_name)

	# Auto trigger 17: adjacent ally destroyed -> self ATK+1
	var adj_slots := _get_adjacent_slots(slot)
	for adj in adj_slots:
		if not adj.is_empty() and adj.is_player_side == slot.is_player_side:
			var adj_card: CardUI = adj.card_ui
			if adj_card.card_data.effect_type == "auto_trigger" and adj_card.card_data.effect_id == 17:
				adj_card.current_atk += 1
				adj_card._update_display()
				_add_log("%s: 隣接味方破壊でATK+1!" % adj_card.card_data.card_name)

	# Apply on_destroy effects
	_apply_on_destroy(card_ui, slot, is_player_card, killer_slot)

	# Play destruction animation then remove
	await card_ui.play_destroy_animation()

	slot.remove_card()
	if card_ui.get_parent():
		card_ui.get_parent().remove_child(card_ui)

	if is_player_card:
		player_trash.append(card_ui.card_data)
	else:
		opponent_trash.append(card_ui.card_data)

	card_ui.queue_free()

func _apply_on_summon(card_ui: CardUI, slot: FieldSlot) -> void:
	var eid := card_ui.card_data.effect_id
	if card_ui.card_data.effect_type != "on_summon":
		return

	var is_player := slot.is_player_side
	var enemy_slots := opponent_slots if is_player else player_slots
	var ally_slots := player_slots if is_player else opponent_slots

	match eid:
		1:  # 1 dmg random enemy
			var targets := _get_non_empty_slots(enemy_slots)
			if targets.size() > 0:
				var target: FieldSlot = targets[randi() % targets.size()]
				var tcard: CardUI = target.card_ui
				var remaining := tcard.take_damage(1)
				tcard.play_damage_flash()
				_spawn_damage_popup(tcard, 1)
				_add_log("効果: %sに1ダメージ!" % tcard.card_data.card_name)
				if remaining <= 0:
					await _destroy_card(target, not is_player, slot)

		2:  # Draw 1
			if is_player:
				_draw_card_player()
				_update_hand_display()
			else:
				_draw_card_opponent()
				_update_opponent_hand_display()
			_add_log("効果: 1枚ドロー!")

		3:  # Adjacent ally ATK+1 permanent
			var adj := _get_adjacent_slots(slot)
			for a in adj:
				if not a.is_empty() and a.is_player_side == is_player:
					var ac: CardUI = a.card_ui
					ac.current_atk += 1
					ac._update_display()
					_add_log("効果: %s ATK+1!" % ac.card_data.card_name)

		4:  # 2 dmg lowest HP enemy
			var targets := _get_non_empty_slots(enemy_slots)
			if targets.size() > 0:
				var lowest: FieldSlot = targets[0]
				for t in targets:
					if (t.card_ui as CardUI).current_hp < (lowest.card_ui as CardUI).current_hp:
						lowest = t
				var tcard: CardUI = lowest.card_ui
				var remaining := tcard.take_damage(2)
				tcard.play_damage_flash()
				_spawn_damage_popup(tcard, 2)
				_add_log("効果: %sに2ダメージ!" % tcard.card_data.card_name)
				if remaining <= 0:
					await _destroy_card(lowest, not is_player, slot)

		5:  # Adjacent ally +1 attack die
			var adj := _get_adjacent_slots(slot)
			for a in adj:
				if not a.is_empty() and a.is_player_side == is_player:
					var ac: CardUI = a.card_ui
					# Add a bonus attack die (next unused number)
					var existing := ac.get_all_attack_dice()
					for d in range(1, 7):
						if d not in existing:
							ac.bonus_attack_dice.append(d)
							ac._update_display()
							_add_log("効果: %s 攻撃ダイス+[%d]!" % [ac.card_data.card_name, d])
							break

func _apply_on_destroy(card_ui: CardUI, slot: FieldSlot, is_player_card: bool, killer_slot: FieldSlot) -> void:
	var eid := card_ui.card_data.effect_id
	if card_ui.card_data.effect_type != "on_destroy":
		return

	var is_player := is_player_card
	var enemy_slots := opponent_slots if is_player else player_slots

	match eid:
		6:  # Draw 1
			if is_player:
				_draw_card_player()
				_update_hand_display()
			else:
				_draw_card_opponent()
				_update_opponent_hand_display()
			_add_log("破壊効果: 1枚ドロー!")

		7:  # 2 dmg to destroyer
			if killer_slot != null and not killer_slot.is_empty():
				var kcard: CardUI = killer_slot.card_ui
				var remaining := kcard.take_damage(2)
				kcard.play_damage_flash()
				_spawn_damage_popup(kcard, 2)
				_add_log("破壊効果: %sに2ダメージ!" % kcard.card_data.card_name)
				if remaining <= 0:
					await _destroy_card(killer_slot, not is_player, null)

		8:  # 1 dmg all enemies
			var targets := _get_non_empty_slots(enemy_slots)
			var to_destroy: Array = []
			for t in targets:
				var tc: CardUI = t.card_ui
				var remaining := tc.take_damage(1)
				tc.play_damage_flash()
				_spawn_damage_popup(tc, 1)
				_add_log("破壊効果: %sに1ダメージ!" % tc.card_data.card_name)
				if remaining <= 0:
					to_destroy.append(t)
			for t in to_destroy:
				await _destroy_card(t, not is_player, null)

		9:  # Recover random from trash
			var trash := player_trash if is_player else opponent_trash
			if trash.size() > 0:
				var idx := randi() % trash.size()
				var recovered: CardData = trash[idx]
				trash.remove_at(idx)
				var new_card_ui: CardUI = CardUIScene.instantiate()
				new_card_ui.setup(recovered)
				if is_player:
					player_hand.append(new_card_ui)
					_update_hand_display()
				else:
					new_card_ui.set_face_down(true)
					opponent_hand.append(new_card_ui)
					_update_opponent_hand_display()
				_add_log("破壊効果: %sを回収!" % recovered.card_name)

		10:  # Adjacent allies HP+2
			var adj := _get_adjacent_slots(slot)
			for a in adj:
				if not a.is_empty() and a.is_player_side == is_player:
					var ac: CardUI = a.card_ui
					ac.heal(2)
					_spawn_heal_popup(ac, 2)
					_add_log("破壊効果: %s HP+2!" % ac.card_data.card_name)

# ==============================================================================
# DIRECT ATTACK PROTECTION CHECK
# ==============================================================================

func _can_attack_player(is_player_target: bool) -> bool:
	# Player is protected by back slots 3 AND 4 both occupied
	var slots := player_slots if is_player_target else opponent_slots
	# Check if both back slots have cards
	if not slots[3].is_empty() and not slots[4].is_empty():
		return false
	# Also check if any front-row cards are unprotected (all must be gone or back must be open)
	# Actually the rule is: player is protected by back slots 3 AND 4 both occupied
	# So if either back slot is empty, player can be attacked
	return true

# ==============================================================================
# END TURN
# ==============================================================================

func _on_end_turn_pressed() -> void:
	if current_turn != Turn.PLAYER:
		return
	if current_phase == Phase.DICE_ROLL:
		return
	if current_phase == Phase.GAME_OVER:
		return

	_clear_selection()
	current_phase = Phase.END_TURN
	_update_phase_display()

	# Start opponent turn
	await get_tree().create_timer(0.3).timeout
	_start_opponent_turn()

# ==============================================================================
# NPC AI
# ==============================================================================

func _ai_turn() -> void:
	# Roll dice with animation
	_roll_dice()
	await _roll_dice_animated()

	# Draw 2 cards
	_draw_card_opponent()
	_draw_card_opponent()
	_update_opponent_hand_display()
	_add_log("相手: 2枚ドロー")
	await get_tree().create_timer(0.3).timeout

	# Set attack ready for opponent cards
	_ai_set_attack_ready()

	# Main phase: summon and attack in priority order
	# Can interleave summoning and attacking

	var actions_taken := true
	while actions_taken:
		actions_taken = false

		# Priority 1: Attack player if possible
		if await _ai_try_attack_player():
			actions_taken = true
			if current_phase == Phase.GAME_OVER:
				return
			await get_tree().create_timer(0.4).timeout
			continue

		# Priority 2: Kill enemy card
		if await _ai_try_kill_card():
			actions_taken = true
			if current_phase == Phase.GAME_OVER:
				return
			await get_tree().create_timer(0.4).timeout
			continue

		# Priority 3: Best trade efficiency
		if await _ai_try_trade():
			actions_taken = true
			if current_phase == Phase.GAME_OVER:
				return
			await get_tree().create_timer(0.4).timeout
			continue

		# Priority 4: Summon to front row first
		if _ai_try_summon_front():
			actions_taken = true
			await get_tree().create_timer(0.4).timeout
			# After summon, check if new attack ready
			_ai_set_attack_ready()
			continue

		# Priority 5: Summon to back row
		if _ai_try_summon_back():
			actions_taken = true
			await get_tree().create_timer(0.4).timeout
			_ai_set_attack_ready()
			continue

		# Priority 6: End turn (break the loop)

	_add_log("相手: ターン終了")
	await get_tree().create_timer(0.5).timeout

func _ai_set_attack_ready() -> void:
	for slot in opponent_slots:
		if not slot.is_empty():
			var card_ui: CardUI = slot.card_ui
			var all_dice := card_ui.get_all_attack_dice()
			if current_dice in all_dice and not card_ui.is_attack_ready:
				card_ui.set_attack_ready(true)

func _ai_try_attack_player() -> bool:
	if not _can_attack_player(true):
		return false
	var attackers := _get_attack_ready_slots(opponent_slots)
	if attackers.size() == 0:
		return false
	# Pick random attacker
	var slot: FieldSlot = attackers[randi() % attackers.size()]
	var card_ui: CardUI = slot.card_ui
	var atk := _get_effective_atk(card_ui, slot)
	card_ui.set_attack_ready(false)

	# Passive 14: on attack draw 1
	if card_ui.card_data.effect_type == "passive" and card_ui.card_data.effect_id == 14:
		_draw_card_opponent()
		_update_opponent_hand_display()
		_add_log("%s: 攻撃時1枚ドロー!" % card_ui.card_data.card_name)

	player_hp -= atk
	_add_log("相手 %s がプレイヤーに%dダメージ!" % [card_ui.card_data.card_name, atk])
	_spawn_hp_damage_popup(true, atk)
	_update_hp_display()
	await _check_game_over()
	return true

func _ai_try_kill_card() -> bool:
	var attackers := _get_attack_ready_slots(opponent_slots)
	if attackers.size() == 0:
		return false

	# Find enemy cards that can be killed
	var targets := _get_attackable_targets(player_slots)
	if targets.size() == 0:
		return false

	for aslot in attackers:
		var atk := _get_effective_atk(aslot.card_ui, aslot)
		for tslot in targets:
			var tcard: CardUI = tslot.card_ui
			if tcard.current_hp <= atk:
				# Can kill this target
				_add_log("相手AI: %sで%sを倒す!" % [aslot.card_ui.card_data.card_name, tcard.card_data.card_name])
				_execute_ai_attack(aslot, tslot)
				return true
	return false

func _ai_try_trade() -> bool:
	var attackers := _get_attack_ready_slots(opponent_slots)
	if attackers.size() == 0:
		return false

	var targets := _get_attackable_targets(player_slots)
	if targets.size() == 0:
		return false

	# Pick the attack with best efficiency (most damage relative to own loss)
	var best_score: float = -999.0
	var best_attacker: FieldSlot = null
	var best_target: FieldSlot = null

	for aslot in attackers:
		var acard: CardUI = aslot.card_ui
		var atk := _get_effective_atk(acard, aslot)
		for tslot in targets:
			var tcard: CardUI = tslot.card_ui
			var def_atk := _get_effective_atk(tcard, tslot)
			# Score: damage dealt - damage taken
			var score: float = float(atk) - float(def_atk) * 0.8
			if score > best_score:
				best_score = score
				best_attacker = aslot
				best_target = tslot

	if best_attacker != null and best_target != null:
		_execute_ai_attack(best_attacker, best_target)
		return true
	return false

func _ai_try_summon_front() -> bool:
	# Find summonable cards and empty front-row slots
	var summonable := _get_ai_summonable_cards()
	if summonable.size() == 0:
		return false

	for i in range(3):  # Front row slots 0,1,2
		if opponent_slots[i].is_empty():
			var card_ui: CardUI = summonable[0]
			card_ui.set_face_down(false)
			_summon_card_to_slot(card_ui, opponent_slots[i])
			return true
	return false

func _ai_try_summon_back() -> bool:
	var summonable := _get_ai_summonable_cards()
	if summonable.size() == 0:
		return false

	for i in [3, 4]:  # Back row slots
		if opponent_slots[i].is_empty():
			var card_ui: CardUI = summonable[0]
			card_ui.set_face_down(false)
			_summon_card_to_slot(card_ui, opponent_slots[i])
			return true
	return false

func _get_ai_summonable_cards() -> Array:
	var result := []
	for card_ui in opponent_hand:
		if current_dice in card_ui.card_data.summon_dice:
			result.append(card_ui)
	return result

func _execute_ai_attack(attacker_slot: FieldSlot, target_slot: FieldSlot) -> void:
	var attacker_card: CardUI = attacker_slot.card_ui
	attacker_card.set_attack_ready(false)

	# Passive 14: on attack draw 1
	if attacker_card.card_data.effect_type == "passive" and attacker_card.card_data.effect_id == 14:
		_draw_card_opponent()
		_update_opponent_hand_display()
		_add_log("%s: 攻撃時1枚ドロー!" % attacker_card.card_data.card_name)

	var atk_atk := _get_effective_atk(attacker_card, attacker_slot)
	var defender_card: CardUI = target_slot.card_ui
	var def_atk := _get_effective_atk(defender_card, target_slot)

	_add_log("相手 %s (ATK:%d) vs %s (ATK:%d)" % [
		attacker_card.card_data.card_name, atk_atk,
		defender_card.card_data.card_name, def_atk
	])

	# Damage reduction passive 12
	var atk_damage_to_def := atk_atk
	var def_damage_to_atk := def_atk

	if defender_card.card_data.effect_type == "passive" and defender_card.card_data.effect_id == 12:
		atk_damage_to_def = maxi(atk_damage_to_def - 1, 1)
	if attacker_card.card_data.effect_type == "passive" and attacker_card.card_data.effect_id == 12:
		def_damage_to_atk = maxi(def_damage_to_atk - 1, 1)

	# Auto trigger 18: when attacked, deal 1 extra damage back
	if defender_card.card_data.effect_type == "auto_trigger" and defender_card.card_data.effect_id == 18:
		def_damage_to_atk += 1
		_add_log("%s: 被攻撃時+1反撃!" % defender_card.card_data.card_name)

	# Apply mutual damage
	var atk_remaining := attacker_card.take_damage(def_damage_to_atk)
	var def_remaining := defender_card.take_damage(atk_damage_to_def)
	attacker_card.play_damage_flash()
	defender_card.play_damage_flash()
	_spawn_damage_popup(attacker_card, def_damage_to_atk)
	_spawn_damage_popup(defender_card, atk_damage_to_def)
	await get_tree().create_timer(0.3).timeout

	# Check destruction
	if def_remaining <= 0:
		await _destroy_card(target_slot, true, attacker_slot)
	if atk_remaining <= 0:
		await _destroy_card(attacker_slot, false, target_slot)

func _get_attack_ready_slots(slots: Array) -> Array:
	var result := []
	for slot in slots:
		if not slot.is_empty() and (slot.card_ui as CardUI).is_attack_ready:
			result.append(slot)
	return result

func _get_attackable_targets(slots: Array) -> Array:
	var result := []
	for slot in slots:
		if not slot.is_empty() and not slot.is_protected():
			result.append(slot)
	return result

# ==============================================================================
# DRAWING CARDS
# ==============================================================================

func _draw_card_player() -> void:
	if player_deck.size() == 0:
		_add_log("デッキが空です!")
		return
	var card_data: CardData = player_deck.pop_front()
	var card_ui: CardUI = CardUIScene.instantiate()
	player_hand.append(card_ui)
	player_hand_container.add_child(card_ui)
	card_ui.setup(card_data)
	card_ui.card_clicked.connect(_on_card_clicked)
	card_ui.card_drag_ended.connect(_on_card_drag_ended)

func _draw_card_opponent() -> void:
	if opponent_deck.size() == 0:
		_add_log("相手デッキが空です!")
		return
	var card_data: CardData = opponent_deck.pop_front()
	var card_ui: CardUI = CardUIScene.instantiate()
	card_ui.setup(card_data)
	card_ui.set_face_down(true)
	opponent_hand.append(card_ui)
	opponent_hand_container.add_child(card_ui)

# ==============================================================================
# HAND DISPLAY
# ==============================================================================

func _update_hand_display() -> void:
	# Ensure all hand cards are children of the container
	for card_ui in player_hand:
		if card_ui.get_parent() != player_hand_container:
			if card_ui.get_parent():
				card_ui.get_parent().remove_child(card_ui)
			player_hand_container.add_child(card_ui)
		# Reconnect signals if needed
		if not card_ui.card_clicked.is_connected(_on_card_clicked):
			card_ui.card_clicked.connect(_on_card_clicked)
		if not card_ui.card_drag_ended.is_connected(_on_card_drag_ended):
			card_ui.card_drag_ended.connect(_on_card_drag_ended)

func _update_opponent_hand_display() -> void:
	for card_ui in opponent_hand:
		if card_ui.get_parent() != opponent_hand_container:
			if card_ui.get_parent():
				card_ui.get_parent().remove_child(card_ui)
			opponent_hand_container.add_child(card_ui)
		card_ui.set_face_down(true)

# ==============================================================================
# HP DISPLAY
# ==============================================================================

func _update_hp_display() -> void:
	player_hp_label.text = "PLAYER HP: %d" % player_hp
	opponent_hp_label.text = "OPPONENT HP: %d" % opponent_hp

	# Color changes
	if player_hp <= 5:
		player_hp_label.add_theme_color_override("font_color", Color(1, 0.2, 0.2))
	elif player_hp <= 10:
		player_hp_label.add_theme_color_override("font_color", Color(1, 0.6, 0.3))
	else:
		player_hp_label.add_theme_color_override("font_color", Color(0.4, 0.8, 1))

	if opponent_hp <= 5:
		opponent_hp_label.add_theme_color_override("font_color", Color(1, 0.2, 0.2))
	elif opponent_hp <= 10:
		opponent_hp_label.add_theme_color_override("font_color", Color(1, 0.6, 0.3))
	else:
		opponent_hp_label.add_theme_color_override("font_color", Color(1, 0.4, 0.4))

# ==============================================================================
# PHASE DISPLAY & BUTTONS
# ==============================================================================

func _update_phase_display() -> void:
	match current_phase:
		Phase.DICE_ROLL:
			phase_label.text = "DICE ROLL"
		Phase.DRAW:
			phase_label.text = "DRAW"
		Phase.MAIN:
			if selected_hand_card != null:
				phase_label.text = "SUMMON: スロットを選択"
			elif selected_attacker != null:
				phase_label.text = "TARGET: 攻撃先を選択"
			else:
				phase_label.text = "MAIN PHASE"
		Phase.ATTACK_TARGET:
			phase_label.text = "TARGET: 攻撃先を選択"
		Phase.END_TURN:
			phase_label.text = "END TURN"
		Phase.GAME_OVER:
			phase_label.text = "GAME OVER"

	if current_turn == Turn.OPPONENT and current_phase != Phase.GAME_OVER:
		phase_label.text = "OPPONENT TURN"

func _update_buttons() -> void:
	dice_roll_button.visible = (current_phase == Phase.DICE_ROLL and current_turn == Turn.PLAYER)
	end_turn_button.disabled = (current_phase == Phase.DICE_ROLL or current_turn != Turn.PLAYER or current_phase == Phase.GAME_OVER)

# ==============================================================================
# SELECTION
# ==============================================================================

func _clear_selection() -> void:
	if selected_hand_card != null:
		selected_hand_card.set_selected(false)
		selected_hand_card = null
	if selected_attacker != null and not selected_attacker.is_empty():
		(selected_attacker.card_ui as CardUI).set_selected(false)
	selected_attacker = null

# ==============================================================================
# GAME OVER
# ==============================================================================

func _check_game_over() -> void:
	if player_hp <= 0:
		current_phase = Phase.GAME_OVER
		_update_phase_display()
		_add_log("GAME OVER - 敗北...")
		GameManager.battle_result = "lose"
		await get_tree().create_timer(2.0).timeout
		_show_result("DEFEAT")
	elif opponent_hp <= 0:
		current_phase = Phase.GAME_OVER
		_update_phase_display()
		_add_log("GAME OVER - 勝利!")
		GameManager.battle_result = "win"
		await get_tree().create_timer(2.0).timeout
		_show_result("VICTORY")

func _show_result(text: String) -> void:
	var overlay := ColorRect.new()
	overlay.color = Color(0, 0, 0, 0.7)
	overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	overlay.z_index = 100
	add_child(overlay)

	var result_vbox := VBoxContainer.new()
	result_vbox.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	result_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	result_vbox.z_index = 101
	overlay.add_child(result_vbox)

	var result_label := Label.new()
	result_label.text = text
	result_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_label.add_theme_font_size_override("font_size", 64)
	if text == "VICTORY":
		result_label.add_theme_color_override("font_color", Color(1, 0.85, 0.2))
	else:
		result_label.add_theme_color_override("font_color", Color(0.8, 0.2, 0.2))
	result_vbox.add_child(result_label)

	var hp_info := Label.new()
	hp_info.text = "Player HP: %d | Opponent HP: %d" % [player_hp, opponent_hp]
	hp_info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hp_info.add_theme_font_size_override("font_size", 24)
	result_vbox.add_child(hp_info)

	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 30)
	result_vbox.add_child(spacer)

	var retry_button := Button.new()
	retry_button.text = "Retry"
	retry_button.custom_minimum_size = Vector2(200, 60)
	retry_button.add_theme_font_size_override("font_size", 28)
	retry_button.pressed.connect(func(): GameManager.change_scene("res://scenes/battle/battle.tscn"))
	result_vbox.add_child(retry_button)

# ==============================================================================
# UTILITY FUNCTIONS
# ==============================================================================

func _get_adjacent_slots(slot: FieldSlot) -> Array:
	var slots := player_slots if slot.is_player_side else opponent_slots
	var result := []
	var idx := slot.slot_index

	if idx < 3:
		# Front row: adjacent front slots
		if idx > 0:
			result.append(slots[idx - 1])
		if idx < 2:
			result.append(slots[idx + 1])
		# Also adjacent to back row slots
		# Front 0 adjacent to Back 3
		# Front 1 adjacent to Back 3 and Back 4
		# Front 2 adjacent to Back 4
		if idx == 0 or idx == 1:
			result.append(slots[3])
		if idx == 1 or idx == 2:
			result.append(slots[4])
	else:
		# Back row
		# Back 3 adjacent to Front 0, 1 and Back 4
		# Back 4 adjacent to Front 1, 2 and Back 3
		if idx == 3:
			result.append(slots[0])
			result.append(slots[1])
			result.append(slots[4])
		elif idx == 4:
			result.append(slots[1])
			result.append(slots[2])
			result.append(slots[3])
	return result

func _get_non_empty_slots(slots: Array) -> Array:
	var result := []
	for slot in slots:
		if not slot.is_empty():
			result.append(slot)
	return result

func _find_slot_for_card(card_ui: CardUI, is_player: bool) -> FieldSlot:
	var slots := player_slots if is_player else opponent_slots
	for slot in slots:
		if slot.card_ui == card_ui:
			return slot
	return null

func _find_slot_at_position(pos: Vector2, player_side: bool) -> FieldSlot:
	var slots := player_slots if player_side else opponent_slots
	for slot in slots:
		var rect := Rect2(slot.global_position, slot.size)
		if rect.has_point(pos):
			return slot
	# If not exact hit, find closest slot within reasonable distance
	var closest: FieldSlot = null
	var closest_dist := 200.0  # Max distance to snap
	for slot in slots:
		var center: Vector2 = slot.global_position + slot.size / 2
		var dist := pos.distance_to(center)
		if dist < closest_dist:
			closest_dist = dist
			closest = slot
	return closest

func _is_position_in_opponent_hp_area(pos: Vector2) -> bool:
	var rect := Rect2(opponent_hp_label.global_position, opponent_hp_label.size)
	# Expand the area a bit for easier targeting
	rect = rect.grow(50)
	return rect.has_point(pos)

func _spawn_damage_popup(node: Control, amount: int) -> void:
	var popup := Label.new()
	popup.text = "-%d" % amount
	popup.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	popup.add_theme_font_size_override("font_size", 32)
	popup.add_theme_color_override("font_color", Color(1, 0.2, 0.2))
	popup.z_index = 50
	popup.mouse_filter = Control.MOUSE_FILTER_IGNORE
	popup.position = Vector2(node.size.x / 2 - 20, -10)
	node.add_child(popup)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(popup, "position:y", popup.position.y - 60, 0.7).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(popup, "modulate:a", 0.0, 0.7).set_delay(0.3)
	tween.finished.connect(popup.queue_free)

func _spawn_heal_popup(node: Control, amount: int) -> void:
	var popup := Label.new()
	popup.text = "+%d" % amount
	popup.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	popup.add_theme_font_size_override("font_size", 28)
	popup.add_theme_color_override("font_color", Color(0.3, 1, 0.3))
	popup.z_index = 50
	popup.mouse_filter = Control.MOUSE_FILTER_IGNORE
	popup.position = Vector2(node.size.x / 2 - 20, -10)
	node.add_child(popup)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(popup, "position:y", popup.position.y - 50, 0.6).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(popup, "modulate:a", 0.0, 0.6).set_delay(0.2)
	tween.finished.connect(popup.queue_free)

func _spawn_hp_damage_popup(is_player: bool, amount: int) -> void:
	var label := player_hp_label if is_player else opponent_hp_label
	var popup := Label.new()
	popup.text = "-%d" % amount
	popup.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	popup.add_theme_font_size_override("font_size", 36)
	popup.add_theme_color_override("font_color", Color(1, 0.1, 0.1))
	popup.z_index = 50
	popup.mouse_filter = Control.MOUSE_FILTER_IGNORE
	popup.position = Vector2(label.size.x / 2 - 20, -20)
	label.add_child(popup)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(popup, "position:y", popup.position.y - 60, 0.8).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tween.tween_property(popup, "modulate:a", 0.0, 0.8).set_delay(0.3)
	tween.finished.connect(popup.queue_free)

func _add_log(msg: String) -> void:
	battle_log_messages.append(msg)
	# Show last 2 messages
	var display_text := ""
	var start := maxi(0, battle_log_messages.size() - 2)
	for i in range(start, battle_log_messages.size()):
		display_text += battle_log_messages[i] + "\n"
	log_label.text = display_text.strip_edges()
	print("[Battle] " + msg)
