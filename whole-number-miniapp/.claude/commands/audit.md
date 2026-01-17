# Balance Audit Tool

Audit and manage user balances for BATTLEFIELD.

## Storage Format

**ALL monetary values are stored in CENTS:**
- `paper_balance` = cents (7291496 = $72,914.96)
- `position_size` = cents
- `pnl` (trades) = cents
- `claims.amount` = cents
- `user_missions.reward_paid` = cents
- `referrals.referrer_reward` / `referred_reward` = cents

**Frontend divides by 100 for display only.**

## Balance Formula (ALL IN CENTS)

```
Expected =
    1000000 (starting - 1M cents = $10k)
  + SUM(claims.amount)
  + SUM(user_missions.reward_paid) WHERE is_claimed = true
  + SUM(referrals.referrer_reward) WHERE referrer_claimed = true
  + SUM(referrals.referred_reward) WHERE referred_claimed = true
  + SUM(corrected_pnl) WHERE status = 'closed'
  - SUM(position_size) WHERE status = 'open'

Expected = MAX(0, Expected)
Discrepancy = paper_balance - Expected
```

**Corrected P&L:** Use `pnl / leverage` for trades where `leverage > 1` (historical bug fix).

## Reference Values (CENTS)

| Item | Cents |
|------|-------|
| Starting Balance | 1,000,000 |
| Daily Claim | 100,000 |
| Referrer Reward | 250,000 |
| Referred Reward | 250,000 |

### Mission Rewards (CENTS)
| Mission | Cents |
|---------|-------|
| Open a Trade | 20,000 |
| Win a Trade | 50,000 |
| Cast a Trade | 50,000 |
| Two Faces | 35,000 |
| Follow Us! | 500,000 |
| Win 5 Trades | 200,000 |
| Trading Streak | 250,000 |
| Claim Streak | 150,000 |
| The Betrayer | 150,000 |
| Army Loyalty | 1,000,000 |

## Instructions

Run ONE of these based on user input:

### Quick Summary (default)

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const r = await pool.query(\`
    WITH
      claims AS (SELECT user_id, COALESCE(SUM(amount), 0) as total FROM claims GROUP BY user_id),
      missions AS (SELECT user_id, COALESCE(SUM(reward_paid), 0) as total FROM user_missions WHERE is_claimed = true GROUP BY user_id),
      ref_given AS (SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) as total FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id),
      ref_received AS (SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) as total FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id),
      pnl AS (SELECT user_id, COALESCE(SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END), 0) as total FROM trades WHERE status = 'closed' GROUP BY user_id),
      collateral AS (SELECT user_id, COALESCE(SUM(position_size), 0) as total FROM trades WHERE status = 'open' GROUP BY user_id)
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE ABS(u.paper_balance - GREATEST(0, 1000000 + COALESCE(c.total,0) + COALESCE(m.total,0) + COALESCE(rg.total,0) + COALESCE(rr.total,0) + COALESCE(p.total,0) - COALESCE(col.total,0))) > 100) as with_discrepancy,
      COUNT(*) FILTER (WHERE col.total > 0) as with_open_positions
    FROM users u
    LEFT JOIN claims c ON c.user_id = u.id
    LEFT JOIN missions m ON m.user_id = u.id
    LEFT JOIN ref_given rg ON rg.user_id = u.id
    LEFT JOIN ref_received rr ON rr.user_id = u.id
    LEFT JOIN pnl p ON p.user_id = u.id
    LEFT JOIN collateral col ON col.user_id = u.id
  \`);

  const s = r.rows[0];
  console.log('=== AUDIT SUMMARY (all values in CENTS) ===');
  console.log('Total Users: ' + s.total_users);
  console.log('With Open Positions: ' + s.with_open_positions);
  console.log('With Discrepancy (>100 cents): ' + s.with_discrepancy);
  console.log(Number(s.with_discrepancy) === 0 ? '\\n✅ All balances correct!' : '\\n⚠️  Run: /audit full');
  pool.end();
})();
"
```

### Full Audit

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const r = await pool.query(\`
    WITH
      claims AS (SELECT user_id, COALESCE(SUM(amount), 0) as total FROM claims GROUP BY user_id),
      missions AS (SELECT user_id, COALESCE(SUM(reward_paid), 0) as total FROM user_missions WHERE is_claimed = true GROUP BY user_id),
      ref_given AS (SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) as total FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id),
      ref_received AS (SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) as total FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id),
      pnl AS (SELECT user_id, COALESCE(SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END), 0) as total FROM trades WHERE status = 'closed' GROUP BY user_id),
      collateral AS (SELECT user_id, COALESCE(SUM(position_size), 0) as total FROM trades WHERE status = 'open' GROUP BY user_id)
    SELECT
      u.id, u.username,
      ROUND(u.paper_balance) as balance,
      ROUND(COALESCE(c.total,0)) as claims,
      ROUND(COALESCE(m.total,0)) as missions,
      ROUND(COALESCE(rg.total,0) + COALESCE(rr.total,0)) as referrals,
      ROUND(COALESCE(p.total,0)) as pnl,
      ROUND(COALESCE(col.total,0)) as collateral,
      ROUND(GREATEST(0, 1000000 + COALESCE(c.total,0) + COALESCE(m.total,0) + COALESCE(rg.total,0) + COALESCE(rr.total,0) + COALESCE(p.total,0) - COALESCE(col.total,0))) as expected,
      col.total > 0 as has_open
    FROM users u
    LEFT JOIN claims c ON c.user_id = u.id
    LEFT JOIN missions m ON m.user_id = u.id
    LEFT JOIN ref_given rg ON rg.user_id = u.id
    LEFT JOIN ref_received rr ON rr.user_id = u.id
    LEFT JOIN pnl p ON p.user_id = u.id
    LEFT JOIN collateral col ON col.user_id = u.id
    WHERE ABS(u.paper_balance - GREATEST(0, 1000000 + COALESCE(c.total,0) + COALESCE(m.total,0) + COALESCE(rg.total,0) + COALESCE(rr.total,0) + COALESCE(p.total,0) - COALESCE(col.total,0))) > 100
    ORDER BY ABS(u.paper_balance - GREATEST(0, 1000000 + COALESCE(c.total,0) + COALESCE(m.total,0) + COALESCE(rg.total,0) + COALESCE(rr.total,0) + COALESCE(p.total,0) - COALESCE(col.total,0))) DESC
    LIMIT 30
  \`);

  console.log('=== BALANCE DISCREPANCIES (all CENTS) ===\\n');

  if (r.rows.length === 0) {
    console.log('✅ No discrepancies found!');
  } else {
    let totalExcess = 0, totalDeficit = 0;
    r.rows.forEach(u => {
      const diff = Number(u.balance) - Number(u.expected);
      if (diff > 0) totalExcess += diff; else totalDeficit += Math.abs(diff);

      console.log(u.username + ' (ID:' + u.id + ') ' + (u.has_open ? '⚠️ OPEN' : ''));
      console.log('  Balance: ' + Number(u.balance).toLocaleString() + ' | Expected: ' + Number(u.expected).toLocaleString());
      console.log('  Diff: ' + (diff >= 0 ? '+' : '') + diff.toLocaleString() + ' cents');
      console.log('  Claims:' + Number(u.claims).toLocaleString() + ' Missions:' + Number(u.missions).toLocaleString() + ' Refs:' + Number(u.referrals).toLocaleString() + ' PnL:' + Number(u.pnl).toLocaleString() + ' Lock:' + Number(u.collateral).toLocaleString());
      console.log('');
    });
    console.log('--- Summary (cents) ---');
    console.log('Total Excess: +' + totalExcess.toLocaleString());
    console.log('Total Deficit: -' + totalDeficit.toLocaleString());
  }
  pool.end();
})();
"
```

### User Lookup
Check specific user. Replace USERNAME with the target.

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const search = 'USERNAME';

  const r = await pool.query(\`
    WITH target AS (SELECT id FROM users WHERE LOWER(username) LIKE LOWER('%' || \$1 || '%') OR id::text = \$1 LIMIT 1),
      claims AS (SELECT COALESCE(SUM(amount), 0) as total FROM claims WHERE user_id = (SELECT id FROM target)),
      missions AS (SELECT COALESCE(SUM(reward_paid), 0) as total FROM user_missions WHERE user_id = (SELECT id FROM target) AND is_claimed = true),
      ref_given AS (SELECT COALESCE(SUM(referrer_reward), 0) as total FROM referrals WHERE referrer_id = (SELECT id FROM target) AND referrer_claimed = true),
      ref_received AS (SELECT COALESCE(SUM(referred_reward), 0) as total FROM referrals WHERE referred_user_id = (SELECT id FROM target) AND referred_claimed = true),
      pnl AS (SELECT COALESCE(SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END), 0) as corrected, COALESCE(SUM(pnl), 0) as raw FROM trades WHERE user_id = (SELECT id FROM target) AND status = 'closed'),
      open_trades AS (SELECT COALESCE(SUM(position_size), 0) as collateral, COUNT(*) as count FROM trades WHERE user_id = (SELECT id FROM target) AND status = 'open')
    SELECT u.id, u.username, ROUND(u.paper_balance) as balance,
      ROUND(c.total) as claims, ROUND(m.total) as missions,
      ROUND(rg.total) as ref_given, ROUND(rr.total) as ref_received,
      ROUND(p.corrected) as pnl_corrected, ROUND(p.raw) as pnl_raw,
      ROUND(o.collateral) as collateral, o.count as open_count
    FROM users u, claims c, missions m, ref_given rg, ref_received rr, pnl p, open_trades o
    WHERE u.id = (SELECT id FROM target)
  \`, [search]);

  if (r.rows.length === 0) { console.log('User not found: ' + search); pool.end(); return; }

  const u = r.rows[0];
  const expected = Math.max(0, 1000000 + Number(u.claims) + Number(u.missions) + Number(u.ref_given) + Number(u.ref_received) + Number(u.pnl_corrected) - Number(u.collateral));
  const diff = Number(u.balance) - expected;

  console.log('=== ' + u.username + ' (ID: ' + u.id + ') ===');
  console.log('ALL VALUES IN CENTS\\n');
  console.log('Current Balance: ' + Number(u.balance).toLocaleString() + '\\n');
  console.log('--- Calculation ---');
  console.log('Starting:     1,000,000');
  console.log('+ Claims:     ' + Number(u.claims).toLocaleString());
  console.log('+ Missions:   ' + Number(u.missions).toLocaleString());
  console.log('+ Ref Given:  ' + Number(u.ref_given).toLocaleString());
  console.log('+ Ref Recv:   ' + Number(u.ref_received).toLocaleString());
  console.log('+ PnL (corr): ' + Number(u.pnl_corrected).toLocaleString());
  console.log('  (Raw PnL:   ' + Number(u.pnl_raw).toLocaleString() + ')');
  console.log('- Collateral: ' + Number(u.collateral).toLocaleString() + ' (' + u.open_count + ' open)');
  console.log('─────────────────────');
  console.log('Expected:     ' + expected.toLocaleString() + '\\n');

  if (Math.abs(diff) <= 100) {
    console.log('✅ Balance is CORRECT');
  } else {
    console.log('⚠️ Discrepancy: ' + (diff >= 0 ? '+' : '') + diff.toLocaleString() + ' cents');
  }
  pool.end();
})();
"
```

### Fix All (Dry Run)

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const r = await pool.query(\`
    WITH
      claims AS (SELECT user_id, COALESCE(SUM(amount), 0) as total FROM claims GROUP BY user_id),
      missions AS (SELECT user_id, COALESCE(SUM(reward_paid), 0) as total FROM user_missions WHERE is_claimed = true GROUP BY user_id),
      ref_given AS (SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) as total FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id),
      ref_received AS (SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) as total FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id),
      pnl AS (SELECT user_id, COALESCE(SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END), 0) as total FROM trades WHERE status = 'closed' GROUP BY user_id),
      collateral AS (SELECT user_id, COALESCE(SUM(position_size), 0) as total FROM trades WHERE status = 'open' GROUP BY user_id)
    SELECT u.id, u.username, ROUND(u.paper_balance) as current,
      ROUND(GREATEST(0, 1000000 + COALESCE(c.total,0) + COALESCE(m.total,0) + COALESCE(rg.total,0) + COALESCE(rr.total,0) + COALESCE(p.total,0) - COALESCE(col.total,0))) as expected
    FROM users u
    LEFT JOIN claims c ON c.user_id = u.id
    LEFT JOIN missions m ON m.user_id = u.id
    LEFT JOIN ref_given rg ON rg.user_id = u.id
    LEFT JOIN ref_received rr ON rr.user_id = u.id
    LEFT JOIN pnl p ON p.user_id = u.id
    LEFT JOIN collateral col ON col.user_id = u.id
    WHERE ABS(u.paper_balance - GREATEST(0, 1000000 + COALESCE(c.total,0) + COALESCE(m.total,0) + COALESCE(rg.total,0) + COALESCE(rr.total,0) + COALESCE(p.total,0) - COALESCE(col.total,0))) > 100
  \`);

  console.log('=== DRY RUN - NO CHANGES (all CENTS) ===\\n');
  if (r.rows.length === 0) { console.log('✅ No discrepancies to fix!'); pool.end(); return; }

  console.log('Would fix ' + r.rows.length + ' users:\\n');
  r.rows.forEach(u => {
    const diff = Number(u.expected) - Number(u.current);
    console.log(u.username + ': ' + Number(u.current).toLocaleString() + ' -> ' + Number(u.expected).toLocaleString() + ' (' + (diff >= 0 ? '+' : '') + diff.toLocaleString() + ')');
  });
  console.log('\\n⚠️ To apply: /audit fix --apply');
  pool.end();
})();
"
```

### Fix All (Apply)

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const r = await pool.query(\`
    WITH
      claims AS (SELECT user_id, COALESCE(SUM(amount), 0) as total FROM claims GROUP BY user_id),
      missions AS (SELECT user_id, COALESCE(SUM(reward_paid), 0) as total FROM user_missions WHERE is_claimed = true GROUP BY user_id),
      ref_given AS (SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) as total FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id),
      ref_received AS (SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) as total FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id),
      pnl AS (SELECT user_id, COALESCE(SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END), 0) as total FROM trades WHERE status = 'closed' GROUP BY user_id),
      collateral AS (SELECT user_id, COALESCE(SUM(position_size), 0) as total FROM trades WHERE status = 'open' GROUP BY user_id)
    SELECT u.id, u.username, ROUND(u.paper_balance) as current,
      ROUND(GREATEST(0, 1000000 + COALESCE(c.total,0) + COALESCE(m.total,0) + COALESCE(rg.total,0) + COALESCE(rr.total,0) + COALESCE(p.total,0) - COALESCE(col.total,0))) as expected
    FROM users u
    LEFT JOIN claims c ON c.user_id = u.id
    LEFT JOIN missions m ON m.user_id = u.id
    LEFT JOIN ref_given rg ON rg.user_id = u.id
    LEFT JOIN ref_received rr ON rr.user_id = u.id
    LEFT JOIN pnl p ON p.user_id = u.id
    LEFT JOIN collateral col ON col.user_id = u.id
    WHERE ABS(u.paper_balance - GREATEST(0, 1000000 + COALESCE(c.total,0) + COALESCE(m.total,0) + COALESCE(rg.total,0) + COALESCE(rr.total,0) + COALESCE(p.total,0) - COALESCE(col.total,0))) > 100
  \`);

  console.log('=== APPLYING FIXES (all CENTS) ===\\n');
  if (r.rows.length === 0) { console.log('✅ No discrepancies to fix!'); pool.end(); return; }

  for (const u of r.rows) {
    const diff = Number(u.expected) - Number(u.current);
    await pool.query('UPDATE users SET paper_balance = \$1 WHERE id = \$2', [u.expected, u.id]);
    console.log('✓ ' + u.username + ': ' + Number(u.current).toLocaleString() + ' -> ' + Number(u.expected).toLocaleString() + ' (' + (diff >= 0 ? '+' : '') + diff.toLocaleString() + ')');
  }

  console.log('\\n✅ Fixed ' + r.rows.length + ' users!');
  pool.end();
})();
"
```

## Historical Notes

### Cents Migration (January 2026)
All values now stored in CENTS:
- `paper_balance`, `position_size`, `pnl` × 100
- Starting balance: 1,000,000 cents

### Collateral Bug (January 2025)
Leveraged trades stored inflated P&L. Fix: `pnl / leverage` for `leverage > 1`.

### Referral Double-Payment Bug (January 2026)
Fixed to pay only on individual claim action.
