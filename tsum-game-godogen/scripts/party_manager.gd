extends Node
## res://scripts/party_manager.gd: Manages party composition (5 slots) and passive/leader effects

signal party_changed
signal skill_ready(slot: int)

# Party slots: [leader, active1, active2, passive1, passive2]
# Each stores character_id (-1 = empty)
var _party: Array = [-1, -1, -1, -1, -1]

# Skill gauges for active skill slots (index 1 and 2)
var _skill_gauges: Array = [0.0, 0.0]
var _skill_ready: Array = [false, false]

# Cached leader/passive values
var _score_multiplier: float = 1.0
var _fever_multiplier_bonus: float = 0.0
var _time_bonus: float = 0.0
var _combo_timeout_bonus: float = 0.0
var _gauge_accel: float = 0.0
var _fever_extend: float = 0.0
var _combo_bonus: float = 0.0
var _drop_luck: float = 0.0

func _ready() -> void:
	# Default party: first character of each type
	_party = [0, 2, 4, 6, 8]
	_recalculate_effects()

func set_party(party: Array) -> void:
	for i in range(mini(party.size(), 5)):
		_party[i] = party[i]
	_recalculate_effects()
	party_changed.emit()

func set_party_member(slot: int, character_id: int) -> void:
	if slot < 0 or slot >= 5:
		return
	# Remove character from any existing slot
	for i in range(5):
		if _party[i] == character_id:
			_party[i] = -1
	_party[slot] = character_id
	_recalculate_effects()
	party_changed.emit()

func get_party() -> Array:
	return _party.duplicate()

func get_leader() -> Dictionary:
	if _party[0] < 0:
		return {}
	return CharacterData.get_character(_party[0])

func get_active_character(slot: int) -> Dictionary:
	# slot 0 or 1 -> party index 1 or 2
	var party_idx: int = slot + 1
	if party_idx < 1 or party_idx > 2:
		return {}
	if _party[party_idx] < 0:
		return {}
	return CharacterData.get_character(_party[party_idx])

func get_passive_character(slot: int) -> Dictionary:
	# slot 0 or 1 -> party index 3 or 4
	var party_idx: int = slot + 3
	if party_idx < 3 or party_idx > 4:
		return {}
	if _party[party_idx] < 0:
		return {}
	return CharacterData.get_character(_party[party_idx])

func _recalculate_effects() -> void:
	_score_multiplier = 1.0
	_fever_multiplier_bonus = 0.0
	_time_bonus = 0.0
	_combo_timeout_bonus = 0.0
	_gauge_accel = 0.0
	_fever_extend = 0.0
	_combo_bonus = 0.0
	_drop_luck = 0.0

	# Leader effect
	var leader = get_leader()
	if not leader.is_empty():
		var lt = leader["leader_type"]
		var lv = leader["leader_value"]
		match lt:
			CharacterData.LeaderType.SCORE_BOOST:
				_score_multiplier += lv
			CharacterData.LeaderType.TIME_EXTEND:
				_time_bonus += lv
			CharacterData.LeaderType.FEVER_BOOST:
				_fever_multiplier_bonus += lv
			CharacterData.LeaderType.COMBO_BOOST:
				_combo_timeout_bonus += lv
			CharacterData.LeaderType.GAUGE_BOOST:
				_gauge_accel += lv

	# Passive effects (slots 3 and 4)
	for i in range(2):
		var ch = get_passive_character(i)
		if ch.is_empty():
			continue
		var pt = ch["passive_type"]
		var pv = ch["passive_value"]
		match pt:
			CharacterData.PassiveType.SCORE_UP:
				_score_multiplier += pv
			CharacterData.PassiveType.GAUGE_ACCEL:
				_gauge_accel += pv
			CharacterData.PassiveType.FEVER_EXTEND:
				_fever_extend += pv
			CharacterData.PassiveType.COMBO_BONUS:
				_combo_bonus += pv
			CharacterData.PassiveType.DROP_LUCK:
				_drop_luck += pv

func get_score_multiplier() -> float:
	return _score_multiplier

func get_fever_multiplier() -> float:
	return 1.0 + _fever_multiplier_bonus

func get_time_bonus() -> float:
	return _time_bonus

func get_combo_timeout_bonus() -> float:
	return _combo_timeout_bonus

func get_gauge_accel() -> float:
	return _gauge_accel

func get_fever_extend() -> float:
	return _fever_extend

func get_combo_bonus() -> float:
	return _combo_bonus

func get_drop_luck() -> float:
	return _drop_luck

# Skill gauge management
func reset_gauges() -> void:
	_skill_gauges = [0.0, 0.0]
	_skill_ready = [false, false]

func add_gauge(amount: float) -> void:
	var accel: float = 1.0 + _gauge_accel
	for i in range(2):
		if _skill_ready[i]:
			continue
		var ch = get_active_character(i)
		if ch.is_empty():
			continue
		var gauge_max: float = ch["gauge_max"]
		_skill_gauges[i] += amount * accel
		if _skill_gauges[i] >= gauge_max:
			_skill_gauges[i] = gauge_max
			_skill_ready[i] = true
			skill_ready.emit(i)

func get_gauge(slot: int) -> float:
	if slot < 0 or slot > 1:
		return 0.0
	return _skill_gauges[slot]

func get_gauge_max(slot: int) -> float:
	var ch = get_active_character(slot)
	if ch.is_empty():
		return 100.0
	return ch["gauge_max"]

func is_skill_ready(slot: int) -> bool:
	if slot < 0 or slot > 1:
		return false
	return _skill_ready[slot]

func consume_gauge(slot: int) -> void:
	if slot < 0 or slot > 1:
		return
	_skill_gauges[slot] = 0.0
	_skill_ready[slot] = false
