# effect-trigger-fix 作業ログ (2026-02-20)

## Step 1: 死亡時ダメージの撃破漏れ再現と修正（black_002）
- 追加テスト: `test_death_effect_black_002_marks_destroy_target_when_hp_zero`
- 初回結果: 失敗（`destroy_targets` 未設定）
- 原因: `black_002` が `take_damage()` 後の残HPチェックをしていない
- 修正: `black_002` を `_apply_damage_and_mark_destroy()` 経由に変更
- 構文チェック: `bash tools/check_syntax.sh` 通過
- GUT: 全件通過

## Step 2: 攻撃時ダメージの撃破漏れ再現と修正（red_002）
- 追加テスト: `test_attack_effect_red_002_marks_destroy_target_when_hp_zero`
- 初回結果: 失敗（`destroy_targets` 未設定）
- 原因: `red_002` が `take_damage()` 後の残HPチェックをしていない
- 修正: `red_002` を `_apply_damage_and_mark_destroy()` 経由に変更
- 構文チェック: `bash tools/check_syntax.sh` 通過
- GUT: 全件通過

## Step 3: 統一イベント入口の payload キー差異で発動漏れ再現と修正（ON_ATTACK / ON_DEFENSE）
- 追加テスト:
  - `test_process_timing_event_dispatch_on_attack_with_generic_card_ui`
  - `test_process_timing_event_dispatch_on_defense_with_generic_card_ui`
- 初回結果: 失敗（`card_ui` だけ渡した場合に攻撃/防御効果が未発動）
- 原因: `process_timing_event` が ON_ATTACK で `attacker_ui`、ON_DEFENSE で `defender_ui` のみ参照し、統一入口の `card_ui` を許容していない
- 修正: dispatcher で `attacker_ui/defender_ui` が無いとき `card_ui` をフォールバック参照
- 構文チェック: `bash tools/check_syntax.sh` 通過
- GUT: 全件通過

## 追加着手（次リファクタリング候補）
- 候補: `process_timing_event` の payload 解決ロジック（attacker/defender/card_ui）を共通ヘルパー化して重複を除去
- 着手内容: `_make_effect_log(color, card_name, message)` を追加し、`green_001` のログ生成を置換
- 影響範囲: 1効果のみ（最小変更）
- 構文チェック: 通過
- GUT: 全件通過

## Step 3: タイミング入口の安全化（必須payload欠落ガード）
- 追加テスト: `test_process_timing_event_missing_required_payload_is_safe`
- 再現内容: Dispatcher経由で`card_ui/attacker_ui/defender_ui`未指定時にクラッシュし得る
- 修正:
  - `process_summon_effect`: `card_ui`/`card_data` nullガード
  - `process_attack_effect`: `attacker_ui`/`card_data` nullガード
  - `process_death_effect`: `card_ui`/`card_data` nullガード
  - `process_defense_effect`: `defender_ui`/`card_data` nullガード（`final_damage`返却）
- 構文チェック: `bash tools/check_syntax.sh` 通過
- GUT: 全件通過（283/283）

## Step 4: ターン処理の入口欠損耐性を追加（発動漏れ防止）
- 追加テスト: `test_turn_start_effects_skips_malformed_slot_and_continues`
- 再現内容: 先頭スロットが壊れている（`is_empty=false` かつ `card_ui=null`）と、後続カードのターン開始効果まで巻き込んで停止し得る
- 修正:
  - `_get_effect_card_from_slot(slot)` を追加（`slot/card_ui/card_data` の妥当性を一元判定）
  - `process_turn_start_effects` の効果走査・毒処理で共通ガードを使用
  - `process_turn_end_effects` の効果走査・凍結tickでも同ガードを使用
- 構文チェック: `bash tools/check_syntax.sh` 通過
- GUT: 全件通過（291/291）

## 次リファクタリング候補（着手開始）
- 候補: ターン開始/終了処理の共通ループ化
- 着手メモ: `_get_effect_card_from_slot` を導入済み。次Stepで「走査→effect取得→emit/append」の骨格をヘルパー化し、match本体だけを差し替える設計に着手する
