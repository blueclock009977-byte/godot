# 統一バジェットルール 設計書

**日付:** 2026-02-25
**対象:** `autoload/card_database.gd` の `_get_effect_budget_modifier()` と `_get_color_balance_budget_adjustment()`

---

## 問題

| 色 | 現状勝率 | 目標 |
|---|---|---|
| RED | 67.2% | ~50% |
| GREEN | 37.1% | ~50% |

根本原因:
- REDのダメージ系効果のバジェットコストが低すぎる（カードのステータスが高くなりすぎる）
- GREENのマナ系効果のバジェットコストが高すぎる（カードのステータスが低くなりすぎる）
- GREENにさらに-2のカラーペナルティが重なっている

---

## 解決方針

### アクション単位コスト表

各「効果アクション」に固定コストを割り当て、複合効果は足し算で算出する。

| アクション | 基準コスト (ON_SUMMON ×1.0) |
|-----------|--------------------------|
| マナ +1 | -3 |
| ドロー +1 | -7 |
| HP ダメージ 1 (単体) | -6 |
| HP ダメージ 1 (全体) | -10 |
| HP 回復 1 (単体) | -2 |
| HP 回復 1 (全体) | -5 |
| ATK +/-1 (単体) | -5 |
| ATK +/-1 (全体) | -9 |
| 凍結 1ターン (単体) | -4 |
| 凍結 1ターン (全体) | -8 |
| 自傷 HP -1 (デメリット) | **+5** |

### タイミング倍率

| タイミング | 倍率 |
|----------|-----|
| ON_SUMMON | ×1.0 |
| ON_ATTACK | ×0.6 |
| ON_DEATH | ×0.7 |
| ON_DEFENSE | ×0.7 |
| TURN_START/END | ×1.4 |
| CONSTANT | ×2.0 |

### 複合効果の計算例

```
black_014 (ON_SUMMON, 自分HP-2 + ドロー1枚):
  自傷HP-2 = +5 × 2 = +10
  ドロー1 = -7 × 1.0 = -7
  合計 = +3

blue_007 (ON_SUMMON, 敵全体ATK-2):
  ATK-1 (全体) = -9 × 2 = -18

red_006 (ON_DEATH, 敵全体HP-2):
  HP ダメージ 1 (全体) × 2 = -10 × 2 = -20
  ON_DEATH 倍率 × 0.7 = -14
  → 値: -14
```

### 色別調整

**全色 0（調整なし）**

以前の GREEN:-2 / BLACK:-3 / PURPLE:+2 ペナルティを廃止。
効果コストのみで全カードを統一判断する。

---

## 全効果モディファイア一覧

計算式: `cost = round(action_base × timing_multiplier × amount)`

### BLUE

| ID | 説明 | 計算 | 新値 | 旧値 |
|----|------|------|------|------|
| blue_001 | ON_SUMMON 敵1体ATK-1 | -5×1.0 | -5 | -8 |
| blue_002 | CONSTANT ダイス3,4でも攻撃可 | 追加2面×2.0≈ | -8 | -12 |
| blue_003 | ON_ATTACK 対象凍結1t | -4×0.6 | -2 | -5 |
| blue_004 | ON_SUMMON 敵全体ATK-1 | -9×1.0 | -9 | -8 |
| blue_005 | CONSTANT ATK+2(ダイス5,6時) | -5×2×2.0×0.33 | -7 | -8 |
| blue_006 | ON_DEFENSE 被ダメ半減 | ≈-5×0.7 | -4 | -8 |
| blue_007 | ON_SUMMON 敵全体ATK-2 | -9×2×1.0 | -18 | -12 |
| blue_008 | ON_ATTACK 対象凍結2t | -4×2×0.6 | -5 | -7 |
| blue_009 | ON_DEATH 敵1体ATK-1 | -5×0.7 | -4 | -7 |
| blue_010 | TURN_START 自身HP+1 | -2×1.4 | -3 | -8 |
| blue_011 | ON_SUMMON 次ダイス+1 | 微小効果 | -2 | -8 |
| blue_012 | ON_ATTACK 追加相手HP-1 | -6×0.6 | -4 | -4 |
| blue_013 | CONSTANT 同列味方被ダメ-1 | -2×2.0 | -4 | -9 |
| blue_014 | ON_SUMMON カード1枚ドロー | -7×1.0 | -7 | -12 |
| blue_015 | CONSTANT 敵前列ATK-1 | -9×2.0×0.5 | -9 | -9 |
| blue_016 | CONSTANT 敵全体ATK-1 | -9×2.0 | -18 | -11 |
| blue_017 | ON_ATTACK HP5以下即破壊 | 特殊≈-8×0.6 | -5 | -10 |
| blue_018 | ON_SUMMON 敵全体凍結1t | -8×1.0 | -10 | -12 |

### GREEN

| ID | 説明 | 計算 | 新値 | 旧値 |
|----|------|------|------|------|
| green_001 | ON_SUMMON マナ+1 | -3×1.0 | -3 | -8 |
| green_002 | ON_DEATH マナ+1 | -3×0.7 | -2 | -6 |
| green_003 | TURN_START 自身HP+1 | -2×1.4 | -3 | -3 |
| green_004 | ON_SUMMON マナ+2 | -3×2 | -6 | -8 |
| green_005 | ON_DEATH マナ+2 | -3×2×0.7 | -4 | -9 |
| green_006 | CONSTANT 味方コスト-1 | 特殊 | -12 | -12 |
| green_007 | CONSTANT 味方全体HP+1 | -5×2.0 | -10 | -10 |
| green_008 | ON_SUMMON マナ+3 | -3×3 | -9 | -12 |
| green_009 | TURN_START マナ+1 | -3×1.4 | -4 | -10 |
| green_010 | ON_ATTACK マナ+1 | -3×0.6 | -2 | -4 |
| green_011 | ON_SUMMON 味方1体HP+2 | -2×2 | -4 | -8 |
| green_012 | ON_DEFENSE マナ+1 | -3×0.7 | -2 | -5 |
| green_013 | ON_SUMMON マナ全回復 | -3×3.5 | -10 | -14 |
| green_014 | ON_DEATH 自身HP+2(味方死亡時) | -2×2×0.7 | -3 | -7 |
| green_015 | ON_SUMMON マナ+2, 自身HP+2 | -6+(-2×2) | -10 | -12 |
| green_016 | TURN_END 味方全体HP+1 | -5×1.4 | -7 | -10 |
| green_017 | ON_SUMMON 味方全体HP+2 | -5×2 | -10 | -12 |

### BLACK

| ID | 説明 | 計算 | 新値 | 旧値 |
|----|------|------|------|------|
| black_001 | ON_SUMMON 自分HP-1 | +5 | +5 | -1 |
| black_002 | ON_DEATH 敵1体HP-2 | -6×2×0.7 | -8 | -11 |
| black_003 | ON_SUMMON 自分HP-2 | +5×2 | +10 | +10 |
| black_004 | ON_ATTACK 毒(毎ターンHP-1) | -6×3×0.6 | -11 | -6 |
| black_005 | ON_SUMMON 自分HP-3 | +5×3-1 | +14 | +12 |
| black_006 | ON_DEATH トークン2/2召喚 | ≈-8×0.7 | -6 | -8 |
| black_007 | ON_ATTACK ライフスティール | -2×ATK×0.6≈ | -5 | -6 |
| black_008 | ON_SUMMON 自分HP-5 | +5×5-3 | +22 | +25 |
| black_009 | CONSTANT 相手ダイス6無効 | -4×2.0 | -8 | -8 |
| black_010 | ON_DEATH 敵全体HP-1 | -10×0.7 | -7 | -12 |
| black_011 | ON_DEATH 自身復活(1回,HP1) | 特殊 | -6 | -12 |
| black_012 | CONSTANT 相手ダイス1無効 | -4×2.0 | -8 | -13 |
| black_013 | ON_DEATH 敵1体ATK-2 | -5×2×0.7 | -7 | -8 |
| black_014 | ON_SUMMON 自分HP-2+ドロー1 | +10-7 | +3 | -2 |
| black_015 | ON_ATTACK 自分HP-1,ATK+2永続 | (+5-5×2)×0.6 | -3 | -3 |
| black_016 | ON_ATTACK 対象HP半減 | 特殊≈-12×0.6 | -7 | -8 |
| black_017 | ON_SUMMON 自分HP-4 | +5×4-2 | +18 | +20 |
| black_018 | ON_DEATH 敵全体HP-3 | -10×3×0.7 | -21 | -11 |
| black_019 | CONSTANT 相手ダイス1,6無効 | -4×2×2.0 | -16 | -14 |

### RED

| ID | 説明 | 計算 | 新値 | 旧値 |
|----|------|------|------|------|
| red_001 | ON_SUMMON 敵1体HP-1 | -6×1.0 | -6 | -8 |
| red_002 | ON_ATTACK 対象追加2ダメージ | -6×2×0.6 | -7 | -6 |
| red_003 | ON_SUMMON 敵全体HP-1 | -10×1.0 | -10 | -12 |
| red_004 | CONSTANT ATK+1 | -5×2.0 | -10 | -8 |
| red_005 | ON_ATTACK 自身ATK+1永続 | -5×1.5×0.6 | -5 | -5 |
| red_006 | ON_DEATH 敵全体HP-2 | -10×2×0.7 | -14 | -10 |
| red_007 | ON_SUMMON 味方全体ATK+1 | -9×1.0 | -9 | -10 |
| red_008 | ON_ATTACK 2回攻撃 | ≈ATK×1.5×0.6 | -10 | -8 |
| red_009 | ON_DEATH 敵味方全体HP-2 | -10×2×0.7×0.5 | -7 | +3 |
| red_010 | TURN_START 自身ATK+1 | -5×1.4 | -7 | -7 |
| red_011 | ON_SUMMON 敵1体HP-2 | -6×2 | -12 | -10 |
| red_012 | CONSTANT ATK+3(ダイス1時) | -5×3×2.0×0.17 | -5 | -8 |
| red_013 | ON_ATTACK 相手HP直接-1 | -6×0.6 | -4 | -4 |
| red_014 | ON_DEATH 敵1体HP-4 | -6×4×0.7 | -17 | -9 |
| red_015 | ON_SUMMON 敵全体HP-1 | -10×1.0 | -10 | -13 |
| red_016 | CONSTANT ATK+2 | -5×2×2.0 | -20 | -11 |
| red_017 | ON_SUMMON 敵全体HP-2 | -10×2 | -20 | -14 |
| red_018 | CONSTANT 味方全体ATK+1 | -9×2.0 | -18 | -12 |

### YELLOW

| ID | 説明 | 計算 | 新値 | 旧値 |
|----|------|------|------|------|
| yellow_001 | ON_SUMMON 味方1体HP+2 | -2×2 | -4 | -8 |
| yellow_002 | CONSTANT 味方全体ダイス+1 | ≈-5×2.0 | -10 | -12 |
| yellow_003 | ON_SUMMON ドロー1 | -7 | -7 | -12 |
| yellow_004 | ON_DEFENSE 被ダメ-1 | -2×0.7 | -1 | -5 |
| yellow_005 | TURN_START ドロー1 | -7×1.4 | -10 | -12 |
| yellow_006 | ON_SUMMON 味方全体HP+1 | -5×1 | -5 | -9 |
| yellow_007 | CONSTANT 自身被ダメ-1 | -2×2.0 | -4 | -8 |
| yellow_008 | ON_ATTACK 自身HP+1 | -2×0.6 | -1 | -4 |
| yellow_009 | ON_SUMMON 味方1体ATK+2 | -5×2 | -10 | -6 |
| yellow_010 | TURN_END マナ+1 | -3×1.4 | -4 | -6 |
| yellow_011 | ON_DEATH 味方全体HP+2 | -5×2×0.7 | -7 | -10 |
| yellow_012 | CONSTANT 味方全体ATK+1 | -9×2.0 | -18 | -10 |
| yellow_013 | ON_SUMMON 味方全体ATK+1,HP+1 | -9+(-5) | -14 | -12 |
| yellow_014 | ON_DEFENSE ダメージ反射 | ≈-5×0.7 | -4 | -6 |
| yellow_015 | TURN_START 味方1体HP+2 | -2×2×1.4 | -6 | -8 |
| yellow_016 | ON_SUMMON 味方全体ATK+2 | -9×2 | -18 | -12 |
| yellow_017 | CONSTANT 味方全体被ダメ-1 | -5×2.0 | -10 | -11 |
| yellow_018 | ON_ATTACK 味方全体HP+1 | -5×0.6 | -3 | -6 |
| yellow_019 | ON_DEATH 味方全体HP+3 | -5×3×0.7 | -11 | -11 |
| yellow_020 | CONSTANT 味方全体ATK+2 | -9×2×2.0 → cap | -18 | -13 |

### PURPLE

| ID | 説明 | 計算 | 新値 | 旧値 |
|----|------|------|------|------|
| purple_001 | ON_SUMMON 敵1体ダイス1つ無効 | ≈-4×1.0 | -4 | -12 |
| purple_002 | ON_ATTACK 対象ATK-2永続 | -5×2×0.6×1.5 | -9 | -5 |
| purple_003 | ON_SUMMON 相手手札1枚破棄 | ≈-5 | -5 | -10 |
| purple_004 | CONSTANT 相手召喚コスト+1 | -5×2.0 | -10 | -12 |
| purple_005 | ON_DEATH 敵1体凍結 | -4×0.7 | -3 | -5 |
| purple_006 | ON_SUMMON 敵全体ATK-1,HP-1 | -9+(-10) | -19 | -12 |
| purple_007 | ON_ATTACK 対象ダイス2つ無効 | ≈-4×2×0.6 | -5 | -11 |
| purple_008 | TURN_END 敵全体HP-1 | -10×1.4 | -14 | -9 |
| purple_009 | ON_SUMMON 敵1体凍結2t | -4×2 | -8 | -10 |
| purple_010 | CONSTANT 相手マナ-1/ターン | -3×1.4×2.0 | -8 | -11 |
| purple_011 | ON_DEATH 敵全体凍結 | -8×0.7 | -6 | -14 |
| purple_012 | ON_SUMMON コスト3以下の敵破壊 | 特殊≈-14 | -14 | -12 |
| purple_013 | ON_ATTACK 対象と自身入替 | 状況依存≈-3 | -3 | -14 |
| purple_014 | CONSTANT 敵ドロー-1 | -7×2.0 | -14 | -11 |
| purple_015 | ON_SUMMON 敵1体凍結3t | -4×3 | -12 | -12 |
| purple_016 | ON_ATTACK 敵全体ATK-1 | -9×0.6 | -5 | -7 |
| purple_017 | CONSTANT 敵召喚コスト+2 | -5×2×2.0 | -20 | -14 |
| purple_018 | ON_SUMMON 敵全体ATK-1,HP-1 | -9+(-10) | -19 | -14 |
| purple_019 | ON_SUMMON 敵全体凍結2t | -8×2 | -16 | -13 |
| purple_020 | CONSTANT 敵全体ダイス-1 | ≈-5×2.0 | -10 | -13 |

### WHITE

| ID | 説明 | 計算 | 新値 | 旧値 |
|----|------|------|------|------|
| white_001 | ON_SUMMON 自分HP+2 | -2×2 | -4 | -8 |
| white_002 | ON_DEATH 自分HP+3 | -2×3×0.7 | -4 | -7 |
| white_003 | TURN_START 自分HP+1 | -2×1.4 | -3 | -7 |
| white_004 | ON_SUMMON 味方全体HP+2 | -5×2 | -10 | -11 |
| white_005 | ON_DEFENSE 被ダメ無効(1回) | ≈-6×0.7 | -4 | -11 |
| white_006 | ON_SUMMON 墓地から1体復活 | ≈-6 | -6 | -7 |
| white_007 | CONSTANT 味方全体被ダメ-1 | -5×2.0 | -10 | -11 |
| white_008 | ON_ATTACK 味方全体HP+1 | -5×0.6 | -3 | -6 |
| white_009 | ON_SUMMON 自分HP+4 | -2×4 | -8 | -10 |
| white_010 | TURN_END 自分HP+2 | -2×2×1.4 | -6 | -9 |
| white_011 | ON_DEATH 自分HP全回復 | ≈-2×7×0.7 | -10 | -11 |
| white_012 | CONSTANT 直接ダメ半減 | ≈-5×2.0 | -10 | -9 |
| white_013 | ON_SUMMON 味方全体状態異常解除 | ≈-3 | -3 | -8 |
| white_014 | ON_DEATH 味方1体HP全回復 | ≈-2×5×0.7 | -7 | -9 |
| white_015 | ON_SUMMON 自分HP+6 | -2×6 | -12 | -12 |
| white_016 | CONSTANT 自身被ダメ-2 | -2×2×2.0 | -8 | -11 |
| white_017 | CONSTANT 味方全体HP+2 | -5×2×2.0 → cap | -16 | -12 |
| white_018 | ON_SUMMON 全状態解除+HP+1 | -3+(-5) | -8 | -12 |
| white_019 | ON_DEATH 墓地から2体復活 | ≈-6×2×0.7 | -8 | -13 |
| white_020 | ON_SUMMON 味方全体HP+3,ATK+1 | -5×3+(-9) | -24 | -14 |

---

## 変更ファイル

1. `autoload/card_database.gd`
   - `_get_effect_budget_modifier()`: 上記テーブルに全更新
   - `_get_color_balance_budget_adjustment()`: 全色 0 に変更

---

## 反復プロセス

1. 上記テーブルを実装してシミュレーション実行
2. 色別勝率の差が15%以内を目標（現在30%差）
3. まだ偏りがある場合: 該当する「アクション単位コスト」を調整（例: ダメージコストを-8に上げる）
4. カラー別ではなく効果タイプ別に調整を繰り返す
