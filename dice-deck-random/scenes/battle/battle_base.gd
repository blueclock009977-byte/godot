extends Control
class_name BattleBase

## 戦闘システム共通基底クラス
## battle.gd と online_battle.gd で共有するコードを集約

# ─── Constants (from BattleConstants) ───
const CARD_UI_SCENE := preload(BattleConstants.CARD_UI_SCENE_PATH)
const FIELD_SLOT_SCENE := preload(BattleConstants.FIELD_SLOT_SCENE_PATH)
const MAX_HP := BattleConstants.MAX_HP
const MAX_MANA_CAP := BattleConstants.MAX_MANA_CAP
const DEFAULT_STARTING_HAND := BattleConstants.DEFAULT_STARTING_HAND
const MOVE_COST := BattleConstants.MOVE_COST

# ─── Enums (from BattleConstants) ───
const Phase := BattleConstants.Phase
const SelectMode := BattleConstants.SelectMode

# ─── Game State ───
var player_hp: int = MAX_HP
var opponent_hp: int = MAX_HP
var player_mana: int = 0
var player_max_mana: int = 0
var opponent_mana: int = 0
var opponent_max_mana: int = 0
var player_deck: Array[CardData] = []
var opponent_deck: Array[CardData] = []
var player_hand: Array = []  # Array of CardUI
var current_dice: int = 0
var turn_number: int = 0
var is_player_turn: bool = true
var is_player_first: bool = true
var current_phase: Phase = Phase.MAIN1
var select_mode: SelectMode = SelectMode.NONE
var selected_hand_card: CardUI = null
var selected_field_card: CardUI = null
var selected_field_slot: FieldSlot = null
var is_animating: bool = false
var game_over: bool = false

# ─── UI References ───
var player_slots: Array = []  # FieldSlot[6]: 0-2 front, 3-5 back
var opponent_slots: Array = []
var player_hand_container: HBoxContainer
var opponent_hand_container: HBoxContainer
var player_hp_label: Label
var opponent_hp_label: Label
var mana_label: Label
var phase_label: Label
var dice_label: Label
var end_turn_btn: Button
var next_phase_btn: Button
var surrender_btn: Button
var log_label: RichTextLabel
var phase_overlay: ColorRect
var phase_overlay_label: Label
var turn_indicator_label: Label
var dice_preview_panel: PanelContainer
var dice_preview_label: RichTextLabel
var center_info: HBoxContainer
var card_preview_overlay: ColorRect
var card_preview_container: CenterContainer

# ═══════════════════════════════════════════
# UI CONSTRUCTION
# ═══════════════════════════════════════════
func _build_ui() -> void:
	# Background
	var bg := ColorRect.new()
	bg.color = Color(0.08, 0.08, 0.12)
	bg.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(bg)

	# Main layout
	var main_vbox := VBoxContainer.new()
	main_vbox.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	main_vbox.add_theme_constant_override("separation", 4)
	add_child(main_vbox)

	# ── Opponent hand area ──
	opponent_hand_container = HBoxContainer.new()
	opponent_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	opponent_hand_container.add_theme_constant_override("separation", 4)
	opponent_hand_container.custom_minimum_size.y = 60
	main_vbox.add_child(opponent_hand_container)

	# ── Turn indicator ──
	turn_indicator_label = Label.new()
	turn_indicator_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	turn_indicator_label.add_theme_font_size_override("font_size", _get_turn_indicator_font_size())
	turn_indicator_label.custom_minimum_size.y = 30
	main_vbox.add_child(turn_indicator_label)

	# ── Opponent HP ──
	opponent_hp_label = Label.new()
	opponent_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	opponent_hp_label.add_theme_font_size_override("font_size", _get_hp_font_size())
	opponent_hp_label.add_theme_color_override("font_color", Color(1, 0.4, 0.4))
	main_vbox.add_child(opponent_hp_label)

	# ── Opponent back row (slots 3,4,5) ──
	var opp_back_row := HBoxContainer.new()
	opp_back_row.alignment = BoxContainer.ALIGNMENT_CENTER
	opp_back_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(opp_back_row)
	for i in range(3, 6):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = false
		opp_back_row.add_child(slot)
		slot.setup_lane_info()
		opponent_slots.append(null)  # placeholder

	# ── Opponent front row (slots 0,1,2) ──
	var opp_front_row := HBoxContainer.new()
	opp_front_row.alignment = BoxContainer.ALIGNMENT_CENTER
	opp_front_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(opp_front_row)
	for i in range(0, 3):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = false
		opp_front_row.add_child(slot)
		slot.setup_lane_info()
		opponent_slots.append(null)  # placeholder

	# Fix opponent_slots ordering: we added 3,4,5 then 0,1,2
	var temp_opp: Array = []
	temp_opp.resize(6)
	for slot_node in opp_back_row.get_children():
		if slot_node is FieldSlot:
			temp_opp[slot_node.slot_index] = slot_node
	for slot_node in opp_front_row.get_children():
		if slot_node is FieldSlot:
			temp_opp[slot_node.slot_index] = slot_node
	opponent_slots = temp_opp

	# ── Center phase bar ──
	var phase_bar := HBoxContainer.new()
	phase_bar.alignment = BoxContainer.ALIGNMENT_CENTER
	phase_bar.custom_minimum_size.y = 50
	main_vbox.add_child(phase_bar)

	phase_label = Label.new()
	phase_label.text = "フェーズ: メイン1"
	phase_label.add_theme_font_size_override("font_size", _get_phase_font_size())
	phase_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	phase_bar.add_child(phase_label)

	# ── ダイスブロック（左側、絶対配置） ──
	var dice_panel := PanelContainer.new()
	var dice_sb := StyleBoxFlat.new()
	dice_sb.bg_color = Color(0.12, 0.12, 0.2, 0.9)
	dice_sb.set_corner_radius_all(8)
	dice_sb.set_content_margin_all(8)
	dice_panel.add_theme_stylebox_override("panel", dice_sb)
	dice_panel.custom_minimum_size = Vector2(150, 150)
	dice_panel.set_anchors_preset(Control.PRESET_CENTER_LEFT)
	dice_panel.position = Vector2(5, -75)
	add_child(dice_panel)

	var dice_vbox := VBoxContainer.new()
	dice_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	dice_panel.add_child(dice_vbox)

	var dice_title := Label.new()
	dice_title.text = "ダイス"
	dice_title.add_theme_font_size_override("font_size", _get_dice_title_font_size())
	dice_title.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8))
	dice_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_vbox.add_child(dice_title)

	dice_label = Label.new()
	dice_label.text = "-"
	dice_label.add_theme_font_size_override("font_size", 60)
	dice_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	dice_vbox.add_child(dice_label)

	# ── ボタン2つ（右側、絶対配置） ──
	var btn_col := VBoxContainer.new()
	btn_col.add_theme_constant_override("separation", 8)
	btn_col.set_anchors_preset(Control.PRESET_CENTER_RIGHT)
	btn_col.position = Vector2(-175, -85)
	add_child(btn_col)

	end_turn_btn = Button.new()
	end_turn_btn.text = "ターン\n終了"
	end_turn_btn.custom_minimum_size = Vector2(165, 80)
	end_turn_btn.add_theme_font_size_override("font_size", _get_button_font_size())
	end_turn_btn.pressed.connect(_on_end_turn)
	btn_col.add_child(end_turn_btn)
	end_turn_btn.visible = false

	next_phase_btn = Button.new()
	next_phase_btn.text = "次の\nフェーズへ"
	next_phase_btn.custom_minimum_size = Vector2(165, 80)
	next_phase_btn.add_theme_font_size_override("font_size", _get_button_font_size())
	next_phase_btn.pressed.connect(_on_end_phase)
	btn_col.add_child(next_phase_btn)

	# ── 降参ボタン（右上、絶対配置） ──
	surrender_btn = Button.new()
	surrender_btn.text = "降参"
	surrender_btn.custom_minimum_size = Vector2(130, 60)
	surrender_btn.add_theme_font_size_override("font_size", _get_button_font_size())
	surrender_btn.pressed.connect(_on_surrender)
	surrender_btn.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	surrender_btn.position = Vector2(-140, 10)
	add_child(surrender_btn)

	# ── Player front row (slots 0,1,2) ──
	var pl_front_row := HBoxContainer.new()
	pl_front_row.alignment = BoxContainer.ALIGNMENT_CENTER
	pl_front_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(pl_front_row)
	for i in range(0, 3):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = true
		pl_front_row.add_child(slot)
		slot.setup_lane_info()
		player_slots.append(null)

	# ── Player back row (slots 3,4,5) ──
	var pl_back_row := HBoxContainer.new()
	pl_back_row.alignment = BoxContainer.ALIGNMENT_CENTER
	pl_back_row.add_theme_constant_override("separation", 6)
	main_vbox.add_child(pl_back_row)
	for i in range(3, 6):
		var slot := FIELD_SLOT_SCENE.instantiate() as FieldSlot
		slot.slot_index = i
		slot.is_player_side = true
		pl_back_row.add_child(slot)
		slot.setup_lane_info()
		player_slots.append(null)

	# Fix player_slots ordering
	var temp_pl: Array = []
	temp_pl.resize(6)
	for slot_node in pl_front_row.get_children():
		if slot_node is FieldSlot:
			temp_pl[slot_node.slot_index] = slot_node
	for slot_node in pl_back_row.get_children():
		if slot_node is FieldSlot:
			temp_pl[slot_node.slot_index] = slot_node
	player_slots = temp_pl

	# Connect slot signals
	for slot in player_slots:
		if slot:
			slot.slot_clicked.connect(_on_player_slot_clicked)
	for slot in opponent_slots:
		if slot:
			slot.slot_clicked.connect(_on_opponent_slot_clicked)

	# ── Player HP ──
	player_hp_label = Label.new()
	player_hp_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	player_hp_label.add_theme_font_size_override("font_size", _get_hp_font_size())
	player_hp_label.add_theme_color_override("font_color", Color(0.4, 1.0, 0.4))
	main_vbox.add_child(player_hp_label)

	# ── Mana display ──
	mana_label = Label.new()
	mana_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	mana_label.add_theme_font_size_override("font_size", _get_mana_font_size())
	mana_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	main_vbox.add_child(mana_label)

	# ── Player hand ──
	var hand_scroll := ScrollContainer.new()
	hand_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	hand_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	hand_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	main_vbox.add_child(hand_scroll)

	player_hand_container = HBoxContainer.new()
	player_hand_container.alignment = BoxContainer.ALIGNMENT_CENTER
	player_hand_container.add_theme_constant_override("separation", 6)
	player_hand_container.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hand_scroll.add_child(player_hand_container)

	# ── Dice Preview Panel ──
	dice_preview_panel = PanelContainer.new()
	var dp_style := StyleBoxFlat.new()
	dp_style.bg_color = Color(0.08, 0.08, 0.16, 0.95)
	dp_style.set_corner_radius_all(12)
	dp_style.border_width_left = 2
	dp_style.border_width_right = 2
	dp_style.border_width_top = 2
	dp_style.border_width_bottom = 2
	dp_style.border_color = Color(1, 0.85, 0.2, 0.7)
	dp_style.content_margin_left = 16
	dp_style.content_margin_right = 16
	dp_style.content_margin_top = 10
	dp_style.content_margin_bottom = 10
	dice_preview_panel.add_theme_stylebox_override("panel", dp_style)
	main_vbox.add_child(dice_preview_panel)

	var dp_vbox := VBoxContainer.new()
	dp_vbox.add_theme_constant_override("separation", 6)
	dice_preview_panel.add_child(dp_vbox)

	var dp_title := Label.new()
	dp_title.text = "ダイス予測"
	dp_title.add_theme_font_size_override("font_size", 24)
	dp_title.add_theme_color_override("font_color", Color(1, 0.9, 0.3))
	dp_title.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	dp_vbox.add_child(dp_title)

	dice_preview_label = RichTextLabel.new()
	dice_preview_label.bbcode_enabled = true
	dice_preview_label.fit_content = true
	dice_preview_label.scroll_active = false
	dice_preview_label.add_theme_font_size_override("normal_font_size", 28)
	dice_preview_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	dp_vbox.add_child(dice_preview_label)

	# ── Log (small, at bottom) ──
	log_label = RichTextLabel.new()
	log_label.bbcode_enabled = true
	log_label.scroll_following = true
	log_label.custom_minimum_size.y = 150
	log_label.add_theme_font_size_override("normal_font_size", _get_log_font_size())
	main_vbox.add_child(log_label)

	# ── Phase transition overlay ──
	phase_overlay = ColorRect.new()
	phase_overlay.color = Color(0, 0, 0, 0.85)
	phase_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	phase_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	phase_overlay.visible = false
	phase_overlay.z_index = 100
	add_child(phase_overlay)

	phase_overlay_label = Label.new()
	phase_overlay_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	phase_overlay_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	phase_overlay_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	phase_overlay_label.add_theme_font_size_override("font_size", 56)
	phase_overlay.add_child(phase_overlay_label)

	# ── Card Preview Overlay ──
	card_preview_overlay = ColorRect.new()
	card_preview_overlay.color = Color(0, 0, 0, 0.7)
	card_preview_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card_preview_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	card_preview_overlay.visible = false
	card_preview_overlay.z_index = 90
	add_child(card_preview_overlay)
	card_preview_container = CenterContainer.new()
	card_preview_container.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	card_preview_overlay.add_child(card_preview_container)
	card_preview_overlay.gui_input.connect(_on_preview_overlay_input)

# サブクラスでオーバーライド可能なフォントサイズ取得関数
func _get_turn_indicator_font_size() -> int:
	return 26

func _get_hp_font_size() -> int:
	return 34

func _get_phase_font_size() -> int:
	return 38

func _get_dice_title_font_size() -> int:
	return 26

func _get_button_font_size() -> int:
	return 28

func _get_mana_font_size() -> int:
	return 30

func _get_log_font_size() -> int:
	return 24

# ═══════════════════════════════════════════
# UI UPDATE - 共通部分
# ═══════════════════════════════════════════
func _update_base_ui() -> void:
	var mana_str := ""
	for i in range(MAX_MANA_CAP):
		if i < player_mana:
			mana_str += "●"
		elif i < player_max_mana:
			mana_str += "○"
		else:
			mana_str += "·"
	mana_label.text = "マナ: %s (%d/%d)" % [mana_str, player_mana, player_max_mana]
	var whose := "自分" if is_player_turn else "相手"
	phase_label.text = "%s: %s" % [whose, BattleConstants.get_phase_name(current_phase)]
	if is_player_turn:
		phase_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
	else:
		phase_label.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
	if current_dice > 0:
		dice_label.text = "%d" % current_dice
	else:
		dice_label.text = "-"
	_update_hand_highlights()
	_update_dice_preview()

func _update_dice_preview() -> void:
	var show := not game_over
	dice_preview_panel.visible = show
	if not show:
		return

	var text := ""
	for dice_val in range(1, 7):
		var result := _simulate_battle(dice_val)
		var score: int = result[0] - result[1]
		var color := "gray"
		var sign := ""
		if score > 0:
			color = "green"
			sign = "+"
		elif score < 0:
			color = "red"
		text += "[font_size=48][b]%d[/b] : [color=%s]%s%d[/color][/font_size]     " % [dice_val, color, sign, score]
	dice_preview_label.text = text

func _simulate_battle(dice_val: int) -> Array:
	var p_cards := []
	var o_cards := []
	for i in range(6):
		var ps: FieldSlot = player_slots[i]
		if ps and not ps.is_empty():
			p_cards.append({"atk": ps.card_ui.current_atk, "hp": ps.card_ui.current_hp, "lane": ps.lane, "is_front": ps.is_front_row, "dice": ps.card_ui.card_data.attack_dice, "idx": i})
		var os: FieldSlot = opponent_slots[i]
		if os and not os.is_empty():
			o_cards.append({"atk": os.card_ui.current_atk, "hp": os.card_ui.current_hp, "lane": os.lane, "is_front": os.is_front_row, "dice": os.card_ui.card_data.attack_dice, "idx": i})

	var turn_cards: Array
	var def_cards: Array
	if is_player_turn:
		turn_cards = p_cards
		def_cards = o_cards
	else:
		turn_cards = o_cards
		def_cards = p_cards

	var dmg_to_opp := 0
	var dmg_to_me := 0

	turn_cards.sort_custom(func(a, b): return a["idx"] < b["idx"])
	for card in turn_cards:
		if card["hp"] <= 0:
			continue
		var dice_arr: Array = card["dice"]
		if not dice_arr.has(dice_val):
			continue
		var target = _sim_find_target(card, def_cards)
		if target == null:
			if is_player_turn:
				dmg_to_opp += card["atk"]
			else:
				dmg_to_me += card["atk"]
		else:
			target["hp"] -= card["atk"]
			if is_player_turn:
				dmg_to_opp += card["atk"]
			else:
				dmg_to_me += card["atk"]

	def_cards.sort_custom(func(a, b): return a["idx"] < b["idx"])
	for card in def_cards:
		if card["hp"] <= 0:
			continue
		var dice_arr: Array = card["dice"]
		if not dice_arr.has(dice_val):
			continue
		var target = _sim_find_target(card, turn_cards)
		if target == null:
			if is_player_turn:
				dmg_to_me += card["atk"]
			else:
				dmg_to_opp += card["atk"]
		else:
			target["hp"] -= card["atk"]
			if is_player_turn:
				dmg_to_me += card["atk"]
			else:
				dmg_to_opp += card["atk"]

	return [dmg_to_opp, dmg_to_me]

func _sim_find_target(attacker: Dictionary, defenders: Array):
	return BattleConstants.sim_find_target(attacker, defenders)

func _update_hand_highlights() -> void:
	var in_main_phase := current_phase == Phase.MAIN1 or current_phase == Phase.MAIN2
	for card_ui in player_hand:
		if card_ui is CardUI:
			var can_summon: bool = in_main_phase and is_player_turn and not is_animating and _get_effective_summon_cost(card_ui) <= player_mana and _has_empty_player_slot()
			card_ui.set_summonable(can_summon)

func _has_empty_player_slot() -> bool:
	for slot in player_slots:
		if slot and slot.is_empty():
			return true
	return false

func _log(text: String) -> void:
	log_label.append_text(text + "\n")

func _show_phase_banner(text: String, banner_color: Color = Color(1, 1, 1), duration: float = 0.8) -> void:
	phase_overlay_label.text = text
	phase_overlay_label.add_theme_color_override("font_color", banner_color)
	phase_overlay.modulate = Color(1, 1, 1, 0)
	phase_overlay.visible = true
	var tween := create_tween()
	tween.tween_property(phase_overlay, "modulate:a", 1.0, 0.15)
	tween.tween_interval(duration)
	tween.tween_property(phase_overlay, "modulate:a", 0.0, 0.2)
	tween.tween_callback(func(): phase_overlay.visible = false)
	await tween.finished

# ═══════════════════════════════════════════
# ANIMATIONS
# ═══════════════════════════════════════════
func _animate_attack(card_ui: CardUI, target_node: Control) -> void:
	var orig := card_ui.global_position
	var target_center := target_node.global_position + target_node.size / 2
	var card_center := orig + card_ui.size / 2
	var direction := (target_center - card_center).normalized()
	var lunge_distance := card_center.distance_to(target_center) * 0.4
	lunge_distance = clampf(lunge_distance, 30.0, 200.0)
	var lunge_pos := orig + direction * lunge_distance

	card_ui.z_index = 50
	var tween := create_tween()
	tween.tween_property(card_ui, "global_position", lunge_pos, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	tween.tween_property(card_ui, "global_position", orig, 0.18).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	await tween.finished
	card_ui.z_index = 1

func _shake_node(node: Control) -> void:
	var orig_pos := node.position
	var tween := create_tween()
	tween.tween_property(node, "position", orig_pos + Vector2(8, 0), 0.04)
	tween.tween_property(node, "position", orig_pos + Vector2(-8, 0), 0.04)
	tween.tween_property(node, "position", orig_pos + Vector2(5, 0), 0.04)
	tween.tween_property(node, "position", orig_pos + Vector2(-5, 0), 0.04)
	tween.tween_property(node, "position", orig_pos, 0.04)

func _spawn_damage_popup(pos: Vector2, amount: int) -> void:
	var popup := Label.new()
	popup.text = "-%d" % amount
	popup.add_theme_font_size_override("font_size", 32)
	popup.add_theme_color_override("font_color", Color(1, 0.2, 0.2))
	popup.global_position = pos
	popup.z_index = 200
	popup.top_level = true
	add_child(popup)
	var tween := create_tween()
	tween.set_parallel(true)
	tween.tween_property(popup, "global_position:y", pos.y - 60, 0.6)
	tween.tween_property(popup, "modulate:a", 0.0, 0.6)
	tween.finished.connect(func(): popup.queue_free())

# ═══════════════════════════════════════════
# CARD PREVIEW
# ═══════════════════════════════════════════
func _on_hand_card_long_pressed(card_ui: CardUI) -> void:
	_show_card_preview(card_ui)

func _show_card_preview(card_ui: CardUI) -> void:
	for child in card_preview_container.get_children():
		child.queue_free()

	var vbox := VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_theme_constant_override("separation", 10)
	card_preview_container.add_child(vbox)

	var preview := CARD_UI_SCENE.instantiate() as CardUI
	vbox.add_child(preview)
	preview.setup(card_ui.card_data, BattleConstants.CARD_SIZE_PREVIEW)
	preview.current_hp = card_ui.current_hp
	preview.current_atk = card_ui.current_atk
	preview.mouse_filter = Control.MOUSE_FILTER_IGNORE

	if card_ui.card_data.has_effect():
		var effect_label := Label.new()
		var effect_desc := EffectManager.get_effect_description(card_ui.card_data.effect_id)
		effect_label.text = effect_desc
		effect_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		effect_label.add_theme_font_size_override("font_size", 24)
		effect_label.add_theme_color_override("font_color", Color(1, 0.9, 0.5))
		effect_label.autowrap_mode = TextServer.AUTOWRAP_WORD
		effect_label.custom_minimum_size.x = 300
		vbox.add_child(effect_label)

	card_preview_overlay.visible = true

func _hide_card_preview() -> void:
	card_preview_overlay.visible = false
	for child in card_preview_container.get_children():
		child.queue_free()

func _on_preview_overlay_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		_hide_card_preview()
	if event is InputEventScreenTouch and event.pressed:
		_hide_card_preview()

# ═══════════════════════════════════════════
# INPUT VALIDATION
# ═══════════════════════════════════════════

## 入力が許可されているかチェック（自分のターン、アニメーション中でない、ゲーム終了していない）
func _is_input_allowed() -> bool:
	return is_player_turn and not is_animating and not game_over

# ═══════════════════════════════════════════
# SELECTION
# ═══════════════════════════════════════════
func _clear_selection() -> void:
	if selected_hand_card:
		selected_hand_card.set_selected(false)
		selected_hand_card = null
	if selected_field_card:
		selected_field_card.set_selected(false)
		selected_field_card.set_movable(false)
		selected_field_card = null
		selected_field_slot = null
	select_mode = SelectMode.NONE
	for slot in player_slots:
		if slot:
			slot.set_highlighted(false)
	_update_hand_highlights()

# ═══════════════════════════════════════════
# UTILITIES
# ═══════════════════════════════════════════
func _to_card_data_array(arr: Array) -> Array[CardData]:
	return BattleConstants.to_card_data_array(arr)

func _get_adjacent_slots(idx: int) -> Array[int]:
	var result: Array[int] = []
	var row_start := (idx / 3) * 3
	var lane_idx := idx % 3
	if lane_idx > 0:
		result.append(row_start + lane_idx - 1)
	if lane_idx < 2:
		result.append(row_start + lane_idx + 1)
	if idx < 3:
		result.append(idx + 3)
	else:
		result.append(idx - 3)
	return result

# ═══════════════════════════════════════════
# 効果処理
# ═══════════════════════════════════════════
func _get_effect_context() -> Dictionary:
	return {
		"player_slots": player_slots,
		"opponent_slots": opponent_slots,
		"current_dice": current_dice
	}

func _process_summon_effect(card_ui: CardUI, is_player: bool) -> void:
	if not card_ui.card_data.has_effect():
		return
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_summon_effect(card_ui, is_player, context)
	_apply_effect_result(result, is_player)

func _process_attack_effect(attacker_ui: CardUI, defender_ui, is_player: bool) -> Dictionary:
	if not attacker_ui.card_data.has_effect():
		return {}
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_attack_effect(attacker_ui, defender_ui, is_player, context)
	_apply_effect_result(result, is_player)
	return result

func _process_death_effect(card_ui: CardUI, is_player: bool) -> Dictionary:
	if not card_ui.card_data.has_effect():
		return {}
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_death_effect(card_ui, is_player, context)
	_apply_effect_result(result, is_player)
	return result

func _process_defense_effect(defender_ui: CardUI, damage: int, is_player: bool) -> int:
	if not defender_ui.card_data.has_effect():
		return damage
	var context := _get_effect_context()
	var result: Dictionary = EffectManager.process_defense_effect(defender_ui, damage, is_player, context)
	_apply_effect_result(result, is_player)
	return result.get("final_damage", damage)

func _process_turn_start_effects(is_player: bool) -> void:
	var context := _get_effect_context()
	var results: Array = EffectManager.process_turn_start_effects(is_player, context)
	for result in results:
		_apply_effect_result(result, is_player)

func _process_turn_end_effects(is_player: bool) -> void:
	var context := _get_effect_context()
	var results: Array = EffectManager.process_turn_end_effects(is_player, context)
	for result in results:
		_apply_effect_result(result, is_player)

func _apply_effect_result(result: Dictionary, is_player: bool) -> void:
	if result.is_empty():
		return

	if result.has("log"):
		_log(result["log"])

	if result.has("mana"):
		if is_player:
			player_mana = mini(player_mana + result["mana"], player_max_mana)
		else:
			opponent_mana = mini(opponent_mana + result["mana"], opponent_max_mana)

	if result.has("mana_full"):
		if is_player:
			player_mana = player_max_mana
		else:
			opponent_mana = opponent_max_mana

	if result.has("self_damage"):
		if is_player:
			player_hp -= result["self_damage"]
			if player_hp <= 0:
				_game_end(false)
		else:
			opponent_hp -= result["self_damage"]
			if opponent_hp <= 0:
				_game_end(true)

	if result.has("direct_damage"):
		if is_player:
			opponent_hp -= result["direct_damage"]
			if opponent_hp <= 0:
				_game_end(true)
		else:
			player_hp -= result["direct_damage"]
			if player_hp <= 0:
				_game_end(false)

	if result.has("draw"):
		for i in range(result["draw"]):
			if is_player:
				_player_draw_card()
			else:
				_opponent_draw_card()

	_update_all_ui()

func _get_effective_attack_dice(card_ui: CardUI, is_player: bool) -> Array:
	var dice := card_ui.card_data.attack_dice.duplicate()
	var context := _get_effect_context()
	var modifier := EffectManager.get_dice_modifier(is_player, context)

	for d in modifier.get("extra_dice", []):
		if d not in dice:
			dice.append(d)

	return dice

func _is_dice_blocked(dice_value: int, is_player: bool) -> bool:
	var context := _get_effect_context()
	var enemy_modifier := EffectManager.get_dice_modifier(not is_player, context)
	return dice_value in enemy_modifier.get("blocked_dice", [])

func _get_effective_summon_cost(card_ui: CardUI) -> int:
	var base_cost: int = card_ui.card_data.mana_cost
	var context := _get_effect_context()
	var modifier: int = EffectManager.get_summon_cost_modifier(true, context)
	return maxi(1, base_cost + modifier)

# ═══════════════════════════════════════════
# ABSTRACT METHODS - サブクラスで実装必須
# ═══════════════════════════════════════════

## UI更新（サブクラスで実装）
func _update_all_ui() -> void:
	push_error("_update_all_ui must be implemented in subclass")

## 相手の手札表示更新（サブクラスで実装）
func _update_opponent_hand_display() -> void:
	push_error("_update_opponent_hand_display must be implemented in subclass")

## プレイヤーのカードドロー（共通実装）
func _player_draw_card() -> void:
	if player_deck.is_empty():
		return
	var card_data: CardData = player_deck.pop_front()
	var card_ui := CARD_UI_SCENE.instantiate() as CardUI
	player_hand_container.add_child(card_ui)
	card_ui.setup(card_data, BattleConstants.CARD_SIZE_HAND)
	card_ui.card_clicked.connect(_on_hand_card_clicked)
	card_ui.card_drag_ended.connect(_on_hand_card_drag_ended)
	card_ui.card_long_pressed.connect(_on_hand_card_long_pressed)
	player_hand.append(card_ui)
	_update_all_ui()

## 相手のカードドロー（サブクラスで実装）
func _opponent_draw_card() -> void:
	push_error("_opponent_draw_card must be implemented in subclass")

## ゲーム終了処理（サブクラスで実装）
func _game_end(_player_wins: bool) -> void:
	push_error("_game_end must be implemented in subclass")

## フェーズ終了ボタン（サブクラスで実装）
func _on_end_phase() -> void:
	push_error("_on_end_phase must be implemented in subclass")

## ターン終了ボタン（サブクラスで実装）
func _on_end_turn() -> void:
	push_error("_on_end_turn must be implemented in subclass")

## 降参ボタン（サブクラスで実装）
func _on_surrender() -> void:
	push_error("_on_surrender must be implemented in subclass")

## プレイヤースロットクリック（サブクラスで実装）
func _on_player_slot_clicked(_slot: FieldSlot) -> void:
	push_error("_on_player_slot_clicked must be implemented in subclass")

## 相手スロットクリック（サブクラスで実装）
func _on_opponent_slot_clicked(_slot: FieldSlot) -> void:
	pass  # 多くの場合何もしない

## 手札カードクリック（サブクラスで実装）
func _on_hand_card_clicked(_card_ui: CardUI) -> void:
	push_error("_on_hand_card_clicked must be implemented in subclass")

## 手札カードドラッグ終了（サブクラスで実装）
func _on_hand_card_drag_ended(_card_ui: CardUI, _drop_pos: Vector2) -> void:
	push_error("_on_hand_card_drag_ended must be implemented in subclass")
