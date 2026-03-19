extends RigidBody2D
## res://scripts/tsum.gd

signal clicked(tsum: RigidBody2D)
signal entered(tsum: RigidBody2D)

@export var tsum_type: int = 0

func _ready() -> void:
	pass

func setup(type: int) -> void:
	pass

func set_chained(value: bool) -> void:
	pass

func set_connectable(value: bool) -> void:
	pass
