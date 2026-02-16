#!/bin/bash
# GDScript syntax checker - checks for common issues
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ERRORS=0

while IFS= read -r file; do
    line_num=0
    has_tabs=false
    has_spaces=false
    
    while IFS= read -r line; do
        line_num=$((line_num + 1))
        
        # Trailing whitespace
        if [[ "$line" =~ [[:blank:]]$ ]]; then
            echo "$file:$line_num: trailing whitespace"
            ERRORS=$((ERRORS + 1))
        fi
        
        # Check indent style (detect mixed tabs/spaces)
        indent="${line%%[^[:blank:]]*}"
        if [[ "$indent" == *$'\t'* ]] && [[ "$indent" == *" "* ]]; then
            echo "$file:$line_num: mixed tabs and spaces in indentation"
            ERRORS=$((ERRORS + 1))
        fi
    done < "$file"
    
    # Unmatched brackets
    open_parens=$(grep -o '(' "$file" | wc -l || true)
    close_parens=$(grep -o ')' "$file" | wc -l || true)
    if [ "$open_parens" -ne "$close_parens" ]; then
        echo "$file: unmatched parentheses (open=$open_parens close=$close_parens)"
        ERRORS=$((ERRORS + 1))
    fi
    
    open_brackets=$(grep -o '\[' "$file" | wc -l || true)
    close_brackets=$(grep -o '\]' "$file" | wc -l || true)
    if [ "$open_brackets" -ne "$close_brackets" ]; then
        echo "$file: unmatched square brackets (open=$open_brackets close=$close_brackets)"
        ERRORS=$((ERRORS + 1))
    fi
    
    open_braces=$(grep -o '{' "$file" | wc -l || true)
    close_braces=$(grep -o '}' "$file" | wc -l || true)
    if [ "$open_braces" -ne "$close_braces" ]; then
        echo "$file: unmatched curly braces (open=$open_braces close=$close_braces)"
        ERRORS=$((ERRORS + 1))
    fi
    
done < <(find "$PROJECT_DIR" -name "*.gd" -not -path "*/.godot/*")

if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo "Found $ERRORS issue(s)."
    exit 1
else
    echo "All GDScript files passed syntax checks."
    exit 0
fi
