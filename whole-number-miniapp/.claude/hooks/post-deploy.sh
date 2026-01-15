#!/bin/bash
# Post-deploy hook: Verify services are healthy after deployment

PROJECT_DIR="/var/www/battlefield/whole-number-miniapp"

# Check if this was a PM2 restart command
if echo "$CLAUDE_TOOL_INPUT" | grep -qE 'pm2 restart'; then
    sleep 2  # Wait for service to start

    # Check which service was restarted
    if echo "$CLAUDE_TOOL_INPUT" | grep -q 'battlefield-backend'; then
        echo "[Hook] Verifying backend health..."
        HEALTH=$(curl -s --max-time 5 http://localhost:3001/health 2>/dev/null)
        if echo "$HEALTH" | grep -q '"status":"ok"'; then
            echo "[Hook] Backend is healthy"
        else
            echo "[Hook] WARNING: Backend health check failed"
        fi
    fi

    if echo "$CLAUDE_TOOL_INPUT" | grep -q 'battlefield-frontend'; then
        echo "[Hook] Verifying frontend health..."
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null)
        if [ "$HTTP_CODE" = "200" ]; then
            echo "[Hook] Frontend is healthy (HTTP $HTTP_CODE)"
        else
            echo "[Hook] WARNING: Frontend returned HTTP $HTTP_CODE"
        fi
    fi
fi
