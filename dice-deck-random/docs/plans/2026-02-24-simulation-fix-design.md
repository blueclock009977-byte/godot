# シミュレーション修正設計書

**日付:** 2026-02-24
**対象:** `test/unit/test_balance_simulator.gd` / `test/unit/test_card_level_balance.gd`

---

## 問題

既存シミュレーションと実際のバトルルールに以下の乖離がある：

| 差異 | シミュ（旧） | 実際のバトル |
|------|------------|-------------|
| フェーズ構造 | M1→Dice→Draw→繰り返し | M1→Dice→Draw→**M2**→終了 |
| 先行1ターン目 | Diceあり | Dice+Drawをスキップ |
| マナ | 累積+1（上限10） | ターン開始全回復、上限5 |
| 効果カード | **完全無視** | ON_SUMMON/ATTACK/DEATH/DEFENSE/TURN_START/TURN_END |
| AI召喚戦略 | 安いカード優先・スロット0→5順 | 高コスト優先・スロットスコアリング |

---

## 解決方針

### SimCard / SimSlot クラスの導入

EffectManagerはCardUI/FieldSlotに対してダックタイピングを使用（型チェックなし、アニメ呼び出しなし）。
同インターフェースを持つ軽量モッククラスを作成し、EffectManagerをそのまま活用する。

```
CardUI（Godotノード）→ SimCard（RefCounted）
FieldSlot（Godotノード）→ SimSlot（RefCounted）
```

### SimCard インターフェース

EffectManagerが使うプロパティ・メソッド：

```gdscript
class SimCard:
    var card_data: CardData       # 参照（変更なし）
    var current_hp: int
    var current_atk: int
    var attack_dice: Array
    var has_revived: bool = false

    func heal(amount: int)         # current_hp += amount
    func modify_atk(amount: int)   # current_atk += amount
    func apply_status(effect, duration: int = 1)
    func has_status(effect) -> bool
    func tick_status_effects()
```

### SimSlot インターフェース

```gdscript
class SimSlot:
    var card_ui              # SimCard or null
    var slot_index: int
    var lane: int            # slot_index % 3
    var is_front_row: bool   # slot_index < 3
    var is_player_side: bool

    func is_empty() -> bool
    func place_card(sim_card)
    func remove_card() -> SimCard
```

---

## マナシステム修正

```
ターン開始:
  max_mana = min(max_mana + 1, 5)
  mana = max_mana  ← 全回復

後攻1ターン目のみ:
  mana += 1  ← 一時ボーナス（max_manaには加算しない）

ドローフェーズ:
  mana = min(mana + 1, max_mana)  ← 1回復
```

---

## フェーズ構造修正

```
ターン開始
  ↓ ターン開始効果（TURN_START）
  ↓ M1: 召喚（AI: 高コスト優先・スロットスコアリング）
  ↓ ← 先行1ターン目はここで終了
  ↓ Dice: バトル（攻撃側→防御側）
  ↓ Draw: 1枚+マナ1回復
  ↓ M2: 召喚（M1と同ロジック）
  ↓ ターン終了効果（TURN_END）
  ↓ 状態異常tick
ターン交代
```

---

## 効果処理フロー

各タイミングで `EffectManager.process_timing_event()` を呼ぶ。
戻り値（result Dictionary）を適用：

```
result["mana"]           → mana += value
result["direct_damage"]  → 相手HP -= value
result["heal_player"]    → 自分HP += value
result["draw"]           → デッキから手札へ
result["destroy_targets"] → 対象SimCardをSimSlotから除去 + 死亡効果
result["damaged_targets"] → HP<=0のSimCardを死亡処理
```

---

## AI召喚戦略修正

battle.gdの `_ai_summon_phase()` を移植：

```
1. 手札をmana_cost降順でソート
2. 各カードについて:
   - コストが現在マナ以下なら召喚試みる
   - スロットスコアリング:
     - 前列: +10
     - 相手がいるレーン: +5
     - 中央レーン(lane==1): +2
   - 最高スコアのスロットに召喚
3. M1・M2の両方で実行
```

---

## リスク・制約

- `black_011`の復活効果（`has_revived`フラグ）はSimCardに実装が必要
- `process_timing_event`がスロット配列を直接参照するため、
  SimSlotを6要素配列として正しく渡す必要がある
- EffectManagerのシグナル（`effect_triggered`, `log_message`）は
  シミュ内では無視（接続しない）

---

## 修正対象ファイル

1. `test/unit/test_balance_simulator.gd` - 色別バランス計測シミュ
2. `test/unit/test_card_level_balance.gd` - カード単位バランス計測シミュ

共通のSimCard/SimSlot/EffectApplierロジックは両ファイルで重複実装（ファイル分割は行わない）。
