# Database Backup

Create a backup of the BATTLEFIELD database.

## Instructions

Run a full database backup:

```bash
BACKUP_DIR="/var/www/battlefield/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/battlefield_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Run backup
echo "Creating backup: $BACKUP_FILE"
PGPASSWORD=battlefield pg_dump -U battlefield -h localhost battlefield > "$BACKUP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
  # Compress the backup
  gzip "$BACKUP_FILE"
  COMPRESSED_FILE="$BACKUP_FILE.gz"
  SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
  echo "✅ Backup created successfully!"
  echo "📁 File: $COMPRESSED_FILE"
  echo "📦 Size: $SIZE"

  # Show recent backups
  echo ""
  echo "=== Recent Backups ==="
  ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | tail -5
else
  echo "❌ Backup failed!"
fi
```

## Quick Backup (Data Only)

```bash
BACKUP_DIR="/var/www/battlefield/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=battlefield pg_dump -U battlefield -h localhost --data-only battlefield | gzip > "$BACKUP_DIR/battlefield_data_$TIMESTAMP.sql.gz" && echo "✅ Data backup created: battlefield_data_$TIMESTAMP.sql.gz"
```

## Backup Specific Tables

```bash
# Backup users and trades tables only
BACKUP_DIR="/var/www/battlefield/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=battlefield pg_dump -U battlefield -h localhost -t users -t trades battlefield | gzip > "$BACKUP_DIR/battlefield_users_trades_$TIMESTAMP.sql.gz" && echo "✅ Users/Trades backup created"
```

## List Existing Backups

```bash
echo "=== Available Backups ===" && ls -lh /var/www/battlefield/backups/*.gz 2>/dev/null || echo "No backups found"
```

## Cleanup Old Backups (Keep Last 10)

```bash
BACKUP_DIR="/var/www/battlefield/backups"
cd "$BACKUP_DIR" && ls -t *.gz 2>/dev/null | tail -n +11 | xargs -r rm -v && echo "✅ Cleanup complete - kept last 10 backups"
```

## Get Database Size

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  pg_size_pretty(pg_database_size('battlefield')) as database_size;
"
```
