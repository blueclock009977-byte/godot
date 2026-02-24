extends GutTest

## 敵システムのテスト

func test_enemy_initial_stats() -> void:
	var enemy_scene: PackedScene = load("res://scenes/enemy/basic_enemy.tscn")
	var enemy: Node3D = enemy_scene.instantiate()
	add_child_autofree(enemy)
	
	assert_eq(enemy.get("enemy_name"), "Basic Enemy", "敵名が正しい")
	assert_eq(enemy.get("max_hp"), 50, "最大HPが正しい")
	assert_eq(enemy.get("hp"), 50, "初期HPが満タン")
	assert_eq(enemy.get("damage"), 10, "ダメージが正しい")
	assert_false(enemy.get("is_dead"), "初期状態は生存")

func test_enemy_take_damage() -> void:
	var enemy_scene: PackedScene = load("res://scenes/enemy/basic_enemy.tscn")
	var enemy: Node3D = enemy_scene.instantiate()
	add_child_autofree(enemy)
	
	enemy.call("take_damage", 20, Vector3.ZERO)
	assert_eq(enemy.get("hp"), 30, "ダメージ後のHP")
	assert_false(enemy.get("is_dead"), "まだ生存")

func test_enemy_death() -> void:
	var enemy_scene: PackedScene = load("res://scenes/enemy/basic_enemy.tscn")
	var enemy: Node3D = enemy_scene.instantiate()
	add_child_autofree(enemy)
	
	# 致死ダメージ
	enemy.call("take_damage", 100, Vector3.ZERO)
	assert_eq(enemy.get("hp"), 0, "HPが0以下にならない")
	assert_true(enemy.get("is_dead"), "死亡状態")
