extends GutTest

const SLOT_PATH := "user://current_deck_slot.txt"

var _backup_exists := false
var _backup_text := ""

func before_each() -> void:
	if OS.has_feature("web"):
		pending("This test is for non-web persistence path only.")
		return
	_backup_exists = FileAccess.file_exists(SLOT_PATH)
	if _backup_exists:
		var f := FileAccess.open(SLOT_PATH, FileAccess.READ)
		if f:
			_backup_text = f.get_as_text()
			f.close()

func after_each() -> void:
	if OS.has_feature("web"):
		return
	if _backup_exists:
		var f := FileAccess.open(SLOT_PATH, FileAccess.WRITE)
		if f:
			f.store_string(_backup_text)
			f.close()
	else:
		if FileAccess.file_exists(SLOT_PATH):
			DirAccess.remove_absolute(SLOT_PATH)

func test_deck_slot_is_persisted_and_restored_locally() -> void:
	if OS.has_feature("web"):
		pending("This test is for non-web persistence path only.")
		return

	assert_true(GameManager.has_method("save_current_deck_slot"), "GameManager should implement save_current_deck_slot(slot)")
	assert_true(GameManager.has_method("_load_current_deck_slot"), "GameManager should implement _load_current_deck_slot()")

	GameManager.call("save_current_deck_slot", 3)
	GameManager.current_deck_slot = -1
	GameManager.call("_load_current_deck_slot")

	assert_eq(GameManager.current_deck_slot, 3, "Saved current_deck_slot should be restored from local file")
