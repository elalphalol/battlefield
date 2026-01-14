# Database Operations

Perform database operations for BATTLEFIELD.

## Instructions

### Connect to PostgreSQL:
```bash
psql -U postgres -d battlefield
```

### Run migrations:
```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node run-migration.js
```

### Check database status:
```bash
psql -U postgres -d battlefield -c "SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as trades FROM trades; SELECT COUNT(*) as open_trades FROM trades WHERE status='open';"
```

### View schema:
```bash
psql -U postgres -d battlefield -c "\dt"
```

## Common Queries

### Active users today:
```sql
SELECT COUNT(DISTINCT wallet_address) FROM trades WHERE created_at > NOW() - INTERVAL '24 hours';
```

### Army statistics:
```sql
SELECT army, COUNT(*) as soldiers, SUM(balance) as total_balance FROM users GROUP BY army;
```
