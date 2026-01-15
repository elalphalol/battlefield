# BTC Price

View current Bitcoin price and market data.

## Instructions

Display current BTC price from various sources.

## Current Price

```bash
echo "₿ BITCOIN PRICE CHECK" && echo ""

# From backend API
echo "📡 Backend API:"
BACKEND_PRICE=$(curl -s --max-time 3 http://localhost:3001/api/btc/price 2>/dev/null)
if echo "$BACKEND_PRICE" | grep -q "price"; then
  echo "$BACKEND_PRICE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
price = data.get('price', 0)
change = data.get('change24h', 0)
symbol = '📈' if change >= 0 else '📉'
print(f'   Price: \${price:,.0f}')
print(f'   24h Change: {symbol} {change:+.2f}%')
" 2>/dev/null
else
  echo "   ❌ Not available"
fi

echo ""

# From CoinGecko (backup)
echo "🦎 CoinGecko:"
CG_PRICE=$(curl -s --max-time 5 "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true" 2>/dev/null)
if echo "$CG_PRICE" | grep -q "bitcoin"; then
  echo "$CG_PRICE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
btc = data.get('bitcoin', {})
price = btc.get('usd', 0)
change = btc.get('usd_24h_change', 0)
symbol = '📈' if change >= 0 else '📉'
print(f'   Price: \${price:,.0f}')
print(f'   24h Change: {symbol} {change:+.2f}%')
" 2>/dev/null
else
  echo "   ❌ Not available (rate limited?)"
fi
```

## Price History (Last 10 Trades)

```bash
echo "" && echo "📊 Recent Trade Prices:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  TO_CHAR(opened_at, 'HH24:MI') as time,
  '\$' || TO_CHAR(entry_price, 'FM999,999') as entry,
  CASE WHEN exit_price IS NOT NULL THEN '\$' || TO_CHAR(exit_price, 'FM999,999') ELSE '-' END as exit,
  position_type as type
FROM trades
ORDER BY opened_at DESC
LIMIT 10;
"
```
