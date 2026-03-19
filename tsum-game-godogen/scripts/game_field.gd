extends Node2D
## res://scripts/game_field.gd

signal chain_completed(chain_length: int, tsum_type: int)

@export var field_width: float = 480.0
@export var field_height: float = 600.0
@export var tsum_radius: float = 30.0
@export var chain_distance: float = 100.0
@export var max_tsums: int = 100
@export var spawn_interval: float = 0.15

func _ready() -> void:
	pass

func _input(event: InputEvent) -> void:
	pass

func _spawn_tsum(tsum_type: int = -1) -> void:
	pass

func _start_chain(tsum: Node) -> void:
	pass

func _add_to_chain(tsum: Node) -> void:
	pass

func _end_chain() -> void:
	pass

func _find_connectable(from_tsum: Node) -> Array:
	pass
