# Balance Audit Tool

Audit and manage user balances for BATTLEFIELD via the API.

## Commands

Based on user input, run ONE of these:

### Quick Summary (default: `/audit`)

```bash
curl -s "http://localhost:3001/api/admin/audit?source=cli" | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const r = JSON.parse(Buffer.concat(chunks).toString());
  if (!r.success) { console.log('Error:', r.message); return; }
  console.log('=== AUDIT SUMMARY (all values in CENTS) ===');
  console.log('Total Users:', r.summary.totalUsers);
  console.log('With Discrepancy (>100 cents):', r.summary.usersWithDiscrepancy);
  console.log('Total Excess:', '+' + r.summary.totalExcess.toLocaleString(), 'cents');
  console.log('Total Deficit:', '-' + r.summary.totalDeficit.toLocaleString(), 'cents');
  console.log(r.summary.usersWithDiscrepancy === 0 ? '\n✅ All balances correct!' : '\n⚠️  Run: /audit full');
});
"
```

### Full Audit (`/audit full`)

```bash
curl -s "http://localhost:3001/api/admin/audit?source=cli" | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const r = JSON.parse(Buffer.concat(chunks).toString());
  if (!r.success) { console.log('Error:', r.message); return; }

  console.log('=== BALANCE DISCREPANCIES (all CENTS) ===\n');

  if (r.discrepancies.length === 0) {
    console.log('✅ No discrepancies found!');
    return;
  }

  r.discrepancies.slice(0, 30).forEach(u => {
    const diff = u.discrepancy;
    console.log(u.username + ' (ID:' + u.id + ') ' + (u.hasOpenPositions ? '⚠️ OPEN' : ''));
    console.log('  Balance: ' + u.currentBalance.toLocaleString() + ' | Expected: ' + u.expectedBalance.toLocaleString());
    console.log('  Diff: ' + (diff >= 0 ? '+' : '') + diff.toLocaleString() + ' cents');
    console.log('  Claims:' + u.claims.toLocaleString() + ' Missions:' + u.missions.toLocaleString() + ' Refs:' + u.referrals.toLocaleString() + ' PnL:' + u.pnl.toLocaleString() + ' Lock:' + u.openCollateral.toLocaleString());
    console.log('');
  });

  console.log('--- Summary (cents) ---');
  console.log('Total Excess: +' + r.summary.totalExcess.toLocaleString());
  console.log('Total Deficit: -' + r.summary.totalDeficit.toLocaleString());
  console.log('Users with discrepancy:', r.summary.usersWithDiscrepancy);
});
"
```

### User Lookup (`/audit user <name>`)

Replace `USERNAME` with the target user:

```bash
curl -s "http://localhost:3001/api/admin/audit/user/USERNAME" | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const r = JSON.parse(Buffer.concat(chunks).toString());
  if (!r.success) { console.log('Error:', r.message); return; }

  const u = r.user;
  const b = r.breakdown;

  console.log('=== ' + u.username + ' (ID: ' + u.id + ') ===');
  console.log('ALL VALUES IN CENTS\n');
  console.log('Current Balance: ' + u.currentBalanceCents.toLocaleString() + '\n');
  console.log('--- Calculation ---');
  console.log('Starting:     1,000,000');
  console.log('+ Claims:     ' + b.claimsCents.toLocaleString());
  console.log('+ Missions:   ' + b.missionsCents.toLocaleString());
  console.log('+ Ref Given:  ' + b.refGivenCents.toLocaleString());
  console.log('+ Ref Recv:   ' + b.refReceivedCents.toLocaleString());
  console.log('+ PnL (corr): ' + b.pnlCorrectedCents.toLocaleString());
  console.log('  (Raw PnL:   ' + b.pnlRawCents.toLocaleString() + ')');
  console.log('- Collateral: ' + b.collateralCents.toLocaleString() + ' (' + b.openTradesCount + ' open)');
  console.log('─────────────────────');
  console.log('Expected:     ' + u.expectedCents.toLocaleString() + '\n');

  if (u.isCorrect) {
    console.log('✅ Balance is CORRECT');
  } else {
    const diff = u.discrepancyCents;
    console.log('⚠️ Discrepancy: ' + (diff >= 0 ? '+' : '') + diff.toLocaleString() + ' cents');
  }
});
"
```

### Fix Dry Run (`/audit fix`)

Preview what would be fixed without making changes:

```bash
curl -s -X POST "http://localhost:3001/api/admin/audit/fix" \
  -H "Content-Type: application/json" \
  -d '{"fixAll": true, "dryRun": true, "source": "cli"}' | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const r = JSON.parse(Buffer.concat(chunks).toString());
  if (!r.success) { console.log('Error:', r.message); return; }

  console.log('=== DRY RUN - NO CHANGES (all CENTS) ===\n');

  if (r.fixedUsers.length === 0) {
    console.log('✅ No discrepancies to fix!');
    return;
  }

  console.log('Would fix ' + r.fixedUsers.length + ' users:\n');
  r.fixedUsers.forEach(u => {
    const diff = u.adjustment;
    console.log(u.username + ': ' + u.previousBalance.toLocaleString() + ' -> ' + u.newBalance.toLocaleString() + ' (' + (diff >= 0 ? '+' : '') + diff.toLocaleString() + ')');
  });
  console.log('\nTotal adjustment: ' + (r.totalAdjustment >= 0 ? '+' : '') + r.totalAdjustment.toLocaleString() + ' cents');
  console.log('\n⚠️ To apply: /audit fix --apply');
});
"
```

### Fix Apply (`/audit fix --apply`)

Actually apply the fixes:

```bash
curl -s -X POST "http://localhost:3001/api/admin/audit/fix" \
  -H "Content-Type: application/json" \
  -d '{"fixAll": true, "dryRun": false, "source": "cli"}' | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const r = JSON.parse(Buffer.concat(chunks).toString());
  if (!r.success) { console.log('Error:', r.message); return; }

  console.log('=== APPLYING FIXES (all CENTS) ===\n');

  if (r.fixedUsers.length === 0) {
    console.log('✅ No discrepancies to fix!');
    return;
  }

  r.fixedUsers.forEach(u => {
    const diff = u.adjustment;
    console.log('✓ ' + u.username + ': ' + u.previousBalance.toLocaleString() + ' -> ' + u.newBalance.toLocaleString() + ' (' + (diff >= 0 ? '+' : '') + diff.toLocaleString() + ')');
  });

  console.log('\n✅ Fixed ' + r.fixedUsers.length + ' users!');
  console.log('Total adjustment: ' + (r.totalAdjustment >= 0 ? '+' : '') + r.totalAdjustment.toLocaleString() + ' cents');
});
"
```

### Audit History (`/audit history`)

View recent audit runs:

```bash
curl -s "http://localhost:3001/api/admin/audit/history?limit=10" | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const r = JSON.parse(Buffer.concat(chunks).toString());
  if (!r.success) { console.log('Error:', r.message); return; }

  console.log('=== AUDIT HISTORY ===\n');

  if (r.history.length === 0) {
    console.log('No audit history found.');
    return;
  }

  r.history.forEach(h => {
    const date = new Date(h.runAt).toLocaleString();
    const typeIcon = h.auditType === 'fix' ? '🔧' : h.auditType === 'rollback' ? '↩️' : '📋';
    const adjustment = h.totalAdjustmentCents ? ' (' + (h.totalAdjustmentCents >= 0 ? '+' : '') + h.totalAdjustmentCents.toLocaleString() + ' cents)' : '';
    const rolledBack = h.rolledBackAt ? ' [ROLLED BACK]' : '';

    console.log('#' + h.id + ' ' + typeIcon + ' ' + h.auditType.toUpperCase() + ' - ' + date + rolledBack);
    console.log('   Checked: ' + h.totalUsersChecked + ' | Discrepancies: ' + h.discrepanciesFound + ' | Fixed: ' + h.fixesApplied + adjustment);
    console.log('   Source: ' + h.triggeredBy + (h.notes ? ' | ' + h.notes : ''));
    console.log('');
  });
});
"
```

### Rollback (`/audit rollback <id>`)

Rollback a specific fix. Replace `LOGID` with the audit log ID:

```bash
curl -s -X POST "http://localhost:3001/api/admin/audit/rollback/LOGID" \
  -H "Content-Type: application/json" \
  -d '{"source": "cli"}' | node -e "
const chunks = [];
process.stdin.on('data', c => chunks.push(c));
process.stdin.on('end', () => {
  const r = JSON.parse(Buffer.concat(chunks).toString());
  if (!r.success) { console.log('Error:', r.message); return; }

  console.log('=== ROLLBACK COMPLETE ===\n');

  r.rolledBackUsers.forEach(u => {
    console.log('↩️ ' + u.username + ': ' + u.previousBalance.toLocaleString() + ' -> ' + u.newBalance.toLocaleString());
  });

  console.log('\n✅ Rolled back ' + r.rolledBackUsers.length + ' users');
  console.log('Total adjustment: ' + (r.totalRollbackAdjustment >= 0 ? '+' : '') + r.totalRollbackAdjustment.toLocaleString() + ' cents');
  console.log('Rollback log ID: #' + r.rollbackLogId);
});
"
```

## Balance Formula (CENTS)

```
Expected = MAX(0,
  1,000,000 (starting)
  + SUM(claims.amount)
  + SUM(user_missions.reward_paid) WHERE is_claimed
  + SUM(referrals.referrer_reward) WHERE referrer_claimed
  + SUM(referrals.referred_reward) WHERE referred_claimed
  + SUM(corrected_pnl) WHERE status='closed'
  - SUM(position_size) WHERE status='open'
)

corrected_pnl = pnl / leverage for leverage > 1
Discrepancy threshold: >100 cents ($1)
```

## Reference Values (CENTS)

| Item | Cents |
|------|-------|
| Starting Balance | 1,000,000 |
| Daily Claim | 100,000 |
| Referrer Reward | 250,000 |
| Referred Reward | 250,000 |
