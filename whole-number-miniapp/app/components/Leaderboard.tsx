'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../lib/api';
import { Avatar } from './Avatar';

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
  winning_trades: number;
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
  const { address: wagmiAddress } = useAccount();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bears' | 'bulls'>(filterArmy);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [farcasterWallet, setFarcasterWallet] = useState<string | null>(null);
  
  // Use Farcaster wallet if available, otherwise use wagmi wallet
  const address = farcasterWallet || wagmiAddress;

  // Get Farcaster wallet on mount
  useEffect(() => {
    const getFarcasterWallet = async () => {
      try {
        const { farcasterAuth } = await import('../lib/farcaster');
        if (farcasterAuth.isInFarcasterFrame()) {
          const signInResult = await farcasterAuth.signInWithFarcaster();
          if (signInResult?.walletAddress) {
            setFarcasterWallet(signInResult.walletAddress);
          }
        }
      } catch (error) {
        console.error('Error getting Farcaster wallet:', error);
      }
    };
    getFarcasterWallet();
  }, []);

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
        ? getApiUrl('api/leaderboard?limit=20')
        : getApiUrl(`api/leaderboard?army=${filter}&limit=20`);
      
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
    <div className="space-y-6">
      {/* Your Rank - Awesome Box - Show if user has rank */}
      {userRank && (
        <div className="bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 border-2 border-purple-500 rounded-xl p-8 shadow-2xl">
          <div className="text-center">
            <div className="text-sm font-semibold text-purple-300 uppercase tracking-widest mb-2">Your Global Rank</div>
            <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 mb-2">
              #{userRank}
            </div>
            <div className="text-gray-400 text-sm">Keep trading to climb higher!</div>
          </div>
        </div>
      )}

      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
      {/* Header - Simple */}
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-3xl font-bold text-yellow-400 text-center">🏆 Top Traders</h2>
      </div>

      {/* Leaderboard List - No scrollbar, top 20 only */}
      <div>
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg mb-2">No traders yet</p>
            <p className="text-sm">Be the first to start trading!</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => {
            const rank = index + 1;
            const isUserEntry = address && entry.wallet_address.toLowerCase() === address.toLowerCase();
            
            // Thick left border only for top 3, like achievements
            let borderClass = '';
            let bgClass = '';
            if (rank === 1) {
              borderClass = 'border-l-4 border-yellow-400';
              bgClass = 'bg-yellow-900/10';
            } else if (rank === 2) {
              borderClass = 'border-l-4 border-gray-400';
              bgClass = 'bg-gray-900/10';
            } else if (rank === 3) {
              borderClass = 'border-l-4 border-orange-600';
              bgClass = 'bg-orange-900/10';
            } else if (isUserEntry) {
              borderClass = 'border-l-4 border-blue-500';
              bgClass = 'bg-blue-900/20';
            }
            
            return (
              <div
                key={entry.wallet_address}
                onClick={() => router.push(`/profile/${entry.fid || entry.wallet_address}`)}
                className={`p-4 m-2 rounded-lg hover:bg-slate-700/50 transition-all cursor-pointer ${borderClass} ${bgClass}`}
              >
                <div className="flex items-center gap-4">
                  {/* Profile Picture with Border */}
                  <Avatar
                    pfpUrl={entry.pfp_url}
                    username={entry.username || `Trader ${entry.fid}`}
                    army={entry.army}
                    winningTrades={entry.winning_trades}
                    size="md"
                  />

                  {/* User Info - Clean and simple */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-lg truncate">
                        {entry.username || `Trader${entry.fid}`}
                      </span>
                      {isUserEntry && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* P&L - Clean */}
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <div className={`text-2xl md:text-3xl font-bold ${Number(entry.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${Math.round(Math.abs(Number(entry.total_pnl)) / 100).toLocaleString('en-US')}
                    </div>
                    {entry.battle_tokens_earned > 0 && (
                      <div className="text-xs text-purple-400 flex items-center gap-1">
                        <img src="/battlefield-logo.jpg" alt="$BATTLE" className="w-3 h-3 rounded-full" />
                        {(entry.battle_tokens_earned / 1000000).toFixed(1)}M
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
    </div>
  );
}
