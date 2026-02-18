class_name CardData
extends Resource

enum ColorType { GRAY, BLUE, GREEN, BLACK, RED, YELLOW, PURPLE, WHITE }

@export var id: int = 0
@export var card_name: String = ""
@export var mana_cost: int = 1
@export var hp: int = 1
@export var atk: int = 1
@export var attack_dice: Array[int] = []
@export var color: Color = Color.WHITE
@export var color_type: ColorType = ColorType.GRAY
@export var effect_id: String = ""  # 例: "blue_001", "green_005"
@export var icon_name: String = "default"

func duplicate_card() -> CardData:
	var copy := CardData.new()
	copy.id = id
	copy.card_name = card_name
	copy.mana_cost = mana_cost
	copy.hp = hp
	copy.atk = atk
	copy.attack_dice = attack_dice.duplicate()
	copy.color = color
	copy.color_type = color_type
	copy.effect_id = effect_id
	copy.icon_name = icon_name
	return copy

func has_effect() -> bool:
	return effect_id != ""

func get_color_name() -> String:
	match color_type:
		ColorType.GRAY: return "グレー"
		ColorType.BLUE: return "青"
		ColorType.GREEN: return "緑"
		ColorType.BLACK: return "黒"
		ColorType.RED: return "赤"
		ColorType.YELLOW: return "黄"
		ColorType.PURPLE: return "紫"
		ColorType.WHITE: return "白"
	return "不明"
