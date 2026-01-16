# User Management

Manage and query BATTLEFIELD users.

## Instructions

Provide an argument to specify the operation:
- `search <username>` - Find user by username
- `top` - Show top 10 users by PnL
- `recent` - Show recently joined users
- `stats <wallet>` - Get detailed user stats
- `fid` - Show FID distribution (Farcaster vs wallet-only users)

## Search User

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const search = process.argv[2] || '';
  const result = await pool.query(\`
    SELECT
      id, username, fid, army,
      paper_balance as balance,
      total_trades, total_pnl,
      referral_code, created_at
    FROM users
    WHERE LOWER(username) LIKE LOWER('%' || \\\$1 || '%')
    ORDER BY total_pnl DESC
    LIMIT 10
  \`, [search]);

  console.log('=== USER SEARCH: ' + search + ' ===');
  result.rows.forEach(u => {
    const fidStatus = u.fid ? '✓ FID:' + u.fid : '✗ No FID';
    console.log(u.username + ' (ID:' + u.id + ') | ' + fidStatus);
    console.log('  Army: ' + u.army + ' | Balance: \\\$' + Number(u.balance).toLocaleString() + ' | Trades: ' + u.total_trades);
    console.log('  PnL: \\\$' + Number(u.total_pnl).toLocaleString() + ' | Code: ' + u.referral_code);
  });
  pool.end();
})();
" "\$ARGS"
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

## FID Distribution (Farcaster Users)

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const stats = await pool.query(\`
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE fid IS NOT NULL) as farcaster_users,
      COUNT(*) FILTER (WHERE fid IS NULL) as wallet_only_users,
      COUNT(*) FILTER (WHERE fid IS NOT NULL AND total_trades > 0) as active_farcaster,
      COUNT(*) FILTER (WHERE fid IS NULL AND total_trades > 0) as active_wallet_only
    FROM users
  \`);
  const s = stats.rows[0];
  const farcasterPct = ((Number(s.farcaster_users) / Number(s.total_users)) * 100).toFixed(1);

  console.log('=== FID DISTRIBUTION ===');
  console.log('Total Users: ' + s.total_users);
  console.log('');
  console.log('Farcaster Users (have FID): ' + s.farcaster_users + ' (' + farcasterPct + '%)');
  console.log('  - Active (traded): ' + s.active_farcaster);
  console.log('  - Eligible for referrals: ✅ Yes');
  console.log('');
  console.log('Wallet-Only Users (no FID): ' + s.wallet_only_users);
  console.log('  - Active (traded): ' + s.active_wallet_only);
  console.log('  - Eligible for referrals: ❌ No');

  // Recent non-FID users
  const recentNoFid = await pool.query(\`
    SELECT username, created_at
    FROM users
    WHERE fid IS NULL
    ORDER BY created_at DESC
    LIMIT 5
  \`);

  if (recentNoFid.rows.length > 0) {
    console.log('');
    console.log('Recent Wallet-Only Users:');
    recentNoFid.rows.forEach(u => {
      console.log('  ' + u.username + ' - ' + new Date(u.created_at).toLocaleDateString());
    });
  }

  pool.end();
})();
"
```
