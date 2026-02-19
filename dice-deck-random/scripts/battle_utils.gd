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
