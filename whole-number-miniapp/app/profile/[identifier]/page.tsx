'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApiUrl } from '../../config/api';
import { Achievements } from '../../components/Achievements';

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
  pagination: {
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    recordsPerPage: number;
  };
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const identifier = params.identifier as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showTitleGlossary, setShowTitleGlossary] = useState(false);

  useEffect(() => {
    fetchProfile(currentPage);
  }, [identifier, currentPage]);

  const fetchProfile = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(getApiUrl(`api/profile/${identifier}?page=${page}`));
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Get player title based on stats (automatically selects rarest/best)
  const getPlayerTitle = (stats: UserProfile['stats']) => {
    if (stats.rank === 1) return { title: 'Battlefield Champion', badge: '👑', color: 'text-yellow-400', rarity: 'Mythic' };
    if (stats.rank <= 3) return { title: 'Elite Warrior', badge: '🥇', color: 'text-orange-400', rarity: 'Legendary' };
    if (stats.rank <= 10) return { title: 'Master Trader', badge: '🥈', color: 'text-gray-300', rarity: 'Legendary' };
    if (stats.total_pnl >= 100000) return { title: 'Legendary Profit King', badge: '🏆', color: 'text-purple-400', rarity: 'Legendary' };
    if (stats.total_pnl >= 50000) return { title: 'Whale Trader', badge: '🐋', color: 'text-blue-400', rarity: 'Epic' };
    if (stats.win_rate >= 80 && stats.total_trades >= 200) return { title: 'Precision Expert', badge: '💫', color: 'text-cyan-400', rarity: 'Epic' };
    if (stats.best_streak >= 50) return { title: 'Streak Legend', badge: '🌪️', color: 'text-red-400', rarity: 'Epic' };
    if (stats.total_trades >= 1000) return { title: 'Trading Veteran', badge: '🌟', color: 'text-yellow-300', rarity: 'Rare' };
    if (stats.total_trades >= 500) return { title: 'Elite Trader', badge: '👑', color: 'text-purple-300', rarity: 'Rare' };
    if (stats.total_pnl >= 10000) return { title: 'Moon Walker', badge: '🚀', color: 'text-green-400', rarity: 'Rare' };
    if (stats.total_pnl >= 5000) return { title: 'Hot Trader', badge: '🔥', color: 'text-orange-300', rarity: 'Uncommon' };
    if (stats.win_rate >= 70 && stats.total_trades >= 100) return { title: 'Sharpshooter', badge: '🎯', color: 'text-blue-300', rarity: 'Uncommon' };
    if (stats.total_trades >= 100) return { title: 'Veteran Warrior', badge: '🏅', color: 'text-gray-400', rarity: 'Uncommon' };
    if (stats.total_pnl >= 1000) return { title: 'Profitable Trader', badge: '💎', color: 'text-cyan-300', rarity: 'Uncommon' };
    if (stats.best_streak >= 10) return { title: 'Unstoppable', badge: '💥', color: 'text-red-300', rarity: 'Common' };
    if (stats.total_trades >= 50) return { title: 'Skilled Trader', badge: '💹', color: 'text-green-300', rarity: 'Common' };
    if (stats.total_trades >= 10) return { title: 'Apprentice Trader', badge: '📈', color: 'text-blue-200', rarity: 'Common' };
    return { title: 'Battlefield Recruit', badge: '⚔️', color: 'text-gray-300', rarity: 'Common' };
  };

  const titleRankings = [
    { rarity: 'Mythic', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', textColor: 'text-yellow-400', titles: ['Battlefield Champion (#1)'] },
    { rarity: 'Legendary', color: 'bg-gradient-to-r from-purple-500 to-pink-500', textColor: 'text-purple-400', titles: ['Elite Warrior (Top 3)', 'Master Trader (Top 10)', 'Legendary Profit King ($100K+ P&L)'] },
    { rarity: 'Epic', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', textColor: 'text-blue-400', titles: ['Whale Trader ($50K+ P&L)', 'Precision Expert (80%+ WR, 200+ trades)', 'Streak Legend (50+ streak)'] },
    { rarity: 'Rare', color: 'bg-gradient-to-r from-green-500 to-emerald-500', textColor: 'text-green-400', titles: ['Trading Veteran (1000+ trades)', 'Elite Trader (500+ trades)', 'Moon Walker ($10K+ P&L)'] },
    { rarity: 'Uncommon', color: 'bg-gradient-to-r from-gray-500 to-slate-500', textColor: 'text-gray-300', titles: ['Hot Trader ($5K+ P&L)', 'Sharpshooter (70%+ WR, 100+ trades)', 'Veteran Warrior (100+ trades)', 'Profitable Trader ($1K+ P&L)'] },
    { rarity: 'Common', color: 'bg-gradient-to-r from-slate-600 to-slate-700', textColor: 'text-gray-400', titles: ['Unstoppable (10+ streak)', 'Skilled Trader (50+ trades)', 'Apprentice Trader (10+ trades)', 'Battlefield Recruit (Starter)'] },
  ];

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
              ${profile.stats.paper_balance.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
            </p>
          </div>

          {/* Total P&L */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${profile.stats.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {profile.stats.total_pnl >= 0 ? '+' : ''}${profile.stats.total_pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-1">Total Trades</p>
            <p className="text-xl font-bold text-white">{profile.stats.total_trades}</p>
          </div>

          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-1">Liquidations</p>
            <p className="text-xl font-bold text-red-400">💥 {profile.stats.times_liquidated}</p>
          </div>

          {/* Player Title */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-1">Player Title</p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">{getPlayerTitle(profile.stats).badge}</span>
              <p className={`text-sm font-bold ${getPlayerTitle(profile.stats).color}`}>
                {getPlayerTitle(profile.stats).title}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{getPlayerTitle(profile.stats).rarity}</p>
          </div>

          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-1">$BATTLE Earned</p>
            <p className="text-xl font-bold text-purple-400 flex items-center justify-center gap-2">
              <img src="/battlefield-logo.jpg" alt="$BATTLE" className="w-5 h-5 rounded-full" />
              {(profile.stats.battle_tokens_earned / 1000000).toFixed(1)}M
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
                          Entry: ${pos.entry_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} • Size: ${pos.position_size.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        <p className="text-xs text-gray-500">
                          Liq: ${pos.liquidation_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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

        {/* Achievements & Title Glossary Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-6 hover:border-purple-400 transition-all"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="text-xl font-bold text-purple-400 mb-1">Achievements & Milestones</h3>
              <p className="text-sm text-gray-400">View your progress and unlocked achievements</p>
            </div>
          </button>

          <button
            onClick={() => setShowTitleGlossary(!showTitleGlossary)}
            className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-lg p-6 hover:border-yellow-400 transition-all"
          >
            <div className="text-center">
              <div className="text-4xl mb-2">👑</div>
              <h3 className="text-xl font-bold text-yellow-400 mb-1">Title Glossary</h3>
              <p className="text-sm text-gray-400">See all player titles and their rarity</p>
            </div>
          </button>
        </div>

        {/* Achievements Modal */}
        {showAchievements && (
          <div className="bg-slate-800 border-2 border-purple-500 rounded-lg">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-yellow-400">🏆 Achievements & Milestones</h2>
              <button
                onClick={() => setShowAchievements(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <Achievements stats={profile.stats} />
            </div>
          </div>
        )}

        {/* Title Glossary Modal */}
        {showTitleGlossary && (
          <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-yellow-400">👑 Player Title Rankings</h2>
              <button
                onClick={() => setShowTitleGlossary(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-300 text-sm mb-4">
                Player titles are automatically assigned based on your best achievement. Higher rarity titles are rarer and more prestigious!
              </p>
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
              <div className="bg-slate-700 rounded-lg p-4 mt-4">
                <p className="text-xs text-gray-400 text-center">
                  💡 Your highest rarity title is automatically displayed. Complete more achievements to unlock rarer titles!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent History */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-bold text-yellow-400">
              📜 Trading History ({profile.pagination.totalRecords} total)
            </h2>
            <p className="text-sm text-gray-400">
              Page {profile.pagination.currentPage} of {profile.pagination.totalPages}
            </p>
          </div>
          <div className="p-4">
            {profile.recentHistory.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No trading history yet</p>
            ) : (
              <>
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
                          ${trade.entry_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} → ${trade.exit_price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} • ${trade.position_size.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatShortDate(trade.closed_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        <p className="text-xs text-gray-500">
                          {((trade.pnl / trade.position_size) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                </div>

                {/* Pagination Controls */}
                {profile.pagination.totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-lg font-bold transition ${
                        currentPage === 1
                          ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      ← Prev
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-2">
                      {Array.from({ length: profile.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg font-bold transition ${
                            page === currentPage
                              ? 'bg-yellow-500 text-slate-900'
                              : 'bg-slate-700 text-white hover:bg-slate-600'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === profile.pagination.totalPages}
                      className={`px-4 py-2 rounded-lg font-bold transition ${
                        currentPage === profile.pagination.totalPages
                          ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                          : 'bg-slate-700 text-white hover:bg-slate-600'
                      }`}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
