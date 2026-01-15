# Recent Activity

View recent trading activity on BATTLEFIELD.

## Instructions

Display recent trades, signups, and platform activity.

## Recent Trades

```bash
echo "📈 RECENT TRADING ACTIVITY" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  TO_CHAR(t.opened_at, 'MM/DD HH24:MI') as time,
  COALESCE(u.username, LEFT(u.wallet_address, 8)) as trader,
  u.army,
  t.position_type as type,
  t.leverage || 'x' as lev,
  '\$' || TO_CHAR(t.position_size, 'FM99,999') as size,
  CASE
    WHEN t.status = 'open' THEN '🟢 OPEN'
    WHEN t.closed_by = 'stop_loss' THEN '🛡️ STOPPED'
    WHEN t.status = 'liquidated' THEN '💥 REKT'
    WHEN t.pnl >= 0 THEN '✅ +\$' || TO_CHAR(t.pnl, 'FM99,999')
    ELSE '❌ -\$' || TO_CHAR(ABS(t.pnl), 'FM99,999')
  END as result
FROM trades t
JOIN users u ON t.user_id = u.id
ORDER BY t.opened_at DESC
LIMIT 15;
"
```

## New Soldiers (Recent Signups)

```bash
echo "" && echo "🆕 NEW SOLDIERS (Last 24h):" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  TO_CHAR(created_at, 'MM/DD HH24:MI') as joined,
  COALESCE(username, LEFT(wallet_address, 10)) as name,
  CASE WHEN army = 'bears' THEN '🐻 Bears' ELSE '🐂 Bulls' END as army,
  CASE WHEN referred_by IS NOT NULL THEN '👥 Referred' ELSE '' END as ref
FROM users
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;
"
```

## Open Positions

```bash
echo "" && echo "🟢 CURRENTLY OPEN POSITIONS:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  COALESCE(u.username, LEFT(u.wallet_address, 8)) as trader,
  t.position_type as type,
  t.leverage || 'x' as lev,
  '\$' || TO_CHAR(t.entry_price, 'FM999,999') as entry,
  '\$' || TO_CHAR(t.position_size, 'FM99,999') as size,
  CASE WHEN t.stop_loss IS NOT NULL THEN '\$' || TO_CHAR(t.stop_loss, 'FM999,999') ELSE '-' END as sl,
  TO_CHAR(t.opened_at, 'HH24:MI') as opened
FROM trades t
JOIN users u ON t.user_id = u.id
WHERE t.status = 'open'
ORDER BY t.opened_at DESC
LIMIT 10;
"
```

## Activity Summary

```bash
echo "" && echo "📊 24H ACTIVITY SUMMARY:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  (SELECT COUNT(*) FROM trades WHERE opened_at > NOW() - INTERVAL '24 hours') as trades_24h,
  (SELECT COUNT(*) FROM trades WHERE closed_at > NOW() - INTERVAL '24 hours' AND pnl > 0) as wins_24h,
  (SELECT COUNT(*) FROM trades WHERE closed_at > NOW() - INTERVAL '24 hours' AND status = 'liquidated') as liquidations_24h,
  (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
  (SELECT COALESCE(SUM(pnl), 0)::bigint FROM trades WHERE closed_at > NOW() - INTERVAL '24 hours') as total_pnl_24h;
"
```
