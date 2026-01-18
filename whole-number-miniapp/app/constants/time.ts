// Time constants - Single Source of Truth

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
  /** BTC price update interval (2s for fluid UX) */
  PRICE_UPDATE: 2 * MS.SECOND,

  /** Open trades refresh interval */
  TRADES_REFRESH: 10 * MS.SECOND,

  /** Leaderboard refresh interval */
  LEADERBOARD_REFRESH: 30 * MS.SECOND,

  /** Trade history refresh interval */
  HISTORY_REFRESH: 30 * MS.SECOND,

  /** User data refresh interval */
  USER_REFRESH: 30 * MS.SECOND,

  /** Army stats refresh interval */
  ARMY_STATS_REFRESH: 30 * MS.SECOND,

  /** Rate limit window for general requests */
  RATE_LIMIT_WINDOW: MS.MINUTE,

  /** FID cache TTL */
  FID_CACHE_TTL: MS.DAY,

  /** Signature verification rate limit */
  VERIFY_RATE_LIMIT: 5 * MS.MINUTE,
} as const;

// Claim cooldowns
export const COOLDOWNS = {
  /** Daily claim cooldown (24 hours) */
  DAILY_CLAIM: MS.DAY,

  /** Emergency claim cooldown (1 hour) */
  EMERGENCY_CLAIM: MS.HOUR,

  /** Referral claim cooldown */
  REFERRAL_CLAIM: MS.MINUTE,
} as const;
