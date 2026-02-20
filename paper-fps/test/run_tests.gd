extends SceneTree

## スタンドアロンテストランナー

var passed := 0
var failed := 0
var total := 0

func _init() -> void:
	print("=".repeat(50))
	print("Paper FPS - Unit Tests")
	print("=".repeat(50))
	
	# テスト実行
	test_hitbox_scale_front()
	test_hitbox_scale_side()
	test_hitbox_scale_behind()
	test_hitbox_width_calculation()
	test_damage_range()
	
	# 結果表示
	print("=".repeat(50))
	print("Results: %d passed, %d failed / %d total" % [passed, failed, total])
	print("=".repeat(50))
	
	if failed > 0:
		quit(1)
	else:
		quit(0)

func assert_almost_eq(a: float, b: float, tolerance: float, msg: String) -> void:
	total += 1
	if abs(a - b) <= tolerance:
		passed += 1
		print("  PASS: %s (%.3f ≈ %.3f)" % [msg, a, b])
	else:
		failed += 1
		print("  FAIL: %s (got %.3f, expected %.3f)" % [msg, a, b])

func assert_true(condition: bool, msg: String) -> void:
	total += 1
	if condition:
		passed += 1
		print("  PASS: %s" % msg)
	else:
		failed += 1
		print("  FAIL: %s" % msg)

# ─── Hitbox Scale Tests ───

func _calc_scale(player_forward: Vector3, enemy_pos: Vector3) -> float:
	var player_pos := Vector3.ZERO
	var to_enemy := (enemy_pos - player_pos).normalized()
	var dot := player_forward.dot(to_enemy)
	var angle := acos(clamp(dot, -1.0, 1.0))
	return lerp(1.0, 0.8, abs(sin(angle)))

func test_hitbox_scale_front() -> void:
	print("\n[Test] Hitbox Scale - Front")
	var scale := _calc_scale(Vector3(0, 0, -1), Vector3(0, 0, -10))
	assert_almost_eq(scale, 1.0, 0.01, "正面からの攻撃は1.0倍")

func test_hitbox_scale_side() -> void:
	print("\n[Test] Hitbox Scale - Side")
	var scale := _calc_scale(Vector3(0, 0, -1), Vector3(10, 0, 0))
	assert_almost_eq(scale, 0.8, 0.01, "横からの攻撃は0.8倍")

func test_hitbox_scale_behind() -> void:
	print("\n[Test] Hitbox Scale - Behind")
	var scale := _calc_scale(Vector3(0, 0, -1), Vector3(0, 0, 10))
	assert_almost_eq(scale, 1.0, 0.01, "後ろからの攻撃も1.0倍")

func test_hitbox_width_calculation() -> void:
	print("\n[Test] Hitbox Width")
	var width_front: float = lerp(0.8, 0.1, 0.0)
	var width_side: float = lerp(0.8, 0.1, 1.0)
	assert_almost_eq(width_front, 0.8, 0.01, "正面向きの幅は0.8")
	assert_almost_eq(width_side, 0.1, 0.01, "横向きの幅は0.1")

func test_damage_range() -> void:
	print("\n[Test] Damage Range")
	# ダメージ倍率は0.8〜1.0の範囲
	var angles: Array[float] = [0.0, 0.25, 0.5, 0.75, 1.0]
	for angle: float in angles:
		var scale: float = lerp(1.0, 0.8, angle)
		assert_true(scale >= 0.8 and scale <= 1.0, "scale %.2f is in range [0.8, 1.0]" % scale)
