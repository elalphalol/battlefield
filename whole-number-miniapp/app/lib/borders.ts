// Avatar Border System - Auto-unlock based on player stats

export type BorderTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface BorderInfo {
  tier: BorderTier;
  name: string;
  emoji: string;
  classes: string;
  requirement: string;
}

/**
 * Calculate border tier based on total trades and win rate
 * Requirements:
 * - None: < 10 trades
 * - Bronze: 10+ trades (any win rate)
 * - Silver: 25+ trades, 40%+ win rate
 * - Gold: 50+ trades, 50%+ win rate
 * - Platinum: 100+ trades, 60%+ win rate
 * - Diamond: 200+ trades, 70%+ win rate
 */
export function getBorderTier(totalTrades: number, winRate: number): BorderTier {
  if (totalTrades >= 200 && winRate >= 70) return 'diamond';
  if (totalTrades >= 100 && winRate >= 60) return 'platinum';
  if (totalTrades >= 50 && winRate >= 50) return 'gold';
  if (totalTrades >= 25 && winRate >= 40) return 'silver';
  if (totalTrades >= 10) return 'bronze';
  return 'none';
}

/**
 * Get Tailwind CSS classes for border styling
 */
export function getBorderClasses(tier: BorderTier): string {
  const borders: Record<BorderTier, string> = {
    none: 'border-slate-600',
    bronze: 'border-amber-600',
    silver: 'border-gray-300',
    gold: 'border-yellow-400',
    platinum: 'border-cyan-300 shadow-[0_0_15px_rgba(103,232,249,0.5)]',
    diamond: 'border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.6)]',
  };
  return borders[tier];
}

/**
 * Get display name for border tier
 */
export function getBorderName(tier: BorderTier): string {
  const names: Record<BorderTier, string> = {
    none: '',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond',
  };
  return names[tier];
}

/**
 * Get emoji for border tier
 */
export function getBorderEmoji(tier: BorderTier): string {
  const emojis: Record<BorderTier, string> = {
    none: '',
    bronze: '🔶',
    silver: '⬡',
    gold: '⭐',
    platinum: '✦',
    diamond: '💎',
  };
  return emojis[tier];
}

/**
 * Get requirement text for next tier
 */
export function getNextTierRequirement(tier: BorderTier): string | null {
  const requirements: Record<BorderTier, string | null> = {
    none: '10 trades to unlock Bronze',
    bronze: '25 trades + 40% win rate for Silver',
    silver: '50 trades + 50% win rate for Gold',
    gold: '100 trades + 60% win rate for Platinum',
    platinum: '200 trades + 70% win rate for Diamond',
    diamond: null, // Max tier
  };
  return requirements[tier];
}

/**
 * Get complete border info object
 */
export function getBorderInfo(totalTrades: number, winRate: number): BorderInfo {
  const tier = getBorderTier(totalTrades, winRate);
  return {
    tier,
    name: getBorderName(tier),
    emoji: getBorderEmoji(tier),
    classes: getBorderClasses(tier),
    requirement: getNextTierRequirement(tier) || 'Max tier reached!',
  };
}
