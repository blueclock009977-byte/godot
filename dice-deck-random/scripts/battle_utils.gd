class_name BattleUtils
## Shared utility functions for battle.gd and online_battle.gd

static func shake_node(parent: Control, node: Control) -> void:
	var orig_pos := node.position
	var tween := parent.create_tween()
	tween.tween_property(node, "position", orig_pos + Vector2(8, 0), 0.04)
	tween.tween_property(node, "position", orig_pos + Vector2(-8, 0), 0.04)
	tween.tween_property(node, "position", orig_pos + Vector2(5, 0), 0.04)
	tween.tween_property(node, "position", orig_pos + Vector2(-5, 0), 0.04)
	tween.tween_property(node, "position", orig_pos, 0.04)

static func spawn_damage_popup(parent: Control, pos: Vector2, amount: int) -> void:
	var popup := Label.new()
	popup.text = "-%d" % amount
	popup.add_theme_font_size_override("font_size", 32)
	popup.add_theme_color_override("font_color", Color(1, 0.2, 0.2))
	popup.global_position = pos
	popup.z_index = 200
	popup.top_level = true
	parent.add_child(popup)
	var tween := parent.create_tween()
	tween.set_parallel(true)
	tween.tween_property(popup, "global_position:y", pos.y - 60, 0.6)
	tween.tween_property(popup, "modulate:a", 0.0, 0.6)
	tween.finished.connect(func(): popup.queue_free())

## Animate attack lunge towards target and return
static func animate_attack(parent: Control, card_ui: Control, target_node: Control) -> void:
	var orig := card_ui.global_position
	var target_center := target_node.global_position + target_node.size / 2
	var card_center := orig + card_ui.size / 2
	var direction := (target_center - card_center).normalized()
	var lunge_distance := card_center.distance_to(target_center) * 0.4
	lunge_distance = clampf(lunge_distance, 30.0, 200.0)
	var lunge_pos := orig + direction * lunge_distance

	card_ui.z_index = 50
	var tween := parent.create_tween()
	tween.tween_property(card_ui, "global_position", lunge_pos, 0.12).set_trans(Tween.TRANS_BACK).set_ease(Tween.EASE_IN)
	tween.tween_property(card_ui, "global_position", orig, 0.18).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	await tween.finished
	card_ui.z_index = 1

## Get adjacent slots for a given slot index
## Adjacent = same row left/right, or same lane other row
static func get_adjacent_slots(idx: int) -> Array[int]:
	var result: Array[int] = []
	var row_start := (idx / 3) * 3
	var lane_idx := idx % 3
	# Left in same row
	if lane_idx > 0:
		result.append(row_start + lane_idx - 1)
	# Right in same row
	if lane_idx < 2:
		result.append(row_start + lane_idx + 1)
	# Same lane other row
	if idx < 3:
		result.append(idx + 3)
	else:
		result.append(idx - 3)
	return result

## Find target for attacker in battle simulation
## Returns the defender dict to attack, or null for direct damage
static func sim_find_target(attacker: Dictionary, defenders: Array):
	var lane: int = attacker["lane"]
	# First, look for front row defender in same lane
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and d["is_front"]:
			return d
	# Then, look for back row defender in same lane
	for d in defenders:
		if d["hp"] > 0 and d["lane"] == lane and not d["is_front"]:
			return d
	return null

## Check if any slot in the array is empty
static func has_empty_slot(slots: Array) -> bool:
	for slot in slots:
		if slot and slot.is_empty():
			return true
	return false

## Calculate effective summon cost with modifiers
## context: the effect context dictionary from _get_effect_context()
static func get_effective_summon_cost(card_ui, context: Dictionary) -> int:
	var base_cost: int = card_ui.card_data.mana_cost
	var modifier: int = EffectManager.get_summon_cost_modifier(true, context)
	return maxi(1, base_cost + modifier)

## Check if a dice value is blocked by enemy effects
## is_player: true if checking for player's dice being blocked
## context: the effect context dictionary from _get_effect_context()
static func is_dice_blocked(dice_value: int, is_player: bool, context: Dictionary) -> bool:
	var enemy_modifier := EffectManager.get_dice_modifier(not is_player, context)
	return dice_value in enemy_modifier.get("blocked_dice", [])

## Simulate battle to calculate expected damage for each side
## Returns [dmg_to_opp, dmg_to_me] (damage predictions)
static func simulate_battle(dice_val: int, player_slots: Array, opponent_slots: Array, is_player_turn: bool) -> Array:
	var p_cards := []
	var o_cards := []
	for i in range(6):
		var ps = player_slots[i]
		if ps and not ps.is_empty():
			p_cards.append({"atk": ps.card_ui.current_atk, "hp": ps.card_ui.current_hp, "lane": ps.lane, "is_front": ps.is_front_row, "dice": ps.card_ui.card_data.attack_dice, "idx": i})
		var os = opponent_slots[i]
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

	# Local helper lambda (to avoid static self-reference parse error)
	var find_target := func(attacker: Dictionary, defenders: Array):
		var lane: int = attacker["lane"]
		for d in defenders:
			if d["hp"] > 0 and d["lane"] == lane and d["is_front"]:
				return d
		for d in defenders:
			if d["hp"] > 0 and d["lane"] == lane and not d["is_front"]:
				return d
		return null

	turn_cards.sort_custom(func(a, b): return a["idx"] < b["idx"])
	for card in turn_cards:
		if card["hp"] <= 0:
			continue
		var dice_arr: Array = card["dice"]
		if not dice_arr.has(dice_val):
			continue
		var target = find_target.call(card, def_cards)
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
		var target = find_target.call(card, turn_cards)
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


## 攻撃ダイスの修正適用後の値を取得（純粋関数）
static func get_effective_attack_dice(card_ui, is_player: bool, context: Dictionary) -> Array:
	var dice: Array = card_ui.card_data.attack_dice.duplicate()
	var modifier := EffectManager.get_dice_modifier(is_player, context)

	for d in modifier.get("extra_dice", []):
		if d not in dice:
			dice.append(d)

	return dice

## カードバック用のスタイルを作成（敵の手札表示用）
static func create_card_back_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.3, 0.3, 0.4)
	style.corner_radius_top_left = 4
	style.corner_radius_top_right = 4
	style.corner_radius_bottom_left = 4
	style.corner_radius_bottom_right = 4
	return style

## マナ表示文字列を生成（●=使用可能、○=最大まで、·=上限超過分）
## max_mana_cap: マナの絶対上限（デフォルト10）
static func build_mana_string(current_mana: int, max_mana: int, max_mana_cap: int = 10) -> String:
	var mana_str := ""
	for i in range(max_mana_cap):
		if i < current_mana:
			mana_str += "●"
		elif i < max_mana:
			mana_str += "○"
		else:
			mana_str += "·"
	return mana_str

## ダイスプレビュー用リッチテキスト文字列を生成
## results: 各ダイス値(1-6)のシミュレーション結果 [[dmg_to_opp, dmg_to_me], ...]
static func build_dice_preview_text(results: Array) -> String:
	var text := ""
	for dice_val in range(1, 7):
		var result = results[dice_val - 1]
		var score: int = result[0] - result[1]
		var color := "gray"
		var sign_str := ""
		if score > 0:
			color = "green"
			sign_str = "+"
		elif score < 0:
			color = "red"
		text += "[font_size=48][b]%d[/b] : [color=%s]%s%d[/color][/font_size]     " % [dice_val, color, sign_str, score]
	return text

## フェーズバナーを表示（アニメーション付き）
## owner: create_tween()を呼ぶためのノード
## overlay: バナーのコンテナ（ColorRect等）
## label: テキスト表示用Label
static func show_phase_banner(owner: Node, overlay: Control, label: Label, text: String, banner_color: Color = Color(1, 1, 1), duration: float = 0.8) -> void:
	label.text = text
	label.add_theme_color_override("font_color", banner_color)
	overlay.modulate = Color(1, 1, 1, 0)
	overlay.visible = true
	var tween := owner.create_tween()
	tween.tween_property(overlay, "modulate:a", 1.0, 0.15)
	tween.tween_interval(duration)
	tween.tween_property(overlay, "modulate:a", 0.0, 0.2)
	tween.tween_callback(func(): overlay.visible = false)
	await tween.finished

## カードプレビューを表示
## container: プレビューを追加するコンテナ
## overlay: オーバーレイ（表示/非表示）
## card_ui_scene: CardUIのPackedScene
## source_card: 元のカードUI
static func show_card_preview(container: Control, overlay: Control, card_ui_scene: PackedScene, source_card) -> void:
	# 古いプレビューをクリア
	for child in container.get_children():
		child.queue_free()

	# コンテナを作成
	var vbox := VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.add_theme_constant_override("separation", 10)
	container.add_child(vbox)

	# 大きなプレビューカードを作成
	var preview = card_ui_scene.instantiate()
	vbox.add_child(preview)
	preview.setup(source_card.card_data, 300)
	preview.current_hp = source_card.current_hp
	preview.current_atk = source_card.current_atk
	preview.mouse_filter = Control.MOUSE_FILTER_IGNORE

	# 効果説明を表示
	if source_card.card_data.has_effect():
		var effect_label := Label.new()
		var effect_desc := EffectManager.get_effect_description(source_card.card_data.effect_id)
		effect_label.text = effect_desc
		effect_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		effect_label.add_theme_font_size_override("font_size", 24)
		effect_label.add_theme_color_override("font_color", Color(1, 0.9, 0.5))
		effect_label.autowrap_mode = TextServer.AUTOWRAP_WORD
		effect_label.custom_minimum_size.x = 300
		vbox.add_child(effect_label)

	overlay.visible = true

## カードプレビューを非表示
static func hide_card_preview(container: Control, overlay: Control) -> void:
	overlay.visible = false
	for child in container.get_children():
		child.queue_free()
