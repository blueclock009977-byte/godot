extends GutTest

class TestBattleBase extends BattleBase:
	var game_end_called: bool = false
	var game_end_win: bool = false

	func _update_all_ui() -> void:
		pass

	func _game_end(win: bool) -> void:
		game_end_called = true
		game_end_win = win

func test_apply_effect_result_heal_player_applies_to_owner_hp() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 10

	battle._apply_effect_result({"heal_player": 3}, true)

	assert_eq(battle.player_hp, 13, "heal_player should increase owner HP")
	battle.free()

func test_apply_effect_result_heal_player_full_sets_owner_to_max_hp() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 4
	battle.opponent_hp = 7

	battle._apply_effect_result({"heal_player_full": true}, true)

	assert_eq(battle.player_hp, BattleConstants.MAX_HP, "heal_player_full should restore owner to max HP")
	assert_eq(battle.opponent_hp, 7, "heal_player_full should not affect opponent HP")
	battle.free()

func test_apply_effect_result_heal_player_applies_to_opponent_side_when_is_player_false() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 10
	battle.opponent_hp = 9

	battle._apply_effect_result({"heal_player": 3}, false)

	assert_eq(battle.player_hp, 10, "heal_player should not affect player side when is_player is false")
	assert_eq(battle.opponent_hp, 12, "heal_player should increase opponent owner HP")
	battle.free()

func test_apply_effect_result_heal_player_full_applies_to_opponent_side_when_is_player_false() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 10
	battle.opponent_hp = 2

	battle._apply_effect_result({"heal_player_full": true}, false)

	assert_eq(battle.player_hp, 10, "heal_player_full should not affect player side when is_player is false")
	assert_eq(battle.opponent_hp, BattleConstants.MAX_HP, "heal_player_full should restore opponent owner to max HP")
	battle.free()

func test_apply_effect_result_direct_damage_triggers_game_end() -> void:
	var battle := TestBattleBase.new()
	battle.opponent_hp = 1

	battle._apply_effect_result({"direct_damage": 1}, true)

	assert_true(battle.game_end_called, "lethal direct_damage should trigger game end")
	assert_true(battle.game_end_win, "player lethal direct_damage should be win")
	battle.free()

func test_apply_effect_result_self_damage_triggers_game_end() -> void:
	var battle := TestBattleBase.new()
	battle.player_hp = 1

	battle._apply_effect_result({"self_damage": 1}, true)

	assert_true(battle.game_end_called, "lethal self_damage should trigger game end")
	assert_false(battle.game_end_win, "player lethal self_damage should be loss")
	battle.free()
