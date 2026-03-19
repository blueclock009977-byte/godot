extends SceneTree
## Scene builder — run: timeout 60 godot --headless --script scenes/build_party_edit.gd

func _initialize() -> void:
	var root := Control.new()
	root.name = "PartyEdit"
	root.set_script(load("res://scripts/party_edit.gd"))
	root.anchors_preset = 15

	var vbox := VBoxContainer.new()
	vbox.name = "VBoxContainer"
	vbox.anchors_preset = 15
	root.add_child(vbox)

	var grid := GridContainer.new()
	grid.name = "CharacterGrid"
	grid.columns = 5
	vbox.add_child(grid)

	var party_container := HBoxContainer.new()
	party_container.name = "PartySlots"
	vbox.add_child(party_container)

	var start_btn := Button.new()
	start_btn.name = "StartButton"
	start_btn.text = "Start Game"
	vbox.add_child(start_btn)

	_set_owners(root, root)
	var packed := PackedScene.new()
	packed.pack(root)
	ResourceSaver.save(packed, "res://scenes/party_edit.tscn")
	print("Saved: res://scenes/party_edit.tscn")
	quit(0)

func _set_owners(node: Node, owner: Node) -> void:
	for c in node.get_children():
		c.owner = owner
		if c.scene_file_path.is_empty():
			_set_owners(c, owner)
