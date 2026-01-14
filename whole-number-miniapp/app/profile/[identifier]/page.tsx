'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getApiUrl } from '../../config/api';
import { Achievements } from '../../components/Achievements';
import { VolumeTracker } from '../../components/VolumeTracker';
import sdk from '@farcaster/miniapp-sdk';
import toast from 'react-hot-toast';

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
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoaded, setPriceLoaded] = useState(false);
  const [achievementTab, setAchievementTab] = useState<'achievements' | 'titles' | 'locked'>('achievements');

  // Fetch BTC price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=BTC');
        const data = await response.json();
        const btcPrice = parseFloat(data.data.rates.USD);
        setCurrentPrice(btcPrice);
        if (!priceLoaded) {
          setPriceLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching BTC price:', error);
        // Set a default price if fetch fails so page doesn't get stuck
        setCurrentPrice(100000);
        if (!priceLoaded) {
          setPriceLoaded(true);
        }
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [priceLoaded]);

  // Load profile once when price is loaded or when page/identifier changes
  useEffect(() => {
    if (priceLoaded && currentPrice && currentPrice > 0) {
      fetchProfile(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifier, currentPage, priceLoaded]);

  const fetchProfile = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const priceParam = currentPrice ? `&currentPrice=${currentPrice}` : '';
      const response = await fetch(getApiUrl(`api/profile/${identifier}?page=${page}${priceParam}`));
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

  // Calculate achievement points based on stats
  const calculateAchievementPoints = (stats: UserProfile['stats']) => {
    let totalPoints = 0;
    const rank = Number(stats.rank);
    
    // Trading Volume
    if (stats.total_trades >= 1) totalPoints += 5;
    if (stats.total_trades >= 10) totalPoints += 5;
    if (stats.total_trades >= 50) totalPoints += 5;
    if (stats.total_trades >= 100) totalPoints += 10;
    if (stats.total_trades >= 500) totalPoints += 25;
    if (stats.total_trades >= 1000) totalPoints += 25;
    
    // P&L Milestones
    if (stats.total_pnl >= 100) totalPoints += 5;
    if (stats.total_pnl >= 1000) totalPoints += 10;
    if (stats.total_pnl >= 5000) totalPoints += 10;
    if (stats.total_pnl >= 10000) totalPoints += 25;
    if (stats.total_pnl >= 50000) totalPoints += 50;
    if (stats.total_pnl >= 100000) totalPoints += 100;
    
    // Win Rate
    if (stats.win_rate >= 50 && stats.total_trades >= 20) totalPoints += 10;
    if (stats.win_rate >= 60 && stats.total_trades >= 50) totalPoints += 25;
    if (stats.win_rate >= 70 && stats.total_trades >= 100) totalPoints += 50;
    if (stats.win_rate >= 80 && stats.total_trades >= 200) totalPoints += 50;
    
    // Streak
    if (stats.best_streak >= 3) totalPoints += 5;
    if (stats.best_streak >= 5) totalPoints += 10;
    if (stats.best_streak >= 10) totalPoints += 10;
    if (stats.best_streak >= 20) totalPoints += 25;
    if (stats.best_streak >= 50) totalPoints += 50;
    
    // Rankings
    if (rank <= 100 && rank > 0) totalPoints += 25;
    if (rank <= 50 && rank > 0) totalPoints += 50;
    if (rank <= 10 && rank > 0) totalPoints += 100;
    if (rank <= 3 && rank > 0) totalPoints += 100;
    if (rank === 1) totalPoints += 200;
    
    // Survival
    if (stats.total_trades >= 50 && stats.times_liquidated === 0) totalPoints += 50;
    if (stats.total_trades >= 100 && stats.times_liquidated === 0) totalPoints += 50;
    if (stats.total_trades >= 500 && stats.times_liquidated === 0) totalPoints += 100;
    
    // Special
    if (stats.total_pnl >= 1000 && stats.times_liquidated > 0) totalPoints += 100;
    if (stats.times_liquidated >= 10 && stats.total_pnl > 0) totalPoints += 100;
    if (stats.win_rate === 100 && stats.total_trades >= 10) totalPoints += 100;
    
    return totalPoints;
  };

  // Get player title based on stats (automatically selects rarest/best)
  const getPlayerTitle = (stats: UserProfile['stats']) => {
    // Fix: Convert rank to number to handle both string and number types from API
    const rank = Number(stats.rank);
    
    if (rank === 1) return { title: 'Battlefield Champion', badge: '👑', color: 'text-yellow-400', rarity: 'Mythic' };
    if (rank <= 3) return { title: 'Legendary Conqueror', badge: '🏆', color: 'text-orange-400', rarity: 'Legendary' };
    if (rank <= 10) return { title: 'Top 10 Elite', badge: '⭐', color: 'text-gray-300', rarity: 'Legendary' };
    if (stats.total_pnl >= 100000) return { title: 'Legendary Profit King', badge: '🏆', color: 'text-purple-400', rarity: 'Legendary' };
    if (stats.total_pnl >= 50000) return { title: 'Whale Trader', badge: '🐋', color: 'text-blue-400', rarity: 'Epic' };
    if (stats.win_rate >= 80 && stats.total_trades >= 200) return { title: 'Precision Expert', badge: '💫', color: 'text-cyan-400', rarity: 'Epic' };
    if (stats.best_streak >= 50) return { title: 'Streak Legend', badge: '🌪️', color: 'text-red-400', rarity: 'Epic' };
    if (stats.total_trades >= 1000) return { title: 'Master Trader', badge: '🌟', color: 'text-yellow-300', rarity: 'Rare' };
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
    { rarity: 'Legendary', color: 'bg-gradient-to-r from-purple-500 to-pink-500', textColor: 'text-purple-400', titles: ['Legendary Conqueror (Top 3)', 'Top 10 Elite (Top 10)', 'Legendary Profit King ($100K+ P&L)'] },
    { rarity: 'Epic', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', textColor: 'text-blue-400', titles: ['Whale Trader ($50K+ P&L)', 'Precision Expert (80%+ WR, 200+ trades)', 'Streak Legend (50+ streak)'] },
    { rarity: 'Rare', color: 'bg-gradient-to-r from-green-500 to-emerald-500', textColor: 'text-green-400', titles: ['Master Trader (1000+ trades)', 'Elite Trader (500+ trades)', 'Moon Walker ($10K+ P&L)'] },
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
        {/* Profile Header */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Top Row: Avatar and User Info */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {profile.user.pfp_url ? (
                <img 
                  src={profile.user.pfp_url} 
                  alt={profile.user.username}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-600 flex-shrink-0"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-slate-600 bg-slate-700 flex items-center justify-center text-3xl sm:text-4xl flex-shrink-0">
                  {getArmyEmoji(profile.user.army)}
                </div>
              )}

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">{profile.user.username}</h1>
                </div>
                <p className="text-gray-400 text-xs sm:text-sm mb-1 sm:mb-2">FID: {profile.user.fid}</p>
                <p className="text-gray-500 text-[10px] sm:text-xs font-mono">
                  {profile.user.wallet_address.slice(0, 6)}...{profile.user.wallet_address.slice(-4)}
                </p>
              </div>
            </div>

            {/* Bottom Row: Player Title and Rank */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Player Title */}
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-gray-400 text-xs mb-2">Player Title</p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-xl sm:text-2xl">{getPlayerTitle(profile.stats).badge}</span>
                  <p className={`text-sm sm:text-md font-bold ${getPlayerTitle(profile.stats).color}`}>
                    {getPlayerTitle(profile.stats).title}
                  </p>
                </div>
              </div>

              {/* Rank Badge */}
              <div className="bg-slate-700 border-2 border-yellow-500 rounded-lg p-3 sm:p-4 text-center">
                <p className="text-gray-400 text-xs mb-1">Rank</p>
                <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{getRankBadge(profile.stats.rank)}</div>
              </div>
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

          {/* Achievement Points */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-1">Achievement Points</p>
            <p className="text-xl font-bold text-yellow-400 flex items-center justify-center gap-2">
              ⭐ {calculateAchievementPoints(profile.stats)}
            </p>
          </div>

          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm mb-1">$BATTLE Earned</p>
            <p className="text-xl font-bold text-purple-400 flex items-center justify-center gap-2">
              <img src="/battlefield-logo.jpg" alt="$BATTLE" className="w-5 h-5 rounded-full" />
              {(profile.stats.battle_tokens_earned / 1000000).toFixed(1)}M
            </p>
          </div>
        </div>

        {/* Volume Tracker */}
        <VolumeTracker walletAddress={profile.user.wallet_address} showUserVolume={true} showExplanation={false} />

        {/* Open Positions & Trading History Side by Side */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Open Positions */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-yellow-400">📊 Open Positions ({profile.openPositions.length})</h2>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto scrollbar-hide">
              {profile.openPositions.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No open positions</p>
              ) : (
                <div className="space-y-3">
                  {profile.openPositions.map((pos: any) => (
                    <div key={pos.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${pos.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                            {pos.position_type === 'long' ? '📈 LONG' : '📉 SHORT'} {pos.leverage}x
                          </span>
                        </div>
                        <div className="text-right">
                          {pos.current_pnl !== undefined ? (
                            <p className={`text-xl font-bold ${pos.current_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pos.current_pnl >= 0 ? '+' : ''}${pos.current_pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-500">P&L: N/A</p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-400">
                        <div>Entry: ${pos.entry_price.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                        <div>Size: ${pos.position_size.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                        <div>Liq: ${pos.liquidation_price.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                        <div>Total: ${(pos.position_size * pos.leverage).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{formatShortDate(pos.opened_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-xl font-bold text-yellow-400">📜 Recent Trades</h2>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto overflow-x-visible scrollbar-hide">
              {profile.recentHistory.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No trading history yet</p>
              ) : (
                <div className="space-y-2">
                  {profile.recentHistory.map((trade) => {
                    const pnl = Number(trade.pnl);
                    const pnlPercentage = (pnl / Number(trade.position_size)) * 100;
                    const isProfit = pnl >= 0;
                    const isLiquidated = trade.status === 'liquidated';

                    const handleCast = async () => {
                      const army = profile.user.army;
                      const armyEmoji = army === 'bears' ? '🐻' : '🐂';
                      const websiteUrl = window.location.origin;
                      
                      // Don't use toLocaleString for URL params - it adds commas that get encoded
                      const params = new URLSearchParams({
                        army,
                        type: trade.position_type,
                        leverage: trade.leverage.toString(),
                        pnl: pnl.toFixed(2),
                        pnlPercent: pnlPercentage.toFixed(1),
                        username: profile.user.username || 'Trader',
                        v: Date.now().toString() // Cache buster
                      });
                      const imageUrl = `${websiteUrl}/api/share-card?${params.toString()}`;
                      
                      // Add liquidation status to share text
                      const statusText = isLiquidated ? '💥 LIQUIDATED' : (isProfit ? 'won' : 'lost');
                      const shareText = `${armyEmoji} Just ${statusText} ${isProfit ? '+' : ''}$${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} on @btcbattle!\n\n${trade.position_type.toUpperCase()} ${trade.leverage}x | ${isProfit ? '+' : ''}${pnlPercentage.toFixed(1)}%${isLiquidated ? ' 💥' : ''}\n\n⚔️ Bears vs Bulls`;

                      // Use Farcaster Frame SDK to open composer
                      try {
                        const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(imageUrl)}`;
                        await sdk.actions.openUrl(castUrl);
                      } catch (error) {
                        console.error('Error casting to Farcaster:', error);
                        // Fallback: try copying to clipboard
                        try {
                          await navigator.clipboard.writeText(shareText);
                          toast.success('Cast text copied to clipboard!');
                        } catch (clipError) {
                          toast.error('❌ Unable to create cast. Please try again.');
                        }
                      }
                    };

                    return (
                      <div
                        key={trade.id}
                        className={`border-2 rounded-lg p-3 relative ${
                          isLiquidated
                            ? 'border-red-900 bg-red-950/30 overflow-hidden'
                            : isProfit
                            ? 'border-green-900 bg-green-950/30 overflow-visible'
                            : 'border-red-700 bg-red-950/20 overflow-visible'
                        }`}
                      >
                        {/* Liquidated Stamp Overlay */}
                        {isLiquidated && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                            <div className="text-red-500 font-black text-2xl opacity-20 rotate-[-15deg] border-4 border-red-500 px-3 py-1.5 rounded">
                              LIQUIDATED
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-2 relative z-20">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${trade.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.position_type === 'long' ? '📈' : '📉'}
                            </span>
                            <span className="text-sm font-bold text-white">
                              {trade.position_type.toUpperCase()} {trade.leverage}x
                            </span>
                          </div>
                          <div className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            <span className="text-xs ml-1">
                              ({isProfit ? '+' : ''}{pnlPercentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                          <div>
                            <span className="text-gray-500">Entry:</span> ${Number(trade.entry_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                          <div>
                            <span className="text-gray-500">Exit:</span> ${Number(trade.exit_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                          <div>
                            <span className="text-gray-500">Size:</span> ${Number(trade.position_size).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {new Date(trade.closed_at).toLocaleString()}
                          </div>
                          <button
                            onClick={handleCast}
                            className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded font-bold transition-all flex items-center gap-1"
                          >
                            🟪 Cast
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Achievement Tab Navigation - 3 Tabs */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setAchievementTab('achievements')}
            className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
              achievementTab === 'achievements'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            Achievements
          </button>
          <button
            onClick={() => setAchievementTab('titles')}
            className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
              achievementTab === 'titles'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            Titles
          </button>
          <button
            onClick={() => setAchievementTab('locked')}
            className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
              achievementTab === 'locked'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            Locked
          </button>
        </div>

        {/* Achievements Content */}
        <div className="bg-slate-800 border-2 border-purple-500 rounded-lg">
          <div className="p-4 border-b border-slate-700">
            <h2 className="text-xl font-bold text-yellow-400">
              {achievementTab === 'achievements' && '🏆 Achievements'}
              {achievementTab === 'titles' && '👑 Player Titles'}
              {achievementTab === 'locked' && '🔒 Locked Achievements'}
            </h2>
          </div>
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {achievementTab === 'achievements' && (
              <Achievements stats={profile.stats} showOnlyUnlocked={true} />
            )}
            {achievementTab === 'titles' && (
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-6 text-center">
                <h3 className="text-sm text-gray-400 mb-2">Current Title</h3>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className="text-4xl">{getPlayerTitle(profile.stats).badge}</span>
                  <h2 className={`text-3xl font-bold ${getPlayerTitle(profile.stats).color}`}>{getPlayerTitle(profile.stats).title}</h2>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm mb-3">
                  <p className="text-gray-400">
                    {calculateAchievementPoints(profile.stats)} / 1485 Achievements (
                    {((calculateAchievementPoints(profile.stats) / 1485) * 100).toFixed(1)}%)
                  </p>
                  <p className="text-yellow-400 font-bold">
                    ⭐ {calculateAchievementPoints(profile.stats)} / 1485 Points
                  </p>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(calculateAchievementPoints(profile.stats) / 1485) * 100}%` }}
                  />
                </div>
              </div>
            )}
            {achievementTab === 'locked' && (
              <Achievements stats={profile.stats} showOnlyLocked={true} />
            )}
          </div>
        </div>

        {/* Full Trading History with Pagination - Button to expand */}
        {profile.pagination.totalPages > 1 && (
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6 text-center">
            <h3 className="text-lg font-bold text-yellow-400 mb-2">
              📜 View Full Trading History ({profile.pagination.totalRecords} total trades)
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Showing recent 10 trades above. Click below to view paginated history.
            </p>
            <div className="flex items-center justify-center gap-2">
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

              <div className="flex gap-2">
                {Array.from({ length: Math.min(profile.pagination.totalPages, 5) }, (_, i) => i + 1).map((page) => (
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
          </div>
        )}
        {/* Footer */}
        <footer className="border-t border-slate-700 mt-12 py-8 text-center text-gray-400 space-y-3 mb-20">
          <p className="text-sm font-bold">⚔️ <strong>BATTLEFIELD</strong> ⚔️</p>
          
          <div className="space-y-2">
            <p className="text-sm">
              Created by{' '}
              <a
                href="https://elalpha.lol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 underline font-semibold"
              >
                elalpha.lol
              </a>
            </p>
            <p className="text-sm">
              Follow on Farcaster:{' '}
              <a
                href="https://warpcast.com/elalpha.eth"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                @elalpha.eth
              </a>
              {' • '}
              <a
                href="https://warpcast.com/btcbattle"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300"
              >
                @btcbattle
              </a>
            </p>
            <p className="text-sm text-purple-400 font-semibold">
              Launching on Clanker.world
            </p>
          </div>
          
          <div className="pt-4 border-t border-slate-800">
            <p className="text-xs text-gray-500">
              ⚠️ Paper trading only. No real funds at risk. High leverage trading is educational.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This is a game. Trade responsibly. DYOR.
            </p>
          </div>
        </footer>
      </div>

      {/* Bottom Navigation - 5 buttons: Leaders, Battle, Profile, Trade, Learn */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-slate-700 z-50">
        <div className="container mx-auto px-2">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => router.push('/battlefield?tab=leaderboard')}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">🏆</span>
              <span className="text-xs font-bold">Leaders</span>
            </button>
            
            <button
              onClick={() => router.push('/battle')}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">⚔️</span>
              <span className="text-xs font-bold">Battle</span>
            </button>
            
            <button
              className="flex flex-col items-center gap-1 px-2 py-1 -mt-4"
            >
              <div className="w-12 h-12 rounded-full border-2 border-yellow-400 bg-slate-800 overflow-hidden flex items-center justify-center">
                {profile.user.pfp_url ? (
                  <img src={profile.user.pfp_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <img src="/battlefield-logo.jpg" alt="Profile" className="w-full h-full object-cover" />
                )}
              </div>
              <span className="text-[10px] font-bold text-yellow-400">Profile</span>
            </button>
            
            <button
              onClick={() => router.push('/battlefield')}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-bold">Trade</span>
            </button>
            
            <button
              onClick={() => router.push('/learn')}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">📚</span>
              <span className="text-xs font-bold">Learn</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
