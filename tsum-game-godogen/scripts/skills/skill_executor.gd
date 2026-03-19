extends RefCounted
## res://scripts/skills/skill_executor.gd: Executes active skill effects on the game field

# context keys:
#   "game_field": GameField node
#   "game_manager": GameManager node
#   "party_manager": PartyManager node

func execute_skill(skill_type: int, power: int, context: Dictionary) -> Dictionary:
	var result: Dictionary = {"success": false, "cleared": 0, "effect": ""}

	match skill_type:
		CharacterData.SkillType.CENTER_CLEAR:
			result = _center_clear(power, context)
		CharacterData.SkillType.HORIZONTAL_CLEAR:
			result = _horizontal_clear(power, context)
		CharacterData.SkillType.VERTICAL_CLEAR:
			result = _vertical_clear(power, context)
		CharacterData.SkillType.RANDOM_CLEAR:
			result = _random_clear(power, context)
		CharacterData.SkillType.COLOR_CONVERT:
			result = _color_convert(power, context)
		CharacterData.SkillType.TIME_STOP:
			result = _time_stop(power, context)
		CharacterData.SkillType.BIG_EXPLOSION:
			result = _big_explosion(power, context)
		CharacterData.SkillType.SCORE_BURST:
			result = _score_burst(power, context)
		CharacterData.SkillType.INSTANT_FEVER:
			result = _instant_fever(context)
		CharacterData.SkillType.CHAIN_EXTEND:
			result = _chain_extend(power, context)

	return result

func _center_clear(count: int, context: Dictionary) -> Dictionary:
	var field = context.get("game_field")
	if not field:
		return {"success": false, "cleared": 0, "effect": "center_clear"}
	var center := Vector2(
		field.field_offset_x + field.field_width / 2.0,
		field.field_offset_y + field.field_height / 2.0
	)
	var cleared: int = _clear_nearest(field, center, count)
	return {"success": true, "cleared": cleared, "effect": "center_clear"}

func _horizontal_clear(count: int, context: Dictionary) -> Dictionary:
	var field = context.get("game_field")
	if not field:
		return {"success": false, "cleared": 0, "effect": "horizontal_clear"}
	var center_y: float = field.field_offset_y + field.field_height / 2.0
	var tsums: Array = _get_active_tsums(field)
	# Sort by distance to center horizontal line
	tsums.sort_custom(func(a, b): return abs(a.global_position.y - center_y) < abs(b.global_position.y - center_y))
	var to_clear: int = mini(count, tsums.size())
	for i in range(to_clear):
		if is_instance_valid(tsums[i]):
			tsums[i].pop_animation()
	return {"success": true, "cleared": to_clear, "effect": "horizontal_clear"}

func _vertical_clear(count: int, context: Dictionary) -> Dictionary:
	var field = context.get("game_field")
	if not field:
		return {"success": false, "cleared": 0, "effect": "vertical_clear"}
	var center_x: float = field.field_offset_x + field.field_width / 2.0
	var tsums: Array = _get_active_tsums(field)
	tsums.sort_custom(func(a, b): return abs(a.global_position.x - center_x) < abs(b.global_position.x - center_x))
	var to_clear: int = mini(count, tsums.size())
	for i in range(to_clear):
		if is_instance_valid(tsums[i]):
			tsums[i].pop_animation()
	return {"success": true, "cleared": to_clear, "effect": "vertical_clear"}

func _random_clear(count: int, context: Dictionary) -> Dictionary:
	var field = context.get("game_field")
	if not field:
		return {"success": false, "cleared": 0, "effect": "random_clear"}
	var tsums: Array = _get_active_tsums(field)
	tsums.shuffle()
	var to_clear: int = mini(count, tsums.size())
	for i in range(to_clear):
		if is_instance_valid(tsums[i]):
			tsums[i].pop_animation()
	return {"success": true, "cleared": to_clear, "effect": "random_clear"}

func _color_convert(count: int, context: Dictionary) -> Dictionary:
	var field = context.get("game_field")
	if not field:
		return {"success": false, "cleared": 0, "effect": "color_convert"}
	var tsums: Array = _get_active_tsums(field)
	if tsums.is_empty():
		return {"success": false, "cleared": 0, "effect": "color_convert"}
	# Pick the most common color
	var color_counts: Array[int] = [0, 0, 0, 0, 0]
	for t in tsums:
		if is_instance_valid(t):
			color_counts[t.tsum_type % 5] += 1
	var target_color: int = 0
	var max_count: int = 0
	for i in range(5):
		if color_counts[i] > max_count:
			max_count = color_counts[i]
			target_color = i
	# Convert random non-target tsums to target color
	var non_target: Array = []
	for t in tsums:
		if is_instance_valid(t) and t.tsum_type != target_color:
			non_target.append(t)
	non_target.shuffle()
	var converted: int = 0
	for i in range(mini(count, non_target.size())):
		non_target[i].setup(target_color)
		non_target[i]._create_visual()
		converted += 1
	return {"success": true, "cleared": converted, "effect": "color_convert"}

func _time_stop(seconds: int, context: Dictionary) -> Dictionary:
	var gm = context.get("game_manager")
	if not gm:
		return {"success": false, "cleared": 0, "effect": "time_stop"}
	gm.add_time(float(seconds))
	return {"success": true, "cleared": 0, "effect": "time_stop"}

func _big_explosion(count: int, context: Dictionary) -> Dictionary:
	var field = context.get("game_field")
	if not field:
		return {"success": false, "cleared": 0, "effect": "big_explosion"}
	var center := Vector2(
		field.field_offset_x + field.field_width / 2.0,
		field.field_offset_y + field.field_height / 2.0
	)
	var cleared: int = _clear_nearest(field, center, count)
	return {"success": true, "cleared": cleared, "effect": "big_explosion"}

func _score_burst(points: int, context: Dictionary) -> Dictionary:
	var gm = context.get("game_manager")
	if not gm:
		return {"success": false, "cleared": 0, "effect": "score_burst"}
	gm.add_score_direct(points)
	return {"success": true, "cleared": 0, "effect": "score_burst"}

func _instant_fever(context: Dictionary) -> Dictionary:
	var gm = context.get("game_manager")
	if not gm:
		return {"success": false, "cleared": 0, "effect": "instant_fever"}
	gm.activate_fever()
	return {"success": true, "cleared": 0, "effect": "instant_fever"}

func _chain_extend(extra_distance: int, context: Dictionary) -> Dictionary:
	var field = context.get("game_field")
	if not field:
		return {"success": false, "cleared": 0, "effect": "chain_extend"}
	field.set_chain_distance_bonus(float(extra_distance))
	return {"success": true, "cleared": 0, "effect": "chain_extend"}

# Helper: get active tsums from field
func _get_active_tsums(field: Node) -> Array:
	return field._active_tsums.duplicate()

# Helper: clear nearest N tsums to a position
func _clear_nearest(field: Node, pos: Vector2, count: int) -> int:
	var tsums: Array = _get_active_tsums(field)
	tsums.sort_custom(func(a, b): return a.global_position.distance_to(pos) < b.global_position.distance_to(pos))
	var cleared: int = 0
	for i in range(mini(count, tsums.size())):
		if is_instance_valid(tsums[i]):
			tsums[i].pop_animation()
			cleared += 1
	return cleared
