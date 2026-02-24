extends Control
class_name SettingsMenu

## 設定画面

@onready var sensitivity_slider: HSlider = $VBoxContainer/SensitivityRow/SensitivitySlider
@onready var sensitivity_label: Label = $VBoxContainer/SensitivityRow/SensitivityValue
@onready var invert_y_check: CheckBox = $VBoxContainer/InvertYRow/InvertYCheck
@onready var master_slider: HSlider = $VBoxContainer/MasterRow/MasterSlider
@onready var sfx_slider: HSlider = $VBoxContainer/SFXRow/SFXSlider
@onready var bgm_slider: HSlider = $VBoxContainer/BGMRow/BGMSlider

signal closed

func _ready() -> void:
	_load_current_settings()
	_connect_signals()

func _load_current_settings() -> void:
	# 感度（0.0005〜0.01を0〜100に変換）
	sensitivity_slider.value = _sensitivity_to_slider(GameSettings.mouse_sensitivity)
	_update_sensitivity_label()
	
	invert_y_check.button_pressed = GameSettings.invert_y
	master_slider.value = GameSettings.master_volume * 100
	sfx_slider.value = GameSettings.sfx_volume * 100
	bgm_slider.value = GameSettings.bgm_volume * 100

func _connect_signals() -> void:
	sensitivity_slider.value_changed.connect(_on_sensitivity_changed)
	invert_y_check.toggled.connect(_on_invert_y_toggled)
	master_slider.value_changed.connect(_on_master_changed)
	sfx_slider.value_changed.connect(_on_sfx_changed)
	bgm_slider.value_changed.connect(_on_bgm_changed)

func _sensitivity_to_slider(sens: float) -> float:
	# 0.0005〜0.01 → 0〜100
	return (sens - 0.0005) / (0.01 - 0.0005) * 100

func _slider_to_sensitivity(slider_val: float) -> float:
	# 0〜100 → 0.0005〜0.01
	return 0.0005 + (slider_val / 100) * (0.01 - 0.0005)

func _update_sensitivity_label() -> void:
	sensitivity_label.text = "%.4f" % GameSettings.mouse_sensitivity

func _on_sensitivity_changed(value: float) -> void:
	GameSettings.mouse_sensitivity = _slider_to_sensitivity(value)
	_update_sensitivity_label()

func _on_invert_y_toggled(pressed: bool) -> void:
	GameSettings.invert_y = pressed

func _on_master_changed(value: float) -> void:
	GameSettings.master_volume = value / 100

func _on_sfx_changed(value: float) -> void:
	GameSettings.sfx_volume = value / 100

func _on_bgm_changed(value: float) -> void:
	GameSettings.bgm_volume = value / 100

func _on_close_pressed() -> void:
	GameSettings.save_settings()
	closed.emit()
	hide()

func _on_reset_pressed() -> void:
	GameSettings.reset_to_defaults()
	_load_current_settings()

func _input(event: InputEvent) -> void:
	if visible and event.is_action_pressed("ui_cancel"):
		_on_close_pressed()
