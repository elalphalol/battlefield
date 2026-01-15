#!/bin/bash
# Pre-trade operations hook: Ensure sequences are valid before trade operations

PROJECT_DIR="/var/www/battlefield/whole-number-miniapp"

# Check if this is a trade-related operation (starting backend, or trade API calls)
if echo "$CLAUDE_TOOL_INPUT" | grep -qE 'pm2 restart battlefield-backend|npm start|node server|/api/trades'; then
    if [ -f "$PROJECT_DIR/backend/scripts/fix-sequences.sh" ]; then
        echo "[Hook] Checking database sequences..."
        "$PROJECT_DIR/backend/scripts/fix-sequences.sh" 2>/dev/null || true
    fi
fi
