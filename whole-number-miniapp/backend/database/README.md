# BATTLEFIELD PostgreSQL Database Setup

## 📋 Prerequisites

- PostgreSQL 14+ installed
- Access to PostgreSQL command line or GUI tool (pgAdmin, DBeaver, etc.)
- Database user with CREATE DATABASE privileges

---

## 🚀 Quick Setup

### Option 1: Command Line Setup

```bash
# 1. Create database
createdb battlefield

# 2. Run schema
psql battlefield < schema.sql

# 3. Verify setup
psql battlefield -c "SELECT * FROM army_stats;"
psql battlefield -c "SELECT * FROM system_config;"
```

### Option 2: Using psql Interactive

```bash
# 1. Connect to PostgreSQL
psql postgres

# 2. Create database
CREATE DATABASE battlefield;

# 3. Connect to new database
\c battlefield

# 4. Run schema file
\i schema.sql

# 5. Verify tables
\dt

# 6. Check views
\dv

# 7. Exit
\q
```

### Option 3: Using Docker

```bash
# 1. Run PostgreSQL in Docker
docker run --name battlefield-postgres \
  -e POSTGRES_DB=battlefield \
  -e POSTGRES_USER=battlefield_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -v $(pwd)/schema.sql:/docker-entrypoint-initdb.d/schema.sql \
  -d postgres:16

# 2. Verify
docker exec -it battlefield-postgres psql -U battlefield_user -d battlefield -c "\dt"
```

---

## 📊 Database Structure

### Tables

1. **users** - User accounts with paper balance and stats
2. **trades** - All paper trading positions
3. **claims** - Paper money claim history ($1K every 10 min)
4. **leaderboard_snapshot** - Historical leaderboard rankings
5. **rewards_history** - $BATTLE token distributions
6. **achievements** - Earned achievements and NFTs
7. **army_stats** - Cached Bears 🐻 vs Bulls 🐂 statistics
8. **system_config** - System configuration parameters

### Views

1. **current_leaderboard** - Live leaderboard with rankings
2. **active_positions** - All open trading positions

### Functions & Triggers

1. **update_user_stats_after_trade()** - Auto-update user stats when trade closes
2. **update_army_stats()** - Auto-update army statistics

---

## 🔌 Connection String Format

```bash
# Development (local)
DATABASE_URL=postgresql://username:password@localhost:5432/battlefield

# Production (example with SSL)
DATABASE_URL=postgresql://username:password@hostname:5432/battlefield?sslmode=require

# Using Railway
DATABASE_URL=postgresql://user:pass@containers-us-west-123.railway.app:5432/railway

# Using Supabase
DATABASE_URL=postgresql://postgres:pass@db.project.supabase.co:5432/postgres
```

---

## 🛠️ Common Commands

### View All Tables
```sql
\dt
```

### View Table Structure
```sql
\d+ users
\d+ trades
```

### Check Current Data
```sql
-- User count
SELECT COUNT(*) FROM users;

-- Army distribution
SELECT army, COUNT(*) FROM users GROUP BY army;

-- Trade statistics
SELECT 
  status,
  COUNT(*) as count,
  AVG(pnl) as avg_pnl
FROM trades
GROUP BY status;

-- Top 10 leaderboard
SELECT * FROM current_leaderboard LIMIT 10;

-- Army stats
SELECT * FROM army_stats;
```

### Reset Database (⚠️ Deletes all data)
```sql
-- Drop all tables
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS rewards_history CASCADE;
DROP TABLE IF EXISTS leaderboard_snapshot CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS army_stats CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;

-- Drop views
DROP VIEW IF EXISTS current_leaderboard;
DROP VIEW IF EXISTS active_positions;

-- Drop functions
DROP FUNCTION IF EXISTS update_user_stats_after_trade();
DROP FUNCTION IF EXISTS update_army_stats();

-- Then re-run schema.sql
\i schema.sql
```

---

## 🧪 Test Data (Optional)

```sql
-- Add test users
INSERT INTO users (fid, wallet_address, username, army, paper_balance) VALUES
(1, '0x1111111111111111111111111111111111111111', 'bear_trader_1', 'bears', 15000),
(2, '0x2222222222222222222222222222222222222222', 'bull_warrior_1', 'bulls', 12000),
(3, '0x3333333333333333333333333333333333333333', 'bear_general', 'bears', 25000);

-- Add test trades
INSERT INTO trades (user_id, position_type, leverage, entry_price, position_size, status) VALUES
(1, 'short', 50, 91500.00, 1000, 'open'),
(2, 'long', 100, 91200.00, 500, 'open');

-- Update army stats
SELECT update_army_stats();

-- View test data
SELECT * FROM current_leaderboard;
SELECT * FROM active_positions;
SELECT * FROM army_stats;
```

---

## 🔒 Security Recommendations

### Production Setup

1. **Create dedicated user:**
```sql
CREATE USER battlefield_app WITH PASSWORD 'strong_random_password';
GRANT CONNECT ON DATABASE battlefield TO battlefield_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO battlefield_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO battlefield_app;
```

2. **Restrict permissions:**
```sql
-- Read-only user for analytics
CREATE USER battlefield_readonly WITH PASSWORD 'another_password';
GRANT CONNECT ON DATABASE battlefield TO battlefield_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO battlefield_readonly;
```

3. **Enable SSL:**
```sql
-- In postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

4. **Connection pooling:**
```bash
# Use pgBouncer or similar
[databases]
battlefield = host=localhost port=5432 dbname=battlefield
```

---

## 📈 Performance Tuning

### Indexes (Already created in schema)
- All foreign keys indexed
- Wallet addresses and FIDs indexed
- Timestamp columns indexed for time-based queries

### Monitoring Queries

```sql
-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table sizes
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::text)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::text) DESC;

-- Slow queries (if pg_stat_statements enabled)
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## 🔄 Backup & Restore

### Backup
```bash
# Full backup
pg_dump battlefield > battlefield_backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump battlefield | gzip > battlefield_backup_$(date +%Y%m%d).sql.gz

# Schema only
pg_dump --schema-only battlefield > battlefield_schema.sql

# Data only
pg_dump --data-only battlefield > battlefield_data.sql
```

### Restore
```bash
# From SQL file
psql battlefield < battlefield_backup.sql

# From compressed
gunzip -c battlefield_backup.sql.gz | psql battlefield

# Create new database and restore
createdb battlefield_restore
psql battlefield_restore < battlefield_backup.sql
```

---

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check port
sudo netstat -plnt | grep 5432

# Test connection
psql -h localhost -U your_user -d battlefield
```

### Permission Errors
```sql
-- Grant all permissions
GRANT ALL PRIVILEGES ON DATABASE battlefield TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Reset Sequences
```sql
-- If you manually inserted data and auto-increment is broken
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('trades_id_seq', (SELECT MAX(id) FROM trades));
```

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg Node.js Library](https://node-postgres.com/)
- [Prisma ORM](https://www.prisma.io/) (Alternative to raw SQL)
- [Database Design Best Practices](https://wiki.postgresql.org/wiki/Don't_Do_This)

---

## 🎯 Next Steps

After setting up the database:

1. ✅ Database created and schema loaded
2. → Update `.env.local` with DATABASE_URL
3. → Build backend API server (Express)
4. → Create database query functions
5. → Test API endpoints
6. → Connect frontend to backend

---

**Database ready for BATTLEFIELD! ⚔️**

Bears 🐻 vs Bulls 🐂
