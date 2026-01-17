# Referral Stats

Monitor BATTLEFIELD referral system performance.

## Instructions

View referral statistics, top referrers, and recent activity. The referral system requires:
- Both referrer and referred user must have a valid Farcaster FID (anti-exploit protection)
- Referred user must complete their first trade for the referral to become claimable
- **Both parties must confirm** the referral to receive $5,000 each (two-sided confirmation)
- Once both confirm, the referral connection becomes **permanent** and cannot be changed
- Circular referrals are blocked (A→B then B→A is not allowed)

**Referral Links:**
- Farcaster Mini App: `https://farcaster.xyz/miniapps/5kLec5hSq3bP/battlefield?ref=CODE`
- Direct Web: `https://btcbattlefield.com?ref=CODE`

## Referral Flow

1. **Pending** - User B clicks User A's referral link, accounts are linked
2. **Claimable** - User B completes their first trade
3. **Confirmation** - Both users must click "Confirm Referral" in their profile
4. **Completed** - Once both confirm, $5,000 is distributed to each user

## User Interface Features

The referral system UI (Profile → Referrals tab) includes:

1. **Referral Code Display** - Shows user's unique code with copy button
2. **Share Link** - Pre-built Farcaster Mini App link with Cast button
3. **Stats** - Friends referred count and total earnings
4. **Referral Confirmations Section** - Individual cards per claimable referral showing:
   - Profile picture and username
   - "You referred them" or "They referred you" label
   - Confirmation status badges: "You: ✓/Pending" and "Friend: ✓/Pending"
   - Full-width "Confirm Referral" button (pulsing yellow if friend already confirmed)
5. **Claim Confirmation Modal** - Warning popup before confirming that explains:
   - The reward amount ($5,000)
   - Whether friend has already confirmed (ready to complete)
   - That confirming makes the referral connection **permanent**
6. **Referred By Section** (visible to everyone viewing the profile):
   - Clickable username/avatar to visit referrer's profile
   - Cancel button (only on own profile, only if not yet confirmed)
7. **Referral List** - Shows all users referred with status badges:
   - Gray "⏳ Awaiting Trade" - pending first trade
   - Yellow "⏳ $0" - claimable, neither confirmed
   - Blue "⏳ $5,000" - you confirmed, waiting for friend
   - Pulsing Yellow "💰 $5,000" - friend confirmed, waiting for you
   - Green "✓ $10,000" - both confirmed, completed

## Anti-Exploit Features

- **FID Required** - Both users must have Farcaster FID
- **Circular Prevention** - Cannot refer someone who already referred you
- **Two-Sided Confirmation** - Rewards only distribute when BOTH confirm
- **Permanent Once Confirmed** - Cannot cancel after confirming

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
      COUNT(*) FILTER (WHERE status = 'claimable' AND referrer_claimed AND NOT referred_claimed) as referrer_waiting,
      COUNT(*) FILTER (WHERE status = 'claimable' AND referred_claimed AND NOT referrer_claimed) as referred_waiting,
      COUNT(*) FILTER (WHERE status = 'claimable' AND NOT referrer_claimed AND NOT referred_claimed) as neither_claimed,
      COALESCE(SUM(CASE WHEN referrer_claimed THEN referrer_reward ELSE 0 END) +
               SUM(CASE WHEN referred_claimed THEN referred_reward ELSE 0 END), 0) / 100 as rewards_claimed
    FROM referrals
  \`);
  const s = stats.rows[0];
  console.log('=== REFERRAL STATS ===');
  console.log('📊 Total Referrals: ' + s.total);
  console.log('');
  console.log('--- By Status ---');
  console.log('⏳ Pending (awaiting first trade): ' + s.pending);
  console.log('🎁 Claimable (ready to confirm): ' + s.claimable);
  console.log('✅ Completed (both confirmed): ' + s.completed);
  console.log('');
  console.log('--- Claimable Breakdown ---');
  console.log('⬜ Neither confirmed: ' + s.neither_claimed);
  console.log('🔵 Referrer confirmed, waiting for referred: ' + s.referrer_waiting);
  console.log('🟡 Referred confirmed, waiting for referrer: ' + s.referred_waiting);
  console.log('');
  console.log('💰 Total Rewards Distributed: \$' + Number(s.rewards_claimed).toLocaleString());
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
      u.referral_count as completed_referrals,
      u.referral_earnings / 100 as earnings,
      (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id) as total_referrals,
      (SELECT COUNT(*) FROM referrals WHERE referrer_id = u.id AND status = 'claimable' AND NOT referrer_claimed) as awaiting_my_confirm
    FROM users u
    WHERE u.referral_count > 0 OR EXISTS (SELECT 1 FROM referrals WHERE referrer_id = u.id)
    ORDER BY u.referral_count DESC, u.referral_earnings DESC
    LIMIT 15
  \`);
  console.log('=== TOP REFERRERS ===');
  console.log('Rank | Username | Code | Completed | Earnings | Awaiting Confirm');
  console.log('-----|----------|------|-----------|----------|------------------');
  result.rows.forEach((r, i) => {
    console.log((i+1) + ' | ' + r.username + ' | ' + r.referral_code + ' | ' + r.completed_referrals + ' | \$' + Number(r.earnings).toLocaleString() + ' | ' + r.awaiting_my_confirm);
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
    let statusIcon = '⏳';
    let confirmStatus = '';
    if (r.status === 'pending') {
      statusIcon = '⏳';
      confirmStatus = 'Awaiting first trade';
    } else if (r.status === 'completed') {
      statusIcon = '✅';
      confirmStatus = 'Both confirmed';
    } else if (r.status === 'claimable') {
      if (r.referrer_claimed && r.referred_claimed) {
        statusIcon = '✅';
        confirmStatus = 'Both confirmed';
      } else if (r.referrer_claimed) {
        statusIcon = '🔵';
        confirmStatus = 'Referrer ✓, Referred pending';
      } else if (r.referred_claimed) {
        statusIcon = '🟡';
        confirmStatus = 'Referred ✓, Referrer pending';
      } else {
        statusIcon = '⬜';
        confirmStatus = 'Neither confirmed';
      }
    }
    console.log(statusIcon + ' ' + r.referrer + ' → ' + r.referred_user);
    console.log('   ' + confirmStatus + ' | ' + new Date(r.created_at).toLocaleDateString());
  });
  pool.end();
})();
"
```

## Claimable Referrals (Awaiting Confirmations)

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const result = await pool.query(\`
    SELECT
      r.id,
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
    ORDER BY
      CASE
        WHEN r.referrer_claimed AND r.referred_claimed THEN 0
        WHEN r.referrer_claimed OR r.referred_claimed THEN 1
        ELSE 2
      END,
      r.created_at DESC
  \`);
  console.log('=== CLAIMABLE REFERRALS (Awaiting Confirmations) ===');
  if (result.rows.length === 0) {
    console.log('No claimable referrals pending.');
  } else {
    result.rows.forEach(r => {
      const referrerIcon = r.referrer_claimed ? '✅' : '⏳';
      const referredIcon = r.referred_claimed ? '✅' : '⏳';
      let status = '';
      if (r.referrer_claimed && r.referred_claimed) {
        status = '🎉 READY TO COMPLETE';
      } else if (r.referrer_claimed) {
        status = '⏳ Waiting for ' + r.referred_user;
      } else if (r.referred_claimed) {
        status = '⏳ Waiting for ' + r.referrer;
      } else {
        status = '⏳ Neither confirmed yet';
      }
      console.log('#' + r.id + ' | ' + r.referrer + ' → ' + r.referred_user + ' | \$' + r.reward + ' each');
      console.log('   ' + referrerIcon + ' ' + r.referrer + ' | ' + referredIcon + ' ' + r.referred_user + ' | ' + status);
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
  console.log('=== PENDING REFERRALS (Awaiting First Trade) ===');
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

## Referral Conversion Rates

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
      COUNT(*) FILTER (WHERE status = 'pending') as pending,
      COUNT(*) FILTER (WHERE status = 'claimable' AND (referrer_claimed OR referred_claimed)) as partially_confirmed
    FROM referrals
  \`);
  const s = stats.rows[0];
  const tradeRate = s.total > 0 ? (((Number(s.completed) + Number(s.claimable)) / Number(s.total)) * 100).toFixed(1) : 0;
  const confirmRate = Number(s.claimable) > 0 ? ((Number(s.partially_confirmed) / Number(s.claimable)) * 100).toFixed(1) : 0;
  const completionRate = s.total > 0 ? ((Number(s.completed) / Number(s.total)) * 100).toFixed(1) : 0;

  console.log('=== REFERRAL CONVERSION RATES ===');
  console.log('Total Referrals: ' + s.total);
  console.log('');
  console.log('Pending → Claimable (First Trade Rate): ' + tradeRate + '%');
  console.log('Claimable → Partially Confirmed: ' + confirmRate + '%');
  console.log('Total → Completed (Full Funnel): ' + completionRate + '%');
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

## Check Specific User's Referral Status

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

(async () => {
  const search = process.argv[2] || '';
  if (!search) {
    console.log('Usage: /referrals user <username or ID>');
    pool.end();
    return;
  }

  const userResult = await pool.query(\`
    SELECT id, username, referral_code, fid, referral_count, referral_earnings / 100 as earnings, referred_by
    FROM users
    WHERE LOWER(username) LIKE LOWER('%' || \$1 || '%') OR id::text = \$1
    LIMIT 1
  \`, [search]);

  if (userResult.rows.length === 0) {
    console.log('User not found: ' + search);
    pool.end();
    return;
  }

  const u = userResult.rows[0];
  console.log('=== REFERRAL STATUS FOR ' + u.username + ' ===');
  console.log('');
  console.log('Code: ' + u.referral_code + ' | FID: ' + (u.fid || 'N/A'));
  console.log('Completed Referrals: ' + u.referral_count + ' | Earnings: \$' + Number(u.earnings).toLocaleString());
  console.log('');

  // Who referred them
  if (u.referred_by) {
    const referrer = await pool.query('SELECT username FROM users WHERE id = \$1', [u.referred_by]);
    const refStatus = await pool.query(\`
      SELECT status, referrer_claimed, referred_claimed
      FROM referrals WHERE referred_user_id = \$1
    \`, [u.id]);
    if (referrer.rows.length > 0 && refStatus.rows.length > 0) {
      const rs = refStatus.rows[0];
      console.log('👥 Referred by: ' + referrer.rows[0].username);
      console.log('   Status: ' + rs.status + ' | Referrer: ' + (rs.referrer_claimed ? '✅' : '⏳') + ' | This user: ' + (rs.referred_claimed ? '✅' : '⏳'));
    }
  } else {
    console.log('👥 Not referred by anyone');
  }
  console.log('');

  // Users they referred
  const referred = await pool.query(\`
    SELECT u.username, r.status, r.referrer_claimed, r.referred_claimed
    FROM referrals r
    JOIN users u ON u.id = r.referred_user_id
    WHERE r.referrer_id = \$1
    ORDER BY r.created_at DESC
  \`, [u.id]);

  if (referred.rows.length > 0) {
    console.log('📋 Users they referred:');
    referred.rows.forEach(r => {
      const icon = r.status === 'completed' ? '✅' : r.status === 'claimable' ? '🎁' : '⏳';
      const confirm = r.referrer_claimed ? '✅' : '⏳';
      const theirConfirm = r.referred_claimed ? '✅' : '⏳';
      console.log('   ' + icon + ' ' + r.username + ' | ' + u.username + ': ' + confirm + ' | ' + r.username + ': ' + theirConfirm);
    });
  } else {
    console.log('📋 Has not referred anyone');
  }

  pool.end();
})();
" "\$ARGS"
```
