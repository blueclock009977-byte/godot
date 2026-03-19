extends SceneTree
## Scene builder — run: timeout 60 godot --headless --script scenes/build_game_field.gd

func _initialize() -> void:
	var root := Node2D.new()
	root.name = "GameField"
	root.set_script(load("res://scripts/game_field.gd"))

	_set_owners(root, root)
	var packed := PackedScene.new()
	packed.pack(root)
	ResourceSaver.save(packed, "res://scenes/game_field.tscn")
	print("Saved: res://scenes/game_field.tscn")
	quit(0)

func _set_owners(node: Node, owner: Node) -> void:
	for c in node.get_children():
		c.owner = owner
		if c.scene_file_path.is_empty():
			_set_owners(c, owner)
