# BATTLEFIELD Security Fixes Implementation Plan

**Generated:** 2026-01-17
**Status:** Ready for Implementation
**Estimated Issues:** 47 identified vulnerabilities and bugs

---

## Instructions for Claude Code

### Using Multiple Agents

When implementing these fixes, use parallel agents for independent tasks:

```
Example prompt for parallel execution:
"Fix issues #1, #2, and #3 in parallel using multiple agents"
```

Claude Code will automatically spawn multiple Task agents to work concurrently on:
- Independent file changes
- Non-conflicting database migrations
- Separate frontend/backend fixes

### Creating Hooks

After implementing security fixes, create verification hooks in `.claude/hooks/`:

```bash
mkdir -p .claude/hooks
```

**Recommended hooks to create:**
1. `pre-commit-security.sh` - Scan for hardcoded secrets, SQL injection patterns
2. `post-deploy-verify.sh` - Run security tests after deployment
3. `admin-endpoint-check.sh` - Verify all admin endpoints have auth middleware

### Creating Skills

Create custom skills in `.claude/skills/` for recurring security tasks:

```yaml
# .claude/skills/security-audit.yaml
name: security-audit
description: Run comprehensive security audit on codebase
commands:
  - grep for SQL injection patterns
  - check admin endpoint protection
  - verify input validation
  - scan for race conditions
```

---

## Critical Priority (P0) - Immediate Action Required

### Issue #1: Unprotected Admin Endpoints
**Severity:** CRITICAL | **Effort:** Low | **File:** `backend/server.ts`

**Description:** 12 admin endpoints lack authentication middleware, allowing any user to:
- View all user data and balances
- Modify user balances
- Reset user accounts
- Change mission configurations

**Affected Lines:**
- Line 1175: `GET /api/admin/referrals`
- Line 1239: `POST /api/admin/referrals/revert`
- Line 3874: `GET /api/admin/analytics`
- Line 4171: `GET /api/admin/audit`
- Line 4308: `GET /api/admin/audit/user/:identifier`
- Line 4392: `GET /api/admin/users`
- Line 4440: `POST /api/admin/users/balance`
- Line 4462: `POST /api/admin/users/reset`
- Line 4500: `GET /api/admin/missions`
- Line 4528: `POST /api/admin/missions/update`
- Line 4556: `POST /api/admin/missions/toggle`
- Line 4578: `GET /api/admin/activity`

**Fix:**
```typescript
// Add adminAuth middleware to each endpoint
app.get('/api/admin/referrals', adminAuth, async (req, res) => { ... });
app.post('/api/admin/referrals/revert', adminAuth, async (req, res) => { ... });
// ... repeat for all 12 endpoints
```

**Verification:**
```bash
curl -X GET https://btcbattlefield.com/api/admin/users
# Should return 401 Unauthorized, not user data
```

---

### Issue #2: No Wallet Signature Verification
**Severity:** CRITICAL | **Effort:** High | **File:** `backend/server.ts`

**Description:** All mutating endpoints accept `walletAddress` from request body without cryptographic proof. Anyone knowing a wallet address can:
- Open/close trades as that user
- Claim rewards
- Apply referral codes

**Affected Endpoints:**
- `POST /api/trades/open` (line 1497)
- `POST /api/trades/close` (line 1686)
- `POST /api/trades/add-collateral` (line 2063)
- `POST /api/trades/update-stop-loss` (line 2172)
- `POST /api/claims` (line 1399)
- `POST /api/referrals/apply` (line 752)
- `POST /api/referrals/claim` (line 912)

**Fix - Option A (Signature Verification):**
```typescript
import { verifyMessage } from 'viem';

// Add signature verification middleware
const verifyWalletSignature = async (req: Request, res: Response, next: NextFunction) => {
  const { walletAddress, signature, message, timestamp } = req.body;

  // Check timestamp is within 5 minutes
  if (Date.now() - timestamp > 5 * 60 * 1000) {
    return res.status(401).json({ success: false, message: 'Signature expired' });
  }

  const expectedMessage = `Battlefield Action: ${timestamp}`;
  const isValid = await verifyMessage({
    address: walletAddress,
    message: expectedMessage,
    signature
  });

  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid signature' });
  }

  next();
};

// Apply to all mutating endpoints
app.post('/api/trades/open', verifyWalletSignature, tradingLimiter, async (req, res) => { ... });
```

**Fix - Option B (Session-Based Auth via Farcaster):**
```typescript
// Use Farcaster auth frame to establish session
// Store session token in httpOnly cookie
// Verify session on each request
```

---

### Issue #3: Double-Claim Race Condition - Paper Money
**Severity:** CRITICAL | **Effort:** Medium | **File:** `backend/server.ts:1399-1490`

**Description:** Non-atomic read-then-update pattern allows concurrent requests to both claim $1,000.

**Current Vulnerable Code:**
```typescript
// Line 1408-1410: Read (no lock)
const user = await pool.query('SELECT ... FROM users WHERE wallet_address = $1', [walletAddress]);

// Line 1426: Check (outside transaction)
const claimedToday = lastClaim && lastClaim >= todayUTC;

// Line 1457: Update (inside transaction but no row lock)
await pool.query('BEGIN');
await pool.query('UPDATE users SET paper_balance = paper_balance + 1000 ...');
await pool.query('COMMIT');
```

**Fix:**
```typescript
app.post('/api/claims', claimLimiter, checkMaintenance, async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  try {
    // Start transaction and lock row FIRST
    await pool.query('BEGIN');

    const user = await pool.query(
      'SELECT id, last_claim_time, paper_balance FROM users WHERE LOWER(wallet_address) = LOWER($1) FOR UPDATE',
      [walletAddress]
    );

    if (user.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const lastClaim = user.rows[0].last_claim_time;
    const todayUTC = new Date();
    todayUTC.setUTCHours(0, 0, 0, 0);

    const claimedToday = lastClaim && new Date(lastClaim) >= todayUTC;

    if (claimedToday) {
      await pool.query('ROLLBACK');
      return res.status(429).json({ success: false, message: 'Already claimed today' });
    }

    // Now safe to update
    await pool.query(
      'UPDATE users SET paper_balance = paper_balance + $1, last_claim_time = NOW() WHERE id = $2',
      [DAILY_CLAIM_AMOUNT, user.rows[0].id]
    );

    await pool.query('COMMIT');
    // ... rest of response
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
});
```

---

### Issue #4: Double-Claim Race Condition - Referral Rewards
**Severity:** CRITICAL | **Effort:** Medium | **File:** `backend/server.ts:912-1111`

**Description:** Referral claim lacks atomic transaction. Both referrer and referred can trigger double payouts via concurrent requests.

**Current Vulnerable Code:**
```typescript
// Line 975-985: Update claimed flag (no transaction)
await pool.query('UPDATE referrals SET referrer_claimed = true WHERE id = $1', [referralId]);

// Line 988-991: Re-fetch (race window)
const updatedReferral = await pool.query('SELECT ... FROM referrals WHERE id = $1', [referralId]);

// Line 995-1016: Pay both users (separate queries, no transaction)
if (ref.referrer_claimed && ref.referred_claimed) {
  await pool.query('UPDATE users SET paper_balance = paper_balance + $1 WHERE id = $2', [...]);
  await pool.query('UPDATE users SET paper_balance = paper_balance + $1 WHERE id = $2', [...]);
  await pool.query('UPDATE referrals SET status = \'completed\' WHERE id = $1', [referralId]);
}
```

**Fix:**
```typescript
app.post('/api/referrals/claim', checkMaintenance, async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  try {
    await pool.query('BEGIN');

    // Lock referral row and user rows
    const referral = await pool.query(
      `SELECT r.*, u.id as claimer_id
       FROM referrals r
       JOIN users u ON LOWER(u.wallet_address) = LOWER($1)
       WHERE (r.referrer_id = u.id OR r.referred_user_id = u.id)
       AND r.status = 'claimable'
       FOR UPDATE OF r`,
      [walletAddress]
    );

    if (referral.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'No claimable referral found' });
    }

    const r = referral.rows[0];
    const isReferrer = r.claimer_id === r.referrer_id;

    // Update claim flag
    const claimColumn = isReferrer ? 'referrer_claimed' : 'referred_claimed';
    await pool.query(
      `UPDATE referrals SET ${claimColumn} = true WHERE id = $1`,
      [r.id]
    );

    // Check if both claimed (within same transaction)
    const bothClaimed = (isReferrer && r.referred_claimed) || (!isReferrer && r.referrer_claimed);

    if (bothClaimed || (isReferrer ? r.referred_claimed : r.referrer_claimed)) {
      // Pay both users atomically
      await pool.query(
        'UPDATE users SET paper_balance = paper_balance + $1, referral_count = referral_count + 1, referral_earnings = referral_earnings + $2 WHERE id = $3',
        [r.referrer_reward, r.referrer_reward, r.referrer_id]
      );

      await pool.query(
        'UPDATE users SET paper_balance = paper_balance + $1 WHERE id = $2',
        [r.referred_reward, r.referred_user_id]
      );

      await pool.query(
        'UPDATE referrals SET status = \'completed\', completed_at = NOW() WHERE id = $1',
        [r.id]
      );
    }

    await pool.query('COMMIT');
    // ... rest of response
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
});
```

---

### Issue #5: Division by Zero Vulnerability
**Severity:** CRITICAL | **Effort:** Low | **File:** `backend/server.ts:1729,1897,1982`

**Description:** If `entryPrice` is 0, division causes NaN which corrupts P&L calculations and database.

**Current Vulnerable Code:**
```typescript
// Line 1729
const priceChangePercentage = priceChange / entryPrice;  // NaN if entryPrice === 0
```

**Fix:**
```typescript
// Add validation at trade open (line ~1500)
if (!entryPrice || entryPrice <= 0) {
  return res.status(400).json({ success: false, message: 'Entry price must be greater than 0' });
}

// Add defensive check at trade close (line ~1729)
if (entryPrice === 0) {
  await pool.query('ROLLBACK');
  return res.status(500).json({ success: false, message: 'Invalid trade data: entry price is zero' });
}

const priceChangePercentage = priceChange / entryPrice;

// Also add isNaN check after calculation
if (isNaN(priceChangePercentage) || !isFinite(priceChangePercentage)) {
  await pool.query('ROLLBACK');
  return res.status(500).json({ success: false, message: 'Invalid price calculation' });
}
```

---

### Issue #6: No Farcaster FID Validation
**Severity:** CRITICAL | **Effort:** Medium | **File:** `backend/server.ts:497-535`

**Description:** Users can claim any Farcaster FID without proof of ownership, enabling impersonation and referral fraud.

**Current Vulnerable Code:**
```typescript
app.post('/api/users/update-farcaster', async (req: Request, res: Response) => {
  const { walletAddress, fid, username, pfpUrl } = req.body;
  // NO VERIFICATION - directly updates
  await pool.query('UPDATE users SET fid = $1 ... WHERE wallet_address = $4', [fid, ...]);
});
```

**Fix (using Neynar API):**
```typescript
import axios from 'axios';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

const verifyFarcasterOwnership = async (fid: number, walletAddress: string): Promise<boolean> => {
  try {
    const response = await axios.get(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      { headers: { 'api_key': NEYNAR_API_KEY } }
    );

    const user = response.data.users[0];
    if (!user) return false;

    // Check if wallet is verified for this FID
    const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
    return verifiedAddresses.some(
      (addr: string) => addr.toLowerCase() === walletAddress.toLowerCase()
    );
  } catch (error) {
    console.error('Neynar verification failed:', error);
    return false;
  }
};

app.post('/api/users/update-farcaster', async (req: Request, res: Response) => {
  const { walletAddress, fid, username, pfpUrl } = req.body;

  // Verify FID ownership
  const isOwner = await verifyFarcasterOwnership(fid, walletAddress);
  if (!isOwner) {
    return res.status(403).json({
      success: false,
      message: 'Wallet address not verified for this Farcaster account'
    });
  }

  // Now safe to update
  await pool.query('UPDATE users SET fid = $1 ... WHERE wallet_address = $4', [fid, ...]);
});
```

---

## High Priority (P1) - This Week

### Issue #7: Add Collateral Race Condition
**Severity:** HIGH | **Effort:** Medium | **File:** `backend/server.ts:2063-2169`

**Description:** Trade row is locked but user balance is not, causing collateral/balance mismatch with concurrent requests.

**Fix:**
```typescript
// Lock both trade AND user rows
await pool.query('BEGIN');

const trade = await pool.query(
  'SELECT t.*, u.paper_balance, u.id as uid FROM trades t JOIN users u ON t.user_id = u.id WHERE t.id = $1 AND t.status = $2 FOR UPDATE OF t, u',
  [tradeId, 'open']
);

// Now both rows are locked, safe to proceed
```

---

### Issue #8: Multiple Referral Applications
**Severity:** HIGH | **Effort:** Low | **File:** `backend/server.ts:752-910`

**Description:** Race condition allows user to apply multiple referral codes simultaneously.

**Fix:**
```typescript
// Use INSERT ... ON CONFLICT with explicit transaction
await pool.query('BEGIN');

const result = await pool.query(
  `INSERT INTO referrals (referrer_id, referred_user_id, status, referrer_reward, referred_reward)
   VALUES ($1, $2, 'pending', $3, $3)
   ON CONFLICT (referred_user_id) DO NOTHING
   RETURNING id`,
  [referrer.id, user.id, REFERRAL_REWARD_CENTS]
);

if (result.rows.length === 0) {
  await pool.query('ROLLBACK');
  return res.status(400).json({ success: false, message: 'Referral already exists' });
}

await pool.query('UPDATE users SET referred_by = $1 WHERE id = $2', [referrer.id, user.id]);
await pool.query('COMMIT');
```

---

### Issue #9: Emergency Claim Bypass
**Severity:** HIGH | **Effort:** Medium | **File:** `backend/server.ts:1399-1490`

**Description:** Users can claim multiple times per day by strategically losing trades to trigger "emergency claim".

**Fix:**
```typescript
// Track emergency claims separately
// Add column: ALTER TABLE users ADD COLUMN last_emergency_claim TIMESTAMP;

// In claim endpoint:
const emergencyClaimedToday = user.rows[0].last_emergency_claim &&
  new Date(user.rows[0].last_emergency_claim) >= todayUTC;

if (emergencyClaim && emergencyClaimedToday) {
  return res.status(429).json({
    success: false,
    message: 'Emergency claim already used today'
  });
}

// Update appropriate timestamp based on claim type
const timestampColumn = emergencyClaim ? 'last_emergency_claim' : 'last_claim_time';
```

---

### Issue #10: Missing Rate Limiting
**Severity:** HIGH | **Effort:** Low | **File:** `backend/server.ts`

**Description:** Sensitive endpoints lack rate limiting.

**Fix:**
```typescript
// Add rate limiters
const referralLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many referral requests' }
});

const profileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many profile requests' }
});

// Apply to endpoints
app.post('/api/referrals/apply', referralLimiter, checkMaintenance, async (req, res) => { ... });
app.post('/api/referrals/claim', referralLimiter, checkMaintenance, async (req, res) => { ... });
app.get('/api/profile/:identifier', profileLimiter, async (req, res) => { ... });
app.get('/api/users/:walletAddress', profileLimiter, async (req, res) => { ... });
```

---

### Issue #11: Negative Number Acceptance
**Severity:** HIGH | **Effort:** Low | **File:** `backend/server.ts:1498-1600`

**Description:** No validation that `size`, `entryPrice`, `exitPrice` are positive.

**Fix:**
```typescript
// Create validation helper
const isValidPositiveNumber = (val: any): val is number => {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val > 0;
};

// Apply in trade open endpoint
app.post('/api/trades/open', tradingLimiter, checkMaintenance, async (req, res) => {
  const { walletAddress, type, leverage, size, entryPrice, stopLoss } = req.body;

  if (!isValidPositiveNumber(leverage) || leverage < 1 || leverage > 200) {
    return res.status(400).json({ success: false, message: 'Invalid leverage (1-200)' });
  }

  if (!isValidPositiveNumber(size)) {
    return res.status(400).json({ success: false, message: 'Invalid position size' });
  }

  if (!isValidPositiveNumber(entryPrice)) {
    return res.status(400).json({ success: false, message: 'Invalid entry price' });
  }

  if (stopLoss !== undefined && stopLoss !== null && !isValidPositiveNumber(stopLoss)) {
    return res.status(400).json({ success: false, message: 'Invalid stop loss' });
  }

  // ... rest of endpoint
});
```

---

### Issue #12: Missing Numeric Type Validation
**Severity:** HIGH | **Effort:** Low | **File:** `backend/server.ts:1498-1514`

**Description:** No type checking - accepts strings, NaN, Infinity.

**Fix:** Same as Issue #11 - use `isValidPositiveNumber` helper.

---

## Medium Priority (P2) - Next Sprint

### Issue #13: SQL Injection via Dynamic WHERE
**Severity:** MEDIUM | **Effort:** Low | **File:** `backend/server.ts:4409,4420,4422`

**Fix:** Already uses parameterized queries but pattern is fragile. Refactor to build query more safely.

---

### Issue #14: Unrestricted Profile Access
**Severity:** MEDIUM | **Effort:** Medium | **File:** `backend/server.ts:2285-2434`

**Description:** All user trades and positions visible to anyone.

**Fix:**
```typescript
app.get('/api/profile/:identifier', async (req, res) => {
  const { identifier } = req.params;
  const { requesterWallet } = req.query;

  // Check if requester is the profile owner
  const isOwner = requesterWallet &&
    requesterWallet.toLowerCase() === user.wallet_address.toLowerCase();

  // Return limited data for non-owners
  const profile = {
    user: {
      fid: user.fid,
      username: user.username,
      army: user.army,
      // Only show wallet to owner
      wallet_address: isOwner ? user.wallet_address : undefined,
      referral_code: isOwner ? user.referral_code : undefined,
    },
    stats: { /* public stats ok */ },
    // Only show positions to owner
    openPositions: isOwner ? openPositions : [],
    recentHistory: isOwner ? recentHistory : [],
  };
});
```

---

### Issue #15: Missing Foreign Key CASCADE
**Severity:** MEDIUM | **Effort:** Low | **File:** `backend/database/referral-schema.sql:6`

**Fix:**
```sql
-- Migration file
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_referred_by_fkey;
ALTER TABLE users ADD CONSTRAINT users_referred_by_fkey
  FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL;
```

---

### Issue #16: Army Stats Trigger Full Table Scans
**Severity:** MEDIUM | **Effort:** Medium | **File:** `backend/database/schema.sql:220-247`

**Fix:** Replace trigger with scheduled job or use incremental counters.

---

### Issue #17: Frontend Stale Closure
**Severity:** MEDIUM | **Effort:** Medium | **File:** `app/hooks/usePaperTrading.ts:66-103`

**Fix:**
```typescript
const closePosition = useCallback((positionId: number) => {
  // Use functional update to get latest positions
  setPositions(prevPositions => {
    const position = prevPositions.find(p => p.id === positionId);
    if (!position) return prevPositions;
    // ... close logic using position from prevPositions
    return prevPositions.filter(p => p.id !== positionId);
  });
}, []); // Remove positions from deps since using functional update
```

---

### Issue #18: Price Staleness in Trade Execution
**Severity:** MEDIUM | **Effort:** High | **File:** `app/components/TradingPanel.tsx:174-194`

**Fix:** Backend should fetch current price instead of trusting frontend-provided price, or implement price tolerance check.

---

## Low Priority (P3) - Backlog

### Issue #19-25: Database Schema Improvements
- Add NOT NULL constraints to `user_missions`
- Add CHECK constraint to `referrals.status`
- Create composite indexes for performance
- Add error handling to triggers

### Issue #26-30: Frontend Improvements
- Memoize callback functions properly
- Add error rollback for optimistic updates
- Fix collateral modal race condition
- Add proper error handling for API calls

### Issue #31-35: Code Quality
- Add Sentry error logging to all catch blocks
- Reduce sensitive info in error messages
- Add request signing/HMAC verification
- Document all cascade delete relationships

---

## Database Migrations

Create these migration files in `backend/database/migrations/`:

### Migration 001: Add Emergency Claim Tracking
```sql
-- 001_add_emergency_claim.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_emergency_claim TIMESTAMP;
```

### Migration 002: Add Schema Constraints
```sql
-- 002_add_constraints.sql
ALTER TABLE user_missions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_missions ALTER COLUMN mission_id SET NOT NULL;

ALTER TABLE referrals ADD CONSTRAINT IF NOT EXISTS chk_referral_status
  CHECK (status IN ('pending', 'claimable', 'completed', 'cancelled'));
```

### Migration 003: Add Performance Indexes
```sql
-- 003_add_indexes.sql
CREATE INDEX IF NOT EXISTS idx_trades_open_liquidation
  ON trades(status, liquidation_price) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_user_missions_composite
  ON user_missions(user_id, mission_id);
```

---

## Verification Checklist

After implementing fixes, verify:

- [ ] All 12 admin endpoints return 401 without auth
- [ ] Concurrent claim requests don't double-pay
- [ ] Concurrent referral claims don't double-pay
- [ ] Negative position sizes are rejected
- [ ] Zero entry prices are rejected
- [ ] Rate limiters are active on sensitive endpoints
- [ ] FID updates require Neynar verification
- [ ] Database constraints are applied
- [ ] No console errors in frontend
- [ ] All trades execute correctly

---

## Testing Commands

```bash
# Test admin endpoint protection
curl -X GET https://btcbattlefield.com/api/admin/users
# Expected: 401 Unauthorized

# Test rate limiting
for i in {1..20}; do curl -X POST https://btcbattlefield.com/api/referrals/apply; done
# Expected: 429 after 5 requests

# Test input validation
curl -X POST https://btcbattlefield.com/api/trades/open \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x123","type":"long","leverage":-5,"size":-100,"entryPrice":0}'
# Expected: 400 Bad Request
```

---

## Hooks to Create

### `.claude/hooks/security-check.sh`
```bash
#!/bin/bash
# Pre-commit security check

# Check for unprotected admin endpoints
grep -n "app\.\(get\|post\|put\|delete\)('/api/admin" backend/server.ts | grep -v "adminAuth" && {
  echo "ERROR: Unprotected admin endpoint found!"
  exit 1
}

# Check for raw SQL interpolation
grep -n '\${.*}' backend/server.ts | grep -i "select\|insert\|update\|delete" && {
  echo "WARNING: Potential SQL injection pattern found"
}

echo "Security check passed"
```

### `.claude/hooks/validate-migrations.sh`
```bash
#!/bin/bash
# Validate database migrations before apply

for file in backend/database/migrations/*.sql; do
  # Check for DROP TABLE without IF EXISTS
  grep -n "DROP TABLE" "$file" | grep -v "IF EXISTS" && {
    echo "ERROR: Unsafe DROP TABLE in $file"
    exit 1
  }
done

echo "Migration validation passed"
```

---

## Skills to Create

### `.claude/skills/fix-security.yaml`
```yaml
name: fix-security
description: Apply security fixes from SECURITY-FIXES-PLAN.md
steps:
  - read SECURITY-FIXES-PLAN.md
  - identify unfixed critical issues
  - apply fixes using multiple agents for independent changes
  - run verification tests
  - update checklist
```

### `.claude/skills/audit-endpoints.yaml`
```yaml
name: audit-endpoints
description: Audit all API endpoints for security issues
steps:
  - list all endpoints in backend/server.ts
  - check each for auth middleware
  - check each for rate limiting
  - check each for input validation
  - report findings
```
