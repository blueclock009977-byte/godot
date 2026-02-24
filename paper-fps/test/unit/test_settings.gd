extends GutTest

## 設定システムのテスト

func test_default_sensitivity() -> void:
	# デフォルト値の確認
	var settings: Node = get_node_or_null("/root/GameSettings")
	if settings == null:
		# Autoloadがない場合はスキップ
		pending("GameSettings not loaded as autoload")
		return
	
	assert_almost_eq(settings.mouse_sensitivity, 0.003, 0.0001, "デフォルト感度")

func test_sensitivity_clamping() -> void:
	var settings: Node = get_node_or_null("/root/GameSettings")
	if settings == null:
		pending("GameSettings not loaded as autoload")
		return
	
	# 下限テスト
	settings.mouse_sensitivity = 0.0001
	assert_gte(settings.mouse_sensitivity, 0.0005, "感度の下限")
	
	# 上限テスト
	settings.mouse_sensitivity = 0.1
	assert_lte(settings.mouse_sensitivity, 0.01, "感度の上限")
	
	# リセット
	settings.mouse_sensitivity = 0.003

func test_invert_y_default() -> void:
	var settings: Node = get_node_or_null("/root/GameSettings")
	if settings == null:
		pending("GameSettings not loaded as autoload")
		return
	
	assert_false(settings.invert_y, "Y軸反転はデフォルトでオフ")

func test_volume_defaults() -> void:
	var settings: Node = get_node_or_null("/root/GameSettings")
	if settings == null:
		pending("GameSettings not loaded as autoload")
		return
	
	assert_almost_eq(settings.master_volume, 1.0, 0.01, "マスター音量")
	assert_almost_eq(settings.sfx_volume, 1.0, 0.01, "SE音量")
	assert_almost_eq(settings.bgm_volume, 1.0, 0.01, "BGM音量")
