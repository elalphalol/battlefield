# Leaderboard

View BATTLEFIELD leaderboard rankings.

## Instructions

Display top traders and leaderboard statistics.

## Top 10 Traders

```bash
echo "🏆 BATTLEFIELD LEADERBOARD - TOP 10" && echo ""

curl -s --max-time 5 "http://localhost:3001/api/leaderboard?limit=10" 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
if data.get('success'):
    lb = data.get('leaderboard', [])
    print(f'{'Rank':<6} {'Username':<20} {'Army':<8} {'P&L':>15} {'Win Rate':>10} {'Trades':>8}')
    print('-' * 75)
    for i, user in enumerate(lb, 1):
        name = user.get('username') or user.get('wallet_address', '')[:10]
        army = '🐻' if user.get('army') == 'bears' else '🐂'
        pnl = user.get('total_pnl', 0)
        pnl_str = f'+\${pnl:,.0f}' if pnl >= 0 else f'-\${abs(pnl):,.0f}'
        trades = user.get('total_trades', 0)
        wins = user.get('winning_trades', 0)
        win_rate = (wins / trades * 100) if trades > 0 else 0

        # Medal for top 3
        medal = '🥇' if i == 1 else '🥈' if i == 2 else '🥉' if i == 3 else f'#{i}'

        print(f'{medal:<6} {name:<20} {army:<8} {pnl_str:>15} {win_rate:>9.1f}% {trades:>8}')
" 2>/dev/null || echo "Error fetching leaderboard"
```

## Leaderboard by Army

```bash
echo "" && echo "🐻 TOP 5 BEARS:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "
SELECT
  COALESCE(username, LEFT(wallet_address, 10)) as name,
  total_pnl,
  total_trades,
  winning_trades
FROM users
WHERE army = 'bears'
ORDER BY total_pnl DESC
LIMIT 5;
" 2>/dev/null

echo "" && echo "🐂 TOP 5 BULLS:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "
SELECT
  COALESCE(username, LEFT(wallet_address, 10)) as name,
  total_pnl,
  total_trades,
  winning_trades
FROM users
WHERE army = 'bulls'
ORDER BY total_pnl DESC
LIMIT 5;
" 2>/dev/null
```

## Leaderboard Summary

```bash
echo "" && echo "📊 Leaderboard Summary:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  'Total Players' as metric, COUNT(*)::text as value FROM users
UNION ALL
SELECT
  'Total P&L (All)', '\$' || TO_CHAR(SUM(total_pnl), 'FM999,999,999') FROM users
UNION ALL
SELECT
  'Total Trades', TO_CHAR(SUM(total_trades), 'FM999,999') FROM users
UNION ALL
SELECT
  'Avg Win Rate', ROUND(AVG(CASE WHEN total_trades > 0 THEN winning_trades::float / total_trades * 100 ELSE 0 END), 1)::text || '%' FROM users WHERE total_trades > 0;
"
```
