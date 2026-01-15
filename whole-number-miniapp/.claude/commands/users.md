# User Management

Manage and query BATTLEFIELD users.

## Instructions

Provide an argument to specify the operation:
- `search <username>` - Find user by username
- `top` - Show top 10 users by PnL
- `recent` - Show recently joined users
- `stats <wallet>` - Get detailed user stats

## Search User

```bash
# Replace USERNAME with the actual username to search
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  id,
  username,
  army,
  TO_CHAR(paper_balance/100, 'FM$999,999,999') as balance,
  total_trades,
  ROUND(win_rate::numeric, 1) as win_rate,
  TO_CHAR(total_pnl/100, 'FM$999,999,999') as total_pnl,
  referral_code,
  created_at::date as joined
FROM users
WHERE LOWER(username) LIKE LOWER('%$ARGS%')
ORDER BY total_pnl DESC
LIMIT 10;
"
```

## Top Users by PnL

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  ROW_NUMBER() OVER (ORDER BY total_pnl DESC) as rank,
  username,
  army,
  TO_CHAR(paper_balance/100, 'FM$999,999,999') as balance,
  total_trades,
  ROUND(win_rate::numeric, 1) || '%' as win_rate,
  TO_CHAR(total_pnl/100, 'FM$999,999,999') as total_pnl
FROM users
WHERE total_trades > 0
ORDER BY total_pnl DESC
LIMIT 10;
"
```

## Recent Users

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  username,
  army,
  TO_CHAR(paper_balance/100, 'FM$999,999,999') as balance,
  total_trades,
  referral_code,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 15;
"
```

## User Details by Wallet

```bash
# Replace WALLET with actual wallet address
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  u.id,
  u.username,
  u.fid,
  u.army,
  TO_CHAR(u.paper_balance/100, 'FM\$999,999,999') as balance,
  u.total_trades,
  u.winning_trades,
  u.losing_trades,
  ROUND(u.win_rate::numeric, 2) || '%' as win_rate,
  TO_CHAR(u.total_pnl/100, 'FM\$999,999,999') as total_pnl,
  u.referral_code,
  u.referral_count,
  TO_CHAR(u.referral_earnings/100, 'FM\$999,999') as referral_earnings,
  (SELECT username FROM users WHERE id = u.referred_by) as referred_by,
  u.created_at
FROM users u
WHERE u.wallet_address = '\$ARGS';
"
```

## Army Distribution

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  army,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 1) || '%' as percentage,
  TO_CHAR(AVG(total_pnl)/100, 'FM$999,999') as avg_pnl
FROM users
WHERE army IS NOT NULL
GROUP BY army
ORDER BY count DESC;
"
```
