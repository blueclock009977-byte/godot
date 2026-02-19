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

## 追加着手（次リファクタリング候補）
- 候補: ログ生成の共通化
- 着手内容: `_make_effect_log(color, card_name, message)` を追加し、`green_001` のログ生成を置換
- 影響範囲: 1効果のみ（最小変更）
- 構文チェック: 通過
- GUT: 全件通過
