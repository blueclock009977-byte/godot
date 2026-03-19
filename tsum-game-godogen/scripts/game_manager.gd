extends Node
## res://scripts/game_manager.gd: Global game state — timer, score, combo, fever, skills

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
var _time_frozen: bool = false
var _freeze_timer: float = 0.0

func _ready() -> void:
	pass

func _process(delta: float) -> void:
	if not _is_running:
		return

	# Time freeze from time_stop skill
	if _time_frozen:
		_freeze_timer -= delta
		if _freeze_timer <= 0.0:
			_time_frozen = false
	else:
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
	# Apply party bonuses
	var pm = _find_autoload("PartyManager")
	var time_bonus: float = 0.0
	if pm:
		time_bonus = pm.get_time_bonus()
		pm.reset_gauges()

	_time_remaining = game_duration + time_bonus
	_score = 0
	_combo = 0
	_combo_timer = 0.0
	_fever_gauge = 0.0
	_fever_active = false
	_fever_timer = 0.0
	_is_running = true
	_time_frozen = false
	_freeze_timer = 0.0
	time_updated.emit(_time_remaining)
	score_updated.emit(_score)
	combo_updated.emit(_combo)
	fever_updated.emit(_fever_gauge, _fever_active)

	# Emit initial gauge state
	if pm:
		for i in range(2):
			skill_gauge_updated.emit(i, pm.get_gauge(i), pm.get_gauge_max(i))

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

	# Apply party score multiplier
	var pm = _find_autoload("PartyManager")
	var score_mult: float = 1.0
	var combo_bonus: float = 0.0
	if pm:
		score_mult = pm.get_score_multiplier()
		combo_bonus = pm.get_combo_bonus()

	# Apply combo multiplier (+10% per combo + passive bonus)
	var combo_mult: float = 1.0 + _combo * (0.1 + combo_bonus)
	var chain_score: int = int(float(base) * combo_mult * score_mult)

	# Apply fever multiplier (including party fever bonus)
	if _fever_active:
		var fever_mult: float = fever_multiplier
		if pm:
			fever_mult *= pm.get_fever_multiplier()
		chain_score = int(float(chain_score) * fever_mult)

	_score += chain_score
	score_updated.emit(_score)

	# Update combo
	_combo += 1
	var combo_timeout_bonus: float = 0.0
	if pm:
		combo_timeout_bonus = pm.get_combo_timeout_bonus()
	_combo_timer = combo_timeout + combo_timeout_bonus
	combo_updated.emit(_combo)

	# Update fever gauge
	if not _fever_active:
		_fever_gauge += float(chain_length) * 5.0
		if _fever_gauge >= fever_max:
			_activate_fever_internal()
		fever_updated.emit(_fever_gauge, _fever_active)

	# Update skill gauges
	if pm:
		var gauge_amount: float = float(chain_length) * 3.0
		pm.add_gauge(gauge_amount)
		for i in range(2):
			skill_gauge_updated.emit(i, pm.get_gauge(i), pm.get_gauge_max(i))

func _activate_fever_internal() -> void:
	_fever_active = true
	var pm = _find_autoload("PartyManager")
	var fever_ext: float = 0.0
	if pm:
		fever_ext = pm.get_fever_extend()
	_fever_timer = fever_duration + fever_ext
	_fever_gauge = fever_max

func use_skill(slot: int) -> Dictionary:
	if not _is_running:
		return {"success": false}
	var pm = _find_autoload("PartyManager")
	if not pm:
		return {"success": false}
	if not pm.is_skill_ready(slot):
		return {"success": false}

	var ch = pm.get_active_character(slot)
	if ch.is_empty():
		return {"success": false}

	var executor = load("res://scripts/skills/skill_executor.gd").new()
	var context: Dictionary = {
		"game_field": _get_game_field(),
		"game_manager": self,
		"party_manager": pm,
	}
	var result = executor.execute_skill(ch["active_type"], ch["active_power"], context)

	if result.get("success", false):
		pm.consume_gauge(slot)
		skill_gauge_updated.emit(slot, pm.get_gauge(slot), pm.get_gauge_max(slot))
		# Add score for cleared tsums from skill
		var cleared: int = result.get("cleared", 0)
		if cleared > 0:
			var skill_score: int = cleared * 80
			var score_mult: float = 1.0
			if pm:
				score_mult = pm.get_score_multiplier()
			_score += int(float(skill_score) * score_mult)
			score_updated.emit(_score)
			# Skill clears also charge fever gauge
			if not _fever_active:
				_fever_gauge += float(cleared) * 3.0
				if _fever_gauge >= fever_max:
					_activate_fever_internal()
				fever_updated.emit(_fever_gauge, _fever_active)

	return result

func add_time(seconds: float) -> void:
	_time_remaining += seconds
	time_updated.emit(_time_remaining)

func add_score_direct(points: int) -> void:
	if not _is_running:
		return
	var pm = _find_autoload("PartyManager")
	var score_mult: float = 1.0
	if pm:
		score_mult = pm.get_score_multiplier()
	_score += int(float(points) * score_mult)
	score_updated.emit(_score)

func activate_fever() -> void:
	if _fever_active:
		return
	_activate_fever_internal()
	fever_updated.emit(_fever_gauge, _fever_active)

func get_score() -> int:
	return _score

func _find_autoload(autoload_name: String) -> Node:
	var root = get_tree().root
	for child in root.get_children():
		if child.name == autoload_name:
			return child
	return null

func _get_game_field() -> Node:
	# Find the current main scene's GameField
	var root = get_tree().root
	for child in root.get_children():
		if child.name == "Main":
			var field = child.get_node_or_null("GameField")
			if field:
				return field
	return null
