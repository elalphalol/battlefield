// Configuration constants - Single Source of Truth

// ============================================
// FINANCIAL VALUES (All amounts in CENTS)
// ============================================

/** Starting balance for new users: $10,000 */
export const STARTING_BALANCE_CENTS = 1000000;

/** Daily claim amount: $1,000 */
export const DAILY_CLAIM_CENTS = 100000;

/** Referral reward for both parties: $5,000 */
export const REFERRAL_REWARD_CENTS = 500000;

/** Emergency claim threshold: $100 */
export const EMERGENCY_CLAIM_THRESHOLD_CENTS = 10000;

/** Minimum position size in dollars */
export const MIN_POSITION_SIZE_DOLLARS = 100;

/** Maximum position size in dollars */
export const MAX_POSITION_SIZE_DOLLARS = 100000;

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
export const LEVERAGE_PRESETS = [10, 50, 86, 113, 200] as const;

/** Quick position size buttons (in dollars) */
export const POSITION_SIZE_PRESETS = [1000, 5000, 10000] as const;

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

// ============================================
// DISPLAY CONSTANTS
// ============================================

/** Default number of trades to show in history */
export const DEFAULT_TRADE_HISTORY_LIMIT = 50;

/** Number of leaderboard entries per page */
export const LEADERBOARD_PAGE_SIZE = 100;

/** Maximum username length */
export const MAX_USERNAME_LENGTH = 20;
