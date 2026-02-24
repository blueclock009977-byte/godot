extends Node

## ゲーム設定管理（Autoload）

const SAVE_PATH := "user://settings.cfg"

# 感度設定
var mouse_sensitivity: float = 0.003:
	set(value):
		mouse_sensitivity = clampf(value, 0.0005, 0.01)
		settings_changed.emit()

# 音量設定
var master_volume: float = 1.0:
	set(value):
		master_volume = clampf(value, 0.0, 1.0)
		_apply_audio_settings()
		settings_changed.emit()

var sfx_volume: float = 1.0:
	set(value):
		sfx_volume = clampf(value, 0.0, 1.0)
		_apply_audio_settings()
		settings_changed.emit()

var bgm_volume: float = 1.0:
	set(value):
		bgm_volume = clampf(value, 0.0, 1.0)
		_apply_audio_settings()
		settings_changed.emit()

# Y軸反転
var invert_y: bool = false:
	set(value):
		invert_y = value
		settings_changed.emit()

signal settings_changed

func _ready() -> void:
	load_settings()

func save_settings() -> void:
	var config := ConfigFile.new()
	
	config.set_value("controls", "mouse_sensitivity", mouse_sensitivity)
	config.set_value("controls", "invert_y", invert_y)
	config.set_value("audio", "master_volume", master_volume)
	config.set_value("audio", "sfx_volume", sfx_volume)
	config.set_value("audio", "bgm_volume", bgm_volume)
	
	var err := config.save(SAVE_PATH)
	if err != OK:
		push_error("Failed to save settings: %s" % err)

func load_settings() -> void:
	var config := ConfigFile.new()
	var err := config.load(SAVE_PATH)
	
	if err != OK:
		# ファイルがない場合はデフォルト値を使用
		return
	
	mouse_sensitivity = config.get_value("controls", "mouse_sensitivity", 0.003)
	invert_y = config.get_value("controls", "invert_y", false)
	master_volume = config.get_value("audio", "master_volume", 1.0)
	sfx_volume = config.get_value("audio", "sfx_volume", 1.0)
	bgm_volume = config.get_value("audio", "bgm_volume", 1.0)

func reset_to_defaults() -> void:
	mouse_sensitivity = 0.003
	invert_y = false
	master_volume = 1.0
	sfx_volume = 1.0
	bgm_volume = 1.0

func _apply_audio_settings() -> void:
	# オーディオバス設定（あれば）
	if AudioServer.get_bus_index("Master") >= 0:
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(master_volume))
	if AudioServer.get_bus_index("SFX") >= 0:
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"), linear_to_db(sfx_volume))
	if AudioServer.get_bus_index("BGM") >= 0:
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index("BGM"), linear_to_db(bgm_volume))
