// Achievement constants - Single Source of Truth

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

// Volume thresholds (in cents)
export const VOLUME_THRESHOLDS = {
  VOLUME_100K: 10000000,    // $100,000
  VOLUME_500K: 50000000,    // $500,000
  VOLUME_1M: 100000000,     // $1,000,000
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

  // Streak milestones
  streak_3: { threshold: STREAK_THRESHOLDS.STREAK_3, type: 'streak' },
  streak_5: { threshold: STREAK_THRESHOLDS.STREAK_5, type: 'streak' },
  streak_10: { threshold: STREAK_THRESHOLDS.STREAK_10, type: 'streak' },
} as const;
