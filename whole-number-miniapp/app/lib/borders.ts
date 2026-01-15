// Avatar Border System - Auto-unlock based on winning trades

export type BorderTier = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface BorderInfo {
  tier: BorderTier;
  name: string;
  emoji: string;
  classes: string;
  requirement: string;
}

/**
 * Calculate border tier based on winning trades only
 * Requirements:
 * - None: < 25 winning trades
 * - Bronze: 25+ winning trades
 * - Silver: 125+ winning trades
 * - Gold: 450+ winning trades
 * - Platinum: 750+ winning trades
 * - Diamond: 1500+ winning trades
 */
export function getBorderTier(winningTrades: number): BorderTier {
  if (winningTrades >= 1500) return 'diamond';
  if (winningTrades >= 750) return 'platinum';
  if (winningTrades >= 450) return 'gold';
  if (winningTrades >= 125) return 'silver';
  if (winningTrades >= 25) return 'bronze';
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
    none: '25 wins to unlock Bronze',
    bronze: '125 wins for Silver',
    silver: '450 wins for Gold',
    gold: '750 wins for Platinum',
    platinum: '1500 wins for Diamond',
    diamond: null, // Max tier
  };
  return requirements[tier];
}

/**
 * Get complete border info object
 */
export function getBorderInfo(winningTrades: number): BorderInfo {
  const tier = getBorderTier(winningTrades);
  return {
    tier,
    name: getBorderName(tier),
    emoji: getBorderEmoji(tier),
    classes: getBorderClasses(tier),
    requirement: getNextTierRequirement(tier) || 'Max tier reached!',
  };
}
