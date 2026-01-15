#!/bin/bash
# Post-tool error detector: Detect and suggest fixes for common errors

# Check for sequence/duplicate key errors
if echo "$CLAUDE_TOOL_OUTPUT" | grep -qE 'duplicate key.*_pkey|Failed to open trade|Failed to claim'; then
    echo ""
    echo "[Hook] Sequence issue detected!"
    echo "       Run: /fix-sequences"
    echo ""
fi

# Check for build errors
if echo "$CLAUDE_TOOL_OUTPUT" | grep -qE 'error TS[0-9]+|Cannot find module|Build failed'; then
    echo ""
    echo "[Hook] Build error detected!"
    echo "       Check TypeScript compilation errors above"
    echo ""
fi

# Check for Next.js client reference manifest error
if echo "$CLAUDE_TOOL_OUTPUT" | grep -qE 'client reference manifest.*does not exist|InvariantError'; then
    echo ""
    echo "[Hook] Next.js build corruption detected!"
    echo "       Run: rm -rf .next && npm run build && pm2 restart battlefield-frontend"
    echo ""
fi

# Check for PM2 process errors
if echo "$CLAUDE_TOOL_OUTPUT" | grep -qE 'errored|stopped'; then
    echo ""
    echo "[Hook] PM2 process error detected!"
    echo "       Check logs: pm2 logs --lines 50"
    echo ""
fi

# Check for database connection errors
if echo "$CLAUDE_TOOL_OUTPUT" | grep -qE 'ECONNREFUSED.*5432|connection refused|database.*does not exist'; then
    echo ""
    echo "[Hook] Database connection error!"
    echo "       Check: systemctl status postgresql"
    echo ""
fi
