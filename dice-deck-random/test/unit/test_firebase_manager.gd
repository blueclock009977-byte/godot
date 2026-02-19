extends GutTest
## FirebaseManager autoload tests (no network calls)

# ─── Constants ───

func test_firebase_url_defined():
	assert_eq(FirebaseManager.FIREBASE_URL, "https://dicedeckrandomtcg-default-rtdb.firebaseio.com")

func test_firebase_url_is_https():
	assert_true(FirebaseManager.FIREBASE_URL.begins_with("https://"))

# ─── Initial State ───

func test_player_id_is_string():
	assert_typeof(FirebaseManager.player_id, TYPE_STRING)

# ─── Method Existence ───

func test_has_put_data_method():
	assert_true(FirebaseManager.has_method("put_data"))

func test_has_post_data_method():
	assert_true(FirebaseManager.has_method("post_data"))

func test_has_patch_data_method():
	assert_true(FirebaseManager.has_method("patch_data"))

func test_has_get_data_method():
	assert_true(FirebaseManager.has_method("get_data"))

func test_has_delete_data_method():
	assert_true(FirebaseManager.has_method("delete_data"))

func test_has_create_request_method():
	assert_true(FirebaseManager.has_method("_create_request"))

func test_has_parse_response_method():
	assert_true(FirebaseManager.has_method("_parse_response"))

func test_has_load_or_create_player_id_method():
	assert_true(FirebaseManager.has_method("_load_or_create_player_id"))
