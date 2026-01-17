# Balance Audit

Run balance audits and manage user balance discrepancies.

## Maintenance Status Check

Always check maintenance status DIRECTLY from database (not API, which may be cached):

```bash
sudo -u postgres psql -d battlefield -t -c "SELECT CASE WHEN enabled THEN '🔴 Maintenance Mode ENABLED - Trading is BLOCKED' ELSE '✅ Trading is ACTIVE' END FROM maintenance_settings WHERE id = 1;"
```

## Instructions

The audit system verifies user balances against expected values using the formula:
```
Expected = $10,000 (starting) + Claims + Missions (reward_paid) + Referrals (claimed) + Corrected_PnL - Open Collateral
Expected = MAX(0, Expected)  -- Balance cannot go negative
Discrepancy = paper_balance - Expected
```

**IMPORTANT - Corrected P&L Calculation:**
Due to a historical bug (see COLLATERAL_BUG_POSTMORTEM.md), trades with leverage > 1 have inflated P&L values stored in the database. The audit uses corrected P&L:
```sql
Corrected_PnL = SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END)
```

Note:
- Uses corrected P&L from closed trades (NOT `total_pnl` from users table)
- Missions use `reward_paid` column (actual amount paid when claimed)
- Balances are capped at $0 minimum

## Expected Values Reference

All values are stored in **cents** in the database.

### Claims (Daily)
- **Daily Claim:** 100000 cents ($1,000)

### Mission Rewards
| Mission | Reward (cents) | Reward ($) |
|---------|----------------|------------|
| Open a Trade | 20000 | $200 |
| Win a Trade | 50000 | $500 |
| Cast a Trade | 50000 | $500 |
| Two Faces | 35000 | $350 |
| Follow Us! | 500000 | $5,000 |
| Win 5 Trades | 200000 | $2,000 |
| Trading Streak | 250000 | $2,500 |
| Claim Streak | 150000 | $1,500 |
| The Betrayer | 150000 | $1,500 |
| Army Loyalty | 1000000 | $10,000 |

### Referral Rewards
- **Referrer Reward:** 250000 cents ($2,500)
- **Referred Reward:** 250000 cents ($2,500)

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
      SELECT user_id, COALESCE(SUM(reward_paid), 0) / 100.0 as total_mission_rewards
      FROM user_missions WHERE is_claimed = true GROUP BY user_id
    ),
    user_referrer_rewards AS (
      SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) / 100.0 as referrer_rewards
      FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id
    ),
    user_referred_rewards AS (
      SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) / 100.0 as referred_rewards
      FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id
    ),
    corrected_pnl AS (
      SELECT user_id,
        COALESCE(SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END), 0) as total_pnl
      FROM trades WHERE status = 'closed' GROUP BY user_id
    ),
    open_collateral AS (
      SELECT user_id, COALESCE(SUM(position_size), 0) as collateral
      FROM trades WHERE status = 'open' GROUP BY user_id
    )
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE ABS(
        u.paper_balance - GREATEST(0, 10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
         COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
         COALESCE(cp.total_pnl, 0) - COALESCE(oc.collateral, 0))
      ) > 1) as with_discrepancy,
      COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM trades WHERE user_id = u.id AND status = 'open')) as with_open_positions
    FROM users u
    LEFT JOIN user_claims c ON c.user_id = u.id
    LEFT JOIN user_missions m ON m.user_id = u.id
    LEFT JOIN user_referrer_rewards rr ON rr.user_id = u.id
    LEFT JOIN user_referred_rewards rd ON rd.user_id = u.id
    LEFT JOIN corrected_pnl cp ON cp.user_id = u.id
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
      SELECT user_id, COALESCE(SUM(reward_paid), 0) / 100.0 as total_mission_rewards
      FROM user_missions WHERE is_claimed = true GROUP BY user_id
    ),
    user_referrer_rewards AS (
      SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) / 100.0 as referrer_rewards
      FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id
    ),
    user_referred_rewards AS (
      SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) / 100.0 as referred_rewards
      FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id
    ),
    corrected_pnl AS (
      SELECT user_id,
        COALESCE(SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END), 0) as total_pnl
      FROM trades WHERE status = 'closed' GROUP BY user_id
    ),
    open_collateral AS (
      SELECT user_id, COALESCE(SUM(position_size), 0) as collateral
      FROM trades WHERE status = 'open' GROUP BY user_id
    )
    SELECT
      u.id, u.username,
      u.paper_balance as current_balance,
      COALESCE(cp.total_pnl, 0) as corrected_pnl,
      COALESCE(c.total_claims, 0) as claims,
      COALESCE(m.total_mission_rewards, 0) as missions,
      COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) as referrals,
      COALESCE(oc.collateral, 0) as open_collateral,
      GREATEST(0, 10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
        COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
        COALESCE(cp.total_pnl, 0) - COALESCE(oc.collateral, 0)) as expected_balance,
      EXISTS (SELECT 1 FROM trades WHERE user_id = u.id AND status = 'open') as has_open
    FROM users u
    LEFT JOIN user_claims c ON c.user_id = u.id
    LEFT JOIN user_missions m ON m.user_id = u.id
    LEFT JOIN user_referrer_rewards rr ON rr.user_id = u.id
    LEFT JOIN user_referred_rewards rd ON rd.user_id = u.id
    LEFT JOIN corrected_pnl cp ON cp.user_id = u.id
    LEFT JOIN open_collateral oc ON oc.user_id = u.id
    WHERE ABS(
      u.paper_balance - GREATEST(0, 10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
       COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
       COALESCE(cp.total_pnl, 0) - COALESCE(oc.collateral, 0))
    ) > 1
    ORDER BY ABS(
      u.paper_balance - GREATEST(0, 10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
       COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
       COALESCE(cp.total_pnl, 0) - COALESCE(oc.collateral, 0))
    ) DESC
    LIMIT 20
  \`);

  console.log('=== BALANCE DISCREPANCIES ===');
  console.log('(Using corrected P&L: pnl/leverage for leveraged trades)');
  console.log('');
  if (result.rows.length === 0) {
    console.log('✅ No discrepancies found!');
  } else {
    result.rows.forEach(r => {
      const diff = Number(r.current_balance) - Number(r.expected_balance);
      const status = r.has_open ? '⚠️ HAS OPEN' : '🔧 FIXABLE';

      console.log('\\n' + r.username + ' (ID: ' + r.id + ') ' + status);
      console.log('  Current: \$' + Number(r.current_balance).toLocaleString());
      console.log('  Expected: \$' + Number(r.expected_balance).toLocaleString());
      console.log('  Discrepancy: ' + (diff >= 0 ? '+' : '') + '\$' + diff.toLocaleString());
      console.log('  Corrected PnL: \$' + Number(r.corrected_pnl).toLocaleString() + ' | Claims \$' + Number(r.claims).toLocaleString() + ' | Missions \$' + Number(r.missions).toLocaleString());
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
      SELECT COALESCE(SUM(reward_paid), 0) / 100.0 as total
      FROM user_missions WHERE user_id = (SELECT id FROM user_data) AND is_claimed = true
    ),
    referrals AS (
      SELECT
        COALESCE((SELECT SUM(referrer_reward) FROM referrals WHERE referrer_id = (SELECT id FROM user_data) AND referrer_claimed = true), 0) / 100.0 +
        COALESCE((SELECT SUM(referred_reward) FROM referrals WHERE referred_user_id = (SELECT id FROM user_data) AND referred_claimed = true), 0) / 100.0 as total
    ),
    corrected_pnl AS (
      SELECT COALESCE(SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END), 0) as total
      FROM trades WHERE user_id = (SELECT id FROM user_data) AND status = 'closed'
    ),
    raw_pnl AS (
      SELECT COALESCE(SUM(pnl), 0) as total
      FROM trades WHERE user_id = (SELECT id FROM user_data) AND status = 'closed'
    ),
    open_pos AS (
      SELECT COALESCE(SUM(position_size), 0) as collateral, COUNT(*) as count
      FROM trades WHERE user_id = (SELECT id FROM user_data) AND status = 'open'
    )
    SELECT
      u.*,
      c.total as claims,
      m.total as missions,
      r.total as referrals,
      cp.total as corrected_pnl,
      rp.total as raw_pnl,
      o.collateral as open_collateral,
      o.count as open_count
    FROM user_data u, claims c, missions m, referrals r, corrected_pnl cp, raw_pnl rp, open_pos o
  \`, [search]);

  if (result.rows.length === 0) {
    console.log('User not found: ' + search);
    pool.end();
    return;
  }

  const u = result.rows[0];
  const expected = Math.max(0, 10000 + Number(u.claims) + Number(u.missions) + Number(u.referrals) + Number(u.corrected_pnl) - Number(u.open_collateral));
  const diff = Number(u.paper_balance) - expected;

  console.log('=== USER AUDIT: ' + u.username + ' (ID: ' + u.id + ') ===');
  console.log('');
  console.log('Current Balance: \$' + Number(u.paper_balance).toLocaleString());
  console.log('');
  console.log('--- Expected Calculation ---');
  console.log('Starting Balance: \$10,000');
  console.log('+ Claims: \$' + Number(u.claims).toLocaleString());
  console.log('+ Missions: \$' + Number(u.missions).toLocaleString());
  console.log('+ Referrals: \$' + Number(u.referrals).toLocaleString());
  console.log('+ Corrected P&L: \$' + Number(u.corrected_pnl).toLocaleString());
  console.log('  (Raw P&L in DB: \$' + Number(u.raw_pnl).toLocaleString() + ')');
  console.log('- Open Collateral: \$' + Number(u.open_collateral).toLocaleString() + ' (' + u.open_count + ' positions)');
  console.log('= Expected (min \$0): \$' + expected.toLocaleString());
  console.log('');

  if (Math.abs(diff) <= 1) {
    console.log('✅ Balance is CORRECT');
  } else {
    console.log('⚠️ Discrepancy: ' + (diff >= 0 ? '+' : '') + '\$' + diff.toLocaleString());
  }

  pool.end();
})();
" "\$ARGS"
```

## Auto-Fix All Discrepancies

**WARNING:** This will update all user balances to their expected values. Use with caution.

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const dryRun = !process.argv.includes('--apply');

  const result = await pool.query(\`
    WITH user_claims AS (
      SELECT user_id, COALESCE(SUM(amount), 0) / 100.0 as total_claims
      FROM claims GROUP BY user_id
    ),
    user_missions AS (
      SELECT user_id, COALESCE(SUM(reward_paid), 0) / 100.0 as total_mission_rewards
      FROM user_missions WHERE is_claimed = true GROUP BY user_id
    ),
    user_referrer_rewards AS (
      SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) / 100.0 as referrer_rewards
      FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id
    ),
    user_referred_rewards AS (
      SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) / 100.0 as referred_rewards
      FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id
    ),
    corrected_pnl AS (
      SELECT user_id,
        COALESCE(SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END), 0) as total_pnl
      FROM trades WHERE status = 'closed' GROUP BY user_id
    ),
    open_collateral AS (
      SELECT user_id, COALESCE(SUM(position_size), 0) as collateral
      FROM trades WHERE status = 'open' GROUP BY user_id
    )
    SELECT
      u.id, u.username,
      u.paper_balance as current_balance,
      GREATEST(0, 10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
        COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
        COALESCE(cp.total_pnl, 0) - COALESCE(oc.collateral, 0)) as expected_balance
    FROM users u
    LEFT JOIN user_claims c ON c.user_id = u.id
    LEFT JOIN user_missions m ON m.user_id = u.id
    LEFT JOIN user_referrer_rewards rr ON rr.user_id = u.id
    LEFT JOIN user_referred_rewards rd ON rd.user_id = u.id
    LEFT JOIN corrected_pnl cp ON cp.user_id = u.id
    LEFT JOIN open_collateral oc ON oc.user_id = u.id
    WHERE ABS(
      u.paper_balance - GREATEST(0, 10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
       COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
       COALESCE(cp.total_pnl, 0) - COALESCE(oc.collateral, 0))
    ) > 1
  \`);

  if (result.rows.length === 0) {
    console.log('✅ No discrepancies to fix!');
    pool.end();
    return;
  }

  console.log('=== AUTO-FIX ' + (dryRun ? '(DRY RUN)' : 'APPLYING') + ' ===');
  console.log('Found ' + result.rows.length + ' users with discrepancies\\n');

  for (const r of result.rows) {
    const diff = Number(r.expected_balance) - Number(r.current_balance);
    console.log(r.username + ': \$' + Number(r.current_balance).toLocaleString() + ' -> \$' + Number(r.expected_balance).toLocaleString() + ' (' + (diff >= 0 ? '+' : '') + '\$' + diff.toLocaleString() + ')');

    if (!dryRun) {
      await pool.query('UPDATE users SET paper_balance = \$1 WHERE id = \$2', [r.expected_balance, r.id]);
    }
  }

  if (dryRun) {
    console.log('\\n⚠️  This was a DRY RUN. To apply changes, run: /audit fix --apply');
  } else {
    console.log('\\n✅ All balances have been corrected!');
  }

  pool.end();
})();
"
```

## Historical Note

See `COLLATERAL_BUG_POSTMORTEM.md` in the project root for details on the leverage bug that affected P&L calculations. The corrected formula (`pnl / leverage` for leveraged trades) accounts for this historical issue.
