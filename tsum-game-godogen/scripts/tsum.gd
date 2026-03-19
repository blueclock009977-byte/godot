extends RigidBody2D
## res://scripts/tsum.gd: Individual tsum piece with physics, color, and chain interaction

signal clicked(tsum: RigidBody2D)
signal entered(tsum: RigidBody2D)

@onready var collision_shape: CollisionShape2D = $CollisionShape2D
@onready var sprite: Sprite2D = $Sprite2D

@export var tsum_type: int = 0

var _is_chained: bool = false
var _is_connectable: bool = false
var _base_color: Color = Color.WHITE
var _is_dragging_over: bool = false

const TSUM_COLORS: Array = [
	Color(0.95, 0.25, 0.25),  # Red
	Color(0.25, 0.55, 0.95),  # Blue
	Color(0.30, 0.85, 0.35),  # Green
	Color(0.95, 0.85, 0.20),  # Yellow
	Color(0.70, 0.30, 0.90),  # Purple
]

const TSUM_FACE_COLORS: Array = [
	Color(1.0, 0.5, 0.5),   # Red lighter
	Color(0.5, 0.7, 1.0),   # Blue lighter
	Color(0.5, 1.0, 0.55),  # Green lighter
	Color(1.0, 0.95, 0.5),  # Yellow lighter
	Color(0.85, 0.55, 1.0), # Purple lighter
]

func _ready() -> void:
	input_pickable = true
	contact_monitor = true
	max_contacts_reported = 4
	_create_visual()

func setup(type: int) -> void:
	tsum_type = type
	if is_inside_tree():
		_create_visual()

func _create_visual() -> void:
	if not sprite:
		return
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	_base_color = TSUM_COLORS[tsum_type % TSUM_COLORS.size()]
	var face_color: Color = TSUM_FACE_COLORS[tsum_type % TSUM_FACE_COLORS.size()]
	var center := Vector2(32, 32)
	var radius: float = 30.0

	for y in range(64):
		for x in range(64):
			var pos := Vector2(x, y)
			var dist: float = pos.distance_to(center)
			if dist <= radius:
				# Radial gradient for body
				var t: float = dist / radius
				var col: Color = _base_color.lerp(face_color, (1.0 - t) * 0.5)
				# Add slight highlight at top-left
				var highlight: float = maxf(0.0, 1.0 - pos.distance_to(Vector2(24, 22)) / 20.0)
				col = col.lerp(Color.WHITE, highlight * 0.4)
				img.set_pixel(x, y, col)
			else:
				img.set_pixel(x, y, Color(0, 0, 0, 0))

	# Draw simple face - eyes
	_draw_circle_on_image(img, Vector2i(24, 30), 3, Color(0.15, 0.1, 0.1))
	_draw_circle_on_image(img, Vector2i(40, 30), 3, Color(0.15, 0.1, 0.1))
	# Eye highlights
	_draw_circle_on_image(img, Vector2i(25, 29), 1, Color.WHITE)
	_draw_circle_on_image(img, Vector2i(41, 29), 1, Color.WHITE)
	# Mouth (small smile - curve upward)
	for mx in range(27, 38):
		var dist_from_center: float = abs(mx - 32)
		var my: int = 40 - int(dist_from_center * 0.4)
		if my >= 0 and my < 64 and mx >= 0 and mx < 64:
			img.set_pixel(mx, my, Color(0.2, 0.1, 0.1))
			if my + 1 < 64:
				img.set_pixel(mx, my + 1, Color(0.2, 0.1, 0.1))

	var tex := ImageTexture.create_from_image(img)
	sprite.texture = tex

func _draw_circle_on_image(img: Image, center: Vector2i, rad: int, col: Color) -> void:
	for dy in range(-rad, rad + 1):
		for dx in range(-rad, rad + 1):
			if dx * dx + dy * dy <= rad * rad:
				var px: int = center.x + dx
				var py: int = center.y + dy
				if px >= 0 and px < img.get_width() and py >= 0 and py < img.get_height():
					img.set_pixel(px, py, col)

func set_chained(value: bool) -> void:
	_is_chained = value
	if sprite:
		if value:
			sprite.modulate = Color(1.2, 1.2, 1.2, 1.0)
			sprite.scale = Vector2(1.15, 1.15)
		else:
			sprite.modulate = Color.WHITE
			sprite.scale = Vector2(1.0, 1.0)

func set_connectable(value: bool) -> void:
	_is_connectable = value
	if sprite:
		if value and not _is_chained:
			sprite.modulate = Color(1.0, 1.0, 1.0, 0.7)
		elif not _is_chained:
			sprite.modulate = Color.WHITE

func _input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			clicked.emit(self)
	elif event is InputEventMouseMotion:
		if Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
			entered.emit(self)

func pop_animation() -> void:
	var tween = create_tween()
	tween.tween_property(sprite, ^"scale", Vector2(1.5, 1.5), 0.1)
	tween.parallel().tween_property(sprite, ^"modulate:a", 0.0, 0.15)
	tween.tween_callback(queue_free)
