# BUG-001: バトル画面ボタンのキーボードアクセシビリティ修正案

## 問題
`next_phase_btn` と `dice_btn` がTabフォーカスチェーンに含まれていない。
スロットと手札カードの間でTabループしてしまい、ボタンにキーボードでアクセスできない。

## 原因
`battle_base.gd` でボタンを作成時に `focus_neighbor_*` を設定していない。

## 修正案

### 方法1: focus_neighborを設定

```gdscript
# battle_base.gd のボタン作成後に追加

# フォーカスチェーンを構築
# 手札カード → 次のフェーズへボタン → ダイスボタン → スロット → 手札カード...

# 例: 最後の手札カードから次のフェーズへボタンへ
if hand_ui.get_child_count() > 0:
    var last_card = hand_ui.get_child(-1)
    last_card.focus_neighbor_right = next_phase_btn.get_path()
    next_phase_btn.focus_neighbor_left = last_card.get_path()

# ダイスボタンとの接続
next_phase_btn.focus_neighbor_bottom = dice_btn.get_path()
dice_btn.focus_neighbor_top = next_phase_btn.get_path()
```

### 方法2: ショートカットキーを追加

```gdscript
# _input(event) を追加してキーバインドを設定
func _input(event: InputEvent) -> void:
    if event.is_action_pressed("ui_page_down"):  # または独自アクション
        _on_end_phase()
    elif event.is_action_pressed("ui_page_up"):
        _on_roll_dice()
```

`project.godot` に追加:
```ini
[input]
ui_next_phase={
    "deadzone": 0.5,
    "events": [Object(InputEventKey,"keycode":78)]  # Nキー
}
```

### 方法3: フォーカスグループを使用

```gdscript
# ボタンのfocus_modeを確認
next_phase_btn.focus_mode = Control.FOCUS_ALL

# フォーカスグループを設定（Godot 4.x）
next_phase_btn.set_focus_group(self)
dice_btn.set_focus_group(self)
```

## 推奨
方法2（ショートカットキー）が最もシンプルで確実。
Nキー: 次のフェーズ、Dキー: ダイス振り、など。

## 発見日
2026-02-24 Phase 3 cron秘術検証にて
