'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNotificationManager } from './useNotificationManager';

interface UserStats {
  total_trades: number;
  total_pnl: number;
  winning_trades: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  rank: number | null;
}

interface AchievementCheck {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  points: number;
  checkUnlock: (stats: UserStats) => boolean;
  priority: 'high' | 'medium';
}

// Define key achievements that trigger modal notifications
const MODAL_ACHIEVEMENTS: AchievementCheck[] = [
  // First trade - important milestone
  {
    id: 'first_trade',
    name: 'First Blood',
    description: 'Completed your first trade',
    icon: '⚔️',
    rarity: 'common',
    points: 5,
    priority: 'high',
    checkUnlock: (stats) => stats.total_trades >= 1,
  },
  // Major trading milestones
  {
    id: 'trader_100',
    name: 'Veteran Trader',
    description: 'Completed 100 trades',
    icon: '🏅',
    rarity: 'uncommon',
    points: 10,
    priority: 'medium',
    checkUnlock: (stats) => stats.total_trades >= 100,
  },
  {
    id: 'trader_500',
    name: 'Elite Trader',
    description: 'Completed 500 trades',
    icon: '👑',
    rarity: 'rare',
    points: 25,
    priority: 'medium',
    checkUnlock: (stats) => stats.total_trades >= 500,
  },
  {
    id: 'trader_1000',
    name: 'Master Trader',
    description: 'Completed 1,000 trades',
    icon: '🌟',
    rarity: 'rare',
    points: 25,
    priority: 'high',
    checkUnlock: (stats) => stats.total_trades >= 1000,
  },
  // Profit milestones
  {
    id: 'profit_1000',
    name: 'Profitable Trader',
    description: 'Reached $1,000 total P&L',
    icon: '💎',
    rarity: 'uncommon',
    points: 10,
    priority: 'high',
    checkUnlock: (stats) => stats.total_pnl >= 1000,
  },
  {
    id: 'profit_10000',
    name: 'To The Moon',
    description: 'Reached $10,000 total P&L',
    icon: '🚀',
    rarity: 'rare',
    points: 25,
    priority: 'high',
    checkUnlock: (stats) => stats.total_pnl >= 10000,
  },
  {
    id: 'profit_50000',
    name: 'Whale Status',
    description: 'Reached $50,000 total P&L',
    icon: '🐋',
    rarity: 'epic',
    points: 50,
    priority: 'high',
    checkUnlock: (stats) => stats.total_pnl >= 50000,
  },
  {
    id: 'profit_100000',
    name: 'Legendary Profit',
    description: 'Reached $100,000 total P&L',
    icon: '🏆',
    rarity: 'legendary',
    points: 100,
    priority: 'high',
    checkUnlock: (stats) => stats.total_pnl >= 100000,
  },
  // Win rate achievements
  {
    id: 'winrate_70',
    name: 'Sharpshooter',
    description: 'Maintained 70%+ win rate (min 100 trades)',
    icon: '🎯',
    rarity: 'epic',
    points: 50,
    priority: 'high',
    checkUnlock: (stats) => stats.win_rate >= 70 && stats.total_trades >= 100,
  },
  {
    id: 'winrate_80',
    name: 'Elite Precision',
    description: 'Maintained 80%+ win rate (min 200 trades)',
    icon: '💫',
    rarity: 'epic',
    points: 50,
    priority: 'high',
    checkUnlock: (stats) => stats.win_rate >= 80 && stats.total_trades >= 200,
  },
  // Streak achievements
  {
    id: 'streak_10',
    name: 'Unstoppable',
    description: 'Achieved a 10-win streak',
    icon: '💥',
    rarity: 'uncommon',
    points: 10,
    priority: 'medium',
    checkUnlock: (stats) => stats.best_streak >= 10,
  },
  {
    id: 'streak_20',
    name: 'Lightning',
    description: 'Achieved a 20-win streak',
    icon: '⚡',
    rarity: 'rare',
    points: 25,
    priority: 'high',
    checkUnlock: (stats) => stats.best_streak >= 20,
  },
  {
    id: 'streak_50',
    name: 'Legendary Streak',
    description: 'Achieved a 50-win streak',
    icon: '🌪️',
    rarity: 'epic',
    points: 50,
    priority: 'high',
    checkUnlock: (stats) => stats.best_streak >= 50,
  },
  // Rank achievements
  {
    id: 'rank_top100',
    name: 'Top 100',
    description: 'Reached Top 100 on the leaderboard',
    icon: '🏅',
    rarity: 'rare',
    points: 25,
    priority: 'high',
    checkUnlock: (stats) => (stats.rank ?? 999) <= 100 && (stats.rank ?? 0) > 0,
  },
  {
    id: 'rank_top50',
    name: 'Top 50',
    description: 'Reached Top 50 on the leaderboard',
    icon: '🌟',
    rarity: 'epic',
    points: 50,
    priority: 'high',
    checkUnlock: (stats) => (stats.rank ?? 999) <= 50 && (stats.rank ?? 0) > 0,
  },
  {
    id: 'rank_top10',
    name: 'Top 10 Elite',
    description: 'Reached Top 10 on the leaderboard',
    icon: '⭐',
    rarity: 'legendary',
    points: 100,
    priority: 'high',
    checkUnlock: (stats) => (stats.rank ?? 999) <= 10 && (stats.rank ?? 0) > 0,
  },
  {
    id: 'rank_top3',
    name: 'Legendary Conqueror',
    description: 'Reached Top 3 on the leaderboard',
    icon: '🏆',
    rarity: 'legendary',
    points: 100,
    priority: 'high',
    checkUnlock: (stats) => (stats.rank ?? 999) <= 3 && (stats.rank ?? 0) > 0,
  },
  {
    id: 'rank_1',
    name: 'Battlefield Champion',
    description: 'Reached #1 on the leaderboard',
    icon: '👑',
    rarity: 'mythic',
    points: 200,
    priority: 'high',
    checkUnlock: (stats) => stats.rank === 1,
  },
  // Survival achievements
  {
    id: 'no_liq_100',
    name: 'Fortress',
    description: 'Completed 100 trades without liquidation',
    icon: '🏰',
    rarity: 'epic',
    points: 50,
    priority: 'high',
    checkUnlock: (stats) => stats.total_trades >= 100 && stats.times_liquidated === 0,
  },
  {
    id: 'no_liq_500',
    name: 'Diamond Hands',
    description: 'Completed 500 trades without liquidation',
    icon: '💎',
    rarity: 'legendary',
    points: 100,
    priority: 'high',
    checkUnlock: (stats) => stats.total_trades >= 500 && stats.times_liquidated === 0,
  },
  // Special achievements
  {
    id: 'perfect_trader',
    name: 'Perfect Score',
    description: 'Maintained 100% win rate with 10+ trades',
    icon: '💯',
    rarity: 'legendary',
    points: 100,
    priority: 'high',
    checkUnlock: (stats) => stats.win_rate === 100 && stats.total_trades >= 10,
  },
];

export function useAchievementDetector(userStats: UserStats | null, previousStats: UserStats | null) {
  const { notify } = useNotificationManager();

  useEffect(() => {
    if (!userStats || !previousStats) return;

    // Check all achievements
    MODAL_ACHIEVEMENTS.forEach(achievement => {
      const wasUnlocked = achievement.checkUnlock(previousStats);
      const isNowUnlocked = achievement.checkUnlock(userStats);

      // Newly unlocked!
      if (!wasUnlocked && isNowUnlocked) {
        // Check if already shown (prevent duplicates)
        const shownKey = `achievement_shown_${achievement.id}`;
        if (typeof window !== 'undefined' && localStorage.getItem(shownKey)) {
          return;
        }

        // Mark as shown
        if (typeof window !== 'undefined') {
          localStorage.setItem(shownKey, 'true');
        }

        // Show notification modal
        notify({
          id: achievement.id,
          type: 'achievement',
          priority: achievement.priority,
          displayStyle: 'modal',
          data: {
            title: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            rarity: achievement.rarity,
            points: achievement.points,
          },
        });
      }
    });

    // Check rank changes
    if (previousStats.rank && userStats.rank) {
      // Rank improved (entered top 10/50/100)
      if (previousStats.rank > 10 && userStats.rank <= 10) {
        // Check if not already shown
        const shownKey = 'rank_change_top_10';
        if (typeof window !== 'undefined' && !localStorage.getItem(shownKey)) {
          localStorage.setItem(shownKey, 'true');

          notify({
            id: shownKey,
            type: 'rank',
            priority: 'high',
            displayStyle: 'modal',
            data: {
              title: '🎊 TOP 10 REACHED! 🎊',
              description: `You're now rank #${userStats.rank}! You're among the elite traders!`,
              icon: '🏆',
              rarity: 'epic',
            },
          });
        }
      } else if (previousStats.rank > 50 && userStats.rank <= 50) {
        toast.success(`📈 You're now in the top 50! Rank #${userStats.rank}`, { duration: 5000 });
      } else if (previousStats.rank > 100 && userStats.rank <= 100) {
        toast.success(`🎯 Top 100 achieved! Rank #${userStats.rank}`, { duration: 5000 });
      }

      // Rank dropped (fell out of top 10)
      if (previousStats.rank <= 10 && userStats.rank > 10) {
        toast.error(`⚠️ Dropped out of top 10 to rank #${userStats.rank}`, { duration: 6000 });
      }
    }

    // Check win streaks (toast notifications for smaller milestones)
    // Only show if streak actually increased (not just re-render with same data)
    if (userStats.current_streak > previousStats.current_streak && typeof window !== 'undefined') {
      // Use sessionStorage to track shown streak notifications (resets on page refresh)
      const lastShownStreak = parseInt(sessionStorage.getItem('last_shown_streak') || '0', 10);

      if (userStats.current_streak === 3 && lastShownStreak < 3) {
        sessionStorage.setItem('last_shown_streak', '3');
        toast.success('🔥 3-win streak! You\'re on fire!', { duration: 4000, icon: '🔥' });
      } else if (userStats.current_streak === 5 && lastShownStreak < 5) {
        sessionStorage.setItem('last_shown_streak', '5');
        toast.success('🔥🔥 5-win streak! Unstoppable!', { duration: 5000, icon: '🔥' });
      }

      // Reset the tracker when streak is broken
      if (userStats.current_streak < lastShownStreak) {
        sessionStorage.setItem('last_shown_streak', '0');
      }
    }
  }, [userStats, previousStats, notify]);
}
