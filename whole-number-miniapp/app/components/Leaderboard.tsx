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

  return (
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
                      <div className="text-xs text-purple-400">
                        🪙 {(entry.battle_tokens_earned / 1000000).toFixed(1)}M $BATTLE
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
  );
}
