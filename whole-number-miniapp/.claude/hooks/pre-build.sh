#!/bin/bash
# Pre-build hook: Check for TypeScript errors before building

set -e

PROJECT_DIR="/var/www/battlefield/whole-number-miniapp"

# Check if this is a build command
if echo "$CLAUDE_TOOL_INPUT" | grep -qE 'npm run build'; then
    cd "$PROJECT_DIR"

    # Quick TypeScript check without full build
    if command -v npx &> /dev/null; then
        echo "[Hook] Running TypeScript check..."
        npx tsc --noEmit --skipLibCheck 2>&1 | head -20 || true
    fi
fi
