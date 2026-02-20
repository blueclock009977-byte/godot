extends GutTest

## 武器システムのテスト

func test_pistol_stats() -> void:
	# ピストルのステータス確認
	var pistol_scene: PackedScene = load("res://scenes/weapons/pistol.tscn")
	var pistol: WeaponBase = pistol_scene.instantiate()
	add_child_autofree(pistol)
	
	assert_eq(pistol.weapon_name, "Pistol", "武器名が正しい")
	assert_eq(pistol.damage, 20, "ダメージが正しい")
	assert_eq(pistol.magazine_size, 12, "弾数が正しい")
	assert_eq(pistol.current_ammo, 12, "初期弾数が満タン")

func test_shotgun_stats() -> void:
	var shotgun_scene: PackedScene = load("res://scenes/weapons/shotgun.tscn")
	var shotgun: WeaponBase = shotgun_scene.instantiate()
	add_child_autofree(shotgun)
	
	assert_eq(shotgun.weapon_name, "Shotgun", "武器名が正しい")
	assert_eq(shotgun.bullets_per_shot, 8, "散弾数が正しい")
	assert_eq(shotgun.spread, 8.0, "スプレッドが正しい")

func test_assault_stats() -> void:
	var assault_scene: PackedScene = load("res://scenes/weapons/assault.tscn")
	var assault: WeaponBase = assault_scene.instantiate()
	add_child_autofree(assault)
	
	assert_eq(assault.weapon_name, "Assault Rifle", "武器名が正しい")
	assert_eq(assault.fire_rate, 0.1, "発射レートが正しい")
	assert_eq(assault.magazine_size, 30, "弾数が正しい")

func test_sniper_stats() -> void:
	var sniper_scene: PackedScene = load("res://scenes/weapons/sniper.tscn")
	var sniper: WeaponBase = sniper_scene.instantiate()
	add_child_autofree(sniper)
	
	assert_eq(sniper.weapon_name, "Sniper Rifle", "武器名が正しい")
	assert_eq(sniper.damage, 100, "ダメージが正しい")
	assert_eq(sniper.spread, 0.0, "スプレッドがゼロ")
