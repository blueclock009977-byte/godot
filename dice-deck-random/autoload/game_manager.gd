extends Node

enum GameState { TITLE, DECK_EDIT, BATTLE, RESULT }

var current_state: GameState = GameState.TITLE
var player_deck: Array = []
var battle_result: String = ""

func change_scene(scene_path: String) -> void:
	get_tree().change_scene_to_file(scene_path)
