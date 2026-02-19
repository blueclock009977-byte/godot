# 次リファクタ候補（着手メモ）

## 候補: TURN_START / TURN_END の payload alias 定義を TIMING_PAYLOAD_KEYS に統合

### 背景
- 現在 `TIMING_CARD_UI_KEYS` がカードUI alias を持ち、`TIMING_PAYLOAD_KEYS` は `is_player/context/damage` を持つ。
- alias の責務が2テーブルに分散しており、将来 alias 追加時の見落としリスクがある。

### 目的
- timing ごとの payload 解決情報を1か所に寄せ、イベント入口の保守性を上げる。

### 着手内容（今回）
- 影響範囲を小さくするため、設計メモを作成。
- 次回は `card_ui_keys` を `TIMING_PAYLOAD_KEYS` 側へ段階移行するための小さなテストを先に追加する。

### 次の1手
1. `test_effects.gd` に `TIMING_PAYLOAD_KEYS` へ `card_ui` alias を持つことを検証するテストを追加（先にFail）。
2. `_resolve_timing_card_ui()` を `TIMING_PAYLOAD_KEYS` 参照へ切り替え。
3. 既存 `TIMING_CARD_UI_KEYS` を互換期間後に削除。
