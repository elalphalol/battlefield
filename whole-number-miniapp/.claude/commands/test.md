# Test & Verify

Run tests and verify BATTLEFIELD functionality.

## Instructions

Verify system health and critical flows.

## Full System Check

```bash
echo "=== BATTLEFIELD SYSTEM CHECK ===" && echo ""

echo "1️⃣ PM2 Processes..."
pm2 list 2>/dev/null | grep -E "battlefield|Name" || echo "❌ PM2 not running"
echo ""

echo "2️⃣ Backend Health..."
HEALTH=$(curl -s --max-time 5 http://localhost:3001/health 2>/dev/null)
if echo "$HEALTH" | grep -q "ok"; then
  echo "✅ Backend healthy: $HEALTH"
else
  echo "❌ Backend not responding"
fi
echo ""

echo "3️⃣ Frontend Status..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Frontend responding (HTTP $HTTP_CODE)"
else
  echo "❌ Frontend error (HTTP $HTTP_CODE)"
fi
echo ""

echo "4️⃣ Database Connection..."
DB_CHECK=$(PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "SELECT 'connected'" 2>/dev/null | tr -d ' ')
if [ "$DB_CHECK" = "connected" ]; then
  echo "✅ Database connected"
else
  echo "❌ Database connection failed"
fi
echo ""

echo "5️⃣ Nginx Status..."
systemctl is-active nginx > /dev/null 2>&1 && echo "✅ Nginx running" || echo "❌ Nginx not running"
echo ""

echo "=== CHECK COMPLETE ==="
```

## API Endpoint Tests

```bash
echo "=== API ENDPOINT TESTS ===" && echo ""

# Test health endpoint
echo "GET /health..."
curl -s http://localhost:3001/health && echo "" && echo ""

# Test leaderboard endpoint
echo "GET /api/leaderboard..."
curl -s "http://localhost:3001/api/leaderboard?limit=3" | head -c 500 && echo "..." && echo ""

# Test army stats endpoint
echo "GET /api/army/stats..."
curl -s http://localhost:3001/api/army/stats && echo "" && echo ""

# Test BTC price endpoint
echo "GET /api/btc/price..."
curl -s http://localhost:3001/api/btc/price && echo ""
```

## Database Integrity Checks

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
-- Check for orphaned trades
SELECT 'Orphaned trades (no user): ' || COUNT(*)
FROM trades t
LEFT JOIN users u ON t.user_id = u.id
WHERE u.id IS NULL;

-- Check for negative balances
SELECT 'Users with negative balance: ' || COUNT(*)
FROM users WHERE paper_balance < 0;

-- Check for stuck open trades (older than 7 days)
SELECT 'Stuck open trades (>7 days): ' || COUNT(*)
FROM trades
WHERE status = 'open' AND opened_at < NOW() - INTERVAL '7 days';

-- Check sequence alignment
SELECT 'Users sequence: ' || last_value FROM users_id_seq;
SELECT 'Max user ID: ' || COALESCE(MAX(id), 0) FROM users;
SELECT 'Trades sequence: ' || last_value FROM trades_id_seq;
SELECT 'Max trade ID: ' || COALESCE(MAX(id), 0) FROM trades;
"
```

## Memory & CPU Check

```bash
echo "=== RESOURCE USAGE ===" && echo ""
echo "Memory:"
free -h | grep -E "Mem|total"
echo ""
echo "CPU Load:"
uptime
echo ""
echo "Disk Space:"
df -h / | grep -v Filesystem
echo ""
echo "PM2 Memory:"
pm2 list | grep -E "battlefield|memory"
```

## Recent Errors Check

```bash
echo "=== RECENT ERRORS (Last 50 lines) ===" && echo ""
echo "--- Backend Errors ---"
pm2 logs battlefield-backend --lines 50 --nostream 2>/dev/null | grep -iE "error|fail|exception|crash" | tail -10 || echo "No recent errors"
echo ""
echo "--- Frontend Errors ---"
pm2 logs battlefield-frontend --lines 50 --nostream 2>/dev/null | grep -iE "error|fail|exception|crash" | tail -10 || echo "No recent errors"
```

## Fix Common Issues

```bash
# Fix sequence issues
# /var/www/battlefield/whole-number-miniapp/backend/scripts/fix-sequences.sh

# Clear Next.js cache and rebuild
# cd /var/www/battlefield/whole-number-miniapp && rm -rf .next && npm run build

# Restart all services
# pm2 restart battlefield-backend battlefield-frontend
```
