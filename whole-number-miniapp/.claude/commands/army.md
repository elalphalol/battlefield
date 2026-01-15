# Army Stats

View Bears vs Bulls army statistics and battle status.

## Instructions

Display current army statistics and war status.

## Army Overview

```bash
echo "⚔️ BATTLEFIELD ARMY STATS" && echo ""

# Fetch army stats from API
STATS=$(curl -s --max-time 5 http://localhost:3001/api/army/stats 2>/dev/null)

if echo "$STATS" | grep -q "success"; then
  echo "$STATS" | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('success'):
    stats = data.get('stats', {})
    bears = stats.get('bears', {})
    bulls = stats.get('bulls', {})

    print('🐻 BEARS ARMY')
    print(f'   Soldiers: {bears.get(\"members\", 0):,}')
    print(f'   Total P&L: \${bears.get(\"totalPnl\", 0):,.0f}')
    print(f'   Win Rate: {bears.get(\"winRate\", 0):.1f}%')
    print(f'   Avg Leverage: {bears.get(\"avgLeverage\", 0):.1f}x')
    print()
    print('🐂 BULLS ARMY')
    print(f'   Soldiers: {bulls.get(\"members\", 0):,}')
    print(f'   Total P&L: \${bulls.get(\"totalPnl\", 0):,.0f}')
    print(f'   Win Rate: {bulls.get(\"winRate\", 0):.1f}%')
    print(f'   Avg Leverage: {bulls.get(\"avgLeverage\", 0):.1f}x')
    print()

    # Determine winner
    bears_score = bears.get('totalPnl', 0)
    bulls_score = bulls.get('totalPnl', 0)
    if bears_score > bulls_score:
        lead = bears_score - bulls_score
        print(f'🏆 BEARS leading by \${lead:,.0f}!')
    elif bulls_score > bears_score:
        lead = bulls_score - bears_score
        print(f'🏆 BULLS leading by \${lead:,.0f}!')
    else:
        print('⚖️ Armies are tied!')
" 2>/dev/null || echo "Error parsing army stats"
else
  echo "❌ Could not fetch army stats"
fi
```

## Database Army Stats

```bash
echo "📊 Army Stats from Database:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  army,
  COUNT(*) as soldiers,
  SUM(total_pnl)::bigint as total_pnl,
  ROUND(AVG(CASE WHEN total_trades > 0 THEN (winning_trades::float / total_trades * 100) ELSE 0 END), 1) as avg_win_rate,
  SUM(total_trades) as total_trades
FROM users
WHERE army IS NOT NULL
GROUP BY army
ORDER BY total_pnl DESC;
"
```
