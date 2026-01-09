'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApiUrl } from '../../config/api';

interface UserProfile {
  user: {
    fid: number;
    username: string;
    pfp_url: string;
    wallet_address: string;
    army: 'bears' | 'bulls';
  };
  stats: {
    paper_balance: number;
    total_pnl: number;
    total_trades: number;
    winning_trades: number;
    win_rate: number;
    current_streak: number;
    best_streak: number;
    times_liquidated: number;
    battle_tokens_earned: number;
    rank: number;
    last_active: string;
  };
  openPositions: Array<{
    id: number;
    position_type: 'long' | 'short';
    leverage: number;
    entry_price: number;
    position_size: number;
    liquidation_price: number;
    opened_at: string;
  }>;
  recentHistory: Array<{
    id: number;
    position_type: 'long' | 'short';
    leverage: number;
    entry_price: number;
    exit_price: number;
    position_size: number;
    pnl: number;
    status: 'closed' | 'liquidated';
    opened_at: string;
    closed_at: string;
  }>;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const identifier = params.identifier as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [identifier]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(getApiUrl(`api/profile/${identifier}`));
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
      } else {
        setError(data.message || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getArmyEmoji = (army: 'bears' | 'bulls') => {
    return army === 'bears' ? '🐻' : '🐂';
  };

  const getArmyColor = (army: 'bears' | 'bulls') => {
    return army === 'bears' ? 'text-red-400' : 'text-green-400';
  };

  const getRankBadge = (rank: number) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-8">
            <div className="text-center">
              <div className="animate-spin text-4xl mb-4">⚔️</div>
              <p className="text-gray-400">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-8">
            <div className="text-center">
              <p className="text-red-400 text-xl mb-4">❌ {error || 'User not found'}</p>
              <button
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-yellow-500 text-slate-900 font-bold rounded-lg hover:bg-yellow-400 transition"
              >
                Back to Battlefield
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
        >
          ← Back
        </button>

        {/* Profile Header */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            {profile.user.pfp_url ? (
              <img 
                src={profile.user.pfp_url} 
                alt={profile.user.username}
                className="w-24 h-24 rounded-full border-4 border-slate-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-slate-600 bg-slate-700 flex items-center justify-center text-4xl">
                {getArmyEmoji(profile.user.army)}
              </div>
            )}

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{profile.user.username}</h1>
                <span className={`text-3xl ${getArmyColor(profile.user.army)}`}>
                  {getArmyEmoji(profile.user.army)}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-2">FID: {profile.user.fid}</p>
              <p className="text-gray-500 text-xs font-mono truncate">
                {profile.user.wallet_address}
              </p>
            </div>

            {/* Rank Badge */}
            <div className="text-center">
              <div className="text-4xl mb-2">{getRankBadge(profile.stats.rank)}</div>
              <p className="text-gray-400 text-sm">Rank</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Balance */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Balance</p>
            <p className="text-2xl font-bold text-white">
              ${profile.stats.paper_balance.toFixed(0)}
            </p>
          </div>

          {/* Total P&L */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${profile.stats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profile.stats.total_pnl >= 0 ? '+' : ''}${profile.stats.total_pnl.toFixed(2)}
            </p>
          </div>

          {/* Win Rate */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-white">
              {profile.stats.win_rate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {profile.stats.winning_trades}/{profile.stats.total_trades} trades
            </p>
          </div>

          {/* Current Streak */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Streak</p>
            <p className="text-2xl font-bold text-yellow-400">
              🔥 {profile.stats.current_streak}
            </p>
            <p className="text-xs text-gray-500">
              Best: {profile.stats.best_streak}
            </p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-1">Total Trades</p>
            <p className="text-xl font-bold text-white">{profile.stats.total_trades}</p>
          </div>

          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-1">Liquidations</p>
            <p className="text-xl font-bold text-red-400">💥 {profile.stats.times_liquidated}</p>
          </div>

          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-1">$BATTLE Earned</p>
            <p className="text-xl font-bold text-purple-400">
              🪙 {(profile.stats.battle_tokens_earned / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-yellow-400">📊 Open Positions ({profile.openPositions.length})</h2>
          </div>
          <div className="p-4">
            {profile.openPositions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No open positions</p>
            ) : (
              <div className="space-y-3">
                {profile.openPositions.map((pos) => (
                  <div key={pos.id} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-bold ${pos.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                            {pos.position_type === 'long' ? '📈 LONG' : '📉 SHORT'} {pos.leverage}x
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Entry: ${pos.entry_price.toFixed(2)} • Size: ${pos.position_size.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Liq: ${pos.liquidation_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatShortDate(pos.opened_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent History */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-yellow-400">📜 Recent History (Last 10)</h2>
          </div>
          <div className="p-4">
            {profile.recentHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No trading history yet</p>
            ) : (
              <div className="space-y-3">
                {profile.recentHistory.map((trade) => (
                  <div key={trade.id} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-bold ${trade.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.position_type === 'long' ? '📈 LONG' : '📉 SHORT'} {trade.leverage}x
                          </span>
                          {trade.status === 'liquidated' && (
                            <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                              💥 LIQUIDATED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          ${trade.entry_price.toFixed(2)} → ${trade.exit_price.toFixed(2)} • ${trade.position_size.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatShortDate(trade.closed_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {((trade.pnl / trade.position_size) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
