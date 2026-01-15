# Database Restore

Restore the BATTLEFIELD database from a backup.

## Instructions

⚠️ **WARNING**: Restoring will OVERWRITE current data. Always create a fresh backup first!

## List Available Backups

```bash
echo "=== Available Backups ===" && ls -lh /var/www/battlefield/backups/*.gz 2>/dev/null | awk '{print NR". "$9" ("$5")"}' || echo "No backups found"
```

## Restore Process

### Step 1: Create a Safety Backup First

```bash
BACKUP_DIR="/var/www/battlefield/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=battlefield pg_dump -U battlefield -h localhost battlefield | gzip > "$BACKUP_DIR/battlefield_pre_restore_$TIMESTAMP.sql.gz" && echo "✅ Safety backup created"
```

### Step 2: Stop Services

```bash
pm2 stop battlefield-backend battlefield-frontend && echo "✅ Services stopped"
```

### Step 3: Restore from Backup

```bash
# Replace BACKUP_FILE with actual backup filename
BACKUP_FILE="/var/www/battlefield/backups/battlefield_YYYYMMDD_HHMMSS.sql.gz"

if [ -f "$BACKUP_FILE" ]; then
  echo "Restoring from: $BACKUP_FILE"

  # Drop and recreate database
  PGPASSWORD=battlefield psql -U battlefield -h localhost -c "DROP DATABASE IF EXISTS battlefield_restore;" postgres
  PGPASSWORD=battlefield psql -U battlefield -h localhost -c "CREATE DATABASE battlefield_restore;" postgres

  # Restore to temp database first
  gunzip -c "$BACKUP_FILE" | PGPASSWORD=battlefield psql -U battlefield -h localhost battlefield_restore

  if [ $? -eq 0 ]; then
    echo "✅ Restore to temp database successful"
    echo "⚠️  To finalize, run the swap commands below"
  else
    echo "❌ Restore failed!"
  fi
else
  echo "❌ Backup file not found: $BACKUP_FILE"
fi
```

### Step 4: Swap Databases (if restore successful)

```bash
# Only run if Step 3 was successful!
# PGPASSWORD=battlefield psql -U battlefield -h localhost postgres -c "
# SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'battlefield';
# "
# PGPASSWORD=battlefield psql -U battlefield -h localhost postgres -c "ALTER DATABASE battlefield RENAME TO battlefield_old;"
# PGPASSWORD=battlefield psql -U battlefield -h localhost postgres -c "ALTER DATABASE battlefield_restore RENAME TO battlefield;"
```

### Step 5: Restart Services

```bash
pm2 restart battlefield-backend battlefield-frontend && sleep 3 && pm2 list
```

### Step 6: Verify Restore

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT 'Users: ' || COUNT(*) FROM users
UNION ALL
SELECT 'Trades: ' || COUNT(*) FROM trades
UNION ALL
SELECT 'Missions: ' || COUNT(*) FROM user_missions;
"
```

## Restore Single Table

```bash
# Restore just users table from a backup
# gunzip -c /var/www/battlefield/backups/BACKUP_FILE.sql.gz | grep -A 1000000 "COPY public.users" | head -n $(grep -n "^\\\." | head -1 | cut -d: -f1) | PGPASSWORD=battlefield psql -U battlefield -h localhost battlefield
```

## Rollback (Use Old Database)

If restore went wrong and you need to rollback:

```bash
# pm2 stop battlefield-backend battlefield-frontend
# PGPASSWORD=battlefield psql -U battlefield -h localhost postgres -c "
# SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'battlefield';
# "
# PGPASSWORD=battlefield psql -U battlefield -h localhost postgres -c "DROP DATABASE battlefield;"
# PGPASSWORD=battlefield psql -U battlefield -h localhost postgres -c "ALTER DATABASE battlefield_old RENAME TO battlefield;"
# pm2 restart battlefield-backend battlefield-frontend
```
