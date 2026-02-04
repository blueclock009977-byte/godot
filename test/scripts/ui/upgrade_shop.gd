extends Control

@onready var gold_label: Label = $GoldLabel
@onready var item_container: VBoxContainer = $ScrollContainer/ItemContainer

const UPGRADE_NAMES := {
	"sword_damage": "剣ダメージ",
	"bow_damage": "弓ダメージ",
	"bow_ammo": "弓弾数",
	"attack_speed": "攻撃速度",
	"dash_distance": "ダッシュ距離",
	"dash_cooldown": "ダッシュ回復",
	"roll_invincible": "ローリング無敵",
	"jump_power": "ジャンプ力",
	"max_hp": "最大HP",
	"damage_reduction": "被ダメ軽減"
}

func _ready() -> void:
	_update_display()
	$BackButton.pressed.connect(_on_back_pressed)

func _update_display() -> void:
	gold_label.text = "所持G: " + str(PlayerDataManager.gold)

	for child in item_container.get_children():
		child.queue_free()

	await get_tree().process_frame

	for key in UPGRADE_NAMES.keys():
		var item = _create_upgrade_item(key, UPGRADE_NAMES[key])
		item_container.add_child(item)

func _create_upgrade_item(key: String, display_name: String) -> HBoxContainer:
	var container = HBoxContainer.new()
	container.custom_minimum_size.y = 50

	var name_label = Label.new()
	name_label.text = display_name
	name_label.custom_minimum_size.x = 200
	container.add_child(name_label)

	var level_label = Label.new()
	var level = PlayerDataManager.upgrades[key]
	level_label.text = "Lv." + str(level) + "/5"
	level_label.custom_minimum_size.x = 100
	container.add_child(level_label)

	var buy_button = Button.new()
	if level >= 5:
		buy_button.text = "MAX"
		buy_button.disabled = true
	else:
		var cost = PlayerDataManager.get_upgrade_cost(key)
		buy_button.text = str(cost) + "G"
		buy_button.disabled = PlayerDataManager.gold < cost
		buy_button.pressed.connect(_on_buy_pressed.bind(key))
	buy_button.custom_minimum_size.x = 120
	container.add_child(buy_button)

	return container

func _on_buy_pressed(upgrade_key: String) -> void:
	if PlayerDataManager.buy_upgrade(upgrade_key):
		_update_display()

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
