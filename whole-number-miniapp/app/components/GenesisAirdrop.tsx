'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../config/api';
import { Avatar } from './Avatar';

interface AirdropUser {
  id: number;
  fid: number;
  username: string;
  pfp_url: string;
  wallet_address: string;
  army: 'bears' | 'bulls';
  total_trades: number;
  winning_trades: number;
  referral_count: number;
  confirmed_referrals: number; // Only counts referrals where BOTH users confirmed
}

interface TierConfig {
  name: string;
  emoji: string;
  minTrades?: number;
  maxTrades?: number;
  minReferrals?: number;
  maxUsers: number;
  perUser: string;
  totalPool: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const TIERS: TierConfig[] = [
  {
    name: 'Ambassador',
    emoji: '🏆',
    minReferrals: 5,
    maxUsers: 20,
    perUser: '50M',
    totalPool: '1B',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20',
    borderColor: 'border-purple-500',
  },
  {
    name: 'OG',
    emoji: '🔥',
    minTrades: 100,
    maxUsers: 50,
    perUser: '40M',
    totalPool: '2B',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20',
    borderColor: 'border-orange-500',
  },
  {
    name: 'Veteran',
    emoji: '⚔️',
    minTrades: 25,
    maxTrades: 99,
    maxUsers: 100,
    perUser: '12.5M',
    totalPool: '1.25B',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20',
    borderColor: 'border-blue-500',
  },
  {
    name: 'Recruit',
    emoji: '🛡️',
    minTrades: 5,
    maxTrades: 24,
    maxUsers: 330,
    perUser: '2.27M',
    totalPool: '750M',
    color: 'text-green-400',
    bgColor: 'bg-green-900/20',
    borderColor: 'border-green-500',
  },
];

export function GenesisAirdrop() {
  const { address: wagmiAddress } = useAccount();
  const router = useRouter();
  const [users, setUsers] = useState<AirdropUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [farcasterWallet, setFarcasterWallet] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<{
    trades: number;
    referrals: number;
    // Ambassador tier (based on referrals)
    ambassadorTier: {
      qualified: boolean;
      rank: number | null;
      secured: boolean;
    } | null;
    // Trading tier (OG, Veteran, or Recruit based on trades)
    tradingTier: {
      name: string;
      rank: number;
      secured: boolean;
    } | null;
    // Next tier info for trading
    nextTradingTier: string | null;
    tradesNeeded: number;
    // How many more referrals needed for Ambassador
    referralsNeeded: number;
  } | null>(null);

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
    fetchAirdropData();
    const interval = setInterval(fetchAirdropData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAirdropData = async () => {
    try {
      // Fetch all users with their stats
      const response = await fetch(getApiUrl('api/leaderboard?limit=500'));
      const data = await response.json();

      if (data.success) {
        setUsers(data.leaderboard);
      }
    } catch (error) {
      console.error('Error fetching airdrop data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate user's status - now tracks both Ambassador AND Trading tier
  useEffect(() => {
    if (!address || users.length === 0) {
      setUserStatus(null);
      return;
    }

    const currentUser = users.find(
      (u) => u.wallet_address.toLowerCase() === address.toLowerCase()
    );

    if (!currentUser) {
      setUserStatus({
        trades: 0,
        referrals: 0,
        ambassadorTier: null,
        tradingTier: null,
        nextTradingTier: 'Recruit',
        tradesNeeded: 5,
        referralsNeeded: 5,
      });
      return;
    }

    // Calculate Ambassador tier (based on CONFIRMED referrals - where both parties claimed)
    // Use confirmed_referrals (both users claimed) instead of referral_count (total referrals)
    const confirmedRefs = Number(currentUser.confirmed_referrals) || 0;
    let ambassadorTier = null;
    if (confirmedRefs >= 5) {
      const ambassadors = users
        .filter((u) => (Number(u.confirmed_referrals) || 0) >= 5)
        .sort((a, b) => (Number(b.confirmed_referrals) || 0) - (Number(a.confirmed_referrals) || 0));
      const ambassadorRank = ambassadors.findIndex(
        (u) => u.wallet_address.toLowerCase() === currentUser.wallet_address.toLowerCase()
      ) + 1;
      ambassadorTier = {
        qualified: true,
        rank: ambassadorRank,
        secured: ambassadorRank <= 20,
      };
    }

    // Calculate Trading tier (OG, Veteran, or Recruit - based on trades)
    let tradingTier = null;
    let nextTradingTier: string | null = null;
    let tradesNeeded = 0;

    if (currentUser.total_trades >= 100) {
      // OG tier
      const ogs = users
        .filter((u) => u.total_trades >= 100)
        .sort((a, b) => b.total_trades - a.total_trades);
      const ogRank = ogs.findIndex(
        (u) => u.wallet_address.toLowerCase() === currentUser.wallet_address.toLowerCase()
      ) + 1;
      tradingTier = { name: 'OG', rank: ogRank, secured: ogRank <= 50 };
      nextTradingTier = null;
      tradesNeeded = 0;
    } else if (currentUser.total_trades >= 25) {
      // Veteran tier
      const veterans = users
        .filter((u) => u.total_trades >= 25 && u.total_trades < 100)
        .sort((a, b) => b.total_trades - a.total_trades);
      const vetRank = veterans.findIndex(
        (u) => u.wallet_address.toLowerCase() === currentUser.wallet_address.toLowerCase()
      ) + 1;
      tradingTier = { name: 'Veteran', rank: vetRank, secured: vetRank <= 100 };
      nextTradingTier = 'OG';
      tradesNeeded = 100 - currentUser.total_trades;
    } else if (currentUser.total_trades >= 5) {
      // Recruit tier
      const recruits = users
        .filter((u) => u.total_trades >= 5 && u.total_trades < 25)
        .sort((a, b) => b.total_trades - a.total_trades);
      const recruitRank = recruits.findIndex(
        (u) => u.wallet_address.toLowerCase() === currentUser.wallet_address.toLowerCase()
      ) + 1;
      tradingTier = { name: 'Recruit', rank: recruitRank, secured: recruitRank <= 330 };
      nextTradingTier = 'Veteran';
      tradesNeeded = 25 - currentUser.total_trades;
    } else {
      // Not qualified for any trading tier
      nextTradingTier = 'Recruit';
      tradesNeeded = 5 - currentUser.total_trades;
    }

    setUserStatus({
      trades: currentUser.total_trades,
      referrals: confirmedRefs, // Show confirmed referrals (both parties claimed)
      ambassadorTier,
      tradingTier,
      nextTradingTier,
      tradesNeeded,
      referralsNeeded: Math.max(0, 5 - confirmedRefs),
    });
  }, [address, users]);

  const calculateUserTierStatus = (
    user: AirdropUser,
    allUsers: AirdropUser[]
  ): {
    tier: string | null;
    rank: number | null;
    secured: boolean;
    nextTier: string | null;
    tradesNeeded: number;
  } => {
    // Check Ambassador first (referrals)
    if (user.referral_count >= 5) {
      const ambassadors = allUsers
        .filter((u) => u.referral_count >= 5)
        .sort((a, b) => b.referral_count - a.referral_count);
      const rank = ambassadors.findIndex(
        (u) => u.wallet_address.toLowerCase() === user.wallet_address.toLowerCase()
      ) + 1;
      return {
        tier: 'Ambassador',
        rank,
        secured: rank <= 20,
        nextTier: null,
        tradesNeeded: 0,
      };
    }

    // Check OG (100+ trades)
    if (user.total_trades >= 100) {
      const ogs = allUsers
        .filter((u) => u.total_trades >= 100)
        .sort((a, b) => b.total_trades - a.total_trades);
      const rank = ogs.findIndex(
        (u) => u.wallet_address.toLowerCase() === user.wallet_address.toLowerCase()
      ) + 1;
      return {
        tier: 'OG',
        rank,
        secured: rank <= 50,
        nextTier: 'Ambassador',
        tradesNeeded: 0, // Need referrals, not trades
      };
    }

    // Check Veteran (25-99 trades)
    if (user.total_trades >= 25) {
      const veterans = allUsers
        .filter((u) => u.total_trades >= 25 && u.total_trades < 100)
        .sort((a, b) => b.total_trades - a.total_trades);
      const rank = veterans.findIndex(
        (u) => u.wallet_address.toLowerCase() === user.wallet_address.toLowerCase()
      ) + 1;
      return {
        tier: 'Veteran',
        rank,
        secured: rank <= 100,
        nextTier: 'OG',
        tradesNeeded: 100 - user.total_trades,
      };
    }

    // Check Recruit (5-24 trades)
    if (user.total_trades >= 5) {
      const recruits = allUsers
        .filter((u) => u.total_trades >= 5 && u.total_trades < 25)
        .sort((a, b) => b.total_trades - a.total_trades);
      const rank = recruits.findIndex(
        (u) => u.wallet_address.toLowerCase() === user.wallet_address.toLowerCase()
      ) + 1;
      return {
        tier: 'Recruit',
        rank,
        secured: rank <= 330,
        nextTier: 'Veteran',
        tradesNeeded: 25 - user.total_trades,
      };
    }

    // Not qualified
    return {
      tier: null,
      rank: null,
      secured: false,
      nextTier: 'Recruit',
      tradesNeeded: 5 - user.total_trades,
    };
  };

  const getTierUsers = (tierName: string): AirdropUser[] => {
    switch (tierName) {
      case 'Ambassador':
        // Use confirmed_referrals (both parties claimed) for Ambassador tier
        return users
          .filter((u) => (Number(u.confirmed_referrals) || 0) >= 5)
          .sort((a, b) => (Number(b.confirmed_referrals) || 0) - (Number(a.confirmed_referrals) || 0));
      case 'OG':
        return users
          .filter((u) => u.total_trades >= 100)
          .sort((a, b) => b.total_trades - a.total_trades);
      case 'Veteran':
        return users
          .filter((u) => u.total_trades >= 25 && u.total_trades < 100)
          .sort((a, b) => b.total_trades - a.total_trades);
      case 'Recruit':
        return users
          .filter((u) => u.total_trades >= 5 && u.total_trades < 25)
          .sort((a, b) => b.total_trades - a.total_trades);
      default:
        return [];
    }
  };

  const getTierConfig = (tierName: string): TierConfig | undefined => {
    return TIERS.find((t) => t.name === tierName);
  };

  if (loading) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🎖️</div>
          <p className="text-gray-400">Loading airdrop status...</p>
        </div>
      </div>
    );
  }

  // Check if user has any tier secured
  const hasAnySecured = userStatus?.ambassadorTier?.secured || userStatus?.tradingTier?.secured;
  const hasAnyTier = userStatus?.ambassadorTier || userStatus?.tradingTier;

  return (
    <div className="space-y-6">
      {/* User's Airdrop Status */}
      {userStatus && (
        <div
          className={`rounded-xl p-6 border-2 ${
            hasAnySecured
              ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 border-green-500'
              : hasAnyTier
              ? 'bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-500'
              : 'bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600'
          }`}
        >
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-yellow-400 mb-1">
              🎖️ YOUR GENESIS AIRDROP STATUS
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{userStatus.trades}</p>
              <p className="text-xs text-gray-400">Trades</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">{userStatus.referrals}</p>
              <p className="text-xs text-gray-400">Referrals</p>
            </div>
          </div>

          {/* Show both tiers if qualified */}
          {(userStatus.ambassadorTier || userStatus.tradingTier) ? (
            <>
              {/* Ambassador Tier (Referrals) */}
              {userStatus.ambassadorTier && (
                <div className={`rounded-lg p-4 mb-3 ${
                  userStatus.ambassadorTier.secured
                    ? 'bg-purple-900/40 border border-purple-500'
                    : 'bg-purple-900/20 border border-purple-500/50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Ambassador Tier:</span>
                    <span className="font-bold text-lg text-purple-400">
                      🏆 Ambassador
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Rank:</span>
                    <span className="font-bold text-white">
                      #{userStatus.ambassadorTier.rank} of 20
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Reward:</span>
                    <span className="font-bold text-yellow-400">50M $BATTLE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    {userStatus.ambassadorTier.secured ? (
                      <span className="font-bold text-green-400">✅ SECURED</span>
                    ) : (
                      <span className="font-bold text-yellow-400">⚠️ AT RISK</span>
                    )}
                  </div>
                </div>
              )}

              {/* Trading Tier (OG/Veteran/Recruit) */}
              {userStatus.tradingTier && (
                <div className={`rounded-lg p-4 mb-3 ${
                  userStatus.tradingTier.secured
                    ? `${getTierConfig(userStatus.tradingTier.name)?.bgColor} border ${getTierConfig(userStatus.tradingTier.name)?.borderColor}`
                    : 'bg-slate-900/50 border border-slate-600'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Trading Tier:</span>
                    <span className={`font-bold text-lg ${getTierConfig(userStatus.tradingTier.name)?.color}`}>
                      {getTierConfig(userStatus.tradingTier.name)?.emoji} {userStatus.tradingTier.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Rank:</span>
                    <span className="font-bold text-white">
                      #{userStatus.tradingTier.rank} of {getTierConfig(userStatus.tradingTier.name)?.maxUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">Reward:</span>
                    <span className="font-bold text-yellow-400">{getTierConfig(userStatus.tradingTier.name)?.perUser} $BATTLE</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Status:</span>
                    {userStatus.tradingTier.secured ? (
                      <span className="font-bold text-green-400">✅ SECURED</span>
                    ) : (
                      <span className="font-bold text-yellow-400">⚠️ AT RISK</span>
                    )}
                  </div>
                </div>
              )}

              {/* Stacking bonus indicator */}
              {userStatus.ambassadorTier && userStatus.tradingTier && (
                <div className="bg-gradient-to-r from-yellow-900/30 to-green-900/30 border border-yellow-500/50 rounded-lg p-3 mb-3">
                  <p className="text-sm text-yellow-400 font-bold text-center">
                    🎉 STACKING BONUS! You qualify for BOTH tiers!
                  </p>
                  <p className="text-xs text-gray-300 text-center mt-1">
                    Total: {userStatus.ambassadorTier.secured && userStatus.tradingTier.secured
                      ? `50M + ${getTierConfig(userStatus.tradingTier.name)?.perUser} = ${
                          userStatus.tradingTier.name === 'OG' ? '90M' :
                          userStatus.tradingTier.name === 'Veteran' ? '62.5M' : '52.27M'
                        } $BATTLE`
                      : 'Secure both tiers to lock in rewards!'}
                  </p>
                </div>
              )}

              {/* Next tier progress */}
              {userStatus.nextTradingTier && userStatus.tradesNeeded > 0 && (
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                  <p className="text-sm text-blue-400">
                    <strong>Next Trading Tier:</strong> {getTierConfig(userStatus.nextTradingTier)?.emoji}{' '}
                    {userStatus.nextTradingTier} (need {userStatus.tradesNeeded} more trades)
                  </p>
                </div>
              )}

              {/* Ambassador bonus prompt if not already ambassador */}
              {!userStatus.ambassadorTier && (
                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 mt-3">
                  <p className="text-sm text-purple-400">
                    <strong>🏆 Ambassador Bonus:</strong> Refer {userStatus.referralsNeeded} more friends for extra 50M $BATTLE!
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 font-bold mb-1">❌ NOT QUALIFIED YET</p>
              <p className="text-sm text-gray-300 mb-2">
                Need {userStatus.tradesNeeded} more trades to qualify for {userStatus.nextTradingTier} tier
              </p>
              {userStatus.referralsNeeded > 0 && (
                <p className="text-sm text-purple-400">
                  Or refer {userStatus.referralsNeeded} friends for Ambassador tier!
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tier Progress Overview */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 text-center">
          📊 Tier Progress
        </h3>
        <div className="space-y-3">
          {TIERS.map((tier) => {
            const tierUsers = getTierUsers(tier.name);
            const filled = Math.min(tierUsers.length, tier.maxUsers);
            const percentage = (filled / tier.maxUsers) * 100;
            const isFull = filled >= tier.maxUsers;

            return (
              <div key={tier.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className={tier.color}>
                    {tier.emoji} {tier.name} ({tier.maxUsers} spots)
                  </span>
                  <span className={isFull ? 'text-red-400 font-bold' : 'text-gray-400'}>
                    {filled}/{tier.maxUsers} {isFull && 'FULL'}
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isFull ? 'bg-red-500' : tier.borderColor.replace('border-', 'bg-')
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tier Selection */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedTier('all')}
          className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
            selectedTier === 'all'
              ? 'bg-yellow-500 text-slate-900'
              : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
          }`}
        >
          All Tiers
        </button>
        {TIERS.map((tier) => (
          <button
            key={tier.name}
            onClick={() => setSelectedTier(tier.name)}
            className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
              selectedTier === tier.name
                ? `${tier.bgColor} ${tier.color} border-2 ${tier.borderColor}`
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            {tier.emoji} {tier.name}
          </button>
        ))}
      </div>

      {/* Tier Details & Leaderboard */}
      {selectedTier === 'all' ? (
        <div className="space-y-6">
          {TIERS.map((tier) => (
            <TierSection
              key={tier.name}
              tier={tier}
              users={getTierUsers(tier.name)}
              address={address}
              router={router}
            />
          ))}
        </div>
      ) : (
        <TierSection
          tier={getTierConfig(selectedTier)!}
          users={getTierUsers(selectedTier)}
          address={address}
          router={router}
          expanded
        />
      )}

      {/* Airdrop Info */}
      <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-lg p-4">
        <h3 className="text-lg font-bold text-yellow-400 mb-3">💎 Genesis Airdrop Details</h3>
        <div className="space-y-2 text-sm text-gray-300">
          <p>
            <strong className="text-white">Total Pool:</strong> 5B $BATTLE tokens (5% of supply)
          </p>
          <p>
            <strong className="text-white">Max Recipients:</strong> 500 users across all tiers
          </p>
          <p>
            <strong className="text-white">Stacking:</strong> Ambassador bonus stacks with trading
            tiers! (Max: 90M tokens)
          </p>
          <p className="text-yellow-400 font-bold mt-3">
            Leftovers go to community vote: BURN or boost weekly rewards
          </p>
        </div>
      </div>
    </div>
  );
}

function TierSection({
  tier,
  users,
  address,
  router,
  expanded = false,
}: {
  tier: TierConfig;
  users: AirdropUser[];
  address: string | undefined;
  router: ReturnType<typeof useRouter>;
  expanded?: boolean;
}) {
  const displayUsers = expanded ? users : users.slice(0, 5);
  const isAmbassador = tier.name === 'Ambassador';

  return (
    <div className={`${tier.bgColor} border-2 ${tier.borderColor} rounded-lg overflow-hidden`}>
      {/* Tier Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-xl font-bold ${tier.color}`}>
              {tier.emoji} {tier.name}
            </h3>
            <p className="text-xs text-gray-400">
              {isAmbassador
                ? `${tier.minReferrals}+ referrals`
                : tier.maxTrades
                ? `${tier.minTrades}-${tier.maxTrades} trades`
                : `${tier.minTrades}+ trades`}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${tier.color}`}>{tier.perUser}</p>
            <p className="text-xs text-gray-400">per user</p>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="divide-y divide-slate-700/30">
        {users.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            <p>No users qualified yet</p>
            <p className="text-sm mt-1">Be the first to reach this tier!</p>
          </div>
        ) : (
          displayUsers.map((user, index) => {
            const rank = index + 1;
            const isUserEntry =
              address && user.wallet_address.toLowerCase() === address.toLowerCase();
            const isSecured = rank <= tier.maxUsers;

            return (
              <div
                key={user.wallet_address}
                onClick={() => router.push(`/profile/${user.fid || user.wallet_address}`)}
                className={`p-3 flex items-center gap-3 hover:bg-slate-800/50 cursor-pointer transition-all ${
                  isUserEntry ? 'bg-blue-900/20' : ''
                }`}
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {rank <= 3 ? (
                    <span className="text-lg">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-gray-400 font-bold">#{rank}</span>
                  )}
                </div>

                {/* Avatar */}
                <Avatar
                  pfpUrl={user.pfp_url}
                  username={user.username}
                  army={user.army}
                  winningTrades={user.winning_trades}
                  size="sm"
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white truncate">
                      {user.username || `Trader${user.fid}`}
                    </span>
                    {isUserEntry && (
                      <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
                        YOU
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <p className={`font-bold ${tier.color}`}>
                    {isAmbassador ? `${user.referral_count} refs` : `${user.total_trades} trades`}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {isSecured ? (
                      <span className="text-green-400">✅ Secured</span>
                    ) : (
                      <span className="text-red-400">❌ Over cap</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Show more link */}
      {!expanded && users.length > 5 && (
        <div className="p-3 text-center border-t border-slate-700/30">
          <p className="text-sm text-gray-400">
            +{users.length - 5} more users in this tier
          </p>
        </div>
      )}
    </div>
  );
}
