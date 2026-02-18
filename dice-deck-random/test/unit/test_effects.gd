extends GutTest

func test_effect_manager_exists() -> void:
	# EffectManagerがautoloadとして存在するか
	assert_not_null(EffectManager, "EffectManager should exist as autoload")

func test_effect_definitions_registered() -> void:
	# 効果定義が登録されているか
	assert_true(EffectManager.effect_definitions.size() > 0, "Should have effect definitions")

func test_blue_effects_registered() -> void:
	# 青効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("blue_001"), "blue_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("blue_018"), "blue_018 should be registered")

func test_green_effects_registered() -> void:
	# 緑効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("green_001"), "green_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("green_016"), "green_016 should be registered")

func test_black_effects_registered() -> void:
	# 黒効果が登録されているか
	assert_true(EffectManager.effect_definitions.has("black_001"), "black_001 should be registered")
	assert_true(EffectManager.effect_definitions.has("black_019"), "black_019 should be registered")

func test_get_effect_description() -> void:
	# 効果説明を取得できるか
	var desc := EffectManager.get_effect_description("blue_001")
	assert_eq(desc, "登場時:敵1体ATK-1", "Should return correct description")

func test_get_effect_timing() -> void:
	# 効果タイミングを取得できるか
	var timing := EffectManager.get_effect_timing("blue_001")
	assert_eq(timing, EffectManager.Timing.ON_SUMMON, "blue_001 should be ON_SUMMON")

	timing = EffectManager.get_effect_timing("blue_003")
	assert_eq(timing, EffectManager.Timing.ON_ATTACK, "blue_003 should be ON_ATTACK")

	timing = EffectManager.get_effect_timing("green_002")
	assert_eq(timing, EffectManager.Timing.ON_DEATH, "green_002 should be ON_DEATH")

func test_has_timing() -> void:
	# タイミング判定が正しいか
	assert_true(EffectManager.has_timing("blue_001", EffectManager.Timing.ON_SUMMON))
	assert_false(EffectManager.has_timing("blue_001", EffectManager.Timing.ON_ATTACK))

func test_unknown_effect() -> void:
	# 未知の効果IDの場合
	var desc := EffectManager.get_effect_description("unknown_effect")
	assert_eq(desc, "", "Unknown effect should return empty string")
