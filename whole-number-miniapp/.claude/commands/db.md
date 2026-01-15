# Database Operations

Perform database operations for BATTLEFIELD.

## Instructions

Ask the user what database operation they need:
1. **Connect** - Open PostgreSQL shell
2. **Status** - Check database stats
3. **Migrations** - Run pending migrations
4. **Query** - Run a specific query
5. **Backup** - Create database backup

### Connect to PostgreSQL:
```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield
```

### Check database status:
```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT 'Users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'Trades', COUNT(*) FROM trades
UNION ALL SELECT 'Open Trades', COUNT(*) FROM trades WHERE status='open'
UNION ALL SELECT 'Claims', COUNT(*) FROM claims
UNION ALL SELECT 'Missions', COUNT(*) FROM user_missions;
"
```

### Run migrations:
```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node run-migration.js
```

### View schema:
```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "\dt"
```

### Create backup:
```bash
mkdir -p /var/backups/battlefield && PGPASSWORD=battlefield pg_dump -U battlefield -h localhost battlefield > /var/backups/battlefield/battlefield_$(date +%Y%m%d_%H%M%S).sql && echo "Backup created"
```

## Common Queries

### Active users today:
```sql
SELECT COUNT(DISTINCT user_id) FROM trades WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Army statistics:
```sql
SELECT army, COUNT(*) as soldiers, ROUND(AVG(total_pnl)::numeric, 2) as avg_pnl FROM users WHERE army IS NOT NULL GROUP BY army;
```

### Top traders by P&L:
```sql
SELECT username, total_pnl, winning_trades, total_trades FROM users ORDER BY total_pnl DESC LIMIT 10;
```
