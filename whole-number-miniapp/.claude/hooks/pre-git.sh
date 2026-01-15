#!/bin/bash
# Pre-git hook: Run linting before commits

PROJECT_DIR="/var/www/battlefield/whole-number-miniapp"

# Check if this is a git commit
if echo "$CLAUDE_TOOL_INPUT" | grep -qE 'git commit'; then
    cd "$PROJECT_DIR"

    echo "[Hook] Running lint check..."
    npm run lint --silent 2>/dev/null || {
        echo "[Hook] WARNING: Lint check has warnings or errors"
    }
fi
