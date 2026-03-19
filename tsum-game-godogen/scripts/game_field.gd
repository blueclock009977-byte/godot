extends Node2D
## res://scripts/game_field.gd: Manages tsum spawning, chain detection, and field physics

signal chain_completed(chain_length: int, tsum_type: int)

@export var field_width: float = 480.0
@export var field_height: float = 600.0
@export var tsum_radius: float = 30.0
@export var chain_distance: float = 100.0
@export var max_tsums: int = 50
@export var spawn_interval: float = 0.08
@export var field_offset_x: float = 30.0
@export var field_offset_y: float = 160.0

var _tsum_scene: PackedScene
var _active_tsums: Array = []
var _chain: Array = []
var _chain_type: int = -1
var _is_chaining: bool = false
var _spawn_timer: float = 0.0
var _initial_spawn_count: int = 40
var _spawned_count: int = 0
var _game_active: bool = false
var _chain_line: Line2D
var _chain_distance_bonus: float = 0.0
var _chain_bonus_timer: float = 0.0

# Wall bodies
var _walls: Array = []

func _ready() -> void:
	_tsum_scene = load("res://scenes/tsum.tscn")
	_create_walls()
	_create_chain_line()

func start_field() -> void:
	_game_active = true
	_spawned_count = 0
	_chain_distance_bonus = 0.0
	_chain_bonus_timer = 0.0
	_clear_all_tsums()

func _create_chain_line() -> void:
	_chain_line = Line2D.new()
	_chain_line.name = "ChainLine"
	_chain_line.width = 4.0
	_chain_line.default_color = Color(1, 1, 1, 0.8)
	_chain_line.z_index = 10
	add_child(_chain_line)

func _create_walls() -> void:
	# Left wall
	_add_wall(Vector2(field_offset_x, field_offset_y + field_height / 2.0),
		Vector2(10, field_height + 60))
	# Right wall
	_add_wall(Vector2(field_offset_x + field_width, field_offset_y + field_height / 2.0),
		Vector2(10, field_height + 60))
	# Bottom wall
	_add_wall(Vector2(field_offset_x + field_width / 2.0, field_offset_y + field_height),
		Vector2(field_width + 20, 10))

func _add_wall(pos: Vector2, size: Vector2) -> void:
	var body := StaticBody2D.new()
	body.position = pos
	var col := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = size
	col.shape = shape
	body.add_child(col)
	add_child(body)
	_walls.append(body)

func _process(delta: float) -> void:
	if not _game_active:
		return

	# Chain distance bonus timer
	if _chain_distance_bonus > 0.0:
		_chain_bonus_timer -= delta
		if _chain_bonus_timer <= 0.0:
			_chain_distance_bonus = 0.0

	# Spawn tsums gradually
	if _active_tsums.size() < max_tsums:
		_spawn_timer += delta
		if _spawn_timer >= spawn_interval:
			_spawn_timer = 0.0
			_spawn_tsum()

	# Update chain line
	if _is_chaining and _chain.size() > 0:
		_chain_line.clear_points()
		for tsum in _chain:
			if is_instance_valid(tsum):
				_chain_line.add_point(tsum.global_position)
		# Add mouse position as endpoint
		_chain_line.add_point(get_global_mouse_position())

	# Update connectable highlights
	if _is_chaining and _chain.size() > 0:
		var connectable = _find_connectable(_chain[_chain.size() - 1])
		for tsum in _active_tsums:
			if is_instance_valid(tsum) and not tsum._is_chained:
				tsum.set_connectable(tsum in connectable)

func _input(event: InputEvent) -> void:
	if not _game_active:
		return
	if event is InputEventMouseButton:
		if not event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			if _is_chaining:
				_end_chain()

func _get_effective_chain_distance() -> float:
	return chain_distance + _chain_distance_bonus

func set_chain_distance_bonus(bonus: float) -> void:
	_chain_distance_bonus = bonus
	_chain_bonus_timer = 10.0  # Lasts 10 seconds

func _spawn_tsum(tsum_type: int = -1) -> void:
	if _active_tsums.size() >= max_tsums:
		return
	var tsum = _tsum_scene.instantiate()
	if tsum_type < 0:
		# Check drop luck for biased spawning
		var pm = _find_autoload("PartyManager")
		if pm and pm.get_drop_luck() > 0.0:
			var leader = pm.get_leader()
			if not leader.is_empty() and randf() < pm.get_drop_luck():
				tsum_type = leader["color"]
			else:
				tsum_type = randi_range(0, 4)
		else:
			tsum_type = randi_range(0, 4)
	tsum.setup(tsum_type)
	# Spawn above field, random x
	var spawn_x: float = randf_range(field_offset_x + tsum_radius + 5, field_offset_x + field_width - tsum_radius - 5)
	var spawn_y: float = field_offset_y - 40 - randf_range(0, 60)
	tsum.position = Vector2(spawn_x, spawn_y)
	tsum.clicked.connect(_on_tsum_clicked)
	tsum.entered.connect(_on_tsum_entered)
	tsum.tree_exiting.connect(_on_tsum_removed.bind(tsum))
	add_child(tsum)
	_active_tsums.append(tsum)

func _on_tsum_clicked(tsum: RigidBody2D) -> void:
	if not _game_active:
		return
	if not _is_chaining:
		_start_chain(tsum)

func _on_tsum_entered(tsum: RigidBody2D) -> void:
	if not _game_active:
		return
	if _is_chaining:
		_add_to_chain(tsum)

func _on_tsum_removed(tsum: RigidBody2D) -> void:
	_active_tsums.erase(tsum)

func _start_chain(tsum: Node) -> void:
	_is_chaining = true
	_chain.clear()
	_chain_type = tsum.tsum_type
	_chain.append(tsum)
	tsum.set_chained(true)
	_chain_line.clear_points()

func _add_to_chain(tsum: Node) -> void:
	if not _is_chaining:
		return
	if tsum in _chain:
		# Allow undo: if tsum is second-to-last, remove last
		if _chain.size() >= 2 and tsum == _chain[_chain.size() - 2]:
			var removed = _chain.pop_back()
			if is_instance_valid(removed):
				removed.set_chained(false)
		return
	if tsum.tsum_type != _chain_type:
		return

	# Check distance from last chain tsum
	var last_tsum = _chain[_chain.size() - 1]
	if not is_instance_valid(last_tsum):
		return
	var dist: float = tsum.global_position.distance_to(last_tsum.global_position)
	if dist > _get_effective_chain_distance():
		return

	_chain.append(tsum)
	tsum.set_chained(true)

func _end_chain() -> void:
	_is_chaining = false
	_chain_line.clear_points()

	if _chain.size() >= 3:
		# Emit chain completed
		chain_completed.emit(_chain.size(), _chain_type)
		# Pop all chained tsums
		for tsum in _chain:
			if is_instance_valid(tsum):
				tsum.pop_animation()
	else:
		# Not enough — unmark
		for tsum in _chain:
			if is_instance_valid(tsum):
				tsum.set_chained(false)
				tsum.set_connectable(false)

	_chain.clear()
	_chain_type = -1

	# Reset connectable highlights
	for tsum in _active_tsums:
		if is_instance_valid(tsum):
			tsum.set_connectable(false)

func _find_connectable(from_tsum: Node) -> Array:
	# BFS to find same-color tsums within chain_distance
	var result: Array = []
	if not is_instance_valid(from_tsum):
		return result

	var effective_dist: float = _get_effective_chain_distance()
	var visited: Array = []
	var queue: Array = [from_tsum]
	visited.append(from_tsum)

	while queue.size() > 0:
		var current = queue.pop_front()
		for tsum in _active_tsums:
			if not is_instance_valid(tsum):
				continue
			if tsum in visited:
				continue
			if tsum in _chain:
				continue
			if tsum.tsum_type != _chain_type:
				continue
			if tsum.global_position.distance_to(current.global_position) <= effective_dist:
				visited.append(tsum)
				queue.append(tsum)
				result.append(tsum)

	return result

func _clear_all_tsums() -> void:
	for tsum in _active_tsums.duplicate():
		if is_instance_valid(tsum):
			tsum.queue_free()
	_active_tsums.clear()

func _find_autoload(autoload_name: String) -> Node:
	var root = get_tree().root
	for child in root.get_children():
		if child.name == autoload_name:
			return child
	return null
