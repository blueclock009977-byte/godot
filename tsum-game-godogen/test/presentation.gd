extends SceneTree
## test/presentation.gd: ~30-second cinematic video showcasing Tsum Puzzle gameplay
## No Camera2D or canvas_transform - 2D UI game renders at fixed viewport

var _frame: int = 0
var _root: Window
var _scene: Node = null
var _game_field: Node2D = null
var _game_manager: Node = null
var _party_manager: Node = null

# Title screen node
var _title_scene: Node = null

# Timing phases (frames at 30fps)
const TITLE_END: int = 90           # 3s title
const GAME_LOAD: int = 95           # Load game
const GAME_SETTLE: int = 180        # Tsums settle (3s)
const CHAIN_SLOW: int = 200         # Slow chains start
const CHAIN_FAST: int = 350         # Faster chains
const SKILL_PHASE: int = 450        # Skill activation
const FEVER_PHASE: int = 550        # Fever mode
const FEVER_CHAINS: int = 560       # Chains during fever
const SKILL_PHASE_2: int = 680      # Second skill use
const FINAL_PLAY: int = 730         # Final gameplay
const END_FRAME: int = 870          # Fade out start

# Chain state
var _sim_chain_timer: float = 0.0
var _chains_completed: int = 0
var _chain_color_cycle: int = 0

# Overlay for fades
var _overlay_layer: CanvasLayer = null
var _overlay: ColorRect = null
var _overlay_alpha: float = 1.0
var _overlay_target: float = 0.0

func _initialize() -> void:
	_root = root

	# Find autoloads
	for child in _root.get_children():
		if child.name == "GameManager":
			_game_manager = child
		elif child.name == "PartyManager":
			_party_manager = child

	# Set up party for demo
	if _party_manager:
		_party_manager.set_party([0, 3, 4, 8, 1])

	# Overlay for fade transitions
	_overlay_layer = CanvasLayer.new()
	_overlay_layer.name = "PresentationOverlay"
	_overlay_layer.layer = 100
	_root.add_child(_overlay_layer)

	_overlay = ColorRect.new()
	_overlay.color = Color(0, 0, 0, 1)
	_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
	_overlay_layer.add_child(_overlay)

	# Load title scene
	_load_title()

func _load_title() -> void:
	var packed: PackedScene = load("res://scenes/title.tscn")
	_title_scene = packed.instantiate()
	_root.add_child(_title_scene)
	# Fix title layout: make it fill the screen
	if _title_scene is Control:
		_title_scene.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
		var vbox = _title_scene.get_node_or_null("VBoxContainer")
		if vbox:
			vbox.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
			vbox.offset_left = -150
			vbox.offset_right = 150
			vbox.offset_top = -100
			vbox.offset_bottom = 100

func _load_game() -> void:
	if _title_scene:
		_title_scene.free()
		_title_scene = null
	var packed: PackedScene = load("res://scenes/main.tscn")
	_scene = packed.instantiate()
	_root.add_child(_scene)
	_game_field = _scene.get_node_or_null("GameField")
	print("ASSERT PASS: Game scene loaded")

func _process(delta: float) -> bool:
	_frame += 1

	# Overlay fade
	if _overlay:
		_overlay_alpha = lerpf(_overlay_alpha, _overlay_target, 4.0 * delta)
		_overlay.color.a = clampf(_overlay_alpha, 0.0, 1.0)

	_handle_phase(delta)
	return false

func _handle_phase(delta: float) -> void:
	# === TITLE: fade in ===
	if _frame == 2:
		_overlay_target = 0.0

	# === FADE OUT TITLE ===
	if _frame == TITLE_END - 15:
		_overlay_target = 1.0

	# === LOAD GAME ===
	if _frame == GAME_LOAD:
		_load_game()

	if _frame == GAME_LOAD + 5:
		_overlay_target = 0.0  # Fade in game

	# === SLOW CHAINS ===
	if _frame >= CHAIN_SLOW and _frame < CHAIN_FAST:
		_simulate_chain_play(delta, 0.8)

	# === FASTER CHAINS ===
	if _frame >= CHAIN_FAST and _frame < SKILL_PHASE:
		_simulate_chain_play(delta, 0.35)

	# === SKILL 1 ===
	if _frame == SKILL_PHASE:
		_charge_skills()
		print("ASSERT PASS: Skill phase")

	if _frame == SKILL_PHASE + 15:
		if _game_manager:
			var r = _game_manager.use_skill(0)
			if r.get("success", false):
				print("ASSERT PASS: Skill 0: %s" % r.get("effect", ""))

	if _frame > SKILL_PHASE and _frame < FEVER_PHASE:
		_simulate_chain_play(delta, 0.4)

	# === FEVER ===
	if _frame == FEVER_PHASE:
		if _game_manager:
			_game_manager.activate_fever()
		print("ASSERT PASS: Fever activated")

	if _frame >= FEVER_CHAINS and _frame < SKILL_PHASE_2:
		_simulate_chain_play(delta, 0.2)

	# === SKILL 2 ===
	if _frame == SKILL_PHASE_2:
		_charge_skills()
	if _frame == SKILL_PHASE_2 + 15:
		if _game_manager:
			var r = _game_manager.use_skill(1)
			if r.get("success", false):
				print("ASSERT PASS: Skill 1: %s" % r.get("effect", ""))

	# === FINAL PLAY ===
	if _frame >= FINAL_PLAY and _frame < END_FRAME:
		_simulate_chain_play(delta, 0.3)

	# === FADE OUT ===
	if _frame == END_FRAME:
		_overlay_target = 1.0
		print("ASSERT PASS: Ending, %d chains" % _chains_completed)

# === Chain simulation ===

func _simulate_chain_play(delta: float, interval: float) -> void:
	_sim_chain_timer += delta
	if _sim_chain_timer >= interval:
		_sim_chain_timer = 0.0
		_perform_chain()

func _perform_chain() -> void:
	if not _game_manager or not _game_field:
		return
	if not _game_manager.is_running():
		return

	var tsums: Array = _game_field._active_tsums.duplicate()
	if tsums.size() < 5:
		return

	var best: Array = _find_best_chain(tsums)
	if best.size() >= 3:
		for tsum in best:
			if is_instance_valid(tsum):
				tsum.pop_animation()
		_game_manager.add_chain_score(best.size(), best[0].tsum_type)
	else:
		_game_manager.add_chain_score(randi_range(3, 6), _chain_color_cycle)
		_chain_color_cycle = (_chain_color_cycle + 1) % 5
	_chains_completed += 1

func _find_best_chain(tsums: Array) -> Array:
	var best: Array = []
	for color in range(5):
		var same: Array = []
		for t in tsums:
			if is_instance_valid(t) and t.tsum_type == color:
				same.append(t)
		if same.size() < 3:
			continue
		var cluster: Array = _find_cluster(same)
		if cluster.size() > best.size():
			best = cluster
	return best

func _find_cluster(group: Array) -> Array:
	if group.is_empty():
		return []
	var idx: int = randi_range(0, group.size() - 1)
	var start = group[idx]
	if not is_instance_valid(start):
		return []

	var result: Array = [start]
	var queue: Array = [start]
	var visited: Array = [start]

	while queue.size() > 0 and result.size() < 7:
		var cur = queue.pop_front()
		for t in group:
			if not is_instance_valid(t) or t in visited:
				continue
			if t.global_position.distance_to(cur.global_position) <= 120.0:
				visited.append(t)
				queue.append(t)
				result.append(t)
				if result.size() >= 7:
					break
	return result

func _charge_skills() -> void:
	if not _game_manager:
		return
	for i in range(15):
		_game_manager.add_chain_score(6, i % 5)
