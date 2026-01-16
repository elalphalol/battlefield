# Referral Stats

Monitor BATTLEFIELD referral system performance.

## Instructions

View referral statistics, top referrers, and recent activity. The referral system requires:
- Both referrer and referred user must have a valid Farcaster FID (anti-exploit protection)
- Referred user must complete their first trade for the referral to become claimable
- Both parties must manually claim their $5,000 rewards

**Referral Links:**
- Farcaster Mini App: `https://farcaster.xyz/miniapps/5kLec5hSq3bP/battlefield?ref=CODE`
- Direct Web: `https://btcbattlefield.com?ref=CODE`

## Referral Overview

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const stats = await pool.query(\`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'claimable') as claimable,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COALESCE(SUM(CASE WHEN referrer_claimed THEN referrer_reward ELSE 0 END) +
               SUM(CASE WHEN referred_claimed THEN referred_reward ELSE 0 END), 0) / 100 as rewards_claimed
    FROM referrals
  \`);
  const s = stats.rows[0];
  console.log('=== REFERRAL STATS ===');
  console.log('📊 Total Referrals: ' + s.total);
  console.log('⏳ Pending (awaiting first trade): ' + s.pending);
  console.log('🎁 Claimable (ready to claim): ' + s.claimable);
  console.log('✅ Completed (fully claimed): ' + s.completed);
  console.log('💰 Total Rewards Claimed: \$' + Number(s.rewards_claimed).toLocaleString());
  pool.end();
})();
"
```

## Top Referrers

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const result = await pool.query(\`
    SELECT
      u.username,
      u.referral_code,
      u.fid,
      u.referral_count as claimed_referrals,
      u.referral_earnings / 100 as earnings,
      (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as total_referrals,
      (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id AND referrer_claimed = false AND status IN ('claimable', 'completed')) as unclaimed
    FROM users u
    WHERE u.referral_count > 0 OR EXISTS (SELECT 1 FROM referrals WHERE referrer_id = u.id)
    ORDER BY u.referral_count DESC, u.referral_earnings DESC
    LIMIT 15
  \`);
  console.log('=== TOP REFERRERS ===');
  console.log('Rank | Username | Code | FID | Claimed | Earnings | Unclaimed');
  console.log('-----|----------|------|-----|---------|----------|----------');
  result.rows.forEach((r, i) => {
    console.log((i+1) + ' | ' + r.username + ' | ' + r.referral_code + ' | ' + (r.fid || 'N/A') + ' | ' + r.claimed_referrals + ' | \$' + Number(r.earnings).toLocaleString() + ' | ' + r.unclaimed);
  });
  pool.end();
})();
"
```

## Recent Referral Activity

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const result = await pool.query(\`
    SELECT
      referrer.username as referrer,
      referrer.fid as referrer_fid,
      referred.username as referred_user,
      referred.fid as referred_fid,
      r.status,
      r.referrer_claimed,
      r.referred_claimed,
      r.created_at,
      r.completed_at
    FROM referrals r
    JOIN users referrer ON r.referrer_id = referrer.id
    JOIN users referred ON r.referred_user_id = referred.id
    ORDER BY r.created_at DESC
    LIMIT 15
  \`);
  console.log('=== RECENT REFERRALS ===');
  result.rows.forEach(r => {
    const claimStatus = (r.referrer_claimed ? '✓' : '✗') + '/' + (r.referred_claimed ? '✓' : '✗');
    console.log(r.referrer + ' (FID:' + r.referrer_fid + ') → ' + r.referred_user + ' (FID:' + r.referred_fid + ')');
    console.log('  Status: ' + r.status + ' | Claims: ' + claimStatus + ' | Created: ' + new Date(r.created_at).toLocaleDateString());
  });
  pool.end();
})();
"
```

## Claimable Referrals (Awaiting User Claims)

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const result = await pool.query(\`
    SELECT
      referrer.username as referrer,
      referred.username as referred_user,
      r.referrer_claimed,
      r.referred_claimed,
      r.referrer_reward / 100 as reward,
      r.created_at
    FROM referrals r
    JOIN users referrer ON r.referrer_id = referrer.id
    JOIN users referred ON r.referred_user_id = referred.id
    WHERE r.status = 'claimable'
    ORDER BY r.created_at DESC
  \`);
  console.log('=== CLAIMABLE REFERRALS ===');
  if (result.rows.length === 0) {
    console.log('No claimable referrals pending.');
  } else {
    result.rows.forEach(r => {
      const referrerStatus = r.referrer_claimed ? '✅ Claimed' : '⏳ Unclaimed';
      const referredStatus = r.referred_claimed ? '✅ Claimed' : '⏳ Unclaimed';
      console.log(r.referrer + ' → ' + r.referred_user + ' | Reward: \$' + r.reward + ' each');
      console.log('  Referrer: ' + referrerStatus + ' | Referred: ' + referredStatus);
    });
  }
  pool.end();
})();
"
```

## Pending Referrals (Waiting for First Trade)

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const result = await pool.query(\`
    SELECT
      referrer.username as referrer,
      referred.username as referred_user,
      referred.total_trades as trades,
      referred.fid as referred_fid,
      r.created_at,
      EXTRACT(DAY FROM NOW() - r.created_at) as days_pending
    FROM referrals r
    JOIN users referrer ON r.referrer_id = referrer.id
    JOIN users referred ON r.referred_user_id = referred.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at DESC
  \`);
  console.log('=== PENDING REFERRALS ===');
  if (result.rows.length === 0) {
    console.log('No pending referrals.');
  } else {
    result.rows.forEach(r => {
      console.log(r.referrer + ' → ' + r.referred_user + ' (FID: ' + (r.referred_fid || 'N/A') + ')');
      console.log('  Trades: ' + r.trades + ' | Days Pending: ' + Math.floor(r.days_pending));
    });
  }
  pool.end();
})();
"
```

## FID Verification Check

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  // Check users without FID who have referral activity
  const noFid = await pool.query(\`
    SELECT u.id, u.username, u.referral_code,
           (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as as_referrer,
           (SELECT COUNT(*) FROM referrals WHERE referred_user_id = u.id) as as_referred
    FROM users u
    WHERE u.fid IS NULL
    AND (EXISTS (SELECT 1 FROM referrals WHERE referrer_id = u.id)
         OR EXISTS (SELECT 1 FROM referrals WHERE referred_user_id = u.id)
         OR u.referred_by IS NOT NULL)
    LIMIT 20
  \`);

  console.log('=== USERS WITHOUT FID IN REFERRAL SYSTEM ===');
  if (noFid.rows.length === 0) {
    console.log('✅ All users with referral activity have valid FIDs');
  } else {
    console.log('⚠️  Users without FID (may have legacy referrals):');
    noFid.rows.forEach(r => {
      console.log('  ID ' + r.id + ': ' + r.username + ' - As Referrer: ' + r.as_referrer + ', As Referred: ' + r.as_referred);
    });
  }

  // Check total eligible users (with FID)
  const eligible = await pool.query('SELECT COUNT(*) as count FROM users WHERE fid IS NOT NULL');
  const total = await pool.query('SELECT COUNT(*) as count FROM users');
  console.log('\\n📊 Eligible for Referrals: ' + eligible.rows[0].count + '/' + total.rows[0].count + ' users have FID');

  pool.end();
})();
"
```

## Referral Conversion Rate

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const stats = await pool.query(\`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'completed') as completed,
      COUNT(*) FILTER (WHERE status = 'claimable') as claimable,
      COUNT(*) FILTER (WHERE status = 'pending') as pending
    FROM referrals
  \`);
  const s = stats.rows[0];
  const completionRate = s.total > 0 ? ((Number(s.completed) / Number(s.total)) * 100).toFixed(1) : 0;
  const activationRate = s.total > 0 ? (((Number(s.completed) + Number(s.claimable)) / Number(s.total)) * 100).toFixed(1) : 0;

  console.log('=== REFERRAL CONVERSION RATES ===');
  console.log('Total Referrals: ' + s.total);
  console.log('Pending → Claimable (First Trade Rate): ' + activationRate + '%');
  console.log('Claimable → Completed (Claim Rate): ' + completionRate + '%');
  pool.end();
})();
"
```

## Generate Referral Link for User

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const search = process.argv[2] || '';
  if (!search) {
    console.log('Usage: /referrals link <username or ID>');
    pool.end();
    return;
  }

  const result = await pool.query(\`
    SELECT id, username, referral_code, fid
    FROM users
    WHERE LOWER(username) LIKE LOWER('%' || \$1 || '%') OR id::text = \$1
    LIMIT 1
  \`, [search]);

  if (result.rows.length === 0) {
    console.log('User not found: ' + search);
    pool.end();
    return;
  }

  const u = result.rows[0];
  console.log('=== REFERRAL LINKS FOR ' + u.username + ' ===');
  console.log('');
  console.log('Referral Code: ' + u.referral_code);
  console.log('FID: ' + (u.fid || 'N/A (cannot refer without FID)'));
  console.log('');
  console.log('📱 Farcaster Mini App Link (recommended):');
  console.log('   https://farcaster.xyz/miniapps/5kLec5hSq3bP/battlefield?ref=' + u.referral_code);
  console.log('');
  console.log('🌐 Direct Web Link:');
  console.log('   https://btcbattlefield.com?ref=' + u.referral_code);

  pool.end();
})();
" "\$ARGS"
```
