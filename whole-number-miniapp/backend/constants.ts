// Backend Constants
// Single Source of Truth for all backend configuration values

// ============================================
// FINANCIAL VALUES (All amounts in CENTS)
// ============================================

/** Starting balance for new users: $10,000 */
export const STARTING_BALANCE_CENTS = 1000000;

/** Daily claim amount: $1,000 */
export const DAILY_CLAIM_CENTS = 100000;

/** Referral reward for both parties: $5,000 */
export const REFERRAL_REWARD_CENTS = 500000;

/** Emergency claim threshold: $100 (user must be below this to claim) */
export const EMERGENCY_CLAIM_THRESHOLD_CENTS = 10000;

/** Emergency claim amount: $1,000 */
export const EMERGENCY_CLAIM_AMOUNT_CENTS = 100000;

/** Minimum position size: $1 */
export const MIN_POSITION_SIZE_CENTS = 100;

/** Maximum position size percentage of balance */
export const MAX_POSITION_SIZE_PERCENT = 100;

// ============================================
// TRADING CONFIGURATION
// ============================================

/** Minimum allowed leverage */
export const MIN_LEVERAGE = 1;

/** Maximum allowed leverage */
export const MAX_LEVERAGE = 200;

/** Fee multiplier per leverage point (0.05% per 1x leverage) */
export const FEE_MULTIPLIER = 0.05;

/** Maximum open positions per user */
export const MAX_OPEN_POSITIONS = 10;

/** Liquidation threshold (100% loss) */
export const LIQUIDATION_THRESHOLD = -100;

/** Price staleness threshold in milliseconds (30 seconds) */
export const PRICE_STALENESS_MS = 30000;

// ============================================
// RATE LIMITING
// ============================================

/** Rate limit window in milliseconds */
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/** General API rate limit (requests per window) */
export const GENERAL_RATE_LIMIT = 100;

/** Trading rate limit (requests per window) */
export const TRADING_RATE_LIMIT = 30;

/** Claim rate limit (requests per window) */
export const CLAIM_RATE_LIMIT = 10;

/** Admin rate limit (requests per window) */
export const ADMIN_RATE_LIMIT = 50;

// ============================================
// CACHE TTL (Time To Live)
// ============================================

/** FID to wallet cache TTL: 24 hours */
export const FID_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Leaderboard cache TTL: 30 seconds */
export const LEADERBOARD_CACHE_TTL_MS = 30 * 1000;

/** Army stats cache TTL: 60 seconds */
export const ARMY_STATS_CACHE_TTL_MS = 60 * 1000;

/** Price cache TTL: 5 seconds */
export const PRICE_CACHE_TTL_MS = 5 * 1000;

// ============================================
// TIME CONSTANTS
// ============================================

/** Milliseconds in one second */
export const MS_SECOND = 1000;

/** Milliseconds in one minute */
export const MS_MINUTE = 60 * 1000;

/** Milliseconds in one hour */
export const MS_HOUR = 60 * 60 * 1000;

/** Milliseconds in one day */
export const MS_DAY = 24 * 60 * 60 * 1000;

/** Milliseconds in one week */
export const MS_WEEK = 7 * 24 * 60 * 60 * 1000;

/** Daily claim cooldown: 24 hours */
export const DAILY_CLAIM_COOLDOWN_MS = MS_DAY;

/** Emergency claim cooldown: 1 hour */
export const EMERGENCY_CLAIM_COOLDOWN_MS = MS_HOUR;

/** Signature verification rate limit: 5 minutes */
export const VERIFY_RATE_LIMIT_MS = 5 * MS_MINUTE;

// ============================================
// MISSION CONFIGURATION
// ============================================

/** Mission types */
export const MISSION_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  ONETIME: 'onetime',
} as const;

/** Mission objective types */
export const OBJECTIVE_TYPES = {
  TRADES: 'trades',
  VOLUME: 'volume',
  PNL: 'pnl',
  WINS: 'wins',
  STREAK: 'streak',
  REFERRALS: 'referrals',
  CAST: 'cast',
  CUSTOM: 'custom',
} as const;

// ============================================
// REFERRAL CONFIGURATION
// ============================================

/** Referral code length */
export const REFERRAL_CODE_LENGTH = 8;

/** Minimum trades to complete referral */
export const REFERRAL_MIN_TRADES = 1;

/** Referral statuses */
export const REFERRAL_STATUS = {
  PENDING: 'pending',
  CLAIMABLE: 'claimable',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

// ============================================
// LEADERBOARD CONFIGURATION
// ============================================

/** Default leaderboard limit */
export const DEFAULT_LEADERBOARD_LIMIT = 100;

/** Maximum leaderboard limit */
export const MAX_LEADERBOARD_LIMIT = 500;

/** Minimum trades to appear on leaderboard */
export const LEADERBOARD_MIN_TRADES = 1;

// ============================================
// VALIDATION
// ============================================

/** Wallet address regex (Ethereum) */
export const WALLET_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

/** Username max length */
export const USERNAME_MAX_LENGTH = 50;

/** Username min length */
export const USERNAME_MIN_LENGTH = 1;

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  INVALID_WALLET: 'Invalid wallet address',
  USER_NOT_FOUND: 'User not found',
  TRADE_NOT_FOUND: 'Trade not found',
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  MAX_POSITIONS_REACHED: 'Maximum open positions reached',
  INVALID_LEVERAGE: `Leverage must be between ${MIN_LEVERAGE} and ${MAX_LEVERAGE}`,
  INVALID_POSITION_SIZE: 'Invalid position size',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  ALREADY_CLAIMED: 'Already claimed today',
  NOT_ELIGIBLE: 'Not eligible for this claim',
  INVALID_REFERRAL: 'Invalid referral code',
  SELF_REFERRAL: 'Cannot refer yourself',
  ALREADY_REFERRED: 'Already referred by someone',
  TRADE_ALREADY_CLOSED: 'Trade is already closed',
  INVALID_STOP_LOSS: 'Invalid stop loss price',
  PRICE_STALE: 'Price data is stale. Please refresh.',
} as const;

// ============================================
// SUCCESS MESSAGES
// ============================================

export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  TRADE_OPENED: 'Trade opened successfully',
  TRADE_CLOSED: 'Trade closed successfully',
  CLAIM_SUCCESS: 'Claim successful',
  REFERRAL_APPLIED: 'Referral code applied',
  STOP_LOSS_UPDATED: 'Stop loss updated',
  COLLATERAL_ADDED: 'Collateral added successfully',
} as const;
