class_name CardData
extends Resource

@export var id: int = 0
@export var card_name: String = ""
@export var hp: int = 1
@export var atk: int = 1
@export var summon_dice: Array[int] = []
@export var attack_dice: Array[int] = []
@export var effect_type: String = "none"  # "none", "on_summon", "on_destroy", "passive", "auto_trigger"
@export var effect_id: int = 0
@export var effect_description: String = ""
@export var color: Color = Color.WHITE
@export var icon_name: String = "default"

func duplicate_card() -> CardData:
	var copy := CardData.new()
	copy.id = id
	copy.card_name = card_name
	copy.hp = hp
	copy.atk = atk
	copy.summon_dice = summon_dice.duplicate()
	copy.attack_dice = attack_dice.duplicate()
	copy.effect_type = effect_type
	copy.effect_id = effect_id
	copy.effect_description = effect_description
	copy.color = color
	copy.icon_name = icon_name
	return copy
