# BATTLEFIELD Balance Audit Report
**Date:** January 16, 2026
**Conducted by:** System Administrator

## Executive Summary

A comprehensive balance audit was performed on all user accounts. The audit identified discrepancies between expected and actual balances for several users. These discrepancies were caused by a race condition bug in the trade opening logic that has now been fixed.

## Bug Description

### Root Cause
A race condition existed in the trade opening endpoint (`/api/trades/open`) where the balance check occurred **before** the database transaction began. This allowed multiple simultaneous requests to pass the balance check before any of them actually deducted the balance.

### Technical Details
- Balance was checked at line 1029 OUTSIDE the transaction
- Transaction began at line 1053
- Balance deduction happened at line 1056-1059 INSIDE transaction
- Multiple concurrent requests could all pass the balance check before any deduction occurred

### Fix Applied
- Moved transaction BEGIN to before the balance check
- Added `FOR UPDATE` row lock when selecting user balance
- Balance check now happens inside the transaction with the row locked
- This prevents any race conditions where multiple trades could exceed available balance

---

## Users with Balance Discrepancies

### Category A: Users Who Had LESS Than Expected (FIXED)

These users were missing money due to various issues and have been corrected:

| User ID | Username | Previous Balance | Corrected Balance | Amount Added |
|---------|----------|------------------|-------------------|--------------|
| 1 | elalpha.eth | $16,747.45 | $34,050.45 | +$17,303.00 |
| 8 | Traderd9F192 | $39,107.44 | $40,357.44 | +$1,250.00 |
| 56 | mrpeptobism | $18,863.98 | $23,363.98 | +$4,500.00 |

**Status:** RESOLVED - Balances have been corrected.

---

### Category B: Users Who Have MORE Than Expected (Pending Manual Resolution)

These users were able to open positions larger than their available balance due to the race condition bug. They currently have more total assets (balance + open positions) than they should.

#### User: yossshuaa (ID: 63)

| Metric | Value |
|--------|-------|
| Current Available Balance | $38,178.29 |
| Open Position Collateral | $59,882.00 |
| **Total Assets** | **$98,060.29** |
| Maximum Expected Assets | $65,724.14 |
| **Excess Amount** | **$32,336.15** |

**Open Positions:**
| Trade ID | Position Type | Collateral | Leverage | Opened At |
|----------|---------------|------------|----------|-----------|
| 372 | LONG | $32,359.00 | 128x | 2026-01-16 02:23:54 |
| 383 | LONG | $3,285.00 | 100x | 2026-01-16 04:10:15 |
| 384 | LONG | $6,241.00 | 113x | 2026-01-16 04:10:23 |
| 385 | LONG | $4,494.00 | 130x | 2026-01-16 04:10:27 |
| 386 | LONG | $5,684.00 | 120x | 2026-01-16 04:10:34 |
| 390 | LONG | $7,819.00 | 100x | 2026-01-16 05:01:15 |

**Action Required:** Please close all open positions. Once closed, balance will be automatically corrected to reflect actual earnings.

Note: you don't have to close them all right now, but when you do please confirm us so we can apply the fix

---

#### User: bonledok (ID: 74)

| Metric | Value |
|--------|-------|
| Current Available Balance | $0.30 |
| Open Position Collateral | $34,724.00 |
| **Total Assets** | **$34,724.30** |
| Maximum Expected Assets | $18,491.86 |
| **Excess Amount** | **$16,232.44** |

**Open Positions:**
| Trade ID | Position Type | Collateral | Leverage | Opened At |
|----------|---------------|------------|----------|-----------|
| 354 | SHORT | $34,724.00 | (unknown) | 2026-01-15 19:33:11 |

**Timeline Analysis:**
- At 19:33:11, user had approximately $18,817.07 available
- Opened position requiring $34,724.00 (exceeded balance by $15,906.93)
- This was caused by the race condition bug

**Action Required:** Please close all open positions. Once closed, balance will be automatically corrected.

Note: you don't have to close them all right now, but when you do please confirm us so we can apply the fix

---

#### User: aliselalujp (ID: 77)

| Metric | Value |
|--------|-------|
| Current Available Balance | ~$613.00 |
| Open Position Collateral | $39,406.00 |
| **Total Assets** | **$40,019.00** |
| Maximum Expected Assets | $30,406.59 |
| **Excess Amount** | **$9,612.41** |

**Action Required:** Please close all open positions. Once closed, balance will be automatically corrected.

Note: you don't have to close them all right now, but when you do please confirm us so we can apply the fix

---

#### User: jessicaliem (ID: 80)

| Metric | Value |
|--------|-------|
| Current Available Balance | $0.98 |
| Open Position Collateral | $21,755.00 |
| **Total Assets** | **$21,755.98** |
| Maximum Expected Assets | $21,255.98 |
| **Excess Amount** | **$500.00** |

**Action Required:** Please close all open positions. Once closed, balance will be automatically corrected.

Note: you don't have to close them all right now, but when you do please confirm us so we can apply the fix

---

## Resolution Process

### For Users in Category B:

1. **Contact:** Admin will reach out to each affected user
2. **Explanation:** Users will be informed about the bug and its impact
3. **Action:** Users should close their open positions manually
4. **Correction:** Once positions are closed, the daily audit will automatically correct the balance to reflect actual resources (starting balance + claims + missions + referrals + PnL)

### What This Means for Affected Users:

- **Your trading profits/losses are REAL** - Any P&L you earned through legitimate trading is yours to keep
- **Your mission rewards are REAL** - All claimed missions count
- **Your referral bonuses are REAL** - All completed referrals count
- **Only the excess from the bug will be corrected** - You will keep everything you legitimately earned

### Example Calculation:

For a user with:
- Starting balance: $10,000
- Claims: $1,000
- Mission rewards: $5,000
- Referral rewards: $0
- Net P&L (after all trades): $3,000

**Correct Balance = $10,000 + $1,000 + $5,000 + $0 + $3,000 = $19,000**

---

## Automated Audit System

An automated balance audit system has been implemented in the admin panel:

### Features:
1. **Daily Audit:** Runs automatically to check all user balances
2. **Discrepancy Detection:** Identifies any users with balance mismatches
3. **Automatic Correction:** For users WITHOUT open positions, balances are auto-corrected
4. **Report Generation:** Creates detailed reports of any discrepancies found
5. **Manual Audit:** Admins can run audits on-demand from the admin panel

### Formula Used:
```
Expected Balance = Starting ($10,000)
                 + Total Claims
                 + Mission Rewards (claimed)
                 + Referral Rewards (completed)
                 + Net P&L (from closed/liquidated trades)
                 - Open Position Collateral
```

---

## Prevention Measures

The following measures have been implemented to prevent future occurrences:

1. **Transaction-level locking:** Balance checks now occur inside database transactions with row-level locks (`FOR UPDATE`)
2. **Atomic operations:** Balance check and deduction are now atomic
3. **Automated audits:** Daily balance verification with automatic correction
4. **Admin monitoring:** Real-time audit dashboard in admin panel

---

## Contact

If you have questions about this audit or your account balance, please contact the admin team.

**Report Generated:** 2026-01-16
**Audit Version:** 1.0
