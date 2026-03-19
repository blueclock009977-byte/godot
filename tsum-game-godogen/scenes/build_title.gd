extends SceneTree
## Scene builder — run: timeout 60 godot --headless --script scenes/build_title.gd

func _initialize() -> void:
	var root := Control.new()
	root.name = "Title"
	root.set_script(load("res://scripts/title.gd"))
	root.anchors_preset = 15  # full rect

	var vbox := VBoxContainer.new()
	vbox.name = "VBoxContainer"
	vbox.anchors_preset = 8  # center
	vbox.grow_horizontal = Control.GROW_DIRECTION_BOTH
	vbox.grow_vertical = Control.GROW_DIRECTION_BOTH
	root.add_child(vbox)

	var title_label := Label.new()
	title_label.name = "TitleLabel"
	title_label.text = "Tsum Puzzle"
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(title_label)

	var start_btn := Button.new()
	start_btn.name = "StartButton"
	start_btn.text = "Start Game"
	vbox.add_child(start_btn)

	var party_btn := Button.new()
	party_btn.name = "PartyButton"
	party_btn.text = "Party Edit"
	vbox.add_child(party_btn)

	_set_owners(root, root)
	var packed := PackedScene.new()
	packed.pack(root)
	ResourceSaver.save(packed, "res://scenes/title.tscn")
	print("Saved: res://scenes/title.tscn")
	quit(0)

func _set_owners(node: Node, owner: Node) -> void:
	for c in node.get_children():
		c.owner = owner
		if c.scene_file_path.is_empty():
			_set_owners(c, owner)
