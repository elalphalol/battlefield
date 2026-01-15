#!/bin/bash
# Pre-database hook: Backup database before destructive operations

PROJECT_DIR="/var/www/battlefield/whole-number-miniapp"
BACKUP_DIR="/var/backups/battlefield"

# Check for potentially destructive database operations
if echo "$CLAUDE_TOOL_INPUT" | grep -qiE 'DROP|TRUNCATE|DELETE FROM|ALTER TABLE.*DROP'; then
    echo "[Hook] Destructive database operation detected!"

    # Create backup directory if needed
    mkdir -p "$BACKUP_DIR" 2>/dev/null || true

    # Create quick backup
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    echo "[Hook] Creating backup: battlefield_$TIMESTAMP.sql"

    PGPASSWORD=battlefield pg_dump -U battlefield -h localhost battlefield > "$BACKUP_DIR/battlefield_$TIMESTAMP.sql" 2>/dev/null || {
        echo "[Hook] WARNING: Backup failed. Proceed with caution!"
    }
fi
