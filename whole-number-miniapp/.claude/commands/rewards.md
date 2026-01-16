# Weekly Rewards Distribution

Manage BATTLE token weekly rewards for Army Competition.

## Instructions

### Weekly Rewards Overview

```bash
echo "=== WEEKLY REWARDS SYSTEM ==="
echo ""
echo "📊 Weekly Pool: 385,000,000 BATTLE"
echo ""
echo "Distribution:"
echo "┌────────────────────────────────────────────┐"
echo "│  40% Winning Army Bonus:  154,000,000     │"
echo "│  30% Top 10 Leaderboard:  115,500,000     │"
echo "│  20% Participation:        77,000,000     │"
echo "│  10% Army Generals:        38,500,000     │"
echo "└────────────────────────────────────────────┘"
```

### Calculate Current Week Winner

```bash
echo "=== THIS WEEK'S BATTLE ==="
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
WITH weekly_stats AS (
  SELECT
    u.army,
    COUNT(DISTINCT u.id) as soldiers,
    COUNT(t.id) as total_trades,
    SUM(CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
    SUM(t.pnl) as total_pnl
  FROM users u
  LEFT JOIN trades t ON t.user_id = u.id
    AND t.closed_at > date_trunc('week', NOW())
    AND t.status IN ('closed', 'liquidated')
  WHERE u.army IS NOT NULL
  GROUP BY u.army
)
SELECT
  army as \"Army\",
  soldiers as \"Soldiers\",
  total_trades as \"Trades\",
  winning_trades as \"Wins\",
  TO_CHAR(total_pnl/100, 'FM\$999,999,999') as \"Total PnL\",
  CASE WHEN total_pnl = (SELECT MAX(total_pnl) FROM weekly_stats)
       THEN '👑 WINNING'
       ELSE ''
  END as \"Status\"
FROM weekly_stats
ORDER BY total_pnl DESC;
"
```

### Weekly Leaderboard (Top 10)

```bash
echo "=== TOP 10 TRADERS THIS WEEK ==="
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  ROW_NUMBER() OVER (ORDER BY SUM(t.pnl) DESC) as rank,
  u.username,
  u.army,
  COUNT(t.id) as trades,
  SUM(CASE WHEN t.pnl > 0 THEN 1 ELSE 0 END) as wins,
  TO_CHAR(SUM(t.pnl)/100, 'FM\$999,999') as pnl
FROM users u
JOIN trades t ON t.user_id = u.id
WHERE t.closed_at > date_trunc('week', NOW())
  AND t.status IN ('closed', 'liquidated')
GROUP BY u.id, u.username, u.army
ORDER BY SUM(t.pnl) DESC
LIMIT 10;
"
```

### Army Generals (Top Player Each Army)

```bash
echo "=== ARMY GENERALS THIS WEEK ==="
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
WITH ranked AS (
  SELECT
    u.username,
    u.army,
    SUM(t.pnl) as total_pnl,
    COUNT(t.id) as trades,
    ROW_NUMBER() OVER (PARTITION BY u.army ORDER BY SUM(t.pnl) DESC) as rank
  FROM users u
  JOIN trades t ON t.user_id = u.id
  WHERE t.closed_at > date_trunc('week', NOW())
    AND t.status IN ('closed', 'liquidated')
    AND u.army IS NOT NULL
  GROUP BY u.id, u.username, u.army
)
SELECT
  army || ' General' as title,
  username,
  trades,
  TO_CHAR(total_pnl/100, 'FM\$999,999') as pnl,
  '19,250,000 BATTLE' as reward
FROM ranked
WHERE rank = 1
ORDER BY total_pnl DESC;
"
```

### Calculate Individual Rewards (Example: 250 users)

```bash
echo "=== REWARD CALCULATION EXAMPLE ==="
echo ""
echo "Assuming 250 active users, 125 per army:"
echo ""
echo "If BULLS win this week:"
echo ""
echo "🐂 Bull General (#1):"
echo "   General Bonus:     19,250,000"
echo "   Top 10 Share:      11,550,000"
echo "   Winning Army:       1,232,000"
echo "   Participation:        308,000"
echo "   ─────────────────────────────"
echo "   TOTAL:            ~32,340,000 BATTLE"
echo ""
echo "🐂 Top 10 Bull:"
echo "   Top 10 Share:      11,550,000"
echo "   Winning Army:       1,232,000"
echo "   Participation:        308,000"
echo "   ─────────────────────────────"
echo "   TOTAL:            ~13,090,000 BATTLE"
echo ""
echo "🐂 Average Bull:"
echo "   Winning Army:       1,232,000"
echo "   Participation:        308,000"
echo "   ─────────────────────────────"
echo "   TOTAL:             ~1,540,000 BATTLE"
echo ""
echo "🐻 Average Bear:"
echo "   Participation:        308,000"
echo "   ─────────────────────────────"
echo "   TOTAL:               ~308,000 BATTLE"
echo ""
echo "🐻 Bear General (#1 Bear):"
echo "   General Bonus:     19,250,000"
echo "   Participation:        308,000"
echo "   ─────────────────────────────"
echo "   TOTAL:            ~19,558,000 BATTLE"
```

### Weekly Active Users

```bash
echo "=== ACTIVE USERS THIS WEEK ==="
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  army,
  COUNT(DISTINCT user_id) as active_traders,
  COUNT(*) as total_trades
FROM trades t
JOIN users u ON u.id = t.user_id
WHERE t.opened_at > date_trunc('week', NOW())
GROUP BY army
UNION ALL
SELECT
  'TOTAL' as army,
  COUNT(DISTINCT user_id),
  COUNT(*)
FROM trades
WHERE opened_at > date_trunc('week', NOW());
"
```

### Participation Rate

```bash
echo "=== PARTICIPATION STATS ==="
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "
SELECT 'Total Registered: ' || COUNT(*) FROM users;
SELECT 'Active This Week: ' || COUNT(DISTINCT user_id) FROM trades WHERE opened_at > date_trunc('week', NOW());
SELECT 'Participation Rate: ' || ROUND(
  COUNT(DISTINCT t.user_id)::numeric * 100 / NULLIF(COUNT(DISTINCT u.id), 0), 1
) || '%'
FROM users u
LEFT JOIN trades t ON t.user_id = u.id AND t.opened_at > date_trunc('week', NOW());
" 2>/dev/null | grep -v "^$"
```

### Week Reset Schedule

```bash
echo "=== WEEKLY SCHEDULE ==="
echo ""
echo "Week resets: Sunday 00:00 UTC"
echo ""
echo "Weekly Operations:"
echo "  1. [ ] Snapshot leaderboard (Saturday 23:59 UTC)"
echo "  2. [ ] Calculate winning army"
echo "  3. [ ] Generate rewards distribution"
echo "  4. [ ] Withdraw from vault (~577M)"
echo "  5. [ ] Distribute rewards (~385M)"
echo "  6. [ ] Add to LP (~192M)"
echo "  7. [ ] Announce results"
echo ""
echo "Current time (UTC): $(TZ=UTC date '+%Y-%m-%d %H:%M:%S')"
echo "Week started: $(TZ=UTC date -d 'last sunday' '+%Y-%m-%d 00:00:00' 2>/dev/null || date '+%Y-%m-%d')"
```

### Notes

- Rewards contract will automate distribution post-launch
- Users claim rewards from contract (gas efficient)
- Weekly snapshots determine final rankings
- Unclaimed rewards accumulate for user
