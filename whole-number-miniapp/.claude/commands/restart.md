# Restart Services

Restart BATTLEFIELD services with proper health checks.

## Instructions

Restart frontend, backend, or all services with verification.

## Restart All

```bash
echo "🔄 RESTARTING ALL BATTLEFIELD SERVICES" && echo ""

# Fix sequences first
echo "1️⃣ Fixing database sequences..."
/var/www/battlefield/whole-number-miniapp/backend/scripts/fix-sequences.sh 2>/dev/null && echo "✅ Sequences fixed" || echo "⚠️ Sequence fix skipped"

echo ""
echo "2️⃣ Restarting backend..."
pm2 restart battlefield-backend 2>/dev/null
sleep 2

# Health check backend
BACKEND=$(curl -s --max-time 5 http://localhost:3001/health 2>/dev/null)
if echo "$BACKEND" | grep -q "ok"; then
  echo "✅ Backend: Healthy"
else
  echo "❌ Backend: Not responding!"
fi

echo ""
echo "3️⃣ Restarting frontend..."
pm2 restart battlefield-frontend 2>/dev/null
sleep 3

# Health check frontend
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 2>/dev/null)
if [ "$FRONTEND" = "200" ]; then
  echo "✅ Frontend: Healthy (HTTP $FRONTEND)"
else
  echo "❌ Frontend: Not responding (HTTP $FRONTEND)"
fi

echo ""
echo "4️⃣ Final status:"
pm2 list | grep battlefield
```

## Restart Backend Only

```bash
echo "🔄 Restarting Backend..." && echo ""

/var/www/battlefield/whole-number-miniapp/backend/scripts/fix-sequences.sh 2>/dev/null
pm2 restart battlefield-backend
sleep 2

curl -s --max-time 5 http://localhost:3001/health && echo "" && echo "✅ Backend healthy"
```

## Restart Frontend Only

```bash
echo "🔄 Restarting Frontend..." && echo ""

pm2 restart battlefield-frontend
sleep 3

HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000)
if [ "$HTTP" = "200" ]; then
  echo "✅ Frontend healthy (HTTP $HTTP)"
else
  echo "❌ Frontend issue (HTTP $HTTP)"
fi
```

## Hard Restart (Stop + Start)

```bash
echo "⚠️ HARD RESTART - Stopping all services..." && echo ""

pm2 stop battlefield-backend battlefield-frontend
sleep 2

echo "Starting services..."
pm2 start battlefield-backend battlefield-frontend
sleep 3

echo ""
pm2 list | grep battlefield
```

## Rebuild and Restart

```bash
echo "🔨 REBUILD AND RESTART" && echo ""

echo "1️⃣ Building backend..."
cd /var/www/battlefield/whole-number-miniapp/backend && npm run build 2>&1 | tail -5

echo ""
echo "2️⃣ Building frontend..."
cd /var/www/battlefield/whole-number-miniapp && npm run build 2>&1 | tail -10

echo ""
echo "3️⃣ Restarting services..."
pm2 restart battlefield-backend battlefield-frontend
sleep 3

echo ""
echo "4️⃣ Health check:"
curl -s http://localhost:3001/health && echo ""
curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\n" http://localhost:3000
```
