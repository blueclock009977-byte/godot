extends SceneTree
## Scene builder — run: timeout 60 godot --headless --script scenes/build_main.gd

func _initialize() -> void:
	var root := Node2D.new()
	root.name = "Main"
	root.set_script(load("res://scripts/main.gd"))

	var game_field = load("res://scenes/game_field.tscn").instantiate()
	game_field.name = "GameField"
	root.add_child(game_field)

	var canvas_layer := CanvasLayer.new()
	canvas_layer.name = "UILayer"
	canvas_layer.layer = 1
	root.add_child(canvas_layer)

	var ui := Control.new()
	ui.name = "UI"
	ui.set_script(load("res://scripts/ui_manager.gd"))
	ui.anchors_preset = 15
	canvas_layer.add_child(ui)

	_set_owners(root, root)
	var packed := PackedScene.new()
	packed.pack(root)
	ResourceSaver.save(packed, "res://scenes/main.tscn")
	print("Saved: res://scenes/main.tscn")
	quit(0)

func _set_owners(node: Node, owner: Node) -> void:
	for c in node.get_children():
		c.owner = owner
		if c.scene_file_path.is_empty():
			_set_owners(c, owner)
