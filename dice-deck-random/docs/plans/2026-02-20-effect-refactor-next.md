# 次リファクタリング候補（着手）

## テーマ
`EffectManager` の ON_SUMMON / ON_ATTACK / ON_DEATH / ON_DEFENSE で重複している
「effect_id 取得 → _can_process_effect → card_name 取得」前処理を共通化する。

## 目的
- タイミング別ハンドラの分岐本体を読みやすくする
- 効果追加時のコピペ漏れを防ぐ
- 効果発動漏れの温床になりやすい入口分岐の重複を減らす

## 着手内容（今回開始）
- 入口の欠損耐性を追加済み（v1.19.159）
- 次ステップとして、共通前処理ヘルパーのプロトタイプ設計を開始
  - 候補: `_prepare_timing_effect(card_ui, timing)`
  - 返却: `{ "ok": bool, "effect_id": String, "card_name": String }`

## 実装方針メモ
- まず ON_SUMMON のみで試験導入
- テスト追加（既存挙動を固定）→ 実装 → syntax + GUT
- 問題なければ ON_ATTACK/ON_DEATH/ON_DEFENSE へ段階展開
