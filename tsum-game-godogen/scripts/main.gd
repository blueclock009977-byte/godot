extends Node2D
## res://scripts/main.gd: Main game scene controller — wires GameField to GameManager

@onready var game_field: Node2D = $GameField

func _ready() -> void:
	# Connect GameField chain signal to GameManager
	var gm = _find_autoload("GameManager")
	if game_field:
		game_field.chain_completed.connect(_on_chain_completed)
	# Start the game
	if gm:
		gm.start_game()
	if game_field:
		game_field.start_field()

	# Draw background
	queue_redraw()

func _draw() -> void:
	# Gradient background
	var viewport_size := get_viewport_rect().size
	var top_color := Color(0.15, 0.1, 0.35)
	var bottom_color := Color(0.05, 0.15, 0.3)
	for y in range(int(viewport_size.y)):
		var t: float = float(y) / viewport_size.y
		var col: Color = top_color.lerp(bottom_color, t)
		draw_line(Vector2(0, y), Vector2(viewport_size.x, y), col)

func _find_autoload(autoload_name: String) -> Node:
	var root = get_tree().root
	for child in root.get_children():
		if child.name == autoload_name:
			return child
	return null

func _on_chain_completed(chain_length: int, tsum_type: int) -> void:
	var gm = _find_autoload("GameManager")
	if gm:
		gm.add_chain_score(chain_length, tsum_type)
