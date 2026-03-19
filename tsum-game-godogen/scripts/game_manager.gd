extends Node
## res://scripts/game_manager.gd: Global game state — timer, score, combo, fever

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

var _time_remaining: float = 0.0
var _score: int = 0
var _combo: int = 0
var _combo_timer: float = 0.0
var _fever_gauge: float = 0.0
var _fever_active: bool = false
var _fever_timer: float = 0.0
var _is_running: bool = false

func _ready() -> void:
	pass

func _process(delta: float) -> void:
	if not _is_running:
		return

	# Game timer
	_time_remaining -= delta
	if _time_remaining <= 0.0:
		_time_remaining = 0.0
		_is_running = false
		time_updated.emit(_time_remaining)
		game_over.emit(_score)
		return
	time_updated.emit(_time_remaining)

	# Combo timer
	if _combo > 0:
		_combo_timer -= delta
		if _combo_timer <= 0.0:
			_combo = 0
			combo_updated.emit(_combo)

	# Fever timer
	if _fever_active:
		_fever_timer -= delta
		if _fever_timer <= 0.0:
			_fever_active = false
			_fever_gauge = 0.0
			fever_updated.emit(_fever_gauge, _fever_active)

func start_game() -> void:
	_time_remaining = game_duration
	_score = 0
	_combo = 0
	_combo_timer = 0.0
	_fever_gauge = 0.0
	_fever_active = false
	_fever_timer = 0.0
	_is_running = true
	time_updated.emit(_time_remaining)
	score_updated.emit(_score)
	combo_updated.emit(_combo)
	fever_updated.emit(_fever_gauge, _fever_active)

func stop_game() -> void:
	_is_running = false

func is_running() -> bool:
	return _is_running

func add_chain_score(chain_length: int, _tsum_type: int) -> void:
	if not _is_running:
		return
	var n: int = chain_length
	# Base score formula: 100 + (n-3)*50 + (n-3)*(n-2)*10
	var base: int = 100
	if n > 3:
		base += (n - 3) * 50 + (n - 3) * (n - 2) * 10

	# Apply combo multiplier (+10% per combo)
	var combo_mult: float = 1.0 + _combo * 0.1
	var chain_score: int = int(float(base) * combo_mult)

	# Apply fever multiplier
	if _fever_active:
		chain_score = int(float(chain_score) * fever_multiplier)

	_score += chain_score
	score_updated.emit(_score)

	# Update combo
	_combo += 1
	_combo_timer = combo_timeout
	combo_updated.emit(_combo)

	# Update fever gauge
	if not _fever_active:
		_fever_gauge += float(chain_length) * 5.0
		if _fever_gauge >= fever_max:
			_fever_active = true
			_fever_timer = fever_duration
			_fever_gauge = fever_max
		fever_updated.emit(_fever_gauge, _fever_active)

func use_skill(_slot: int) -> void:
	# Placeholder for Phase 2
	pass

func get_score() -> int:
	return _score
