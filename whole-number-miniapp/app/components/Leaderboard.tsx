'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../config/api';

interface LeaderboardEntry {
  id: number;
  fid: number;
  username: string;
  pfp_url: string;
  wallet_address: string;
  army: 'bears' | 'bulls';
  paper_balance: number;
  total_pnl: number;
  total_trades: number;
  win_rate: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  battle_tokens_earned: number;
  score: number;
  last_active: string;
}

interface LeaderboardProps {
  filterArmy?: 'bears' | 'bulls' | 'all';
}

export function Leaderboard({ filterArmy = 'all' }: LeaderboardProps) {
  const { address } = useAccount();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bears' | 'bulls'>(filterArmy);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    fetchLeaderboard();
    if (address) {
      fetchUserRank();
    }
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLeaderboard();
      if (address) {
        fetchUserRank();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [filter, address]);

  const fetchLeaderboard = async () => {
    try {
      const url = filter === 'all' 
        ? getApiUrl('api/leaderboard?limit=100')
        : getApiUrl(`api/leaderboard?army=${filter}&limit=100`);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    if (!address) return;
    
    try {
      // Always fetch overall rank (not army-specific rank)
      const response = await fetch(getApiUrl(`api/leaderboard/rank/${address}`));
      const data = await response.json();
      
      if (data.success && data.rank) {
        setUserRank(data.rank);
      }
    } catch (error) {
      console.error('Error fetching user rank:', error);
    }
  };

  const getRankBadge = (rank: number) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getArmyEmoji = (army: 'bears' | 'bulls') => {
    return army === 'bears' ? '🐻' : '🐂';
  };

  const getArmyColor = (army: 'bears' | 'bulls') => {
    return army === 'bears' ? 'text-red-400' : 'text-green-400';
  };

  if (loading) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚔️</div>
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const titleRankings = [
    { rarity: 'Mythic', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', titles: ['Battlefield Champion (#1)'] },
    { rarity: 'Legendary', color: 'bg-gradient-to-r from-purple-500 to-pink-500', titles: ['Legendary Conqueror (Top 3)', 'Top 10 Elite (Top 10)', 'Legendary Profit King ($100K+ P&L)'] },
    { rarity: 'Epic', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', titles: ['Whale Trader ($50K+ P&L)', 'Precision Expert (80%+ WR, 200+ trades)', 'Streak Legend (50+ streak)'] },
    { rarity: 'Rare', color: 'bg-gradient-to-r from-green-500 to-emerald-500', titles: ['Master Trader (1000+ trades)', 'Elite Trader (500+ trades)', 'Moon Walker ($10K+ P&L)'] },
    { rarity: 'Uncommon', color: 'bg-gradient-to-r from-gray-500 to-slate-500', titles: ['Hot Trader ($5K+ P&L)', 'Sharpshooter (70%+ WR, 100+ trades)', 'Veteran Warrior (100+ trades)', 'Profitable Trader ($1K+ P&L)'] },
    { rarity: 'Common', color: 'bg-gradient-to-r from-slate-600 to-slate-700', titles: ['Unstoppable (10+ streak)', 'Skilled Trader (50+ trades)', 'Apprentice Trader (10+ trades)', 'Battlefield Recruit (Starter)'] },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-yellow-400">🏆 Leaderboard</h2>
          {userRank && (
            <div className="bg-blue-900/30 border border-blue-500/50 rounded px-3 py-1">
              <span className="text-blue-400 text-sm font-bold">Your Rank: #{userRank}</span>
            </div>
          )}
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'all'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            All Warriors
          </button>
          <button
            onClick={() => setFilter('bears')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'bears'
                ? 'bg-red-500 text-white'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            🐻 Bears
          </button>
          <button
            onClick={() => setFilter('bulls')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              filter === 'bulls'
                ? 'bg-green-500 text-white'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            🐂 Bulls
          </button>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg mb-2">No traders yet</p>
            <p className="text-sm">Be the first to start trading!</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isUserEntry = address && entry.wallet_address.toLowerCase() === address.toLowerCase();
            
            return (
              <div
                key={entry.wallet_address}
                onClick={() => router.push(`/profile/${entry.fid}`)}
                className={`p-4 hover:bg-slate-700/50 transition-colors cursor-pointer ${
                  isUserEntry ? 'bg-blue-900/20 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div className="text-2xl font-bold w-12 text-center">
                    {getRankBadge(rank)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xl ${getArmyColor(entry.army)}`}>
                        {getArmyEmoji(entry.army)}
                      </span>
                      <span className="font-bold text-white truncate">
                        {entry.username || `Trader ${entry.fid}`}
                      </span>
                      {isUserEntry && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-4 text-xs text-gray-400">
                      <span>💰 ${Number(entry.paper_balance).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                      <span>📊 {Number(entry.win_rate).toFixed(1)}% WR</span>
                      <span>🔥 {entry.current_streak} streak</span>
                    </div>
                  </div>

                  {/* P&L */}
                  <div className="hidden md:flex flex-col items-end gap-1">
                    <div className={`text-2xl font-bold ${Number(entry.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(entry.total_pnl) >= 0 ? '+' : ''}${Number(entry.total_pnl).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.total_trades} trades
                    </div>
                    {entry.battle_tokens_earned > 0 && (
                      <div className="text-xs text-purple-400 flex items-center gap-1">
                        <img src="/battlefield-logo.jpg" alt="$BATTLE" className="w-3 h-3 rounded-full" />
                        {(entry.battle_tokens_earned / 1000000).toFixed(1)}M $BATTLE
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
      
      {/* Battlefield Glossary */}
      <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-yellow-400">📚 Battlefield Glossary</h2>
          <p className="text-gray-400 text-sm mt-1">Complete guide to player titles, achievements, and their requirements</p>
        </div>
        <div className="p-6 space-y-6">
          {/* Title Rarity Rankings */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-yellow-400 mb-3">🏆 Player Title Rankings by Rarity</h3>
            {titleRankings.map((tier) => (
              <div key={tier.rarity} className={`${tier.color} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white">{tier.rarity}</h3>
                  <div className="flex-1 h-1 bg-white/30 rounded"></div>
                </div>
                <ul className="space-y-1">
                  {tier.titles.map((title, idx) => (
                    <li key={idx} className="text-sm text-white/90 flex items-center gap-2">
                      <span className="text-white">•</span>
                      {title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Complete Achievement List */}
          <div className="bg-slate-700 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-bold text-purple-400 mb-4">📋 Complete Achievement List</h3>
            <p className="text-xs text-gray-400 mb-4">All 32 achievements and their exact unlock requirements:</p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-blue-400 mb-2">📊 Trading Volume Achievements</h4>
                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                  <li>⚔️ First Blood - Complete 1 trade</li>
                  <li>📈 Apprentice Trader - Complete 10 trades</li>
                  <li>💹 Skilled Trader - Complete 50 trades</li>
                  <li>🏅 Veteran Trader - Complete 100 trades</li>
                  <li>👑 Elite Trader - Complete 500 trades</li>
                  <li>🌟 Master Trader - Complete 1,000 trades</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-green-400 mb-2">💰 Profit & Loss Achievements</h4>
                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                  <li>💰 First Profit - Reach $100 total P&L</li>
                  <li>💎 Profitable Trader - Reach $1,000 total P&L</li>
                  <li>🔥 Hot Streak - Reach $5,000 total P&L</li>
                  <li>🚀 To The Moon - Reach $10,000 total P&L</li>
                  <li>🐋 Whale Status - Reach $50,000 total P&L</li>
                  <li>🏆 Legendary Profit - Reach $100,000 total P&L</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-purple-400 mb-2">🎯 Win Rate Achievements</h4>
                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                  <li>⚖️ Balanced - Maintain 50%+ win rate (min 20 trades)</li>
                  <li>✨ Consistent Winner - Maintain 60%+ win rate (min 50 trades)</li>
                  <li>🎯 Sharpshooter - Maintain 70%+ win rate (min 100 trades)</li>
                  <li>💫 Elite Precision - Maintain 80%+ win rate (min 200 trades)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-orange-400 mb-2">🔥 Win Streak Achievements</h4>
                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                  <li>🔥 On Fire - Achieve 3-win streak</li>
                  <li>🌡️ Heating Up - Achieve 5-win streak</li>
                  <li>💥 Unstoppable - Achieve 10-win streak</li>
                  <li>⚡ Lightning - Achieve 20-win streak</li>
                  <li>🌪️ Legendary Streak - Achieve 50-win streak</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-yellow-400 mb-2">🏅 Ranking Achievements</h4>
                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                  <li>🏅 Top 100 - Reach Top 100 on leaderboard</li>
                  <li>🥉 Top 50 - Reach Top 50 on leaderboard</li>
                  <li>🥈 Top 10 Elite - Reach Top 10 on leaderboard</li>
                  <li>🥇 Legendary Conqueror - Reach Top 3 on leaderboard</li>
                  <li>👑 Battlefield Champion - Reach #1 on leaderboard</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-cyan-400 mb-2">🛡️ Survival Achievements</h4>
                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                  <li>🛡️ Survivor - Complete 50 trades without liquidation</li>
                  <li>🏰 Fortress - Complete 100 trades without liquidation</li>
                  <li>💎 Diamond Hands - Complete 500 trades without liquidation</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-pink-400 mb-2">✨ Special Achievements</h4>
                <ul className="text-sm text-gray-300 space-y-1 ml-4">
                  <li>🎭 The Comeback - Recover from negative P&L to reach $1,000 profit (requires at least 1 liquidation)</li>
                  <li>🎲 High Roller - Survive 10+ liquidations and still be profitable</li>
                  <li>💯 Perfect Score - Maintain 100% win rate with 10+ trades</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 rounded-lg p-4 mt-4">
            <p className="text-xs text-gray-400 text-center">
              💡 Achievements unlock exactly as described above! Your highest rarity title is automatically displayed on your profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
