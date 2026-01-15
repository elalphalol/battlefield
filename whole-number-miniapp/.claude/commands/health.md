# Quick Health Check

Fast system health overview for BATTLEFIELD.

## Instructions

Run a quick health check of all services.

## Quick Check

```bash
echo "⚡ BATTLEFIELD QUICK HEALTH" && echo ""

# Backend
BACKEND=$(curl -s --max-time 3 http://localhost:3001/health 2>/dev/null)
if echo "$BACKEND" | grep -q "ok"; then
  echo "✅ Backend: OK"
else
  echo "❌ Backend: DOWN"
fi

# Frontend
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000 2>/dev/null)
if [ "$FRONTEND" = "200" ]; then
  echo "✅ Frontend: OK (HTTP $FRONTEND)"
else
  echo "❌ Frontend: DOWN (HTTP $FRONTEND)"
fi

# Database
DB=$(PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "SELECT 1" 2>/dev/null | tr -d ' ')
if [ "$DB" = "1" ]; then
  echo "✅ Database: OK"
else
  echo "❌ Database: DOWN"
fi

# PM2 Status
echo ""
echo "📊 PM2 Status:"
pm2 list 2>/dev/null | grep -E "battlefield|online|errored" || echo "PM2 not running"

# BTC Price (API check)
echo ""
BTC=$(curl -s --max-time 3 http://localhost:3001/api/btc/price 2>/dev/null)
if echo "$BTC" | grep -q "price"; then
  PRICE=$(echo "$BTC" | grep -oP '"price":\s*\d+' | grep -oP '\d+')
  echo "₿ BTC Price: \$${PRICE}"
else
  echo "⚠️ BTC Price API: Not responding"
fi
```
