# Service Status

Check the status of all BATTLEFIELD services.

## Instructions

1. Check PM2 processes:
```bash
pm2 list
```

2. Check backend health:
```bash
curl -s http://localhost:3001/health | jq . 2>/dev/null || curl -s http://localhost:3001/health
```

3. Check frontend:
```bash
curl -s -o /dev/null -w "Frontend HTTP status: %{http_code}\n" http://localhost:3000
```

4. Check nginx:
```bash
systemctl status nginx --no-pager -l | head -10
```

5. Check PostgreSQL:
```bash
systemctl status postgresql --no-pager -l | head -10
```

## Quick Health Check

```bash
pm2 list && echo "---" && curl -s http://localhost:3001/health
```
