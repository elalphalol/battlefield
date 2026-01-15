# Service Status

Check the status of all BATTLEFIELD services.

## Instructions

Run this comprehensive status check:

```bash
echo "=== PM2 Processes ===" && pm2 list && echo "" && echo "=== Backend Health ===" && curl -s http://localhost:3001/health 2>/dev/null || echo "Backend not responding" && echo "" && echo "=== Frontend Status ===" && curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000 2>/dev/null || echo "Frontend not responding" && echo "" && echo "=== Database ===" && PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "SELECT 'Connected' as status, COUNT(*) as users FROM users;" 2>/dev/null || echo "Database not responding"
```

## Quick Health Check

```bash
pm2 list && curl -s http://localhost:3001/health
```

## Detailed Checks

### Backend logs:
```bash
pm2 logs battlefield-backend --lines 20
```

### Frontend logs:
```bash
pm2 logs battlefield-frontend --lines 20
```

### System services:
```bash
systemctl status nginx --no-pager -l | head -5 && systemctl status postgresql --no-pager -l | head -5
```

## Database Stats

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "SELECT COUNT(*) as users FROM users; SELECT COUNT(*) as total_trades, COUNT(*) FILTER (WHERE status='open') as open_trades FROM trades;"
```
