# Performance

Monitor BATTLEFIELD system performance and resources.

## Instructions

Check CPU, memory, and application performance metrics.

## System Overview

```bash
echo "⚡ BATTLEFIELD PERFORMANCE" && echo ""

echo "📊 SYSTEM RESOURCES:"
echo ""

# CPU
echo "CPU Load:"
uptime | sed 's/.*load average/Load average/'

echo ""

# Memory
echo "Memory Usage:"
free -h | grep -E "Mem|total"

echo ""

# Disk
echo "Disk Usage:"
df -h / | grep -v Filesystem

echo ""

# PM2 Process Memory
echo "📱 PM2 PROCESS MEMORY:"
pm2 list 2>/dev/null | grep -E "battlefield|memory|cpu"
```

## PM2 Detailed Stats

```bash
echo "" && echo "📈 PM2 DETAILED METRICS:" && echo ""

pm2 show battlefield-backend 2>/dev/null | grep -E "status|memory|cpu|uptime|restarts" | head -10
echo ""
pm2 show battlefield-frontend 2>/dev/null | grep -E "status|memory|cpu|uptime|restarts" | head -10
```

## Database Performance

```bash
echo "" && echo "🗄️ DATABASE PERFORMANCE:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
-- Table sizes
SELECT
  relname as table,
  pg_size_pretty(pg_total_relation_size(relid)) as total_size,
  n_live_tup as rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;
"

echo ""
echo "Active connections:"
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "
SELECT COUNT(*) || ' active connections' FROM pg_stat_activity WHERE state = 'active';
"
```

## API Response Times

```bash
echo "" && echo "⏱️ API RESPONSE TIMES:" && echo ""

echo "Health endpoint:"
time curl -s -o /dev/null http://localhost:3001/health 2>&1 | grep real

echo ""
echo "Leaderboard endpoint:"
time curl -s -o /dev/null "http://localhost:3001/api/leaderboard?limit=10" 2>&1 | grep real

echo ""
echo "Army stats endpoint:"
time curl -s -o /dev/null http://localhost:3001/api/army/stats 2>&1 | grep real

echo ""
echo "BTC price endpoint:"
time curl -s -o /dev/null http://localhost:3001/api/btc/price 2>&1 | grep real
```

## Network Connections

```bash
echo "" && echo "🌐 NETWORK CONNECTIONS:" && echo ""

echo "Open connections to backend (3001):"
ss -tunap 2>/dev/null | grep ":3001" | wc -l

echo "Open connections to frontend (3000):"
ss -tunap 2>/dev/null | grep ":3000" | wc -l

echo "Open connections to postgres (5432):"
ss -tunap 2>/dev/null | grep ":5432" | wc -l
```

## Memory Breakdown

```bash
echo "" && echo "💾 DETAILED MEMORY:" && echo ""

# Get PM2 memory usage
pm2 jlist 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    total = 0
    for proc in data:
        name = proc.get('name', 'unknown')
        mem = proc.get('monit', {}).get('memory', 0)
        mem_mb = mem / 1024 / 1024
        total += mem_mb
        print(f'  {name}: {mem_mb:.1f} MB')
    print(f'  ─────────────────')
    print(f'  Total PM2: {total:.1f} MB')
except:
    print('  Unable to parse PM2 memory')
" 2>/dev/null
```
