extends GutTest

## 当たり判定・ダメージ倍率のテスト

func test_hitbox_scale_front() -> void:
	# 正面からの攻撃 = 1.0倍
	var player_pos := Vector3(0, 0, 0)
	var player_forward := Vector3(0, 0, -1)  # プレイヤーは-Z方向を向いている
	var enemy_pos := Vector3(0, 0, -10)  # 敵は正面にいる
	
	var to_enemy := (enemy_pos - player_pos).normalized()
	var dot := player_forward.dot(to_enemy)
	var angle := acos(clamp(dot, -1.0, 1.0))
	var scale := lerp(1.0, 0.8, abs(sin(angle)))
	
	assert_almost_eq(scale, 1.0, 0.01, "正面からの攻撃は1.0倍")

func test_hitbox_scale_side() -> void:
	# 横からの攻撃 = 0.8倍
	var player_pos := Vector3(0, 0, 0)
	var player_forward := Vector3(0, 0, -1)  # プレイヤーは-Z方向を向いている
	var enemy_pos := Vector3(10, 0, 0)  # 敵は横にいる
	
	var to_enemy := (enemy_pos - player_pos).normalized()
	var dot := player_forward.dot(to_enemy)
	var angle := acos(clamp(dot, -1.0, 1.0))
	var scale := lerp(1.0, 0.8, abs(sin(angle)))
	
	assert_almost_eq(scale, 0.8, 0.01, "横からの攻撃は0.8倍")

func test_hitbox_scale_behind() -> void:
	# 後ろからの攻撃 = 1.0倍（正面と同じ）
	var player_pos := Vector3(0, 0, 0)
	var player_forward := Vector3(0, 0, -1)
	var enemy_pos := Vector3(0, 0, 10)  # 敵は後ろにいる
	
	var to_enemy := (enemy_pos - player_pos).normalized()
	var dot := player_forward.dot(to_enemy)
	var angle := acos(clamp(dot, -1.0, 1.0))
	var scale := lerp(1.0, 0.8, abs(sin(angle)))
	
	assert_almost_eq(scale, 1.0, 0.01, "後ろからの攻撃も1.0倍")

func test_hitbox_scale_diagonal() -> void:
	# 斜め45度からの攻撃
	var player_pos := Vector3(0, 0, 0)
	var player_forward := Vector3(0, 0, -1)
	var enemy_pos := Vector3(10, 0, -10).normalized() * 10  # 45度
	
	var to_enemy := (enemy_pos - player_pos).normalized()
	var dot := player_forward.dot(to_enemy)
	var angle := acos(clamp(dot, -1.0, 1.0))
	var scale := lerp(1.0, 0.8, abs(sin(angle)))
	
	# 45度 = sin(45°) ≈ 0.707 → scale ≈ 0.86
	assert_true(scale > 0.8 and scale < 1.0, "斜めからの攻撃は0.8〜1.0の間")

func test_hitbox_width_calculation() -> void:
	# 当たり判定の幅計算
	# 正面向き = 0.8、横向き = 0.1
	
	# 正面（forward.x = 0）
	var width_front := lerp(0.8, 0.1, 0.0)
	assert_almost_eq(width_front, 0.8, 0.01, "正面向きの幅は0.8")
	
	# 横（forward.x = 1）
	var width_side := lerp(0.8, 0.1, 1.0)
	assert_almost_eq(width_side, 0.1, 0.01, "横向きの幅は0.1")
