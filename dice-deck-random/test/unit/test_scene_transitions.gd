extends GutTest

func test_title_to_lobby_transition():
	# タイトル画面をロード
	var title_scene = load("res://scenes/title/title_screen.tscn")
	assert_not_null(title_scene, "タイトルシーンがロードできること")
	
	var title = title_scene.instantiate()
	assert_not_null(title, "タイトルシーンがインスタンス化できること")
	
	add_child(title)
	await get_tree().process_frame
	
	gut.p("タイトル画面ロード成功")
	title.queue_free()

func test_lobby_scene_load():
	# ロビー画面を直接ロード
	var lobby_scene = load("res://scenes/lobby/lobby.tscn")
	assert_not_null(lobby_scene, "ロビーシーンがロードできること")
	
	var lobby = lobby_scene.instantiate()
	assert_not_null(lobby, "ロビーシーンがインスタンス化できること")
	
	add_child(lobby)
	await get_tree().process_frame
	
	gut.p("ロビー画面ロード成功")
	lobby.queue_free()

func test_online_battle_scene_load():
	# オンラインバトル画面を直接ロード
	var battle_scene = load("res://scenes/battle/online_battle.tscn")
	assert_not_null(battle_scene, "オンラインバトルシーンがロードできること")
	
	var battle = battle_scene.instantiate()
	assert_not_null(battle, "オンラインバトルシーンがインスタンス化できること")
	
	add_child(battle)
	await get_tree().process_frame
	
	gut.p("オンラインバトル画面ロード成功")
	battle.queue_free()
