extends Node
## res://scripts/game_manager.gd

signal time_updated(remaining: float)
signal score_updated(new_score: int)
signal combo_updated(combo_count: int)
signal fever_updated(gauge: float, active: bool)
signal game_over(final_score: int)
signal skill_gauge_updated(slot: int, current: float, max_val: float)

@export var game_duration: float = 60.0
@export var combo_timeout: float = 2.0
@export var fever_max: float = 100.0
@export var fever_duration: float = 10.0
@export var fever_multiplier: float = 2.0

func _ready() -> void:
	pass

func _process(delta: float) -> void:
	pass

func start_game() -> void:
	pass

func add_chain_score(chain_length: int, tsum_type: int) -> void:
	pass

func use_skill(slot: int) -> void:
	pass
