#!/bin/bash
set -uo pipefail

echo "========================================"
echo "  Dice Deck Random - Test Suite"
echo "========================================"

PASS=0
FAIL=0
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

assert_ok() {
    local desc="$1"
    if eval "$2" > /dev/null 2>&1; then
        PASS=$((PASS + 1))
        echo "  PASS: $desc"
    else
        FAIL=$((FAIL + 1))
        echo "  FAIL: $desc"
    fi
}

echo ""
echo "--- Card Data Integrity ---"
CARD_DEFS=$(grep -cE '^\s+\[[0-9]+,' "$PROJECT_DIR/autoload/card_database.gd" || echo "0")
assert_ok "CardDatabase has at least 20 cards (found $CARD_DEFS)" "[ $CARD_DEFS -ge 20 ]"
assert_ok "CardData has atk field" "grep -q 'var atk' $PROJECT_DIR/cards/card_data.gd"
assert_ok "CardData has hp field" "grep -q 'var hp' $PROJECT_DIR/cards/card_data.gd"
assert_ok "CardData has attack_dice field" "grep -q 'var attack_dice' $PROJECT_DIR/cards/card_data.gd"
assert_ok "CardData has mana_cost field" "grep -q 'var mana_cost' $PROJECT_DIR/cards/card_data.gd"

echo ""
echo "--- Scene Integrity ---"
for scene in battle/battle lobby/lobby title/title_screen deck_editor/deck_editor result/result; do
    assert_ok "Scene exists: $scene.tscn" "[ -f '$PROJECT_DIR/scenes/$scene.tscn' ]"
done

echo ""
echo "--- Script Integrity ---"
for gd in battle/battle battle/card_ui battle/field_slot battle/online_battle lobby/lobby title/title_screen deck_editor/deck_editor result/result; do
    GD_FILE="$PROJECT_DIR/scenes/$gd.gd"
    if [ -f "$GD_FILE" ]; then
        LINES=$(wc -l < "$GD_FILE")
        assert_ok "Script has content: $gd.gd ($LINES lines)" "[ $LINES -gt 0 ]"
    else
        FAIL=$((FAIL + 1))
        echo "  FAIL: Script missing: $gd.gd"
    fi
done

echo ""
echo "--- Autoload Integrity ---"
for autoload in game_manager card_database firebase_manager multiplayer_manager; do
    GD_FILE="$PROJECT_DIR/autoload/$autoload.gd"
    LINES=$(wc -l < "$GD_FILE" 2>/dev/null || echo "0")
    assert_ok "Autoload: $autoload.gd ($LINES lines)" "[ $LINES -gt 0 ]"
    NAME=$(echo "$autoload" | perl -pe 's/(^|_)(\w)/uc($2)/ge')
    assert_ok "project.godot registers $NAME" "grep -q '$NAME' $PROJECT_DIR/project.godot"
done

echo ""
echo "--- Point Budget Validation ---"
BUDGET_OUTPUT=$(perl -ne '
    # gray_defsセクション内のバニラカードのみチェック（ID 0-19）
    if (/^\s+\[(\d+),\s*"([^"]+)",\s*(\d+),\s*(\d+),\s*(\d+),\s*\[([^\]]*)\]\],?$/) {
        my ($id, $name, $cost, $atk, $hp, $dice_str) = ($1, $2, $3, $4, $5, $6);
        next if $id >= 20; # 効果カードはスキップ
        my @dice = split /,\s*/, $dice_str;
        my $faces = scalar @dice;
        my $synergy = int(($atk * $faces) / 3);
        my $score = 4*$hp + 3*$atk + 3*$faces + $synergy;
        my $budget = 12 + 10*$cost;
        my $diff = $score - $budget;
        if (abs($diff) <= 1) {
            print "PASS:$name (cost=$cost atk=$atk hp=$hp faces=$faces score=$score budget=$budget)\n";
        } else {
            print "FAIL:$name (cost=$cost atk=$atk hp=$hp faces=$faces score=$score budget=$budget diff=$diff)\n";
        }
    }
' "$PROJECT_DIR/autoload/card_database.gd")

while IFS= read -r line; do
    if [[ "$line" == PASS:* ]]; then
        PASS=$((PASS + 1))
        echo "  PASS: ${line#PASS:}"
    elif [[ "$line" == FAIL:* ]]; then
        FAIL=$((FAIL + 1))
        echo "  FAIL: ${line#FAIL:}"
    fi
done <<< "$BUDGET_OUTPUT"

echo ""
echo "========================================"
echo "  Total: $PASS passed, $FAIL failed"
echo "========================================"

if [ "$FAIL" -gt 0 ]; then
    echo "FAIL"
    exit 1
else
    echo "All tests PASS"
    exit 0
fi
