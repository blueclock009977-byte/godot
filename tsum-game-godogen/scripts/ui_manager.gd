extends Control
## res://scripts/ui_manager.gd

func _ready() -> void:
	pass

func _on_time_updated(remaining: float) -> void:
	pass

func _on_score_updated(new_score: int) -> void:
	pass

func _on_combo_updated(combo_count: int) -> void:
	pass

func _on_fever_updated(gauge: float, active: bool) -> void:
	pass

func _on_game_over(final_score: int) -> void:
	pass

func _on_skill_gauge_updated(slot: int, current: float, max_val: float) -> void:
	pass
