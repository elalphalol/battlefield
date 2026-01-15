# Trade Operations

Query and monitor BATTLEFIELD trades.

## Instructions

Monitor trading activity and analyze positions.

## Open Positions

```bash
echo "=== OPEN POSITIONS ===" && PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  t.id,
  u.username,
  t.position_type as type,
  t.leverage || 'x' as lev,
  TO_CHAR(t.entry_price, 'FM$999,999') as entry,
  TO_CHAR(t.position_size/100, 'FM$999,999') as size,
  CASE WHEN t.stop_loss IS NOT NULL THEN TO_CHAR(t.stop_loss, 'FM$999,999') ELSE '-' END as sl,
  t.opened_at::timestamp(0)
FROM trades t
JOIN users u ON t.user_id = u.id
WHERE t.status = 'open'
ORDER BY t.opened_at DESC
LIMIT 20;
"
```

## Recent Closed Trades

```bash
echo "=== RECENT CLOSED TRADES ===" && PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  t.id,
  u.username,
  t.position_type as type,
  t.leverage || 'x' as lev,
  TO_CHAR(t.entry_price, 'FM$999,999') as entry,
  TO_CHAR(t.exit_price, 'FM$999,999') as exit,
  TO_CHAR(t.pnl/100, 'FM$999,999') as pnl,
  t.status,
  COALESCE(t.closed_by, '-') as closed_by
FROM trades t
JOIN users u ON t.user_id = u.id
WHERE t.status IN ('closed', 'liquidated')
ORDER BY t.closed_at DESC
LIMIT 15;
"
```

## Today's Trading Summary

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  'Total Trades' as metric, COUNT(*)::text as value FROM trades WHERE opened_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 'Closed Trades', COUNT(*)::text FROM trades WHERE closed_at > NOW() - INTERVAL '24 hours' AND status = 'closed'
UNION ALL
SELECT 'Liquidations', COUNT(*)::text FROM trades WHERE closed_at > NOW() - INTERVAL '24 hours' AND status = 'liquidated'
UNION ALL
SELECT 'Stop Loss Triggers', COUNT(*)::text FROM trades WHERE closed_at > NOW() - INTERVAL '24 hours' AND closed_by = 'stop_loss'
UNION ALL
SELECT 'Total Volume', TO_CHAR(SUM(position_size)/100, 'FM\$999,999,999') FROM trades WHERE opened_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 'Total PnL', TO_CHAR(SUM(pnl)/100, 'FM\$999,999,999') FROM trades WHERE closed_at > NOW() - INTERVAL '24 hours' AND status IN ('closed', 'liquidated');
"
```

## Leverage Distribution

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  CASE
    WHEN leverage <= 10 THEN '1-10x'
    WHEN leverage <= 25 THEN '11-25x'
    WHEN leverage <= 50 THEN '26-50x'
    WHEN leverage <= 75 THEN '51-75x'
    ELSE '76-100x'
  END as leverage_range,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) || '%' as percentage
FROM trades
WHERE opened_at > NOW() - INTERVAL '7 days'
GROUP BY 1
ORDER BY MIN(leverage);
"
```

## Biggest Winners Today

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  u.username,
  u.army,
  t.position_type as type,
  t.leverage || 'x' as lev,
  TO_CHAR(t.pnl/100, 'FM$999,999') as pnl,
  t.closed_at::timestamp(0)
FROM trades t
JOIN users u ON t.user_id = u.id
WHERE t.closed_at > NOW() - INTERVAL '24 hours'
  AND t.status = 'closed'
  AND t.pnl > 0
ORDER BY t.pnl DESC
LIMIT 10;
"
```

## Biggest Liquidations Today

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  u.username,
  u.army,
  t.position_type as type,
  t.leverage || 'x' as lev,
  TO_CHAR(ABS(t.pnl)/100, 'FM$999,999') as loss,
  t.closed_at::timestamp(0)
FROM trades t
JOIN users u ON t.user_id = u.id
WHERE t.closed_at > NOW() - INTERVAL '24 hours'
  AND t.status = 'liquidated'
ORDER BY t.pnl ASC
LIMIT 10;
"
```
