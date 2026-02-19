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
static func get_effective_summon_cost(card_ui: CardUI, context: Dictionary) -> int:
	var base_cost: int = card_ui.card_data.mana_cost
	var modifier: int = EffectManager.get_summon_cost_modifier(true, context)
	return maxi(1, base_cost + modifier)
