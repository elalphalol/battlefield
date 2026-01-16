# Quick App Statistics

Show real-time BATTLEFIELD app statistics at a glance.

## Instructions

Run this comprehensive stats query:

```bash
echo "=== BATTLEFIELD STATS ===" && echo "" && PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "
SELECT '👥 Total Users: ' || COUNT(*) FROM users;
SELECT '🎭 Farcaster Users: ' || COUNT(*) FILTER (WHERE fid IS NOT NULL) || ' (' || ROUND(100.0 * COUNT(*) FILTER (WHERE fid IS NOT NULL) / COUNT(*), 0) || '%)' FROM users;
SELECT '📊 Active Today: ' || COUNT(DISTINCT user_id) FROM trades WHERE opened_at > NOW() - INTERVAL '24 hours';
SELECT '💰 Total Trades: ' || COUNT(*) FROM trades;
SELECT '📈 Open Positions: ' || COUNT(*) FROM trades WHERE status = 'open';
SELECT '🐂 Bulls Army: ' || COUNT(*) FROM users WHERE army = 'bulls';
SELECT '🐻 Bears Army: ' || COUNT(*) FROM users WHERE army = 'bears';
SELECT '💵 Total Paper Money: $' || TO_CHAR(SUM(paper_balance), 'FM999,999,999') FROM users;
SELECT '🔥 Liquidations Today: ' || COUNT(*) FROM trades WHERE status = 'liquidated' AND closed_at > NOW() - INTERVAL '24 hours';
SELECT '🎯 Missions Completed: ' || COUNT(*) FROM user_missions WHERE is_completed = true;
SELECT '🔗 Referrals (Claimable): ' || COUNT(*) FILTER (WHERE status = 'claimable') || ' | Completed: ' || COUNT(*) FILTER (WHERE status = 'completed') FROM referrals;
" 2>/dev/null | grep -v "^$"
```

## Detailed Stats

### User Growth (Last 7 Days)
```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT DATE(created_at) as date, COUNT(*) as new_users
FROM users
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
"
```

### Trading Volume (Last 24 Hours)
```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  COUNT(*) as total_trades,
  COUNT(*) FILTER (WHERE position_type = 'long') as longs,
  COUNT(*) FILTER (WHERE position_type = 'short') as shorts,
  ROUND(AVG(leverage)) as avg_leverage,
  TO_CHAR(SUM(position_size)/100, 'FM$999,999,999') as total_volume
FROM trades
WHERE opened_at > NOW() - INTERVAL '24 hours';
"
```

### Top Performers Today
```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  u.username,
  u.army,
  COUNT(t.id) as trades,
  TO_CHAR(SUM(t.pnl)/100, 'FM$999,999') as pnl
FROM users u
JOIN trades t ON t.user_id = u.id
WHERE t.closed_at > NOW() - INTERVAL '24 hours' AND t.status IN ('closed', 'liquidated')
GROUP BY u.id, u.username, u.army
ORDER BY SUM(t.pnl) DESC
LIMIT 5;
"
```

### Army Battle Status
```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  army,
  COUNT(*) as soldiers,
  TO_CHAR(SUM(total_pnl)/100, 'FM$999,999,999') as total_pnl,
  ROUND(AVG(win_rate)::numeric, 1) as avg_win_rate
FROM users
WHERE army IS NOT NULL
GROUP BY army;
"
```
