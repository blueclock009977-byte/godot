extends Node
## res://scripts/party_manager.gd

signal party_changed

func _ready() -> void:
	pass

func set_party_member(slot: int, character_id: int) -> void:
	pass

func get_leader() -> Dictionary:
	return {}

func get_score_multiplier() -> float:
	return 1.0

func get_fever_multiplier() -> float:
	return 1.0

func get_time_bonus() -> float:
	return 0.0

func get_combo_timeout_bonus() -> float:
	return 0.0
