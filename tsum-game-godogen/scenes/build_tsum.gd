extends SceneTree
## Scene builder — run: timeout 60 godot --headless --script scenes/build_tsum.gd

func _initialize() -> void:
	var root := RigidBody2D.new()
	root.name = "Tsum"
	root.set_script(load("res://scripts/tsum.gd"))
	root.gravity_scale = 1.0
	root.physics_material_override = PhysicsMaterial.new()
	root.physics_material_override.bounce = 0.3
	root.physics_material_override.friction = 0.5

	var collision := CollisionShape2D.new()
	collision.name = "CollisionShape2D"
	var shape := CircleShape2D.new()
	shape.radius = 30.0
	collision.shape = shape
	root.add_child(collision)

	var sprite := Sprite2D.new()
	sprite.name = "Sprite2D"
	root.add_child(sprite)

	_set_owners(root, root)
	var packed := PackedScene.new()
	packed.pack(root)
	ResourceSaver.save(packed, "res://scenes/tsum.tscn")
	print("Saved: res://scenes/tsum.tscn")
	quit(0)

func _set_owners(node: Node, owner: Node) -> void:
	for c in node.get_children():
		c.owner = owner
		if c.scene_file_path.is_empty():
			_set_owners(c, owner)
