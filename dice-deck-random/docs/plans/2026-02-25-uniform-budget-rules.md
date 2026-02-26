# 統一バジェットルール 実装プラン

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 全カードの効果コストをアクション単位テーブルで統一し、REDの優位性(67%)とGREENの劣勢(37%)を修正する。

**Architecture:** `card_database.gd` の `_get_effect_budget_modifier()` を設計書のテーブルに置き換え、`_get_color_balance_budget_adjustment()` を全色0に変更。余ったバジェットは既存の `_tune_card_stats_to_budget()` が自動的にステータスに反映。

**Tech Stack:** GDScript 4 / Godot 4, GUT 9.5.0 テストフレームワーク

---

### Task 1: 色別調整を全色0に変更

**Files:**
- Modify: `autoload/card_database.gd:402-412`

**Step 1: 現在の関数を確認**

```bash
# card_database.gd の _get_color_balance_budget_adjustment を確認
```

現在のコード（行402付近）:
```gdscript
func _get_color_balance_budget_adjustment(color_type: CardData.ColorType) -> int:
	match color_type:
		CardData.ColorType.GREEN:
			return -2
		CardData.ColorType.BLACK:
			return -3
		CardData.ColorType.PURPLE:
			return 2
		_:
			return 0
```

**Step 2: 全色0に変更**

```gdscript
func _get_color_balance_budget_adjustment(color_type: CardData.ColorType) -> int:
	# 色別調整なし: 効果コストのみでバランス判断
	return 0
```

**Step 3: シンタックスチェック**

```bash
godot4 --headless --path . --check-only autoload/card_database.gd 2>&1
```

Expected: エラーなし

**Step 4: コミット**

```bash
git add autoload/card_database.gd
git commit -m "refactor(balance): 色別バジェット調整を全色0に変更（効果コストのみで判断）"
```

---

### Task 2: _get_effect_budget_modifier() を設計書テーブルに更新

**Files:**
- Modify: `autoload/card_database.gd:322-378`

**Step 1: 関数全体を以下の内容に置き換える**

設計書 `docs/plans/2026-02-25-uniform-budget-design.md` の値を使用。

```gdscript
func _get_effect_budget_modifier(effect_id: String) -> int:
	# アクション単位コスト表（2026-02-25）:
	# マナ+1(召喚)=-3, ドロー=-7, ダメージ1HP(単体)=-6, ダメージ1HP(全体)=-10
	# 回復1HP(単体)=-2, 回復1HP(全体)=-5, ATK+/-1(単体)=-5, ATK+/-1(全体)=-9
	# 凍結1t(単体)=-4, 凍結1t(全体)=-8, 自傷HP-1=+5
	# タイミング倍率: ON_SUMMON=1.0, ON_ATTACK=0.6, ON_DEATH=0.7,
	#   ON_DEFENSE=0.7, TURN_START/END=1.4, CONSTANT=2.0
	if effect_id == "":
		return 0

	var modifier_by_effect := {
		# ─── BLUE ───
		"blue_001": -5,   # ON_SUMMON 敵1体ATK-1: -5×1.0
		"blue_002": -8,   # CONSTANT ダイス3,4追加: 2面×2.0
		"blue_003": -2,   # ON_ATTACK 凍結1t: -4×0.6
		"blue_004": -9,   # ON_SUMMON 敵全体ATK-1: -9×1.0
		"blue_005": -7,   # CONSTANT ATK+2(ダイス5,6条件): -5×2×2.0×0.33
		"blue_006": -4,   # ON_DEFENSE 被ダメ半減: -5×0.7
		"blue_007": -18,  # ON_SUMMON 敵全体ATK-2: -9×2×1.0
		"blue_008": -5,   # ON_ATTACK 凍結2t: -4×2×0.6
		"blue_009": -4,   # ON_DEATH 敵1体ATK-1: -5×0.7
		"blue_010": -3,   # TURN_START 自身HP+1: -2×1.4
		"blue_011": -2,   # ON_SUMMON 次ダイス+1: 微小効果
		"blue_012": -4,   # ON_ATTACK 追加相手HP-1: -6×0.6
		"blue_013": -4,   # CONSTANT 同列味方被ダメ-1: -2×2.0
		"blue_014": -7,   # ON_SUMMON ドロー1: -7×1.0
		"blue_015": -9,   # CONSTANT 敵前列ATK-1: -9×2.0×0.5
		"blue_016": -18,  # CONSTANT 敵全体ATK-1: -9×2.0
		"blue_017": -5,   # ON_ATTACK HP5以下即破壊: 特殊-8×0.6
		"blue_018": -10,  # ON_SUMMON 敵全体凍結1t: -8×1.0(AoEプレミアム)

		# ─── GREEN ───
		"green_001": -3,  # ON_SUMMON マナ+1: -3×1.0
		"green_002": -2,  # ON_DEATH マナ+1: -3×0.7
		"green_003": -3,  # TURN_START 自身HP+1: -2×1.4
		"green_004": -6,  # ON_SUMMON マナ+2: -3×2
		"green_005": -4,  # ON_DEATH マナ+2: -3×2×0.7
		"green_006": -12, # CONSTANT 味方コスト-1: 特殊(維持)
		"green_007": -10, # CONSTANT 味方全体HP+1: -5×2.0
		"green_008": -9,  # ON_SUMMON マナ+3: -3×3
		"green_009": -4,  # TURN_START マナ+1: -3×1.4
		"green_010": -2,  # ON_ATTACK マナ+1: -3×0.6
		"green_011": -4,  # ON_SUMMON 味方1体HP+2: -2×2
		"green_012": -2,  # ON_DEFENSE マナ+1: -3×0.7
		"green_013": -10, # ON_SUMMON マナ全回復: -3×3.5
		"green_014": -3,  # ON_DEATH 自身HP+2(味方死亡時): -2×2×0.7
		"green_015": -10, # ON_SUMMON マナ+2+自身HP+2: -6+(-4)
		"green_016": -7,  # TURN_END 味方全体HP+1: -5×1.4
		"green_017": -10, # ON_SUMMON 味方全体HP+2: -5×2

		# ─── BLACK ───
		"black_001": 5,   # ON_SUMMON 自分HP-1: +5
		"black_002": -8,  # ON_DEATH 敵1体HP-2: -6×2×0.7
		"black_003": 10,  # ON_SUMMON 自分HP-2: +5×2
		"black_004": -11, # ON_ATTACK 毒(HP-1/t×3turns): -6×3×0.6
		"black_005": 14,  # ON_SUMMON 自分HP-3: +5×3-1
		"black_006": -6,  # ON_DEATH トークン2/2: -8×0.7
		"black_007": -5,  # ON_ATTACK ライフスティール: -2×ATK×0.6≈
		"black_008": 22,  # ON_SUMMON 自分HP-5: +5×5-3
		"black_009": -8,  # CONSTANT 相手ダイス6無効: -4×2.0
		"black_010": -7,  # ON_DEATH 敵全体HP-1: -10×0.7
		"black_011": -6,  # ON_DEATH 自身復活(1回,HP1): 特殊
		"black_012": -8,  # CONSTANT 相手ダイス1無効: -4×2.0
		"black_013": -7,  # ON_DEATH 敵1体ATK-2: -5×2×0.7
		"black_014": 3,   # ON_SUMMON 自分HP-2+ドロー1: +10-7
		"black_015": -3,  # ON_ATTACK 自分HP-1+ATK+2永続: (+5-10)×0.6
		"black_016": -7,  # ON_ATTACK 対象HP半減: -12×0.6
		"black_017": 18,  # ON_SUMMON 自分HP-4: +5×4-2
		"black_018": -21, # ON_DEATH 敵全体HP-3: -10×3×0.7
		"black_019": -16, # CONSTANT 相手ダイス1,6無効: -4×2×2.0

		# ─── RED ───
		"red_001": -6,    # ON_SUMMON 敵1体HP-1: -6×1.0
		"red_002": -7,    # ON_ATTACK 対象追加2ダメ: -6×2×0.6
		"red_003": -10,   # ON_SUMMON 敵全体HP-1: -10×1.0
		"red_004": -10,   # CONSTANT ATK+1: -5×2.0
		"red_005": -5,    # ON_ATTACK 自身ATK+1永続: -5×1.5×0.6
		"red_006": -14,   # ON_DEATH 敵全体HP-2: -10×2×0.7
		"red_007": -9,    # ON_SUMMON 味方全体ATK+1: -9×1.0
		"red_008": -10,   # ON_ATTACK 2回攻撃: 特殊
		"red_009": -7,    # ON_DEATH 敵味方全体HP-2: -10×2×0.7×0.5
		"red_010": -7,    # TURN_START 自身ATK+1: -5×1.4
		"red_011": -12,   # ON_SUMMON 敵1体HP-2: -6×2
		"red_012": -5,    # CONSTANT ATK+3(ダイス1条件): -5×3×2.0×0.17
		"red_013": -4,    # ON_ATTACK 相手HP直接-1: -6×0.6
		"red_014": -17,   # ON_DEATH 敵1体HP-4: -6×4×0.7
		"red_015": -10,   # ON_SUMMON 敵全体HP-1: -10×1.0
		"red_016": -20,   # CONSTANT ATK+2: -5×2×2.0
		"red_017": -20,   # ON_SUMMON 敵全体HP-2: -10×2
		"red_018": -18,   # CONSTANT 味方全体ATK+1: -9×2.0

		# ─── YELLOW ───
		"yellow_001": -4,  # ON_SUMMON 味方1体HP+2: -2×2
		"yellow_002": -10, # CONSTANT 味方全体ダイス+1: -5×2.0
		"yellow_003": -7,  # ON_SUMMON ドロー1: -7
		"yellow_004": -1,  # ON_DEFENSE 被ダメ-1: -2×0.7
		"yellow_005": -10, # TURN_START ドロー1: -7×1.4
		"yellow_006": -5,  # ON_SUMMON 味方全体HP+1: -5×1
		"yellow_007": -4,  # CONSTANT 自身被ダメ-1: -2×2.0
		"yellow_008": -1,  # ON_ATTACK 自身HP+1: -2×0.6
		"yellow_009": -10, # ON_SUMMON 味方1体ATK+2: -5×2
		"yellow_010": -4,  # TURN_END マナ+1: -3×1.4
		"yellow_011": -7,  # ON_DEATH 味方全体HP+2: -5×2×0.7
		"yellow_012": -18, # CONSTANT 味方全体ATK+1: -9×2.0
		"yellow_013": -14, # ON_SUMMON 味方全体ATK+1,HP+1: -9+(-5)
		"yellow_014": -4,  # ON_DEFENSE ダメージ反射: -5×0.7
		"yellow_015": -6,  # TURN_START 味方1体HP+2: -2×2×1.4
		"yellow_016": -18, # ON_SUMMON 味方全体ATK+2: -9×2
		"yellow_017": -10, # CONSTANT 味方全体被ダメ-1: -5×2.0
		"yellow_018": -3,  # ON_ATTACK 味方全体HP+1: -5×0.6
		"yellow_019": -11, # ON_DEATH 味方全体HP+3: -5×3×0.7
		"yellow_020": -18, # CONSTANT 味方全体ATK+2: cap -18

		# ─── PURPLE ───
		"purple_001": -4,  # ON_SUMMON 敵1体ダイス1つ無効: -4
		"purple_002": -9,  # ON_ATTACK 対象ATK-2永続: -5×2×0.6×1.5
		"purple_003": -5,  # ON_SUMMON 相手手札1枚破棄: -5
		"purple_004": -10, # CONSTANT 相手召喚コスト+1: -5×2.0
		"purple_005": -3,  # ON_DEATH 敵1体凍結: -4×0.7
		"purple_006": -19, # ON_SUMMON 敵全体ATK-1,HP-1: -9+(-10)
		"purple_007": -5,  # ON_ATTACK 対象ダイス2つ無効: -4×2×0.6
		"purple_008": -14, # TURN_END 敵全体HP-1: -10×1.4
		"purple_009": -8,  # ON_SUMMON 敵1体凍結2t: -4×2
		"purple_010": -8,  # CONSTANT 相手マナ-1/t: -3×1.4×2.0
		"purple_011": -6,  # ON_DEATH 敵全体凍結: -8×0.7
		"purple_012": -14, # ON_SUMMON コスト3以下の敵破壊: 特殊
		"purple_013": -3,  # ON_ATTACK 対象と自身入替: 状況依存
		"purple_014": -14, # CONSTANT 敵ドロー-1: -7×2.0
		"purple_015": -12, # ON_SUMMON 敵1体凍結3t: -4×3
		"purple_016": -5,  # ON_ATTACK 敵全体ATK-1: -9×0.6
		"purple_017": -20, # CONSTANT 敵召喚コスト+2: -5×2×2.0
		"purple_018": -19, # ON_SUMMON 敵全体ATK-1,HP-1: 同purple_006
		"purple_019": -16, # ON_SUMMON 敵全体凍結2t: -8×2
		"purple_020": -10, # CONSTANT 敵全体ダイス-1: -5×2.0

		# ─── WHITE ───
		"white_001": -4,  # ON_SUMMON 自分HP+2: -2×2
		"white_002": -4,  # ON_DEATH 自分HP+3: -2×3×0.7
		"white_003": -3,  # TURN_START 自分HP+1: -2×1.4
		"white_004": -10, # ON_SUMMON 味方全体HP+2: -5×2
		"white_005": -4,  # ON_DEFENSE 被ダメ無効(1回): -6×0.7
		"white_006": -6,  # ON_SUMMON 墓地から1体復活: 特殊
		"white_007": -10, # CONSTANT 味方全体被ダメ-1: -5×2.0
		"white_008": -3,  # ON_ATTACK 味方全体HP+1: -5×0.6
		"white_009": -8,  # ON_SUMMON 自分HP+4: -2×4
		"white_010": -6,  # TURN_END 自分HP+2: -2×2×1.4
		"white_011": -10, # ON_DEATH 自分HP全回復: -2×7×0.7
		"white_012": -10, # CONSTANT 直接ダメ半減: -5×2.0
		"white_013": -3,  # ON_SUMMON 全状態異常解除: 微小効果
		"white_014": -7,  # ON_DEATH 味方1体HP全回復: -2×5×0.7
		"white_015": -12, # ON_SUMMON 自分HP+6: -2×6
		"white_016": -8,  # CONSTANT 自身被ダメ-2: -2×2×2.0
		"white_017": -16, # CONSTANT 味方全体HP+2: cap -16
		"white_018": -8,  # ON_SUMMON 全状態解除+HP+1: -3+(-5)
		"white_019": -8,  # ON_DEATH 墓地から2体復活: -6×2×0.7
		"white_020": -24, # ON_SUMMON 味方全体HP+3,ATK+1: -5×3+(-9)
	}

	if modifier_by_effect.has(effect_id):
		return int(modifier_by_effect[effect_id])

	push_error("[CardDatabase] 未分類のeffect_id: %s" % effect_id)
	return 0
```

**Step 2: シンタックスチェック**

```bash
godot4 --headless --path . --check-only autoload/card_database.gd 2>&1
```

Expected: エラーなし

**Step 3: コミット**

```bash
git add autoload/card_database.gd
git commit -m "feat(balance): アクション単位コスト表で効果バジェットモディファイアを統一"
```

---

### Task 3: シミュレーション実行・結果確認

**Files:** なし（テスト実行のみ）

**Step 1: カードレベルシミュレーション実行**

```bash
godot4 --headless --path . -s addons/gut/gut_cmdln.gd \
  -gtest=test/unit/test_card_level_balance.gd -gexit 2>&1 | \
  grep -E "(BLUE|GREEN|BLACK|RED|YELLOW|PURPLE|WHITE|色別|範囲|差:)" | head -30
```

Expected: 色別勝率差が30%→15%以下に改善

**Step 2: 結果を評価**

目標:
- 色別勝率差 ≤ 15%（現在30%差）
- RED: 60%以下
- GREEN: 40%以上

**Step 3: 問題があれば Task 4 へ。成功ならコミット**

```bash
git add -A
git commit -m "test(balance): シミュレーション結果確認（第1回）"
```

---

### Task 4: 調整が必要な場合のイテレーション

**Files:**
- Modify: `autoload/card_database.gd`（`_get_effect_budget_modifier`の値のみ）

**判断基準:**
- REDがまだ強い (>60%) → ダメージ系効果コスト増加 (例: 全体ダメージを-10→-12)
- GREENがまだ弱い (<40%) → マナ系効果コスト減少 (例: マナ+1を-3→-2)
- 特定のカードのみ外れ → そのカードの効果コストのみ個別調整

**調整後は必ず Step 1-3 を再実行**

```bash
git add autoload/card_database.gd
git commit -m "fix(balance): シミュレーション結果に基づく効果コスト調整（第N回）"
```

---

## 実行コマンドリファレンス

```bash
# シンタックスチェック
godot4 --headless --path . --check-only autoload/card_database.gd 2>&1

# 色別シミュレーション（高速）
godot4 --headless --path . -s addons/gut/gut_cmdln.gd \
  -gtest=test/unit/test_balance_simulator.gd -gexit 2>&1 | \
  grep -E "(BLUE|GREEN|BLACK|RED|YELLOW|PURPLE|WHITE|差:)"

# カードレベルシミュレーション（詳細）
godot4 --headless --path . -s addons/gut/gut_cmdln.gd \
  -gtest=test/unit/test_card_level_balance.gd -gexit 2>&1 | \
  grep -E "(BLUE|GREEN|BLACK|RED|YELLOW|PURPLE|WHITE|差:)" | head -30
```
