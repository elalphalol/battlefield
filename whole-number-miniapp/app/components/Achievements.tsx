'use client';

import { useState } from 'react';
import sdk from '@farcaster/miniapp-sdk';

// Farcaster icon component - using local SVG for consistent rendering
const FarcasterIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <img
    src="/farcaster-icon.svg"
    alt="Farcaster"
    className={`${className} rounded-sm`}
  />
);

interface AchievementsProps {
  stats: {
    total_trades: number;
    total_pnl: number;
    winning_trades: number;
    win_rate: number;
    current_streak: number;
    best_streak: number;
    times_liquidated: number;
    rank: number;
  };
  showOnlyUnlocked?: boolean;
  showOnlyLocked?: boolean;
  username?: string;
  isOwnProfile?: boolean;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'trading' | 'pnl' | 'winrate' | 'streak' | 'rank' | 'survival' | 'special';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic';
  points: number;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

export function Achievements({ stats, showOnlyUnlocked, showOnlyLocked, username, isOwnProfile = true }: AchievementsProps) {
  const [showUnlocked, setShowUnlocked] = useState(true);
  const [showLocked, setShowLocked] = useState(false);

  // Point values: Common=5, Uncommon=10, Rare=25, Epic=50, Legendary=100, Mythic=200
  const allAchievements: Achievement[] = [
    // Trading Volume
    { id: 'first_trade', title: '🎖️ First Blood', description: 'Completed your first trade', icon: '⚔️', category: 'trading', rarity: 'Common', points: 5, unlocked: stats.total_trades >= 1, progress: Math.min(stats.total_trades, 1), target: 1 },
    { id: 'trader_10', title: '📊 Apprentice Trader', description: 'Completed 10 trades', icon: '📈', category: 'trading', rarity: 'Common', points: 5, unlocked: stats.total_trades >= 10, progress: Math.min(stats.total_trades, 10), target: 10 },
    { id: 'trader_50', title: '💼 Skilled Trader', description: 'Completed 50 trades', icon: '💹', category: 'trading', rarity: 'Common', points: 5, unlocked: stats.total_trades >= 50, progress: Math.min(stats.total_trades, 50), target: 50 },
    { id: 'trader_100', title: '🎯 Veteran Trader', description: 'Completed 100 trades', icon: '🏅', category: 'trading', rarity: 'Uncommon', points: 10, unlocked: stats.total_trades >= 100, progress: Math.min(stats.total_trades, 100), target: 100 },
    { id: 'trader_500', title: '👑 Elite Trader', description: 'Completed 500 trades', icon: '👑', category: 'trading', rarity: 'Rare', points: 25, unlocked: stats.total_trades >= 500, progress: Math.min(stats.total_trades, 500), target: 500 },
    { id: 'trader_1000', title: '🌟 Master Trader', description: 'Completed 1,000 trades', icon: '🌟', category: 'trading', rarity: 'Rare', points: 25, unlocked: stats.total_trades >= 1000, progress: Math.min(stats.total_trades, 1000), target: 1000 },

    // P&L Milestones (total_pnl is in CENTS, thresholds in cents: $100 = 10000 cents)
    { id: 'profit_100', title: '💵 First Profit', description: 'Reached $100 total P&L', icon: '💰', category: 'pnl', rarity: 'Common', points: 5, unlocked: stats.total_pnl >= 10000, progress: Math.min(stats.total_pnl / 100, 100), target: 100 },
    { id: 'profit_1000', title: '💎 Profitable Trader', description: 'Reached $1,000 total P&L', icon: '💎', category: 'pnl', rarity: 'Uncommon', points: 10, unlocked: stats.total_pnl >= 100000, progress: Math.min(stats.total_pnl / 100, 1000), target: 1000 },
    { id: 'profit_5000', title: '🔥 Hot Streak', description: 'Reached $5,000 total P&L', icon: '🔥', category: 'pnl', rarity: 'Uncommon', points: 10, unlocked: stats.total_pnl >= 500000, progress: Math.min(stats.total_pnl / 100, 5000), target: 5000 },
    { id: 'profit_10000', title: '🚀 To The Moon', description: 'Reached $10,000 total P&L', icon: '🚀', category: 'pnl', rarity: 'Rare', points: 25, unlocked: stats.total_pnl >= 1000000, progress: Math.min(stats.total_pnl / 100, 10000), target: 10000 },
    { id: 'profit_50000', title: '💰 Whale Status', description: 'Reached $50,000 total P&L', icon: '🐋', category: 'pnl', rarity: 'Epic', points: 50, unlocked: stats.total_pnl >= 5000000, progress: Math.min(stats.total_pnl / 100, 50000), target: 50000 },
    { id: 'profit_100000', title: '👑 Legendary Profit', description: 'Reached $100,000 total P&L', icon: '🏆', category: 'pnl', rarity: 'Legendary', points: 100, unlocked: stats.total_pnl >= 10000000, progress: Math.min(stats.total_pnl / 100, 100000), target: 100000 },

    // Win Rate
    { id: 'winrate_50', title: '⚖️ Balanced', description: 'Maintained 50%+ win rate (min 20 trades)', icon: '⚖️', category: 'winrate', rarity: 'Uncommon', points: 10, unlocked: stats.win_rate >= 50 && stats.total_trades >= 20 },
    { id: 'winrate_60', title: '📈 Consistent Winner', description: 'Maintained 60%+ win rate (min 50 trades)', icon: '✨', category: 'winrate', rarity: 'Rare', points: 25, unlocked: stats.win_rate >= 60 && stats.total_trades >= 50 },
    { id: 'winrate_70', title: '🎯 Sharpshooter', description: 'Maintained 70%+ win rate (min 100 trades)', icon: '🎯', category: 'winrate', rarity: 'Epic', points: 50, unlocked: stats.win_rate >= 70 && stats.total_trades >= 100 },
    { id: 'winrate_80', title: '🌟 Elite Precision', description: 'Maintained 80%+ win rate (min 200 trades)', icon: '💫', category: 'winrate', rarity: 'Epic', points: 50, unlocked: stats.win_rate >= 80 && stats.total_trades >= 200 },

    // Streak
    { id: 'streak_3', title: '🔥 On Fire', description: 'Achieved a 3-win streak', icon: '🔥', category: 'streak', rarity: 'Common', points: 5, unlocked: stats.best_streak >= 3, progress: Math.min(stats.best_streak, 3), target: 3 },
    { id: 'streak_5', title: '🌡️ Heating Up', description: 'Achieved a 5-win streak', icon: '🌡️', category: 'streak', rarity: 'Uncommon', points: 10, unlocked: stats.best_streak >= 5, progress: Math.min(stats.best_streak, 5), target: 5 },
    { id: 'streak_10', title: '💥 Unstoppable', description: 'Achieved a 10-win streak', icon: '💥', category: 'streak', rarity: 'Uncommon', points: 10, unlocked: stats.best_streak >= 10, progress: Math.min(stats.best_streak, 10), target: 10 },
    { id: 'streak_20', title: '⚡ Lightning', description: 'Achieved a 20-win streak', icon: '⚡', category: 'streak', rarity: 'Rare', points: 25, unlocked: stats.best_streak >= 20, progress: Math.min(stats.best_streak, 20), target: 20 },
    { id: 'streak_50', title: '🌪️ Legendary Streak', description: 'Achieved a 50-win streak', icon: '🌪️', category: 'streak', rarity: 'Epic', points: 50, unlocked: stats.best_streak >= 50, progress: Math.min(stats.best_streak, 50), target: 50 },

    // Rankings
    { id: 'rank_top100', title: '🏅 Top 100', description: 'Reached Top 100 on the leaderboard', icon: '🏅', category: 'rank', rarity: 'Rare', points: 25, unlocked: Number(stats.rank) <= 100 && Number(stats.rank) > 0 },
    { id: 'rank_top50', title: '🌟 Top 50', description: 'Reached Top 50 on the leaderboard', icon: '🌟', category: 'rank', rarity: 'Epic', points: 50, unlocked: Number(stats.rank) <= 50 && Number(stats.rank) > 0 },
    { id: 'rank_top10', title: '⭐ Top 10 Elite', description: 'Reached Top 10 on the leaderboard', icon: '⭐', category: 'rank', rarity: 'Legendary', points: 100, unlocked: Number(stats.rank) <= 10 && Number(stats.rank) > 0 },
    { id: 'rank_top3', title: '🏆 Legendary Conqueror', description: 'Reached Top 3 on the leaderboard', icon: '🏆', category: 'rank', rarity: 'Legendary', points: 100, unlocked: Number(stats.rank) <= 3 && Number(stats.rank) > 0 },
    { id: 'rank_1', title: '👑 Battlefield Champion', description: 'Reached #1 on the leaderboard', icon: '👑', category: 'rank', rarity: 'Mythic', points: 200, unlocked: Number(stats.rank) === 1 },

    // Survival
    { id: 'no_liq_50', title: '🛡️ Survivor', description: 'Completed 50 trades without liquidation', icon: '🛡️', category: 'survival', rarity: 'Epic', points: 50, unlocked: stats.total_trades >= 50 && stats.times_liquidated === 0 },
    { id: 'no_liq_100', title: '🏰 Fortress', description: 'Completed 100 trades without liquidation', icon: '🏰', category: 'survival', rarity: 'Epic', points: 50, unlocked: stats.total_trades >= 100 && stats.times_liquidated === 0 },
    { id: 'no_liq_500', title: '💎 Diamond Hands', description: 'Completed 500 trades without liquidation', icon: '💎', category: 'survival', rarity: 'Legendary', points: 100, unlocked: stats.total_trades >= 500 && stats.times_liquidated === 0 },

    // Special (total_pnl is in CENTS)
    { id: 'comeback', title: '🎭 The Comeback', description: 'Recovered from negative P&L to reach $1,000 profit', icon: '🎭', category: 'special', rarity: 'Legendary', points: 100, unlocked: stats.total_pnl >= 100000 && stats.times_liquidated > 0 },
    { id: 'risk_taker', title: '🎲 High Roller', description: 'Survived 10+ liquidations and still profitable', icon: '🎲', category: 'special', rarity: 'Legendary', points: 100, unlocked: stats.times_liquidated >= 10 && stats.total_pnl > 0 },
    { id: 'perfect_trader', title: '💯 Perfect Score', description: 'Maintained 100% win rate with 10+ trades', icon: '💯', category: 'special', rarity: 'Legendary', points: 100, unlocked: stats.win_rate === 100 && stats.total_trades >= 10 },
  ];

  const unlockedAchievements = allAchievements.filter(a => a.unlocked);
  const lockedAchievements = allAchievements.filter(a => !a.unlocked);
  const completionRate = ((unlockedAchievements.length / allAchievements.length) * 100).toFixed(1);
  
  // Calculate total points
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);
  const maxPoints = allAchievements.reduce((sum, a) => sum + a.points, 0);

  const getPlayerTitle = (): { title: string; badge: string; color: string } => {
    const rank = Number(stats.rank);
    // total_pnl is in CENTS, so $100,000 = 10,000,000 cents
    if (rank === 1) return { title: 'Battlefield Champion', badge: '👑', color: 'text-yellow-400' };
    if (rank <= 3) return { title: 'Legendary Conqueror', badge: '🏆', color: 'text-orange-400' };
    if (rank <= 10) return { title: 'Top 10 Elite', badge: '⭐', color: 'text-gray-300' };
    if (stats.total_pnl >= 10000000) return { title: 'Legendary Profit King', badge: '🏆', color: 'text-purple-400' };
    if (stats.total_pnl >= 5000000) return { title: 'Whale Trader', badge: '🐋', color: 'text-blue-400' };
    if (stats.win_rate >= 80 && stats.total_trades >= 200) return { title: 'Precision Expert', badge: '💫', color: 'text-cyan-400' };
    if (stats.best_streak >= 50) return { title: 'Streak Legend', badge: '🌪️', color: 'text-red-400' };
    if (stats.total_trades >= 1000) return { title: 'Trading Veteran', badge: '🌟', color: 'text-yellow-300' };
    if (stats.total_trades >= 500) return { title: 'Elite Trader', badge: '👑', color: 'text-purple-300' };
    if (stats.total_pnl >= 1000000) return { title: 'Moon Walker', badge: '🚀', color: 'text-green-400' };
    if (stats.total_pnl >= 500000) return { title: 'Hot Trader', badge: '🔥', color: 'text-orange-300' };
    if (stats.win_rate >= 70 && stats.total_trades >= 100) return { title: 'Sharpshooter', badge: '🎯', color: 'text-blue-300' };
    if (stats.total_trades >= 100) return { title: 'Veteran Warrior', badge: '🏅', color: 'text-gray-400' };
    if (stats.total_pnl >= 100000) return { title: 'Profitable Trader', badge: '💎', color: 'text-cyan-300' };
    if (stats.best_streak >= 10) return { title: 'Unstoppable', badge: '💥', color: 'text-red-300' };
    if (stats.total_trades >= 50) return { title: 'Skilled Trader', badge: '💹', color: 'text-green-300' };
    if (stats.total_trades >= 10) return { title: 'Apprentice Trader', badge: '📈', color: 'text-blue-200' };
    return { title: 'Battlefield Recruit', badge: '⚔️', color: 'text-gray-300' };
  };

  const playerTitle = getPlayerTitle();

  const categoryColors = {
    trading: 'border-blue-500',
    pnl: 'border-green-500',
    winrate: 'border-purple-500',
    streak: 'border-orange-500',
    rank: 'border-yellow-500',
    survival: 'border-cyan-500',
    special: 'border-pink-500',
  };

  const categoryNames = {
    trading: 'Trading Volume',
    pnl: 'Profit & Loss',
    winrate: 'Win Rate',
    streak: 'Win Streaks',
    rank: 'Rankings',
    survival: 'Survival',
    special: 'Special',
  };

  const rarityColors = {
    Common: 'text-gray-400',
    Uncommon: 'text-green-400',
    Rare: 'text-blue-400',
    Epic: 'text-purple-400',
    Legendary: 'text-orange-400',
    Mythic: 'text-yellow-400',
  };

  const rarityBorderColors = {
    Common: 'border-gray-500',
    Uncommon: 'border-green-500',
    Rare: 'border-blue-500',
    Epic: 'border-purple-500',
    Legendary: 'border-orange-500',
    Mythic: 'border-yellow-500',
  };

  const handleShareAchievement = async (achievement: Achievement) => {
    // If viewing someone else's profile, tag them in the cast
    const shareText = isOwnProfile
      ? `Just unlocked ${achievement.title} on @btcbattle! ${achievement.icon}\n\n${achievement.description}\n\n+${achievement.points} points earned!`
      : `@${username} unlocked ${achievement.title} on @btcbattle! ${achievement.icon}\n\n${achievement.description}\n\n+${achievement.points} points earned!`;
    const miniappUrl = 'https://farcaster.xyz/miniapps/5kLec5hSq3bP/battlefield';

    try {
      const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(miniappUrl)}`;
      await sdk.actions.openUrl(castUrl);
    } catch (error) {
      console.error('Error sharing achievement:', error);
      try {
        await navigator.clipboard.writeText(shareText);
      } catch (clipError) {
        console.error('Failed to copy to clipboard:', clipError);
      }
    }
  };

  // If showOnlyUnlocked, render ONLY unlocked achievements cards (no dropdown, no title)
  if (showOnlyUnlocked) {
    return (
      <div>
        {unlockedAchievements.length === 0 ? (
          <p className="text-gray-400 text-center py-4">Start trading to unlock achievements!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unlockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-slate-700/50 border-l-4 ${rarityBorderColors[achievement.rarity]} rounded-lg p-3`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-white text-sm mb-1">{achievement.title}</h4>
                    <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-gray-500">{categoryNames[achievement.category]}</p>
                        <span className="text-xs text-gray-600">•</span>
                        <p className={`text-xs font-bold ${rarityColors[achievement.rarity]}`}>{achievement.rarity}</p>
                        <span className="text-xs text-gray-600">•</span>
                        <p className="text-xs text-yellow-400 font-bold">+{achievement.points} pts</p>
                      </div>
                      <button
                        onClick={() => handleShareAchievement(achievement)}
                        className="text-purple-400 hover:text-purple-300 text-xs font-medium flex items-center gap-1 ml-2"
                        title="Share to Farcaster"
                      >
                        <FarcasterIcon className="w-4 h-4" /> Cast
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // If showOnlyLocked, render ONLY locked achievements cards (no dropdown)
  if (showOnlyLocked) {
    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lockedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-slate-700/30 border-l-4 ${rarityBorderColors[achievement.rarity]} rounded-lg p-3 opacity-60`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl grayscale">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-300 text-sm mb-1">{achievement.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-gray-600">{categoryNames[achievement.category]}</p>
                    <span className="text-xs text-gray-600">•</span>
                    <p className={`text-xs font-bold ${rarityColors[achievement.rarity]} opacity-60`}>{achievement.rarity}</p>
                    <span className="text-xs text-gray-600">•</span>
                    <p className="text-xs text-yellow-400/60 font-bold">+{achievement.points} pts</p>
                  </div>
                  {achievement.progress !== undefined && achievement.target && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress} / {achievement.target}</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: render full component with title, dropdowns, etc.
  return (
    <div className="space-y-6">
      {/* Player Title & Points */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-6 text-center">
        <h3 className="text-sm text-gray-400 mb-2">Current Title</h3>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl">{playerTitle.badge}</span>
          <h2 className={`text-3xl font-bold ${playerTitle.color}`}>{playerTitle.title}</h2>
        </div>
        <div className="flex items-center justify-center gap-4 text-sm mb-3">
          <p className="text-gray-400">
            {unlockedAchievements.length} / {allAchievements.length} Achievements ({completionRate}%)
          </p>
          <p className="text-yellow-400 font-bold">
            ⭐ {totalPoints} / {maxPoints} Points
          </p>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Unlocked Achievements - Collapsible */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
        <button 
          onClick={() => setShowUnlocked(!showUnlocked)}
          className="w-full p-4 border-b border-slate-700 flex items-center justify-between hover:bg-slate-700/50 transition"
        >
          <h3 className="text-xl font-bold text-yellow-400">
            🏆 Achievements ({unlockedAchievements.length})
          </h3>
          <span className="text-2xl text-yellow-400">{showUnlocked ? '▼' : '▶'}</span>
        </button>
        {showUnlocked && (<div className="p-4">
          {unlockedAchievements.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Start trading to unlock achievements!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unlockedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`bg-slate-700/50 border-l-4 ${rarityBorderColors[achievement.rarity]} rounded-lg p-3`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white text-sm mb-1">{achievement.title}</h4>
                      <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{categoryNames[achievement.category]}</p>
                          <span className="text-xs text-gray-600">•</span>
                          <p className={`text-xs font-bold ${rarityColors[achievement.rarity]}`}>{achievement.rarity}</p>
                          <span className="text-xs text-gray-600">•</span>
                          <p className="text-xs text-yellow-400 font-bold">+{achievement.points} pts</p>
                        </div>
                        <button
                          onClick={() => handleShareAchievement(achievement)}
                          className="text-purple-400 hover:text-purple-300 text-xs font-medium flex items-center gap-1 ml-2"
                          title="Share to Farcaster"
                        >
                          Cast
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>)}
      </div>

      {/* Locked Achievements - Collapsible */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
        <button 
          onClick={() => setShowLocked(!showLocked)}
          className="w-full p-4 border-b border-slate-700 flex items-center justify-between hover:bg-slate-700/50 transition"
        >
          <h3 className="text-xl font-bold text-gray-400">
            🔒 Locked Achievements ({lockedAchievements.length})
          </h3>
          <span className="text-2xl text-gray-400">{showLocked ? '▼' : '▶'}</span>
        </button>
        {showLocked && (<div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lockedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-slate-700/30 border-l-4 ${rarityBorderColors[achievement.rarity]} rounded-lg p-3 opacity-60`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl grayscale">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-300 text-sm mb-1">{achievement.title}</h4>
                    <p className="text-xs text-gray-500 mb-2">{achievement.description}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-600">{categoryNames[achievement.category]}</p>
                      <span className="text-xs text-gray-600">•</span>
                      <p className={`text-xs font-bold ${rarityColors[achievement.rarity]} opacity-60`}>{achievement.rarity}</p>
                      <span className="text-xs text-gray-600">•</span>
                      <p className="text-xs text-yellow-400/60 font-bold">+{achievement.points} pts</p>
                    </div>
                    {achievement.progress !== undefined && achievement.target && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{achievement.progress} / {achievement.target}</span>
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>)}
      </div>
    </div>
  );
}
