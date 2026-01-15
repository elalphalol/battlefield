# Error Logs

View and analyze BATTLEFIELD error logs.

## Instructions

Check recent errors from backend, frontend, and system logs.

## Recent Errors

```bash
echo "🚨 BATTLEFIELD ERROR CHECK" && echo ""

echo "=== BACKEND ERRORS (Last 50 lines) ===" && echo ""
pm2 logs battlefield-backend --lines 50 --nostream 2>/dev/null | grep -iE "error|fail|exception|warn|crash|ECONNREFUSED|ENOTFOUND|timeout" | tail -15 || echo "No recent errors"

echo ""
echo "=== FRONTEND ERRORS (Last 50 lines) ===" && echo ""
pm2 logs battlefield-frontend --lines 50 --nostream 2>/dev/null | grep -iE "error|fail|exception|warn|crash|build" | tail -15 || echo "No recent errors"
```

## Backend Errors Only

```bash
echo "🔴 BACKEND ERRORS" && echo ""
pm2 logs battlefield-backend --lines 100 --nostream 2>/dev/null | grep -iE "error|exception|fail" | tail -20
```

## Frontend Errors Only

```bash
echo "🔴 FRONTEND ERRORS" && echo ""
pm2 logs battlefield-frontend --lines 100 --nostream 2>/dev/null | grep -iE "error|exception|fail" | tail -20
```

## Database Errors

```bash
echo "🔴 DATABASE ERRORS" && echo ""

# Check PostgreSQL logs
if [ -f /var/log/postgresql/postgresql-16-main.log ]; then
  tail -50 /var/log/postgresql/postgresql-16-main.log 2>/dev/null | grep -iE "error|fatal|panic" | tail -10
else
  echo "PostgreSQL log not found at default location"
fi

# Check for connection issues
echo ""
echo "Connection test:"
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "SELECT 1 as connected;" 2>&1 | head -5
```

## Nginx Errors

```bash
echo "🔴 NGINX ERRORS" && echo ""
tail -30 /var/log/nginx/error.log 2>/dev/null | tail -15 || echo "Nginx error log not accessible"
```

## Error Summary

```bash
echo "" && echo "📊 ERROR SUMMARY (Last 24h):" && echo ""

echo "Backend errors:"
pm2 logs battlefield-backend --lines 1000 --nostream 2>/dev/null | grep -ciE "error|exception" || echo "0"

echo "Frontend errors:"
pm2 logs battlefield-frontend --lines 1000 --nostream 2>/dev/null | grep -ciE "error|exception" || echo "0"

echo ""
echo "Most common errors:"
pm2 logs battlefield-backend --lines 500 --nostream 2>/dev/null | grep -iE "error" | sed 's/.*error/error/i' | sort | uniq -c | sort -rn | head -5
```

## Trade Failures

```bash
echo "" && echo "❌ RECENT TRADE FAILURES:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  TO_CHAR(closed_at, 'MM/DD HH24:MI') as time,
  COALESCE(u.username, LEFT(u.wallet_address, 8)) as user,
  t.position_type as type,
  t.leverage || 'x' as lev,
  '\$' || TO_CHAR(ABS(t.pnl), 'FM99,999') as loss,
  CASE
    WHEN t.status = 'liquidated' THEN '💥 LIQUIDATED'
    WHEN t.closed_by = 'stop_loss' THEN '🛡️ STOP LOSS'
    ELSE '❌ LOSS'
  END as reason
FROM trades t
JOIN users u ON t.user_id = u.id
WHERE t.status IN ('closed', 'liquidated')
AND t.pnl < 0
ORDER BY t.closed_at DESC
LIMIT 10;
"
```
