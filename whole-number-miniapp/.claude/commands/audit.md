# Balance Audit Tool

Audit and manage user balances for BATTLEFIELD via the API.

## Core Concept

The audit separates **Trading** from **Rewards**:
- **Trading Ledger**: Starting balance + Closed PnL (must be exact for fairplay)
- **Rewards Ledger**: Claims + Missions + Referrals (tracked separately)
- **Trading Discrepancy**: If user has more/less than trading allows → fairplay issue

## Commands

- `/audit` - Quick summary of trading discrepancies
- `/audit full` - Full audit with all details
- `/audit user <name>` - Detailed breakdown for a specific user
- `/audit fix` - Dry run preview of fixes
- `/audit fix --apply` - Apply all balance fixes
- `/audit fix user <id>` - Fix a specific user by ID
- `/audit history` - View recent audit runs
- `/audit rollback <id>` - Rollback a previous fix

Based on user input, run ONE of these:

### Quick Summary (default: `/audit`)

```bash
curl -s "http://localhost:3001/api/admin/audit?source=cli" | python3 -c "
import json, sys
r = json.load(sys.stdin)
s = r['summary']
print('=== TRADING AUDIT ===')
print(f'Total Users: {s[\"totalUsers\"]}')
print(f'With Discrepancy: {s[\"usersWithDiscrepancy\"]}')
print(f'Total Excess: +\${s[\"totalExcess\"]/100:,.2f} (possible exploits)')
print(f'Total Deficit: -\${s[\"totalDeficit\"]/100:,.2f} (possible bugs)')
print()
print('✅ All correct!' if s['usersWithDiscrepancy'] == 0 else '⚠️  Run: /audit full')
"
```

### Full Audit (`/audit full`)

```bash
curl -s "http://localhost:3001/api/admin/audit?source=cli" | python3 -c "
import json, sys
r = json.load(sys.stdin)
if not r['success']: print('Error:', r.get('message')); sys.exit(1)

excess = [d for d in r['discrepancies'] if d['tradingDiscrepancy'] > 0]
deficit = [d for d in r['discrepancies'] if d['tradingDiscrepancy'] < 0]

print('=== EXCESS (fairplay concern) ===')
for d in excess[:20]:
    pos = 'OPEN' if d['hasOpenPositions'] else ''
    print(f'{d[\"username\"]}: +\${d[\"tradingDiscrepancy\"]/100:,.2f} | PnL:\${d[\"closedPnl\"]/100:,.2f} Rewards:\${d[\"totalRewards\"]/100:,.2f} {pos}')

print(f'\n=== DEFICIT (possible bugs) ===')
for d in deficit[:20]:
    pos = 'OPEN' if d['hasOpenPositions'] else ''
    print(f'{d[\"username\"]}: \${d[\"tradingDiscrepancy\"]/100:,.2f} | PnL:\${d[\"closedPnl\"]/100:,.2f} Rewards:\${d[\"totalRewards\"]/100:,.2f} {pos}')

print(f'\n--- Summary ---')
print(f'Excess: +\${r[\"summary\"][\"totalExcess\"]/100:,.2f} ({len(excess)} users)')
print(f'Deficit: -\${r[\"summary\"][\"totalDeficit\"]/100:,.2f} ({len(deficit)} users)')
"
```

### User Lookup (`/audit user <name>`)

Replace `USERNAME` with the target user:

```bash
curl -s "http://localhost:3001/api/admin/audit/user/USERNAME" | python3 -c "
import json, sys
r = json.load(sys.stdin)
if not r['success']: print('Error:', r.get('message')); sys.exit(1)

u = r['user']
t = r['trading']
rw = r['rewards']

print(f'=== {u[\"username\"]} (ID: {u[\"id\"]}) ===')
print()
print('CURRENT STATE:')
print(f'  Paper Balance:   \${u[\"paperBalance\"]/100:>12,.2f}')
print(f'  Open Collateral: \${u[\"openCollateral\"]/100:>12,.2f}')
print(f'  Total Assets:    \${u[\"totalAssets\"]/100:>12,.2f}')
print()
print('TRADING LEDGER:')
print(f'  Starting:        \${t[\"startingBalance\"]/100:>12,.2f}')
print(f'  Closed PnL:      \${t[\"closedPnl\"]/100:>+12,.2f}')
print(f'  Expected:        \${t[\"expectedFromTrading\"]/100:>12,.2f}')
print(f'  Trading Assets:  \${t[\"tradingAssets\"]/100:>12,.2f}')
print(f'  DISCREPANCY:     \${t[\"tradingDiscrepancy\"]/100:>+12,.2f}')
print()
print('REWARDS LEDGER:')
print(f'  Claims:          \${rw[\"claims\"]/100:>12,.2f}')
print(f'  Missions:        \${rw[\"missions\"]/100:>12,.2f}')
print(f'  Referrals:       \${(rw[\"referralsGiven\"]+rw[\"referralsReceived\"])/100:>12,.2f}')
print(f'  Total Rewards:   \${rw[\"totalRewards\"]/100:>12,.2f}')
print()
status = '✅ CORRECT' if u['isCorrect'] else f'⚠️ DISCREPANCY: \${u[\"tradingDiscrepancy\"]/100:+,.2f}'
print(status)
"
```

### Fix Dry Run (`/audit fix`)

```bash
curl -s -X POST "http://localhost:3001/api/admin/audit/fix" \
  -H "Content-Type: application/json" \
  -d '{"fixAll": true, "dryRun": true, "source": "cli"}' | python3 -c "
import json, sys
r = json.load(sys.stdin)
if not r['success']: print('Error:', r.get('message')); sys.exit(1)

print('=== DRY RUN - NO CHANGES ===\n')
if not r['fixedUsers']:
    print('✅ No discrepancies to fix!')
    sys.exit(0)

print(f'Would fix {len(r[\"fixedUsers\"])} users:\n')
for u in r['fixedUsers']:
    print(f'{u[\"username\"]}: \${u[\"previousBalance\"]/100:,.2f} -> \${u[\"newBalance\"]/100:,.2f} ({u[\"adjustment\"]/100:+,.2f})')

print(f'\nTotal adjustment: \${r[\"totalAdjustment\"]/100:+,.2f}')
print('\n⚠️ To apply: /audit fix --apply')
"
```

### Fix Apply (`/audit fix --apply`)

```bash
curl -s -X POST "http://localhost:3001/api/admin/audit/fix" \
  -H "Content-Type: application/json" \
  -d '{"fixAll": true, "dryRun": false, "source": "cli"}' | python3 -c "
import json, sys
r = json.load(sys.stdin)
if not r['success']: print('Error:', r.get('message')); sys.exit(1)

print('=== FIXES APPLIED ===\n')
if not r['fixedUsers']:
    print('✅ No discrepancies to fix!')
    sys.exit(0)

for u in r['fixedUsers']:
    print(f'✓ {u[\"username\"]}: \${u[\"previousBalance\"]/100:,.2f} -> \${u[\"newBalance\"]/100:,.2f} ({u[\"adjustment\"]/100:+,.2f})')

print(f'\n✅ Fixed {len(r[\"fixedUsers\"])} users!')
print(f'Total adjustment: \${r[\"totalAdjustment\"]/100:+,.2f}')
"
```

### Fix Specific User (`/audit fix user <id>`)

Replace `USERID` with the user's numeric ID:

```bash
curl -s -X POST "http://localhost:3001/api/admin/audit/fix" \
  -H "Content-Type: application/json" \
  -d '{"userIds": [USERID], "dryRun": false, "source": "cli"}' | python3 -c "
import json, sys
r = json.load(sys.stdin)
if not r['success']: print('Error:', r.get('message')); sys.exit(1)

if not r['fixedUsers']:
    print('✅ No discrepancy for this user!')
    sys.exit(0)

u = r['fixedUsers'][0]
print(f'=== FIXED: {u[\"username\"]} ===')
print(f'Previous: \${u[\"previousBalance\"]/100:,.2f}')
print(f'New:      \${u[\"newBalance\"]/100:,.2f}')
print(f'Change:   \${u[\"adjustment\"]/100:+,.2f}')
print('\n✅ Balance corrected!')
"
```

### Audit History (`/audit history`)

```bash
curl -s "http://localhost:3001/api/admin/audit/history?limit=10" | python3 -c "
import json, sys
from datetime import datetime
r = json.load(sys.stdin)
if not r['success']: print('Error'); sys.exit(1)

print('=== AUDIT HISTORY ===\n')
for h in r['history']:
    icon = '🔧' if h['auditType'] == 'fix' else '↩️' if h['auditType'] == 'rollback' else '📋'
    adj = f' ({h[\"totalAdjustmentCents\"]/100:+,.2f})' if h.get('totalAdjustmentCents') else ''
    rb = ' [ROLLED BACK]' if h.get('rolledBackAt') else ''
    print(f'#{h[\"id\"]} {icon} {h[\"auditType\"].upper()} - {h[\"runAt\"]}{rb}')
    print(f'   Checked:{h[\"totalUsersChecked\"]} Disc:{h[\"discrepanciesFound\"]} Fixed:{h[\"fixesApplied\"]}{adj}')
    print()
"
```

### Rollback (`/audit rollback <id>`)

Replace `LOGID` with the audit log ID:

```bash
curl -s -X POST "http://localhost:3001/api/admin/audit/rollback/LOGID" \
  -H "Content-Type: application/json" \
  -d '{"source": "cli"}' | python3 -c "
import json, sys
r = json.load(sys.stdin)
if not r['success']: print('Error:', r.get('message')); sys.exit(1)

print('=== ROLLBACK COMPLETE ===\n')
for u in r['rolledBackUsers']:
    print(f'↩️ {u[\"username\"]}: \${u[\"previousBalance\"]/100:,.2f} -> \${u[\"newBalance\"]/100:,.2f}')

print(f'\n✅ Rolled back {len(r[\"rolledBackUsers\"])} users')
print(f'Rollback log ID: #{r[\"rollbackLogId\"]}')
"
```

## Formula

```
TRADING LEDGER (must be exact for fairplay):
  Expected from Trading = Starting (1M) + Closed PnL

REWARDS LEDGER (tracked separately):
  Total Rewards = Claims + Missions + Referrals

CURRENT STATE:
  Total Assets = paper_balance + open_collateral

TRADING DISCREPANCY:
  = (Total Assets - Total Rewards) - Expected from Trading
  = Trading Assets - Expected from Trading

  Positive = User has MORE than trading allows (possible exploit)
  Negative = User has LESS than trading allows (possible bug)
```

## How Fixes Work

The fix sets `paper_balance` so that:
```
paper_balance + open_collateral = Expected from Trading + Total Rewards
paper_balance = Expected Total - open_collateral
```

This only adjusts paper_balance, never touches trade records.

## Reference Values

| Item | Cents | Dollars |
|------|-------|---------|
| Starting Balance | 1,000,000 | $10,000 |
| Daily Claim | 100,000 | $1,000 |
| Referrer Reward | 500,000 | $5,000 |
| Referred Reward | 500,000 | $5,000 |
