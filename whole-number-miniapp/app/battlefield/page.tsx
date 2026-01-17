'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../config/api';
import sdk from '@farcaster/miniapp-sdk';
import toast from 'react-hot-toast';
import { WalletConnect } from '../components/WalletConnect';
import { PaperMoneyClaim } from '../components/PaperMoneyClaim';
import { TradingPanel } from '../components/TradingPanel';
import { Leaderboard } from '../components/Leaderboard';
import { BattlefieldVisual } from '../components/BattlefieldVisual';
import { UserStats } from '../components/UserStats';
import { TradeHistory } from '../components/TradeHistory';
import { WholeNumberStrategy as StrategyGuide } from '../components/WholeNumberStrategy';
import { MarketCycle } from '../components/MarketCycle';
import { BattleAlerts } from '../components/BattleAlerts';
import { VolumeTracker } from '../components/VolumeTracker';
import { ArmyBattleStatus } from '../components/ArmyBattleStatus';
import { ArmySelection } from '../components/ArmySelection';
import { NotificationManager } from '../components/NotificationManager';
import { Missions } from '../components/Missions';
import { Avatar } from '../components/Avatar';
import { GenesisAirdrop } from '../components/GenesisAirdrop';
import { Referrals } from '../components/Referrals';
import { useBTCPrice } from '../hooks/useBTCPrice';
import { useAchievementDetector } from '../hooks/useAchievementDetector';
import { WholeNumberStrategy } from '../lib/strategy';

interface UserData {
  id: number;
  fid: number;
  wallet_address: string;
  username: string;
  pfp_url: string;
  army: 'bears' | 'bulls';
  paper_balance: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  battle_tokens_earned: number;
}

export default function BattlefieldHome() {
  const router = useRouter();
  const { address: wagmiAddress } = useAccount();
  const { price: btcPrice, isLoading } = useBTCPrice(5000);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'trade' | 'leaderboard' | 'battle' | 'missions' | 'airdrop' | 'referrals'>('trade');
  const [battleSection, setBattleSection] = useState<'market' | 'status' | 'predictions' | 'strategy' | 'tips'>('market');
  const [strategy] = useState(() => new WholeNumberStrategy());
  const [farcasterWallet, setFarcasterWallet] = useState<string | null>(null);
  const [previousUserData, setPreviousUserData] = useState<UserData | null>(null);

  // Stopped/liquidated trade notification state
  const [stoppedTradeInfo, setStoppedTradeInfo] = useState<{
    pnl: number;
    isLiquidated: boolean;
    isStopLoss: boolean;
  } | null>(null);

  // Use Farcaster wallet if available, otherwise use wagmi wallet
  const address = farcasterWallet || wagmiAddress;

  // Check URL params on mount to set initial tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'leaderboard') {
      setActiveTab('leaderboard');
    } else if (tab === 'battle' || tab === 'learn') {
      setActiveTab('battle');
      // If coming from learn, show strategy section
      if (tab === 'learn') {
        setBattleSection('strategy');
      }
    } else if (tab === 'missions') {
      setActiveTab('missions');
    } else if (tab === 'airdrop') {
      setActiveTab('airdrop');
    } else if (tab === 'referrals') {
      setActiveTab('referrals');
    }
  }, []);

  // Track if we've already tried to apply the referral code this session
  const [referralApplied, setReferralApplied] = useState(false);

  // Handle referral code from URL or localStorage - auto-apply when wallet connected (ONCE)
  useEffect(() => {
    // Only run once per session
    if (referralApplied) return;

    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('referral') || localStorage.getItem('pendingReferral');

    if (!refCode) return;

    // Store the referral code for later use (in case user disconnects)
    localStorage.setItem('pendingReferral', refCode);
    console.log('📝 Referral code captured:', refCode);

    // Check if user has a connected wallet
    if (address && userData) {
      // Mark as applied to prevent duplicate calls
      setReferralApplied(true);

      // User is connected - auto-apply the referral code
      const applyReferral = async () => {
        try {
          const response = await fetch(getApiUrl('api/referrals/apply'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress: userData.wallet_address,
              referralCode: refCode
            })
          });

          const data = await response.json();

          if (data.success) {
            toast.success(data.message, { duration: 5000 });
            // Clear the pending referral
            localStorage.removeItem('pendingReferral');
            // Clear the URL param
            if (params.get('ref') || params.get('referral')) {
              window.history.replaceState({}, '', '/battlefield');
            }
          } else {
            // Only show error if it's not "already referred" (silent fail for that)
            if (!data.message?.includes('already been referred')) {
              toast.error(data.message || 'Failed to apply referral code');
            }
            // Clear pending referral for permanent error conditions
            // (already referred, invalid code, circular referral, own code)
            if (data.message?.includes('already been referred') ||
                data.message?.includes('Invalid referral code') ||
                data.message?.includes('cannot use a referral code from someone') ||
                data.message?.includes('cannot use your own')) {
              localStorage.removeItem('pendingReferral');
              // Also clear the URL param
              window.history.replaceState({}, '', '/battlefield');
            }
          }
        } catch (error) {
          console.error('Error applying referral:', error);
          // Reset so user can try again
          setReferralApplied(false);
        }
      };

      applyReferral();
    } else if (!address) {
      // No wallet connected - show toast notification (only once)
      if (!sessionStorage.getItem('referralToastShown')) {
        toast('🔗 Connect your wallet first to use the referral code!', {
          duration: 5000,
          icon: '👛',
        });
        sessionStorage.setItem('referralToastShown', 'true');
      }
    }
  }, [address, userData, referralApplied]);

  // Achievement detection - convert userData to UserStats format
  useAchievementDetector(
    userData ? {
      total_trades: userData.total_trades,
      total_pnl: userData.total_pnl,
      winning_trades: userData.winning_trades,
      win_rate: userData.total_trades > 0 ? (userData.winning_trades / userData.total_trades) * 100 : 0,
      current_streak: userData.current_streak,
      best_streak: userData.best_streak,
      times_liquidated: userData.times_liquidated,
      rank: null, // Will need to fetch rank separately
    } : null,
    previousUserData ? {
      total_trades: previousUserData.total_trades,
      total_pnl: previousUserData.total_pnl,
      winning_trades: previousUserData.winning_trades,
      win_rate: previousUserData.total_trades > 0 ? (previousUserData.winning_trades / previousUserData.total_trades) * 100 : 0,
      current_streak: previousUserData.current_streak,
      best_streak: previousUserData.best_streak,
      times_liquidated: previousUserData.times_liquidated,
      rank: null,
    } : null
  );

  const handleExternalLink = async (url: string) => {
    // Always try SDK first - it will only work in Farcaster miniapp
    try {
      await sdk.actions.openUrl(url);
      console.log('✅ Opened via Farcaster SDK');
    } catch (error) {
      // SDK failed (desktop browser) - use regular window.open
      console.log('⚠️ SDK failed, using window.open:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Initialize Farcaster and get wallet address
  useEffect(() => {
    const initFarcaster = async () => {
      try {
        console.log('🔍 Initializing Farcaster...');
        const { farcasterAuth } = await import('../lib/farcaster');
        const initialized = await farcasterAuth.initialize();
        console.log('Farcaster initialized:', initialized);
        
        if (farcasterAuth.isInFarcasterFrame()) {
          console.log('✅ Running in Farcaster Frame');
          const signInResult = await farcasterAuth.signInWithFarcaster();
          console.log('Sign in result:', signInResult);
          
          if (signInResult && signInResult.walletAddress) {
            console.log('✅ Farcaster wallet detected:', signInResult.walletAddress);
            setFarcasterWallet(signInResult.walletAddress);
          } else {
            console.warn('⚠️ No wallet address in Farcaster sign-in result');
          }
        } else {
          console.log('⚠️ Not in Farcaster Frame');
        }
      } catch (error) {
        console.error('❌ Farcaster initialization error:', error);
      }
    };
    
    initFarcaster();
  }, []);

  // Update strategy with new price
  useEffect(() => {
    if (btcPrice > 0) {
      strategy.updatePrice(btcPrice);
    }
  }, [btcPrice, strategy]);

  // Calculate strategy values
  const coordinate = useMemo(() => strategy.getCoordinate(btcPrice), [btcPrice, strategy]);
  const wholeNumber = useMemo(() => strategy.getWholeNumber(btcPrice), [btcPrice, strategy]);
  const nextWholeNumber = useMemo(() => strategy.getNextWholeNumber(btcPrice), [btcPrice, strategy]);
  const zoneInfo = useMemo(() => strategy.getZoneInfo(coordinate), [coordinate, strategy]);
  const direction = useMemo(() => strategy.getMarketDirection(), [btcPrice, strategy]);
  const recommendation = useMemo(() => strategy.getRecommendedAction(coordinate, direction), [coordinate, direction, btcPrice, strategy]);

  // Check beams
  useEffect(() => {
    if (btcPrice > 0) {
      strategy.checkBeams(coordinate, wholeNumber);
    }
  }, [btcPrice, coordinate, wholeNumber, strategy]);

  // Fetch or create user when wallet connects
  const fetchUserData = useCallback(async () => {
    if (!address) {
      setUserData(null);
      setPreviousUserData(null);
      return;
    }

    try {
      // Try to get existing user
      const response = await fetch(getApiUrl(`api/users/${address}`));
      const data = await response.json();

      if (data.success) {
        // Save previous data before updating (for achievement detection)
        setUserData(prevData => {
          setPreviousUserData(prevData);
          return data.user;
        });
      } else {
        // No user found - try to get Farcaster data
        const { farcasterAuth } = await import('../lib/farcaster');
        const farcasterUser = await farcasterAuth.getFarcasterUser();

        let fid, username, pfpUrl;
        
        if (farcasterUser) {
          // Use real Farcaster data (ONLY in Farcaster mini app)
          fid = farcasterUser.fid;
          username = farcasterUser.username || farcasterUser.displayName || `User${farcasterUser.fid}`;
          pfpUrl = farcasterUser.pfpUrl || '';
          console.log('✅ Creating user with Farcaster data:', { fid, username, pfpUrl });
        } else {
          // For regular wallet users (desktop/mobile browser - NO Farcaster)
          fid = null; // NULL for non-Farcaster users
          username = `Trader${address.slice(2, 8)}`; // Use wallet address for username
          pfpUrl = '/battlefield-logo.jpg'; // Generic game PFP
          console.log('⚠️ Creating regular wallet user (no Farcaster):', { fid, username, pfpUrl });
        }

        // Check for pending referral code
        const pendingReferral = typeof window !== 'undefined' ? localStorage.getItem('pendingReferral') : null;

        // Create new user
        const createResponse = await fetch(getApiUrl('api/users'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid,
            walletAddress: address,
            username,
            pfpUrl,
            army: 'bulls', // Default army for backend
            referralCode: pendingReferral // Pass referral code if present
          })
        });

        const createData = await createResponse.json();
        if (createData.success) {
          // For new users, no previous data
          setPreviousUserData(null);
          setUserData(createData.user);
          console.log('✅ User created successfully:', createData.user);
          // Clear pending referral after successful creation
          if (pendingReferral) {
            localStorage.removeItem('pendingReferral');
            console.log('✅ Referral code applied:', pendingReferral);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [address]);

  useEffect(() => {
    // Data fetching on address change is intentional
    // eslint-disable-next-line
    fetchUserData();
  }, [address, fetchUserData]);

  // Auto-liquidate positions when price updates
  useEffect(() => {
    if (btcPrice > 0) {
      const checkLiquidations = async () => {
        try {
          const response = await fetch(getApiUrl('api/trades/auto-liquidate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPrice: btcPrice })
          });

          const data = await response.json();

          // Show notification for liquidated trades
          if (data.success && data.liquidatedCount > 0) {
            console.log(`💥 Auto-liquidated ${data.liquidatedCount} position(s)`);
            // Show notification for the first liquidated trade
            const trade = data.liquidatedTrades[0];
            setStoppedTradeInfo({
              pnl: -trade.loss, // Loss is positive, so negate for display
              isLiquidated: true,
              isStopLoss: false
            });
            // Refresh user data if any liquidations occurred
            if (address) {
              fetchUserData();
            }
          }

          // Show notification for stopped trades (stop loss triggered)
          if (data.success && data.stoppedCount > 0) {
            console.log(`🛑 Stop loss triggered for ${data.stoppedCount} position(s)`);
            // Show notification for the first stopped trade
            const trade = data.stoppedTrades[0];
            setStoppedTradeInfo({
              pnl: trade.pnl,
              isLiquidated: false,
              isStopLoss: true
            });
            // Refresh user data
            if (address) {
              fetchUserData();
            }
          }
        } catch (error) {
          console.error('Error checking liquidations:', error);
        }
      };

      checkLiquidations();
    }
  }, [btcPrice, address, fetchUserData]);

  const handleArmyChange = (army: 'bears' | 'bulls') => {
    if (userData) {
      setUserData({ ...userData, army });
    }
  };

  const handleClaim = (newBalance: number) => {
    if (userData) {
      setUserData({ ...userData, paper_balance: newBalance });
    }
  };

  const handleTradeComplete = () => {
    // Refresh user data after trade
    fetchUserData();
  };

  const scrollToTrading = () => {
    const tradingSection = document.getElementById('trading-section');
    if (tradingSection) {
      tradingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Notification System */}
      <NotificationManager />

      {/* Header */}
      <header className="border-b-2 border-yellow-500/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink min-w-0">
              <img 
                src="/battlefield-logo.jpg" 
                alt="BATTLEFIELD Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 rounded-lg object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-yellow-400 truncate">
                  <strong>BATTLEFIELD</strong>
                </h1>
              </div>
            </div>
            <div className="flex-shrink-0">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-7xl pb-24">
        {/* BTC Price with Volume - Only show on Trade tab */}
        {activeTab === 'trade' && (
          <div className="bg-slate-800 rounded-lg px-4 py-3 mb-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl md:text-4xl font-bold text-yellow-400">
                  {isLoading ? '...' : `$${Math.floor(btcPrice).toLocaleString()}`}
                </div>
                <span className="text-sm text-gray-400 font-medium">BTC</span>
              </div>
              {/* Minimal Volume Display */}
              <VolumeTracker walletAddress={address} showUserVolume={false} showExplanation={false} minimal={true} />
            </div>
          </div>
        )}

        {/* Content Based on Active Tab */}
        {activeTab === 'trade' ? (
          <div>
            {/* Demo Mode Warning if no wallet */}
            {!address && (
              <div className="bg-yellow-900/30 border-2 border-yellow-500 rounded-lg p-6 mb-6">
                <h3 className="text-2xl font-bold text-yellow-400 mb-2">📱 Connect Wallet to Play</h3>
                <p className="text-gray-300 mb-4">
                  This game requires wallet connection. Click &quot;Connect Wallet&quot; above to start with $10,000 paper money!
                </p>
                <p className="text-sm text-gray-400">
                  Note: Full game requires Farcaster Frame integration for real user profiles.
                </p>
              </div>
            )}

            {/* If connected but no balance, show get started button */}
            {address && userData && userData.paper_balance === 0 && (
              <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-6 mb-6 text-center">
                <h3 className="text-2xl font-bold text-green-400 mb-3">🎮 Get Started!</h3>
                <p className="text-gray-300 mb-4">
                  Click below to claim your starting $10,000 paper money
                </p>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(getApiUrl('api/claims'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ walletAddress: address })
                      });
                      const data = await response.json();
                      if (data.success) {
                        await fetchUserData(); // Refresh user data
                        toast.success('$1,000 added! Click 9 more times to reach $10k or start trading!');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-lg font-bold text-xl"
                >
                  💵 Claim $10,000 to Start Playing!
                </button>
              </div>
            )}

            {/* Trading Panel - FRONT AND CENTER */}
            <div className="max-w-3xl mx-auto mb-6">
              <TradingPanel
                btcPrice={btcPrice}
                paperBalance={userData?.paper_balance || 0}
                onTradeComplete={handleTradeComplete}
                walletAddress={address}
                stoppedTradeInfo={stoppedTradeInfo}
                onStoppedTradeShown={() => setStoppedTradeInfo(null)}
              />
            </div>

            {/* Account Info Bar - Clean Design */}
            {userData && (
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 mb-6 max-w-3xl mx-auto border-2 border-slate-600 shadow-lg">
                {/* Balance & P&L Row */}
                <div className="grid grid-cols-2 gap-6 mb-4">
                  {/* Balance */}
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Balance</div>
                    <div className="text-2xl font-bold text-green-400">
                      ${Number(userData.paper_balance / 100).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                    </div>
                  </div>

                  {/* P&L */}
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total P&L</div>
                    <div className={`text-2xl font-bold ${Number(userData.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(userData.total_pnl) >= 0 ? '+' : ''}${Math.round(Number(userData.total_pnl) / 100).toLocaleString('en-US')}
                    </div>
                  </div>
                </div>
                
                {/* Claim Button - Full Width Below */}
                <div className="pt-3 border-t border-slate-600">
                  <PaperMoneyClaim 
                    onClaim={handleClaim} 
                    paperBalance={userData?.paper_balance || 0}
                    walletAddress={address}
                  />
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'leaderboard' ? (
          <div>
            {/* Leaderboard */}
            <Leaderboard />
          </div>
        ) : activeTab === 'battle' ? (
          <div>
            {/* Section Navigation */}
            <div className="grid grid-cols-5 gap-1 mb-6">
              <button
                onClick={() => setBattleSection('market')}
                className={`py-2 px-1 rounded-lg font-bold text-[10px] md:text-xs transition-all ${
                  battleSection === 'market'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                🎯 Battle
              </button>
              <button
                onClick={() => setBattleSection('status')}
                className={`py-2 px-1 rounded-lg font-bold text-[10px] md:text-xs transition-all ${
                  battleSection === 'status'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                ⚔️ Army
              </button>
              <button
                onClick={() => setBattleSection('strategy')}
                className={`py-2 px-1 rounded-lg font-bold text-[10px] md:text-xs transition-all ${
                  battleSection === 'strategy'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                📈 Strategy
              </button>
              <button
                onClick={() => setBattleSection('tips')}
                className={`py-2 px-1 rounded-lg font-bold text-[10px] md:text-xs transition-all ${
                  battleSection === 'tips'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                💡 Tips
              </button>
              <button
                onClick={() => setBattleSection('predictions')}
                className={`py-2 px-1 rounded-lg font-bold text-[10px] md:text-xs transition-all ${
                  battleSection === 'predictions'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                🔮 Predict
              </button>
            </div>

            {/* Content Sections */}
            {battleSection === 'strategy' ? (
              <div key="strategy-section">
                <StrategyGuide />
              </div>
            ) : battleSection === 'tips' ? (
              <div key="tips-section" className="space-y-6">
                {/* Trading Tips */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-6">💡 Trading Tips & Best Practices</h2>

                  <div className="space-y-4">
                    <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                      <h3 className="font-bold text-green-400 mb-2">✅ DO: Start with Low Leverage</h3>
                      <p className="text-sm text-gray-300">
                        Begin with 1x-5x leverage to learn. Higher leverage amplifies both gains AND losses.
                        Work your way up as you understand the strategy better.
                      </p>
                    </div>

                    <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                      <h3 className="font-bold text-green-400 mb-2">✅ DO: Use the Whole Number Strategy</h3>
                      <p className="text-sm text-gray-300">
                        Buy dips around +800 coordinates, short pumps around +150 coordinates.
                        The beams (+86, +113, +226) act as resistance levels.
                      </p>
                    </div>

                    <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                      <h3 className="font-bold text-green-400 mb-2">✅ DO: Take Profits</h3>
                      <p className="text-sm text-gray-300">
                        Don&apos;t be greedy! Close winning positions. A 10% gain with 10x leverage = 100% profit!
                      </p>
                    </div>

                    <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                      <h3 className="font-bold text-red-400 mb-2">❌ DON&apos;T: Use Maximum Leverage Immediately</h3>
                      <p className="text-sm text-gray-300">
                        200x leverage looks tempting, but a 0.5% move against you = liquidation!
                        Start small and work your way up.
                      </p>
                    </div>

                    <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                      <h3 className="font-bold text-red-400 mb-2">❌ DON&apos;T: Go All-In on One Trade</h3>
                      <p className="text-sm text-gray-300">
                        Never risk your entire balance. Keep some paper money for future trades.
                        If you get liquidated with nothing left, claim more paper money and try again.
                      </p>
                    </div>

                    <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                      <h3 className="font-bold text-red-400 mb-2">❌ DON&apos;T: Hold Losing Positions Forever</h3>
                      <p className="text-sm text-gray-300">
                        Cut your losses! Better to lose 20% than wait and get liquidated at -100%.
                        Live to trade another day.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trading Glossary */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-6">📖 Trading Glossary</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-green-400 mb-1">LONG 🐂</h3>
                      <p className="text-sm text-gray-300">Betting price goes UP</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-red-400 mb-1">SHORT 🐻</h3>
                      <p className="text-sm text-gray-300">Betting price goes DOWN</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-yellow-400 mb-1">Leverage ⚡</h3>
                      <p className="text-sm text-gray-300">Multiplier (1x-200x)</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-orange-400 mb-1">Liquidation 💥</h3>
                      <p className="text-sm text-gray-300">Position auto-closed at 100% loss</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-purple-400 mb-1">Whole Number 🎯</h3>
                      <p className="text-sm text-gray-300">$1000 levels (94k, 95k...)</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-cyan-400 mb-1">Coordinate 📍</h3>
                      <p className="text-sm text-gray-300">Last 3 digits of price</p>
                    </div>
                  </div>
                </div>

                {/* Market Cycles */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">🕐 Market Sessions</h2>
                  <MarketCycle />
                </div>

                {/* Avatar Frames */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-cyan-400 mb-4">🖼️ Avatar Frames</h2>
                  <p className="text-gray-400 text-sm mb-6">
                    Unlock special avatar borders based on your winning trades. Higher tiers have epic decorative frames!
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-slate-900/50 rounded-lg p-4 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full border-2 border-slate-600 bg-slate-800 flex items-center justify-center mb-2 overflow-hidden">
                        {userData?.pfp_url ? (
                          <img src={userData.pfp_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-400 text-sm">No Frame</p>
                      <p className="text-[10px] text-gray-500">&lt;25 wins</p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full border-4 border-amber-600 bg-slate-800 flex items-center justify-center mb-2 overflow-hidden">
                        {userData?.pfp_url ? (
                          <img src={userData.pfp_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">👤</span>
                        )}
                      </div>
                      <p className="font-semibold text-amber-600 text-sm">Bronze</p>
                      <p className="text-[10px] text-gray-400">25+ wins</p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4 flex flex-col items-center text-center">
                      <div className="relative w-[72px] h-[72px] flex items-center justify-center mb-2">
                        <svg className="absolute inset-0 w-[72px] h-[72px]" viewBox="0 0 100 100">
                          <polygon points="0,15 0,0 15,0" fill="#d1d5db" opacity="0.8" />
                          <polygon points="85,0 100,0 100,15" fill="#d1d5db" opacity="0.8" />
                          <polygon points="100,85 100,100 85,100" fill="#d1d5db" opacity="0.8" />
                          <polygon points="0,85 0,100 15,100" fill="#d1d5db" opacity="0.8" />
                        </svg>
                        <div className="w-14 h-14 rounded-full border-4 border-gray-300 bg-slate-800 flex items-center justify-center z-10 overflow-hidden">
                          {userData?.pfp_url ? (
                            <img src={userData.pfp_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-gray-300 text-sm">Silver</p>
                      <p className="text-[10px] text-gray-400">125+ wins</p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4 flex flex-col items-center text-center">
                      <div className="relative w-[72px] h-[72px] flex items-center justify-center mb-2">
                        <svg className="absolute inset-0 w-[72px] h-[72px]" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.5))' }}>
                          <polygon points="50,0 54,12 50,8 46,12" fill="#facc15" />
                          <polygon points="100,50 88,54 92,50 88,46" fill="#facc15" />
                          <polygon points="50,100 46,88 50,92 54,88" fill="#facc15" />
                          <polygon points="0,50 12,46 8,50 12,54" fill="#facc15" />
                          <polygon points="12,12 18,6 24,12 18,18" fill="#eab308" />
                          <polygon points="88,12 82,6 76,12 82,18" fill="#eab308" />
                          <polygon points="88,88 82,94 76,88 82,82" fill="#eab308" />
                          <polygon points="12,88 18,94 24,88 18,82" fill="#eab308" />
                        </svg>
                        <div className="w-14 h-14 rounded-full border-4 border-yellow-400 bg-slate-800 flex items-center justify-center z-10 overflow-hidden">
                          {userData?.pfp_url ? (
                            <img src={userData.pfp_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-yellow-400 text-sm">Gold</p>
                      <p className="text-[10px] text-gray-400">450+ wins</p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4 flex flex-col items-center text-center">
                      <div className="relative w-[72px] h-[72px] flex items-center justify-center mb-2">
                        <svg className="absolute inset-0 w-[72px] h-[72px]" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 8px rgba(103,232,249,0.6))' }}>
                          <polygon points="50,-4 54,14 50,10 46,14" fill="#67e8f9" />
                          <polygon points="104,50 86,54 90,50 86,46" fill="#67e8f9" />
                          <polygon points="50,104 46,86 50,90 54,86" fill="#67e8f9" />
                          <polygon points="-4,50 14,46 10,50 14,54" fill="#67e8f9" />
                          <polygon points="15,15 8,8 22,12 18,22" fill="#22d3ee" />
                          <polygon points="85,15 92,8 78,12 82,22" fill="#22d3ee" />
                          <polygon points="85,85 92,92 78,88 82,78" fill="#22d3ee" />
                          <polygon points="15,85 8,92 22,88 18,78" fill="#22d3ee" />
                        </svg>
                        <div className="w-14 h-14 rounded-full border-4 border-cyan-300 shadow-[0_0_15px_rgba(103,232,249,0.5)] bg-slate-800 flex items-center justify-center z-10 overflow-hidden">
                          {userData?.pfp_url ? (
                            <img src={userData.pfp_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-cyan-300 text-sm">Platinum</p>
                      <p className="text-[10px] text-gray-400">750+ wins</p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4 flex flex-col items-center text-center">
                      <div className="relative w-[72px] h-[72px] flex items-center justify-center mb-2">
                        <svg className="absolute inset-0 w-[72px] h-[72px] animate-pulse" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 10px rgba(192,132,252,0.7))' }}>
                          <polygon points="50,-6 54,16 50,10 46,16" fill="#c084fc" />
                          <polygon points="35,2 40,18 35,14 30,16" fill="#a855f7" />
                          <polygon points="65,2 60,18 65,14 70,16" fill="#a855f7" />
                          <polygon points="106,50 84,54 88,50 84,46" fill="#c084fc" />
                          <polygon points="-6,50 16,46 12,50 16,54" fill="#c084fc" />
                          <polygon points="50,106 46,84 50,88 54,84" fill="#c084fc" />
                          <polygon points="12,12 6,6 18,2 22,14 14,18 2,18" fill="#c084fc" />
                          <polygon points="88,12 94,6 82,2 78,14 86,18 98,18" fill="#c084fc" />
                          <polygon points="88,88 94,94 82,98 78,86 86,82 98,82" fill="#c084fc" />
                          <polygon points="12,88 6,94 18,98 22,86 14,82 2,82" fill="#c084fc" />
                        </svg>
                        <div className="w-14 h-14 rounded-full border-4 border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.6)] bg-slate-800 flex items-center justify-center z-10 overflow-hidden">
                          {userData?.pfp_url ? (
                            <img src={userData.pfp_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-purple-400 text-sm">Diamond</p>
                      <p className="text-[10px] text-gray-400">1500+ wins</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    Frames auto-unlock based on your winning trades. Keep winning to level up!
                  </p>
                </div>

                {/* Achievements Summary */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-purple-400 mb-4">🏆 Achievements</h2>
                  <p className="text-gray-400 text-sm mb-4">
                    Unlock achievements by trading. Your best achievement determines your player title!
                  </p>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-slate-900/50 p-2 rounded">
                        <span className="text-blue-400 font-bold">📊 Trading</span>
                        <p className="text-xs text-gray-400">1 to 1000 trades</p>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded">
                        <span className="text-green-400 font-bold">💰 P&L</span>
                        <p className="text-xs text-gray-400">$100 to $100K profit</p>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded">
                        <span className="text-purple-400 font-bold">🎯 Win Rate</span>
                        <p className="text-xs text-gray-400">50% to 80%+</p>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded">
                        <span className="text-orange-400 font-bold">🔥 Streaks</span>
                        <p className="text-xs text-gray-400">3 to 50 wins</p>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded">
                        <span className="text-yellow-400 font-bold">🏅 Rankings</span>
                        <p className="text-xs text-gray-400">Top 100 to #1</p>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded">
                        <span className="text-cyan-400 font-bold">🛡️ Survival</span>
                        <p className="text-xs text-gray-400">No liquidations</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      32 total achievements • View full list in <a href="/glossary" className="text-yellow-400 underline">Glossary</a>
                    </p>
                  </div>
                </div>

                {/* Missions Summary */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎯 Missions</h2>
                  <p className="text-gray-400 text-sm mb-4">
                    Complete missions to earn paper money rewards!
                  </p>

                  <div className="space-y-3">
                    <div className="bg-yellow-900/20 p-3 rounded border border-yellow-500/30">
                      <h4 className="font-bold text-yellow-400 text-sm mb-1">📅 Daily (Reset 12:00 UTC)</h4>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Open a Trade → <span className="text-green-400">$2,000</span></li>
                        <li>• Win a Trade → <span className="text-green-400">$3,000</span></li>
                      </ul>
                    </div>
                    <div className="bg-purple-900/20 p-3 rounded border border-purple-500/30">
                      <h4 className="font-bold text-purple-400 text-sm mb-1">📆 Weekly (Reset Mon 12:00 UTC)</h4>
                      <ul className="text-xs text-gray-300 space-y-1">
                        <li>• Trading Streak (5 days) → <span className="text-green-400">$25,000</span></li>
                        <li>• Win 5 Trades → <span className="text-green-400">$20,000</span></li>
                        <li>• Paper Collector (10 claims) → <span className="text-green-400">$15,000</span></li>
                        <li>• Army Loyalty → <span className="text-green-400">$10,000</span></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Trading Fees */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-red-400 mb-4">⚙️ Trading Fees</h2>
                  <div className="bg-slate-900/50 p-4 rounded">
                    <p className="text-sm text-gray-300 mb-2">
                      <span className="font-bold text-white">Fee Formula:</span> Leverage × 0.05%
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <span>10x = 0.5%</span>
                      <span>50x = 2.5%</span>
                      <span>100x = 5%</span>
                      <span>200x = 10%</span>
                    </div>
                    <p className="text-xs text-yellow-400 mt-2">
                      Fees are deducted when closing, not opening.
                    </p>
                  </div>
                </div>

                {/* Full Glossary Link */}
                <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/50 rounded-lg p-4 text-center">
                  <p className="text-yellow-400 font-bold mb-2">📚 Want the full guide?</p>
                  <a
                    href="/glossary"
                    className="inline-block bg-yellow-500 text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition"
                  >
                    Open Complete Glossary
                  </a>
                </div>
              </div>
            ) : battleSection === 'market' ? (
              <div key="market-section">
                {/* Loading state when BTC price not ready */}
                {btcPrice === 0 || isLoading ? (
                  <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 text-center">
                    <div className="animate-spin text-4xl mb-4">🎯</div>
                    <p className="text-gray-400">Loading market data...</p>
                  </div>
                ) : (
                <div className="space-y-6">
                {/* Battlefield Visual - TOP */}
                <div>
                  <BattlefieldVisual
                    coordinate={coordinate}
                    wholeNumber={wholeNumber}
                    nextWholeNumber={nextWholeNumber}
                    zoneInfo={zoneInfo}
                    beamsBroken={strategy.beamsBroken}
                  />
                </div>

                {/* Battle Strategy - Market Direction & Recommendation */}
                <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4">🎯 Current Market Analysis</h3>
                  
                  <div className="space-y-4">
                    <div className={`bg-slate-900/50 rounded-lg p-4 border-2 ${
                      direction === 'bullish' ? 'border-green-500/50' : 
                      direction === 'bearish' ? 'border-red-500/50' : 
                      'border-gray-500/50'
                    }`}>
                      <h4 className="font-bold text-white mb-2">Market Direction</h4>
                      <div className={`text-2xl font-bold ${
                        direction === 'bullish' ? 'text-green-400' : 
                        direction === 'bearish' ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {direction === 'bullish' && 'BULLISH'}
                        {direction === 'bearish' && 'BEARISH'}
                        {direction === 'neutral' && 'NEUTRAL'}
                      </div>
                    </div>

                    <div className={`bg-slate-900/50 rounded-lg p-4 border-2 ${
                      recommendation?.action?.toLowerCase().includes('long') ? 'border-green-500/50' :
                      recommendation?.action?.toLowerCase().includes('short') ? 'border-red-500/50' :
                      'border-yellow-500/50'
                    }`}>
                      <h4 className="font-bold text-white mb-2">Recommended Action</h4>
                      <div className={`text-2xl font-bold ${
                        recommendation?.action?.toLowerCase().includes('long') ? 'text-green-400' :
                        recommendation?.action?.toLowerCase().includes('short') ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {recommendation?.action?.toUpperCase() || 'LOADING...'}
                      </div>
                    </div>

                    <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                      <h4 className="font-bold text-blue-400 mb-2">Current Zone</h4>
                      <p className="text-sm text-gray-300">
                        <strong>Zone:</strong> {zoneInfo?.name || 'Loading...'}<br />
                        <strong>Description:</strong> {zoneInfo?.description || 'Loading...'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Battle Alerts */}
                <div>
                  <BattleAlerts
                    btcPrice={btcPrice}
                    coordinate={coordinate}
                    beamsBroken={strategy.beamsBroken}
                  />
                </div>

                {/* Battle Strategy Tips - BOTTOM */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-yellow-400 mb-4">📊 Battle Strategy Tips</h3>
                  
                  <div className="space-y-3">
                    <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30">
                      <h4 className="font-bold text-green-400 mb-1">🐂 Bulls Strategy</h4>
                      <p className="text-sm text-gray-300">
                        Long the dips! Look for entries around +800 coordinates. 
                        Hold through consolidation. Bulls win when market trends up.
                      </p>
                    </div>

                    <div className="bg-red-900/20 rounded-lg p-3 border border-red-500/30">
                      <h4 className="font-bold text-red-400 mb-1">🐻 Bears Strategy</h4>
                      <p className="text-sm text-gray-300">
                        Short the pumps! Look for entries around +150 coordinates. 
                        Take profit quickly. Bears win when market trends down or consolidates.
                      </p>
                    </div>

                    <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
                      <h4 className="font-bold text-blue-400 mb-1">🔄 Switching Armies</h4>
                      <p className="text-sm text-gray-300">
                        Want to switch? Close winning positions in the opposite direction.
                        If you&apos;re Bulls but Bears are winning, close some long wins and open/close winning shorts!
                      </p>
                    </div>
                  </div>
                </div>
                </div>
                )}
              </div>
            ) : battleSection === 'status' ? (
              <div key="status-section">
                {/* Army Battle Status - TOP */}
                <div className="mb-6">
                  <ArmyBattleStatus />
                </div>

                {/* Weekly Army Airdrop */}
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-purple-400 mb-4 text-center">💎 Weekly Army Airdrop</h3>
                  
                  <div className="space-y-4 text-gray-300">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h4 className="font-bold text-white mb-2">How It Works:</h4>
                      <p className="text-sm">
                        Every week, the combined P&L of all Bulls is compared to all Bears. 
                        The winning army shares a massive $BATTLE token airdrop! ALL players in the winning army receive rewards.
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h4 className="font-bold text-white mb-2">📅 Weekly Snapshot:</h4>
                      <p className="text-sm">
                        Every Monday, we take a snapshot and announce the winning army. 
                        Your army is determined by comparing your total positive P&L from longs vs shorts.
                      </p>
                    </div>

                    <div className="bg-yellow-900/20 rounded p-4 border border-yellow-500/30">
                      <strong className="text-yellow-400">⚡ Strategic Army Switching:</strong>
                      <p className="text-sm mt-1">
                        You can switch armies by closing winning positions in the opposite direction! 
                        Only profitable trades count toward army assignment. Watch the standings and 
                        strategically switch before Monday snapshots!
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div key="predictions-section">
                {/* Prediction Markets */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-4 text-center">🎯 Army Prediction Market</h3>
                  <p className="text-sm text-gray-400 text-center mb-6">Predict which army will win the weekly battle! (Coming Soon)</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Bulls Prediction */}
                    <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-500/50 rounded-lg p-6 opacity-60 cursor-not-allowed">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🐂</div>
                        <h4 className="text-xl font-bold text-green-400 mb-2">Bulls Win</h4>
                        <p className="text-sm text-gray-400 mb-4">Place prediction</p>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Functionality coming soon</p>
                        </div>
                      </div>
                    </div>

                    {/* Bears Prediction */}
                    <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-2 border-red-500/50 rounded-lg p-6 opacity-60 cursor-not-allowed">
                      <div className="text-center">
                        <div className="text-4xl mb-3">🐻</div>
                        <h4 className="text-xl font-bold text-red-400 mb-2">Bears Win</h4>
                        <p className="text-sm text-gray-400 mb-4">Place prediction</p>
                        <div className="bg-slate-900/50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Functionality coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                    <p className="text-sm text-gray-300 text-center">
                      <strong className="text-blue-400">💡 How it works:</strong> Soon you&apos;ll be able to predict which army will win the weekly P&L battle and earn rewards for correct predictions!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'missions' ? (
          <div>
            <Missions walletAddress={address} />
          </div>
        ) : activeTab === 'airdrop' ? (
          <div>
            <GenesisAirdrop />
          </div>
        ) : activeTab === 'referrals' ? (
          <div>
            <Referrals walletAddress={address} />
          </div>
        ) : null}
      </div>

      {/* Bottom Navigation Bar - 7 buttons: Airdrop, Leaders, Battle, Profile (center), Trade, Missions, Referrals */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-slate-700 z-50">
        <div className="container mx-auto px-1">
          <div className="flex justify-between items-center py-1.5">
            {/* Left side - 3 buttons */}
            <button
              onClick={() => setActiveTab('airdrop')}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all min-w-[48px] ${
                activeTab === 'airdrop' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-lg">🎖️</span>
              <span className="text-[9px] font-bold">Airdrop</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all min-w-[48px] ${
                activeTab === 'leaderboard' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-lg">🏆</span>
              <span className="text-[9px] font-bold">Leaders</span>
            </button>

            <button
              onClick={() => setActiveTab('battle')}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all min-w-[48px] ${
                activeTab === 'battle' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-lg">⚔️</span>
              <span className="text-[9px] font-bold">Battle</span>
            </button>

            {/* Center - Profile (larger, raised) */}
            {address && userData ? (
              <button
                onClick={() => router.push(`/profile/${userData.fid || userData.wallet_address}`)}
                className="flex flex-col items-center gap-0.5 px-1 hover:opacity-80 transition-all -mt-3"
              >
                <Avatar
                  pfpUrl={userData.pfp_url}
                  username={userData.username}
                  army={userData.army}
                  winningTrades={userData.winning_trades}
                  size="lg"
                />
                <span className="text-[9px] font-bold text-yellow-400">Profile</span>
              </button>
            ) : (
              <div className="w-14 h-14 -mt-3 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            )}

            {/* Right side - 3 buttons */}
            <button
              onClick={() => setActiveTab('trade')}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all min-w-[48px] ${
                activeTab === 'trade' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-lg">🎯</span>
              <span className="text-[9px] font-bold">Trade</span>
            </button>

            <button
              onClick={() => setActiveTab('missions')}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all min-w-[48px] ${
                activeTab === 'missions' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-lg">🏅</span>
              <span className="text-[9px] font-bold">Missions</span>
            </button>

            <button
              onClick={() => setActiveTab('referrals')}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all min-w-[48px] ${
                activeTab === 'referrals' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-lg">🔗</span>
              <span className="text-[9px] font-bold">Referrals</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-8 mb-24 text-center text-gray-400 space-y-3">
        <p className="text-sm font-bold">⚔️ <strong>BATTLEFIELD</strong> ⚔️</p>
        
        <div className="space-y-2">
          <p className="text-sm">
            Created by{' '}
            <button
              onClick={() => handleExternalLink('https://elalpha.lol')}
              className="text-purple-400 hover:text-purple-300 underline cursor-pointer font-semibold"
            >
              elalpha.lol
            </button>
          </p>
          <p className="text-sm">
            Follow on Farcaster:{' '}
            <button
              onClick={() => handleExternalLink('https://warpcast.com/elalpha.eth')}
              className="text-purple-400 hover:text-purple-300 cursor-pointer"
            >
              @elalpha.eth
            </button>
            {' • '}
            <button
              onClick={() => handleExternalLink('https://warpcast.com/btcbattle')}
              className="text-purple-400 hover:text-purple-300 cursor-pointer"
            >
              @btcbattle
            </button>
          </p>
          <p className="text-sm text-purple-400 font-semibold">
            Launching on clanker.world
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
    </main>
  );
}
