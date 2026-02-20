extends Node3D

## メインゲームシーン

@onready var player: Player = $Player
@onready var hud: CanvasLayer = $HUD
@onready var hp_label: Label = $HUD/HPLabel
@onready var ammo_label: Label = $HUD/AmmoLabel
@onready var crosshair: TextureRect = $HUD/Crosshair
@onready var weapon_label: Label = $HUD/WeaponLabel

var enemies_killed: int = 0

func _ready() -> void:
	# プレイヤーのシグナル接続
	player.hp_changed.connect(_on_player_hp_changed)
	player.player_died.connect(_on_player_died)
	player.add_to_group("player")
	
	# 武器のシグナル接続
	_connect_weapon_signals()
	
	# 初期UI更新
	_on_player_hp_changed(player.hp, player.max_hp)
	
	# 敵をスポーン
	_spawn_enemies()

func _connect_weapon_signals() -> void:
	for weapon in player.weapons:
		weapon.ammo_changed.connect(_on_ammo_changed)
		weapon.reloading_started.connect(_on_reload_started)
		weapon.reloading_finished.connect(_on_reload_finished)
	
	if player.current_weapon:
		_update_weapon_display()

func _on_player_hp_changed(current_hp: int, max_hp: int) -> void:
	hp_label.text = "HP: %d / %d" % [current_hp, max_hp]
	
	# HPが低いと赤くなる
	if current_hp < max_hp * 0.3:
		hp_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
	else:
		hp_label.add_theme_color_override("font_color", Color(1, 1, 1))

func _on_player_died() -> void:
	# ゲームオーバー処理
	var game_over := Label.new()
	game_over.text = "GAME OVER\n\nKills: %d\n\nPress R to restart" % enemies_killed
	game_over.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	game_over.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	game_over.add_theme_font_size_override("font_size", 48)
	game_over.add_theme_color_override("font_color", Color(1, 0.3, 0.3))
	game_over.set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	hud.add_child(game_over)
	
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	set_process_input(true)

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("reload") and player.hp <= 0:
		get_tree().reload_current_scene()

func _on_ammo_changed(current: int, max_ammo: int) -> void:
	ammo_label.text = "Ammo: %d / %d" % [current, max_ammo]

func _on_reload_started() -> void:
	ammo_label.text = "Reloading..."
	ammo_label.add_theme_color_override("font_color", Color(1, 1, 0.3))

func _on_reload_finished() -> void:
	ammo_label.remove_theme_color_override("font_color")

func _update_weapon_display() -> void:
	if player.current_weapon:
		weapon_label.text = player.current_weapon.weapon_name
		_on_ammo_changed(player.current_weapon.current_ammo, player.current_weapon.magazine_size)

func _spawn_enemies() -> void:
	var enemy_scene := preload("res://scenes/enemy/basic_enemy.tscn")
	
	# 敵を複数スポーン
	var spawn_positions := [
		Vector3(10, 0, 10),
		Vector3(-10, 0, 10),
		Vector3(15, 0, -5),
		Vector3(-15, 0, -10),
		Vector3(0, 0, 20),
	]
	
	for pos in spawn_positions:
		var enemy := enemy_scene.instantiate()
		enemy.global_position = pos
		enemy.enemy_died.connect(_on_enemy_died)
		add_child(enemy)

func _on_enemy_died(_enemy: EnemyBase) -> void:
	enemies_killed += 1
	
	# 全滅チェック
	var remaining := get_tree().get_nodes_in_group("enemies").size()
	if remaining <= 1:  # 死んだ敵がまだグループにいる可能性
		_spawn_more_enemies()

func _spawn_more_enemies() -> void:
	# 追加の敵をスポーン
	await get_tree().create_timer(2.0).timeout
	_spawn_enemies()
