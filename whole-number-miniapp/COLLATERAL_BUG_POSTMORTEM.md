# Collateral Bug Postmortem

**Date Discovered:** January 2025
**Date Fixed:** January 2025
**Severity:** Critical
**Affected Users:** 48 users with leveraged trades

## Summary

A critical bug in the trade opening logic caused incorrect P&L calculations for all trades with leverage > 1. The bug allowed users to gain (or lose) money at an inflated rate proportional to their leverage setting.

## Technical Details

### The Bug

In `backend/server.ts`, when opening a trade:

```typescript
// BUGGY CODE (before fix)
const collateral = size / leverage;  // Deducted from balance
// But stored full `size` as position_size in database
await client.query(
  'INSERT INTO trades ... VALUES (..., $5, ...)',  // $5 = size (not collateral!)
  [userId, direction, entryPrice, leverage, size, ...]
);
```

**Problem:** The code deducted `size / leverage` from the user's balance (correct), but stored the full `size` as `position_size` in the database (incorrect).

### Impact on P&L Calculation

When closing a trade, P&L was calculated using `position_size`:

```typescript
const pnl = priceChangePercentage * position_size;
```

Since `position_size` was the full size (not collateral), users experienced:
- **Gains/losses multiplied by leverage factor**
- A user putting in $100 collateral with 10x leverage had P&L calculated on $1000 instead of the correct leveraged position

### Example

User opens a trade:
- Sends: `size = 1000`, `leverage = 10`
- Balance deducted: `1000 / 10 = $100` (collateral)
- Database stores: `position_size = 1000`

Price moves +5%:
- **Buggy P&L:** `0.05 × 1000 = $50` (incorrect - based on stored position_size)
- **Correct P&L:** `0.05 × 100 × 10 = $50` (looks same, but...)

The issue becomes clear when looking at the actual values:
- Collateral risked: $100
- Leveraged exposure: $100 × 10 = $1000
- P&L should be capped at -$100 (max loss = collateral)

But with the bug, if price drops 20%:
- **Buggy P&L:** `0.20 × 1000 = -$200` (double the collateral!)
- **Correct P&L:** `-$100` (capped at collateral)

## The Fix

### Code Fix

```typescript
// FIXED CODE
const collateral = size;  // Frontend now sends collateral directly
await client.query(
  'INSERT INTO trades ... VALUES (..., $5, ...)',
  [userId, direction, entryPrice, leverage, collateral, ...]  // Store actual collateral
);
```

### Corrected P&L Formula

For trades opened with the bug (where `position_size` was inflated):

```
True P&L = recorded_pnl / leverage
```

For new trades (after fix):
```
P&L = priceChangePercentage × collateral × leverage
```

### User Balance Correction

The correct balance formula:

```sql
Expected Balance = $10,000 (starting)
                 + Claims
                 + Mission Rewards (reward_paid where is_claimed = true)
                 + Referral Rewards (claimed)
                 + Corrected Total P&L
                 - Open Collateral

Where Corrected Total P&L = SUM(
  CASE
    WHEN leverage > 1 THEN pnl / leverage  -- Bug-affected trades
    ELSE pnl                                -- Non-leveraged trades
  END
) for all closed trades
```

## Affected Users

- **Total affected:** 48 users
- **Users credited:** 41 users (+$518,766.34 total)
- **Users debited:** 7 users (-$104,580.28 total)
- **Net adjustment:** +$414,186.06

Most users were CREDITED money because they had negative P&L that was inflated by the bug (they lost more than they should have).

## Lessons Learned

1. **Consistent data storage:** Always store exactly what you deduct from balance
2. **Frontend/Backend contract:** Be explicit about what values frontend sends (collateral vs full position size)
3. **P&L caps:** Always cap losses at collateral amount - users can't lose more than they put in
4. **Audit regularly:** The audit tool should verify balances match expected calculations

## Audit Tool Update

The audit tool at `.claude/commands/audit.md` has been updated to use the corrected P&L formula when checking balances. It now calculates:

```sql
-- For closed trades, use corrected P&L
SELECT SUM(CASE WHEN leverage > 1 THEN pnl / leverage ELSE pnl END) as corrected_pnl
FROM trades WHERE status = 'closed'
```

## Related Files

- `backend/server.ts` - Main fix location (line ~1554)
- `.claude/commands/audit.md` - Updated audit tool
- Database tables: `users`, `trades`

---

# Additional Data Fixes (January 2026)

## Mission Rewards Bug

**Issue:** Mission `reward_paid` values were stored divided by 100 (e.g., $5 instead of $500).

**Root Cause:** Incorrect conversion when storing reward values.

**Fix Applied:** Updated 120 `user_missions` records, multiplying `reward_paid` by 100.

**Affected Records:**
- 120 mission reward records across 26 users
- Total correction: +$153,150.00

**Correct Mission Reward Values (in cents):**
| Mission | Correct Value |
|---------|---------------|
| Open a Trade | 20000 ($200) |
| Win a Trade | 50000 ($500) |
| Cast a Trade | 50000 ($500) |
| Two Faces | 35000 ($350) |
| Follow Us! | 500000 ($5,000) |
| Win 5 Trades | 200000 ($2,000) |
| Trading Streak | 250000 ($2,500) |
| Claim Streak | 150000 ($1,500) |
| The Betrayer | 150000 ($1,500) |
| Army Loyalty | 1000000 ($10,000) |

## Claims Bug

**Issue:** Daily claim amounts were stored as 1000 cents ($10) instead of 100000 cents ($1,000).

**Fix Applied:** Updated 19 claim records from 1000 to 100000 cents.

**Affected Records:**
- 19 claim records across 7 users
- Total correction: +$18,810.00

**Correct Claim Value:** 100000 cents ($1,000) per daily claim
