# BATTLEFIELD Single Source of Truth (SSOT) Fixes Plan

**Generated:** 2026-01-17
**Overall SSOT Compliance Score:** 3/10
**Estimated Issues:** 60+ violations across 6 categories

---

## Instructions for Claude Code

### Using Multiple Agents

When implementing SSOT fixes, use parallel agents for independent tasks:

```
Example prompt for parallel execution:
"Fix SSOT issues for types, constants, and state management in parallel using multiple agents"
```

### Recommended Approach

1. **Phase 1:** Fix critical database schema issues (blocks everything else)
2. **Phase 2:** Create centralized types folder
3. **Phase 3:** Create constants/config files
4. **Phase 4:** Implement React Context providers
5. **Phase 5:** Remove duplicates and update imports

---

## Critical Priority (P0) - Database Schema Gaps

### Issue #1: Missing `referrer_claimed` Column
**Severity:** CRITICAL | **Impact:** Referral system crashes on fresh install

**Referenced in `backend/server.ts`:**
- Lines 601, 632, 642, 667, 678, 697, 706, 985, 990, 1003, 1065, 1159, 1215 (13+ locations)

**Fix - Create Migration:**
```sql
-- backend/database/migrations/add-referral-claimed-columns.sql
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referrer_claimed BOOLEAN DEFAULT false;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_claimed BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_referrals_claims ON referrals(referrer_claimed, referred_claimed);
```

---

### Issue #2: Missing `reward_paid` Column
**Severity:** CRITICAL | **Impact:** Mission reward tracking broken

**Referenced in `backend/server.ts`:**
- Lines 3504, 3507, 4206, 4209, 4355 (5 locations)

**Fix - Create Migration:**
```sql
-- backend/database/migrations/add-reward-paid-column.sql
ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS reward_paid BIGINT DEFAULT 0;

-- Add index for aggregation queries
CREATE INDEX IF NOT EXISTS idx_user_missions_reward_paid ON user_missions(reward_paid) WHERE reward_paid > 0;
```

---

### Issue #3: Missing `closed_by` Column
**Severity:** HIGH | **Impact:** Trade closure tracking incomplete

**Referenced in `backend/server.ts`:**
- Lines 1795, 1935, 2020, 2439, 4613 (5 locations)

**Fix - Create Migration:**
```sql
-- backend/database/migrations/add-closed-by-column.sql
ALTER TABLE trades ADD COLUMN IF NOT EXISTS closed_by VARCHAR(20);

-- Add check constraint
ALTER TABLE trades ADD CONSTRAINT chk_closed_by
  CHECK (closed_by IS NULL OR closed_by IN ('manual', 'stop_loss', 'liquidation', 'voided'));
```

---

### Issue #4: Migration System Not Running All Files
**Severity:** CRITICAL | **Impact:** Fresh installs have incomplete schema

**Current `setup-db.js` only runs `schema.sql`**

**Fix - Update `backend/setup-db.js`:**
```javascript
const migrations = [
  'schema.sql',
  'referral-schema.sql',
  'missions-schema.sql',
  'add-stop-loss.sql',
  'add-volume-tracking.sql',
  'add-notification-tokens.sql',
  'safe-upgrade-to-200x.sql',
  // New migrations
  'migrations/add-referral-claimed-columns.sql',
  'migrations/add-reward-paid-column.sql',
  'migrations/add-closed-by-column.sql'
];

async function runMigrations() {
  for (const migration of migrations) {
    const filePath = path.join(__dirname, 'database', migration);
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, 'utf8');
      await pool.query(sql);
      console.log(`✓ Applied: ${migration}`);
    }
  }
}
```

---

## High Priority (P1) - Centralized Types

### Issue #5: No Shared Types Folder
**Severity:** HIGH | **Impact:** 6+ duplicate type definitions

**Create folder structure:**
```
app/types/
├── index.ts          # Re-exports all types
├── user.ts           # UserData, UserStats, UserProfile
├── trading.ts        # Trade, Position, ClosedTrade
├── farcaster.ts      # FarcasterUser, FarcasterContext
├── missions.ts       # Mission, UserMission
├── referrals.ts      # ReferralData, Referral
├── leaderboard.ts    # LeaderboardEntry
├── api.ts            # API response wrapper types
└── database.ts       # Database row types (snake_case)
```

---

### Issue #6: Duplicate FarcasterUser Interface
**Severity:** HIGH | **Locations:** `farcaster.ts`, `minikit.ts`

**Create `app/types/farcaster.ts`:**
```typescript
export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
  verifications?: string[];
}

export interface FarcasterContext {
  user: FarcasterUser | null;
  isReady: boolean;
}

// For SDK responses that may have optional fid
export interface FarcasterUserPartial extends Partial<FarcasterUser> {
  fid?: number;
}
```

**Update imports in:**
- `app/lib/farcaster.ts` - Remove interface, import from types
- `app/lib/minikit.ts` - Remove interface, import from types

---

### Issue #7: Duplicate UserData Interface (3 versions)
**Severity:** HIGH | **Locations:** `battlefield/page.tsx`, `UserStats.tsx`, `TradeHistory.tsx`

**Create `app/types/user.ts`:**
```typescript
// Base user from database
export interface UserBase {
  id: number;
  fid: number;
  wallet_address: string;
  username: string;
  pfp_url: string;
  army: 'bears' | 'bulls';
}

// Full user with all stats
export interface UserData extends UserBase {
  paper_balance: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  battle_tokens_earned: number;
  referral_code?: string;
  total_volume?: number;
}

// Subset for stats display
export interface UserStats {
  paper_balance: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  battle_tokens_earned: number;
}

// Minimal user for trade history context
export interface UserContext {
  army: 'bears' | 'bulls';
  username?: string;
  referral_code?: string;
  rank?: number;
}
```

**Update imports in:**
- `app/battlefield/page.tsx:31-46` - Remove interface, import UserData
- `app/components/UserStats.tsx:3-12` - Remove interface, import UserStats
- `app/components/TradeHistory.tsx:34-39` - Remove interface, import UserContext

---

### Issue #8: Duplicate Trade Interface
**Severity:** HIGH | **Locations:** `TradingPanel.tsx`, `TradeHistory.tsx`

**Create `app/types/trading.ts`:**
```typescript
// Base trade fields (shared between open and closed)
export interface TradeBase {
  id: number;
  position_type: 'long' | 'short';
  leverage: number;
  entry_price: number;
  position_size: number;
  stop_loss: number | null;
  opened_at: string;
}

// Open trade (active position)
export interface Trade extends TradeBase {
  liquidation_price: number;
}

// Closed trade (historical)
export interface ClosedTrade extends TradeBase {
  exit_price: number;
  pnl: number;
  status: 'closed' | 'liquidated' | 'voided';
  closed_by: 'manual' | 'stop_loss' | 'liquidation' | 'voided' | null;
  closed_at: string;
}

// Position with calculated P&L (frontend only)
export interface Position extends Trade {
  currentPnl: number;
  currentPnlPercent: number;
}
```

---

### Issue #9: Duplicate Mission Interface
**Severity:** MEDIUM | **Locations:** `Missions.tsx`, `admin/page.tsx`

**Create `app/types/missions.ts`:**
```typescript
// Base mission definition
export interface MissionBase {
  id: number;
  mission_key: string;
  mission_type: 'daily' | 'weekly' | 'onetime';
  title: string;
  description: string;
  objective_type: string;
  objective_value: number;
  reward_amount: number; // in cents
  icon: string;
}

// User-facing mission with progress
export interface Mission extends MissionBase {
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  period_start: string;
  period_end: string;
}

// Admin view of mission
export interface MissionAdmin extends MissionBase {
  is_active: boolean;
  completions_count?: number;
  claims_count?: number;
}
```

---

### Issue #10: Duplicate Alert Interface
**Severity:** MEDIUM | **Locations:** `strategy.ts`, `BattleAlerts.tsx`

**Create `app/types/alerts.ts`:**
```typescript
// System alert (from strategy analysis)
export interface SystemAlert {
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  timestamp: number;
}

// UI alert (for display with icons)
export interface UIAlert {
  id: string;
  icon: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
}
```

---

### Issue #11: Create Types Index
**Create `app/types/index.ts`:**
```typescript
// User types
export type { UserBase, UserData, UserStats, UserContext } from './user';

// Trading types
export type { TradeBase, Trade, ClosedTrade, Position } from './trading';

// Farcaster types
export type { FarcasterUser, FarcasterContext, FarcasterUserPartial } from './farcaster';

// Mission types
export type { MissionBase, Mission, MissionAdmin } from './missions';

// Alert types
export type { SystemAlert, UIAlert } from './alerts';

// Leaderboard types
export type { LeaderboardEntry } from './leaderboard';

// Referral types
export type { ReferralData, Referral } from './referrals';

// API types
export type { ApiResponse, ApiError } from './api';
```

---

## High Priority (P1) - Centralized Constants

### Issue #12: Magic Numbers Everywhere
**Severity:** HIGH | **Impact:** 30+ hardcoded values

**Create `app/constants/config.ts`:**
```typescript
// ============================================
// FINANCIAL VALUES (All amounts in CENTS)
// ============================================

/** Starting balance for new users: $10,000 */
export const STARTING_BALANCE_CENTS = 1000000;

/** Daily claim amount: $10 */
export const DAILY_CLAIM_CENTS = 1000;

/** Referral reward for both parties: $5,000 */
export const REFERRAL_REWARD_CENTS = 500000;

/** Emergency claim threshold: $1 */
export const EMERGENCY_CLAIM_THRESHOLD_CENTS = 100;

// ============================================
// TRADING CONFIGURATION
// ============================================

/** Minimum allowed leverage */
export const MIN_LEVERAGE = 1;

/** Maximum allowed leverage */
export const MAX_LEVERAGE = 200;

/** Fee multiplier per leverage point (0.05% per 1x) */
export const FEE_MULTIPLIER = 0.05;

/** Quick leverage buttons */
export const LEVERAGE_PRESETS = [10, 50, 86, 113, 200];

/** Quick position size buttons (in dollars) */
export const POSITION_SIZE_PRESETS = [1000, 5000, 10000];

// ============================================
// STRATEGY BEAMS (Fibonacci-based)
// ============================================

export const STRATEGY_BEAMS = {
  BEAM_226: 226,
  BEAM_113: 113,
  BEAM_086: 86,
} as const;

export const STRATEGY_ZONES = {
  ACCELERATION_MIN: 900,
  DIP_BUY_MAX: 888,
  DIP_BUY_MIN: 700,
  WEAKNESS_MIN: 300,
} as const;
```

---

### Issue #13: Achievement Thresholds Duplicated
**Severity:** MEDIUM | **Locations:** `useAchievementDetector.ts`, `Achievements.tsx`

**Create `app/constants/achievements.ts`:**
```typescript
// P&L thresholds (in cents)
export const PNL_THRESHOLDS = {
  PROFIT_100: 10000,      // $100
  PROFIT_1000: 100000,    // $1,000
  PROFIT_5000: 500000,    // $5,000
  PROFIT_10000: 1000000,  // $10,000
  PROFIT_50000: 5000000,  // $50,000
  PROFIT_100000: 10000000, // $100,000
} as const;

// Trade count thresholds
export const TRADE_THRESHOLDS = {
  TRADES_10: 10,
  TRADES_50: 50,
  TRADES_100: 100,
  TRADES_500: 500,
  TRADES_1000: 1000,
} as const;

// Win rate thresholds (as percentages)
export const WINRATE_THRESHOLDS = {
  WINRATE_60: 60,
  WINRATE_70: 70,
  WINRATE_80: 80,
} as const;

// Streak thresholds
export const STREAK_THRESHOLDS = {
  STREAK_3: 3,
  STREAK_5: 5,
  STREAK_10: 10,
} as const;

// Combined achievement definitions
export const ACHIEVEMENTS = {
  // Trade milestones
  trader_10: { threshold: TRADE_THRESHOLDS.TRADES_10, type: 'trades' },
  trader_50: { threshold: TRADE_THRESHOLDS.TRADES_50, type: 'trades' },
  trader_100: { threshold: TRADE_THRESHOLDS.TRADES_100, type: 'trades' },
  trader_500: { threshold: TRADE_THRESHOLDS.TRADES_500, type: 'trades' },
  trader_1000: { threshold: TRADE_THRESHOLDS.TRADES_1000, type: 'trades' },

  // P&L milestones
  profit_100: { threshold: PNL_THRESHOLDS.PROFIT_100, type: 'pnl' },
  profit_1000: { threshold: PNL_THRESHOLDS.PROFIT_1000, type: 'pnl' },
  profit_5000: { threshold: PNL_THRESHOLDS.PROFIT_5000, type: 'pnl' },
  profit_10000: { threshold: PNL_THRESHOLDS.PROFIT_10000, type: 'pnl' },
  profit_50000: { threshold: PNL_THRESHOLDS.PROFIT_50000, type: 'pnl' },
  profit_100000: { threshold: PNL_THRESHOLDS.PROFIT_100000, type: 'pnl' },

  // Win rate milestones
  winrate_60: { threshold: WINRATE_THRESHOLDS.WINRATE_60, type: 'winrate' },
  winrate_70: { threshold: WINRATE_THRESHOLDS.WINRATE_70, type: 'winrate' },
  winrate_80: { threshold: WINRATE_THRESHOLDS.WINRATE_80, type: 'winrate' },
} as const;
```

---

### Issue #14: Time Constants Scattered
**Severity:** MEDIUM | **Impact:** Time intervals hardcoded

**Create `app/constants/time.ts`:**
```typescript
// Millisecond constants
export const MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// Application-specific intervals
export const INTERVALS = {
  /** BTC price update interval */
  PRICE_UPDATE: 5 * MS.SECOND,

  /** Open trades refresh interval */
  TRADES_REFRESH: 10 * MS.SECOND,

  /** Leaderboard refresh interval */
  LEADERBOARD_REFRESH: 30 * MS.SECOND,

  /** Trade history refresh interval */
  HISTORY_REFRESH: 30 * MS.SECOND,

  /** Rate limit window for general requests */
  RATE_LIMIT_WINDOW: MS.MINUTE,

  /** FID cache TTL */
  FID_CACHE_TTL: MS.DAY,

  /** Signature verification rate limit */
  VERIFY_RATE_LIMIT: 5 * MS.MINUTE,
} as const;
```

---

### Issue #15: Duplicate API_URL Definition
**Severity:** HIGH | **Locations:** `app/lib/api.ts`, `app/config/api.ts`

**Fix:**
1. Delete `app/config/api.ts` entirely
2. Keep only `app/lib/api.ts` as the single source

```bash
rm app/config/api.ts
```

**Update any imports from `app/config/api.ts` to use `app/lib/api.ts`**

---

### Issue #16: Create Constants Index
**Create `app/constants/index.ts`:**
```typescript
export * from './config';
export * from './achievements';
export * from './time';
```

---

## Medium Priority (P2) - State Management

### Issue #17: No Global User Context
**Severity:** MEDIUM | **Impact:** User data fetched 3+ times independently

**Create `app/context/UserContext.tsx`:**
```typescript
'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '@/lib/api';
import type { UserData } from '@/types';

interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  walletAddress: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { address: wagmiAddress } = useAccount();
  const [farcasterWallet, setFarcasterWallet] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const walletAddress = farcasterWallet || wagmiAddress || null;

  // Resolve Farcaster wallet once
  useEffect(() => {
    const resolveFarcasterWallet = async () => {
      try {
        const { sdk } = await import('@farcaster/frame-sdk');
        const context = await sdk.context;
        if (context?.user?.fid) {
          const response = await fetch(getApiUrl(`api/users/fid/${context.user.fid}`));
          const data = await response.json();
          if (data.success && data.user?.wallet_address) {
            setFarcasterWallet(data.user.wallet_address);
          }
        }
      } catch (e) {
        // Not in Farcaster context
      }
    };
    resolveFarcasterWallet();
  }, []);

  const refetch = useCallback(async () => {
    if (!walletAddress) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl(`api/users/${walletAddress}`));
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError('Failed to fetch user data');
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <UserContext.Provider value={{ userData, isLoading, error, refetch, walletAddress }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
```

---

### Issue #18: No Global Price Context
**Severity:** MEDIUM | **Impact:** Price prop-drilled through many components

**Create `app/context/PriceContext.tsx`:**
```typescript
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useBTCPrice } from '@/hooks/useBTCPrice';

interface PriceContextType {
  btcPrice: number;
  isLoading: boolean;
  error: string | null;
  wholeNumber: number;
  coordinate: number;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export function PriceProvider({ children }: { children: ReactNode }) {
  const { price: btcPrice, isLoading, error } = useBTCPrice();

  const wholeNumber = Math.floor(btcPrice / 1000) * 1000;
  const coordinate = Math.round(btcPrice - wholeNumber);

  return (
    <PriceContext.Provider value={{ btcPrice, isLoading, error, wholeNumber, coordinate }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrice() {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePrice must be used within PriceProvider');
  }
  return context;
}
```

---

### Issue #19: No Global Trade Context
**Severity:** MEDIUM | **Impact:** Trade data fetched independently

**Create `app/context/TradeContext.tsx`:**
```typescript
'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getApiUrl } from '@/lib/api';
import { useUser } from './UserContext';
import type { Trade, ClosedTrade } from '@/types';

interface TradeContextType {
  openTrades: Trade[];
  closedTrades: ClosedTrade[];
  isLoading: boolean;
  refetchOpen: () => Promise<void>;
  refetchClosed: () => Promise<void>;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: ReactNode }) {
  const { walletAddress } = useUser();
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetchOpen = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const response = await fetch(getApiUrl(`api/trades/${walletAddress}/open`));
      const data = await response.json();
      if (data.success) {
        setOpenTrades(data.trades || []);
      }
    } catch (e) {
      console.error('Failed to fetch open trades:', e);
    }
  }, [walletAddress]);

  const refetchClosed = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const response = await fetch(getApiUrl(`api/trades/${walletAddress}/history?limit=50`));
      const data = await response.json();
      if (data.success) {
        setClosedTrades(data.trades || []);
      }
    } catch (e) {
      console.error('Failed to fetch closed trades:', e);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      setIsLoading(true);
      Promise.all([refetchOpen(), refetchClosed()]).finally(() => setIsLoading(false));

      const openInterval = setInterval(refetchOpen, 10000);
      const closedInterval = setInterval(refetchClosed, 30000);

      return () => {
        clearInterval(openInterval);
        clearInterval(closedInterval);
      };
    }
  }, [walletAddress, refetchOpen, refetchClosed]);

  return (
    <TradeContext.Provider value={{ openTrades, closedTrades, isLoading, refetchOpen, refetchClosed }}>
      {children}
    </TradeContext.Provider>
  );
}

export function useTrades() {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrades must be used within TradeProvider');
  }
  return context;
}
```

---

### Issue #20: Update Providers
**Update `app/providers.tsx`:**
```typescript
import { UserProvider } from '@/context/UserContext';
import { PriceProvider } from '@/context/PriceContext';
import { TradeProvider } from '@/context/TradeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider {...}>
          <UserProvider>
            <PriceProvider>
              <TradeProvider>
                {children}
              </TradeProvider>
            </PriceProvider>
          </UserProvider>
          <Toaster />
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

---

## Medium Priority (P2) - Backend Types

### Issue #21: No Backend TypeScript Types
**Severity:** MEDIUM | **Impact:** No type safety in API responses

**Create `backend/types.ts`:**
```typescript
// Database row types (snake_case - matches PostgreSQL)
export interface UserRow {
  id: number;
  fid: number;
  wallet_address: string;
  username: string | null;
  pfp_url: string | null;
  army: 'bears' | 'bulls' | null;
  paper_balance: string; // DECIMAL comes as string
  total_pnl: string;
  total_trades: number;
  winning_trades: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  battle_tokens_earned: string;
  referral_code: string | null;
  referred_by: number | null;
  referral_count: number;
  referral_earnings: string;
  total_volume: string | null;
  last_claim_time: Date | null;
  last_emergency_claim: Date | null;
  created_at: Date;
  last_active: Date;
}

export interface TradeRow {
  id: number;
  user_id: number;
  position_type: 'long' | 'short';
  leverage: number;
  entry_price: string;
  exit_price: string | null;
  position_size: string;
  pnl: string | null;
  liquidation_price: string;
  stop_loss: string | null;
  status: 'open' | 'closed' | 'liquidated' | 'voided';
  closed_by: 'manual' | 'stop_loss' | 'liquidation' | 'voided' | null;
  opened_at: Date;
  closed_at: Date | null;
}

export interface ReferralRow {
  id: number;
  referrer_id: number;
  referred_user_id: number;
  status: 'pending' | 'claimable' | 'completed' | 'cancelled';
  referrer_reward: string;
  referred_reward: string;
  referrer_claimed: boolean;
  referred_claimed: boolean;
  created_at: Date;
  completed_at: Date | null;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UserResponse {
  success: boolean;
  user: UserRow;
}

export interface TradesResponse {
  success: boolean;
  trades: TradeRow[];
}
```

---

### Issue #22: Create Backend Constants
**Create `backend/constants.ts`:**
```typescript
// Financial values (all in CENTS)
export const STARTING_BALANCE_CENTS = 1000000; // $10,000
export const DAILY_CLAIM_CENTS = 1000; // $10
export const REFERRAL_REWARD_CENTS = 500000; // $5,000
export const EMERGENCY_CLAIM_THRESHOLD_CENTS = 100; // $1

// Trading
export const MIN_LEVERAGE = 1;
export const MAX_LEVERAGE = 200;
export const FEE_MULTIPLIER = 0.05;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60 * 1000;
export const GENERAL_RATE_LIMIT = 100;
export const TRADING_RATE_LIMIT = 30;
export const CLAIM_RATE_LIMIT = 10;

// Cache TTL
export const FID_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const VERIFY_RATE_LIMIT_MS = 5 * 60 * 1000;
```

---

## Low Priority (P3) - Naming Convention

### Issue #23: Snake_case to CamelCase Transformation
**Severity:** LOW | **Impact:** Manual conversion scattered

**Create `app/lib/transform.ts`:**
```typescript
// Convert snake_case database rows to camelCase for frontend
export function snakeToCamel<T>(obj: Record<string, any>): T {
  const result: Record<string, any> = {};

  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }

  return result as T;
}

// Convert array of rows
export function transformRows<T>(rows: Record<string, any>[]): T[] {
  return rows.map(row => snakeToCamel<T>(row));
}

// Specific transformers for type safety
export function transformUser(row: UserRow): UserData {
  return {
    id: row.id,
    fid: row.fid,
    walletAddress: row.wallet_address,
    username: row.username || '',
    pfpUrl: row.pfp_url || '',
    army: row.army || 'bulls',
    paperBalance: parseFloat(row.paper_balance),
    totalPnl: parseFloat(row.total_pnl),
    totalTrades: row.total_trades,
    winningTrades: row.winning_trades,
    currentStreak: row.current_streak,
    bestStreak: row.best_streak,
    timesLiquidated: row.times_liquidated,
    battleTokensEarned: parseFloat(row.battle_tokens_earned),
  };
}

export function transformTrade(row: TradeRow): Trade {
  return {
    id: row.id,
    positionType: row.position_type,
    leverage: row.leverage,
    entryPrice: parseFloat(row.entry_price),
    positionSize: parseFloat(row.position_size),
    liquidationPrice: parseFloat(row.liquidation_price),
    stopLoss: row.stop_loss ? parseFloat(row.stop_loss) : null,
    openedAt: row.opened_at.toISOString(),
  };
}
```

---

## Verification Checklist

After implementing fixes, verify:

### Database
- [ ] All 4 missing columns added (`referrer_claimed`, `referred_claimed`, `reward_paid`, `closed_by`)
- [ ] `setup-db.js` runs all migration files
- [ ] Fresh database install works without errors
- [ ] Referral claim system works
- [ ] Mission reward tracking works

### Types
- [ ] `app/types/` folder created with all type files
- [ ] No duplicate interfaces in component files
- [ ] All components import from `@/types`
- [ ] Backend types file created

### Constants
- [ ] `app/constants/` folder created
- [ ] No magic numbers in `server.ts`
- [ ] No magic numbers in components
- [ ] `app/config/api.ts` deleted (duplicate)
- [ ] Achievement thresholds use constants

### State Management
- [ ] `UserContext` created and working
- [ ] `PriceContext` created and working
- [ ] `TradeContext` created and working
- [ ] Providers updated to include new contexts
- [ ] Components updated to use contexts instead of local fetch

---

## Files to Delete (Duplicates)

```bash
# Remove duplicate API config
rm app/config/api.ts

# After migrating types, remove inline definitions from:
# - app/lib/minikit.ts (FarcasterUser, FarcasterContext)
# - app/components/BattleAlerts.tsx (Alert)
# - app/components/UserStats.tsx (UserData)
# - app/components/TradeHistory.tsx (UserData, ClosedTrade)
# - app/battlefield/page.tsx (UserData)
# - app/admin/page.tsx (Mission)
```

---

## Summary

| Category | Issues | Priority | Effort |
|----------|--------|----------|--------|
| Database Schema | 4 | P0 - Critical | Low |
| Types/Interfaces | 7 | P1 - High | Medium |
| Constants | 5 | P1 - High | Low |
| State Management | 4 | P2 - Medium | High |
| Backend Types | 2 | P2 - Medium | Medium |
| Naming Convention | 1 | P3 - Low | Medium |

**Total Issues:** 23
**Estimated Files to Create:** 15
**Estimated Files to Modify:** 20+
**Estimated Files to Delete:** 1
