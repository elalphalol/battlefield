# Balance Audit

Run balance audits and manage user balance discrepancies.

## Instructions

The audit system verifies user balances against expected values using the formula:
```
Effective Balance = paper_balance + balance_adjustment
Expected = $10,000 (starting) + Claims + Missions (reward_paid) + Referrals (claimed) + Net P&L - Open Collateral
Discrepancy = Effective Balance - Expected
```

Note: Missions use `reward_paid` column (actual amount paid when claimed), not current mission reward values.

- Users WITHOUT open positions: paper_balance is set directly to expected, adjustment=0
- Users WITH open positions: balance_adjustment is used to correct the effective balance (will be reconciled when positions close)

## Quick Audit Summary

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const result = await pool.query(\`
    WITH user_claims AS (
      SELECT user_id, COALESCE(SUM(amount), 0) / 100.0 as total_claims
      FROM claims GROUP BY user_id
    ),
    user_missions AS (
      -- reward_paid is stored in dollars directly (not cents)
      SELECT user_id, COALESCE(SUM(reward_paid), 0) as total_mission_rewards
      FROM user_missions
      WHERE is_claimed = true GROUP BY user_id
    ),
    user_referrer_rewards AS (
      SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) / 100.0 as referrer_rewards
      FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id
    ),
    user_referred_rewards AS (
      SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) / 100.0 as referred_rewards
      FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id
    ),
    user_pnl AS (
      SELECT user_id, COALESCE(SUM(
        CASE
          WHEN position_type = 'long' THEN ((exit_price - entry_price) / NULLIF(entry_price, 0)) * position_size
          WHEN position_type = 'short' THEN ((entry_price - exit_price) / NULLIF(entry_price, 0)) * position_size
        END
      ), 0) as calculated_pnl
      FROM trades
      WHERE status IN ('closed', 'liquidated') AND exit_price IS NOT NULL AND entry_price > 0
      GROUP BY user_id
    ),
    open_collateral AS (
      SELECT user_id, COALESCE(SUM(position_size / leverage), 0) as collateral
      FROM trades WHERE status = 'open' GROUP BY user_id
    )
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE ABS(
        u.paper_balance + COALESCE(u.balance_adjustment, 0) -
        (10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
         COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
         COALESCE(p.calculated_pnl, 0) - COALESCE(oc.collateral, 0))
      ) > 1) as with_discrepancy,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM trades WHERE user_id = u.id AND status = 'open')) as with_open_positions
    FROM users u
    LEFT JOIN user_claims c ON c.user_id = u.id
    LEFT JOIN user_missions m ON m.user_id = u.id
    LEFT JOIN user_referrer_rewards rr ON rr.user_id = u.id
    LEFT JOIN user_referred_rewards rd ON rd.user_id = u.id
    LEFT JOIN user_pnl p ON p.user_id = u.id
    LEFT JOIN open_collateral oc ON oc.user_id = u.id
  \`);

  const r = result.rows[0];
  console.log('=== BALANCE AUDIT SUMMARY ===');
  console.log('Total Users: ' + r.total_users);
  console.log('Users with Discrepancy: ' + r.with_discrepancy);
  console.log('Users with Open Positions: ' + r.with_open_positions);

  if (Number(r.with_discrepancy) === 0) {
    console.log('\\n✅ All balances are correct!');
  } else {
    console.log('\\n⚠️  Run full audit for details: /audit full');
  }

  pool.end();
})();
"
```

## Full Audit with Details

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const result = await pool.query(\`
    WITH user_claims AS (
      SELECT user_id, COALESCE(SUM(amount), 0) / 100.0 as total_claims
      FROM claims GROUP BY user_id
    ),
    user_missions AS (
      -- reward_paid is stored in dollars directly (not cents)
      SELECT user_id, COALESCE(SUM(reward_paid), 0) as total_mission_rewards
      FROM user_missions
      WHERE is_claimed = true GROUP BY user_id
    ),
    user_referrer_rewards AS (
      SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) / 100.0 as referrer_rewards
      FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id
    ),
    user_referred_rewards AS (
      SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) / 100.0 as referred_rewards
      FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id
    ),
    user_pnl AS (
      SELECT user_id, COALESCE(SUM(
        CASE
          WHEN position_type = 'long' THEN ((exit_price - entry_price) / NULLIF(entry_price, 0)) * position_size
          WHEN position_type = 'short' THEN ((entry_price - exit_price) / NULLIF(entry_price, 0)) * position_size
        END
      ), 0) as calculated_pnl
      FROM trades
      WHERE status IN ('closed', 'liquidated') AND exit_price IS NOT NULL AND entry_price > 0
      GROUP BY user_id
    ),
    open_collateral AS (
      SELECT user_id, COALESCE(SUM(position_size / leverage), 0) as collateral
      FROM trades WHERE status = 'open' GROUP BY user_id
    )
    SELECT
      u.id, u.username,
      u.paper_balance as current_balance,
      COALESCE(u.balance_adjustment, 0) as adjustment,
      COALESCE(c.total_claims, 0) as claims,
      COALESCE(m.total_mission_rewards, 0) as missions,
      COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) as referrals,
      COALESCE(p.calculated_pnl, 0) as pnl,
      COALESCE(oc.collateral, 0) as open_collateral,
      10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
        COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
        COALESCE(p.calculated_pnl, 0) - COALESCE(oc.collateral, 0) as expected_balance,
      EXISTS (SELECT 1 FROM trades WHERE user_id = u.id AND status = 'open') as has_open
    FROM users u
    LEFT JOIN user_claims c ON c.user_id = u.id
    LEFT JOIN user_missions m ON m.user_id = u.id
    LEFT JOIN user_referrer_rewards rr ON rr.user_id = u.id
    LEFT JOIN user_referred_rewards rd ON rd.user_id = u.id
    LEFT JOIN user_pnl p ON p.user_id = u.id
    LEFT JOIN open_collateral oc ON oc.user_id = u.id
    WHERE ABS(
      u.paper_balance + COALESCE(u.balance_adjustment, 0) -
      (10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
       COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
       COALESCE(p.calculated_pnl, 0) - COALESCE(oc.collateral, 0))
    ) > 1
    ORDER BY ABS(
      u.paper_balance + COALESCE(u.balance_adjustment, 0) -
      (10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
       COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
       COALESCE(p.calculated_pnl, 0) - COALESCE(oc.collateral, 0))
    ) DESC
    LIMIT 20
  \`);

  console.log('=== BALANCE DISCREPANCIES ===');
  if (result.rows.length === 0) {
    console.log('✅ No discrepancies found!');
  } else {
    result.rows.forEach(r => {
      const actual = Number(r.current_balance) + Number(r.adjustment);
      const expected = Number(r.expected_balance);
      const diff = actual - expected;
      const status = r.has_open ? '⚠️ HAS OPEN' : '🔧 FIXABLE';

      console.log('\\n' + r.username + ' (ID: ' + r.id + ') ' + status);
      console.log('  Current: \$' + Number(r.current_balance).toLocaleString() + ' (adj: \$' + Number(r.adjustment).toLocaleString() + ')');
      console.log('  Expected: \$' + expected.toLocaleString());
      console.log('  Discrepancy: ' + (diff >= 0 ? '+' : '') + '\$' + diff.toLocaleString());
      console.log('  Breakdown: Claims \$' + Number(r.claims).toLocaleString() + ' | Missions \$' + Number(r.missions).toLocaleString() + ' | Refs \$' + Number(r.referrals).toLocaleString() + ' | PnL \$' + Number(r.pnl).toLocaleString());
    });
  }

  pool.end();
})();
"
```

## Check Specific User

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const search = process.argv[2] || '';
  if (!search) {
    console.log('Usage: /audit user <username or ID>');
    pool.end();
    return;
  }

  const result = await pool.query(\`
    WITH user_data AS (
      SELECT * FROM users
      WHERE LOWER(username) LIKE LOWER('%' || \$1 || '%') OR id::text = \$1
      LIMIT 1
    ),
    claims AS (SELECT COALESCE(SUM(amount), 0) / 100.0 as total FROM claims WHERE user_id = (SELECT id FROM user_data)),
    missions AS (
      -- Use reward_paid (actual amount paid) instead of current mission reward_amount
      SELECT COALESCE(SUM(reward_paid), 0) / 100.0 as total
      FROM user_missions
      WHERE user_id = (SELECT id FROM user_data) AND is_claimed = true
    ),
    referrals AS (
      SELECT
        COALESCE((SELECT SUM(referrer_reward) FROM referrals WHERE referrer_id = (SELECT id FROM user_data) AND referrer_claimed = true), 0) / 100.0 +
        COALESCE((SELECT SUM(referred_reward) FROM referrals WHERE referred_user_id = (SELECT id FROM user_data) AND referred_claimed = true), 0) / 100.0 as total
    ),
    pnl AS (
      SELECT COALESCE(SUM(
        CASE
          WHEN position_type = 'long' THEN ((exit_price - entry_price) / NULLIF(entry_price, 0)) * position_size
          WHEN position_type = 'short' THEN ((entry_price - exit_price) / NULLIF(entry_price, 0)) * position_size
        END
      ), 0) as total
      FROM trades
      WHERE user_id = (SELECT id FROM user_data) AND status IN ('closed', 'liquidated') AND exit_price IS NOT NULL
    ),
    open_pos AS (
      SELECT COALESCE(SUM(position_size / leverage), 0) as collateral, COUNT(*) as count
      FROM trades WHERE user_id = (SELECT id FROM user_data) AND status = 'open'
    )
    SELECT
      u.*,
      c.total as claims,
      m.total as missions,
      r.total as referrals,
      p.total as pnl,
      o.collateral as open_collateral,
      o.count as open_count
    FROM user_data u, claims c, missions m, referrals r, pnl p, open_pos o
  \`, [search]);

  if (result.rows.length === 0) {
    console.log('User not found: ' + search);
    pool.end();
    return;
  }

  const u = result.rows[0];
  const expected = 10000 + Number(u.claims) + Number(u.missions) + Number(u.referrals) + Number(u.pnl) - Number(u.open_collateral);
  const actual = Number(u.paper_balance) + Number(u.balance_adjustment || 0);
  const diff = actual - expected;

  console.log('=== USER AUDIT: ' + u.username + ' (ID: ' + u.id + ') ===');
  console.log('');
  console.log('Current Balance: \$' + Number(u.paper_balance).toLocaleString());
  console.log('Balance Adjustment: \$' + Number(u.balance_adjustment || 0).toLocaleString());
  console.log('Effective Balance: \$' + actual.toLocaleString());
  console.log('');
  console.log('--- Expected Calculation ---');
  console.log('Starting Balance: \$10,000');
  console.log('+ Claims: \$' + Number(u.claims).toLocaleString());
  console.log('+ Missions: \$' + Number(u.missions).toLocaleString());
  console.log('+ Referrals: \$' + Number(u.referrals).toLocaleString());
  console.log('+ Net P&L: \$' + Number(u.pnl).toLocaleString());
  console.log('- Open Collateral: \$' + Number(u.open_collateral).toLocaleString() + ' (' + u.open_count + ' positions)');
  console.log('= Expected: \$' + expected.toLocaleString());
  console.log('');

  if (Math.abs(diff) <= 1) {
    console.log('✅ Balance is CORRECT');
  } else {
    console.log('⚠️ Discrepancy: ' + (diff >= 0 ? '+' : '') + '\$' + diff.toLocaleString());
    if (Number(u.open_count) > 0) {
      console.log('   Cannot auto-fix: user has ' + u.open_count + ' open position(s)');
    } else {
      console.log('   Can be auto-fixed via admin panel');
    }
  }

  pool.end();
})();
" "\$ARGS"
```

## Users with Open Positions (Cannot Auto-Fix)

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const result = await pool.query(\`
    SELECT
      u.id, u.username,
      COUNT(t.id) as open_positions,
      SUM(t.position_size / t.leverage) as total_collateral,
      u.paper_balance as balance
    FROM users u
    JOIN trades t ON t.user_id = u.id AND t.status = 'open'
    GROUP BY u.id, u.username, u.paper_balance
    ORDER BY COUNT(t.id) DESC
  \`);

  console.log('=== USERS WITH OPEN POSITIONS ===');
  console.log('(These users cannot be auto-fixed until positions are closed)\\n');

  if (result.rows.length === 0) {
    console.log('No users have open positions.');
  } else {
    result.rows.forEach(r => {
      console.log(r.username + ' (ID: ' + r.id + ')');
      console.log('  Open Positions: ' + r.open_positions);
      console.log('  Collateral Locked: \$' + Number(r.total_collateral).toLocaleString());
      console.log('  Available Balance: \$' + Number(r.balance).toLocaleString());
    });
  }

  pool.end();
})();
"
```

## Run Auto-Fix (API Call)

```bash
echo "To auto-fix balances, use the admin panel at /admin or call:"
echo ""
echo "curl -X GET 'https://btcbattlefield.com/api/admin/audit?autoFix=true'"
echo ""
echo "This will fix all users WITHOUT open positions."
```
