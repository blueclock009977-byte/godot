extends Node

var card_pool: Array = []

func _ready() -> void:
	_generate_card_pool()

func _generate_card_pool() -> void:
	pass

func get_card_by_id(id: int):
	for card in card_pool:
		if card.id == id:
			return card
	return null
