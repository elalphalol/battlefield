'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '../config/api';
import sdk from '@farcaster/frame-sdk';
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
import { ArmyBattleStatus } from '../components/ArmyBattleStatus';
import { ArmySelection } from '../components/ArmySelection';
import { useBTCPrice } from '../hooks/useBTCPrice';
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
  const [activeTab, setActiveTab] = useState<'trade' | 'leaderboard' | 'battle' | 'learn'>('trade');
  const [learnSection, setLearnSection] = useState<'strategy' | 'cycles' | 'glossary' | 'ranking' | 'tips'>('strategy');
  const [battleSection, setBattleSection] = useState<'market' | 'status'>('market');
  const [strategy] = useState(() => new WholeNumberStrategy());
  const [farcasterWallet, setFarcasterWallet] = useState<string | null>(null);
  
  // Check URL params on mount to set initial tab
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'leaderboard') {
      setActiveTab('leaderboard');
    }
  }, []);
  
  // Use Farcaster wallet if available, otherwise use wagmi wallet
  const address = farcasterWallet || wagmiAddress;

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
      return;
    }

    try {
      // Try to get existing user
      const response = await fetch(getApiUrl(`api/users/${address}`));
      const data = await response.json();

      if (data.success) {
        setUserData(data.user);
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

        // Create new user
        const createResponse = await fetch(getApiUrl('api/users'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid,
            walletAddress: address,
            username,
            pfpUrl,
            army: 'bulls' // Default army for backend
          })
        });

        const createData = await createResponse.json();
        if (createData.success) {
          setUserData(createData.user);
          console.log('✅ User created successfully:', createData.user);
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
          if (data.success && data.liquidatedCount > 0) {
            console.log(`💥 Auto-liquidated ${data.liquidatedCount} position(s)`);
            // Refresh user data if any liquidations occurred
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
                  BATTLEFIELD
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
        {/* BTC Price - CLEAN - Only show on Trade tab */}
        {activeTab === 'trade' && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">BITCOIN PRICE</div>
              <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-3">
                {isLoading ? 'Loading...' : `$${Math.floor(btcPrice).toLocaleString()}`}
              </div>
              <div className={`text-4xl font-bold ${
                coordinate < 500 ? 'text-red-400' : 'text-green-400'
              }`}>
                {coordinate.toString().padStart(3, '0')}
              </div>
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
                        alert('✅ $1,000 added! Click 9 more times to reach $10k or start trading!');
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
                      ${Number(userData.paper_balance).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                    </div>
                  </div>
                  
                  {/* P&L */}
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Total P&L</div>
                    <div className={`text-2xl font-bold ${Number(userData.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(userData.total_pnl) >= 0 ? '+' : ''}${Number(userData.total_pnl).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
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
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                onClick={() => setBattleSection('market')}
                className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  battleSection === 'market'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                📊 Prediction Market
              </button>
              <button
                onClick={() => setBattleSection('status')}
                className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  battleSection === 'status'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                ⚔️ Army Status
              </button>
            </div>

            {/* Content Sections */}
            {battleSection === 'market' ? (
              <div>
                {/* Battlefield Visual - TOP */}
                <div className="mb-6">
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
                      direction === 'BULLISH' ? 'border-green-500/50' : 
                      direction === 'BEARISH' ? 'border-red-500/50' : 
                      'border-gray-500/50'
                    }`}>
                      <h4 className="font-bold text-white mb-2">Market Direction</h4>
                      <div className={`text-2xl font-bold ${
                        direction === 'BULLISH' ? 'text-green-400' : 
                        direction === 'BEARISH' ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {direction === 'BULLISH' && '🐂 BULLISH'}
                        {direction === 'BEARISH' && '🐻 BEARISH'}
                        {direction === 'NEUTRAL' && '⚖️ NEUTRAL'}
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h4 className="font-bold text-white mb-2">Recommended Action</h4>
                      <p className={`text-lg font-semibold ${
                        recommendation.includes('LONG') ? 'text-green-400' : 
                        recommendation.includes('SHORT') ? 'text-red-400' : 
                        'text-yellow-400'
                      }`}>
                        {recommendation}
                      </p>
                    </div>

                    <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                      <h4 className="font-bold text-blue-400 mb-2">Current Zone</h4>
                      <p className="text-sm text-gray-300">
                        <strong>Zone:</strong> {zoneInfo.zone}<br />
                        <strong>Bias:</strong> {zoneInfo.bias}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Battle Alerts */}
                <div className="mb-6">
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
            ) : (
              <div>
                {/* Army Selection */}
                <div className="mb-6">
                  <ArmySelection 
                    currentArmy={userData?.army}
                    onArmyChange={handleArmyChange}
                  />
                </div>

                {/* Army Battle Status */}
                <div className="mb-6">
                  <ArmyBattleStatus />
                </div>

                {/* Army Battle Info */}
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
            )}
          </div>
        ) : (
          <div>
            {/* Section Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
              <button
                onClick={() => setLearnSection('strategy')}
                className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  learnSection === 'strategy'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                📈 Strategy
              </button>
              <button
                onClick={() => setLearnSection('cycles')}
                className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  learnSection === 'cycles'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                🕐 Market Cycles
              </button>
              <button
                onClick={() => setLearnSection('glossary')}
                className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  learnSection === 'glossary'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                📖 Glossary
              </button>
              <button
                onClick={() => setLearnSection('ranking')}
                className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  learnSection === 'ranking'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                🏆 Ranking
              </button>
              <button
                onClick={() => setLearnSection('tips')}
                className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
                  learnSection === 'tips'
                    ? 'bg-yellow-500 text-slate-900'
                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                }`}
              >
                💡 Tips
              </button>
            </div>

            {/* Content Sections */}
            {learnSection === 'strategy' && (
              <div>
                <StrategyGuide />
              </div>
            )}

            {learnSection === 'cycles' && (
              <div>
                <MarketCycle />
                
                <div className="bg-slate-800/50 rounded-lg p-6 mt-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-4">Understanding Market Cycles</h2>
                  
                  <div className="space-y-4 text-gray-300">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-white mb-2">🌅 Asian Session (7pm - 4am EST)</h3>
                      <p className="text-sm">Lower volatility period. Good for setting up positions before major moves.</p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-white mb-2">🇬🇧 London Session (3am - 12pm EST)</h3>
                      <p className="text-sm">High volume! Major price movements often start here. Great for trend trading.</p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-white mb-2">🇺🇸 NYC Session (8am - 5pm EST)</h3>
                      <p className="text-sm">Highest volume and volatility. Major moves happen during overlap with London.</p>
                    </div>

                    <div className="bg-yellow-900/20 rounded p-4 border border-yellow-500/30">
                      <strong className="text-yellow-400">💡 Pro Tip:</strong>
                      <p className="text-sm mt-1">
                        Most explosive moves happen during the London/NYC overlap (8am-12pm EST). 
                        Trade with caution during low-volume Asian session.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {learnSection === 'glossary' && (
              <div className="space-y-6">
                {/* Trading Terms */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-yellow-400 mb-6">📖 Trading Glossary</h2>
                  
                  <div className="space-y-4">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-green-400 text-lg mb-2">LONG 🐂</h3>
                      <p className="text-sm text-gray-300">
                        Betting that the price will go UP. You profit when Bitcoin rises.
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-red-400 text-lg mb-2">SHORT 🐻</h3>
                      <p className="text-sm text-gray-300">
                        Betting that the price will go DOWN. You profit when Bitcoin falls.
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-yellow-400 text-lg mb-2">Leverage ⚡</h3>
                      <p className="text-sm text-gray-300">
                        Multiplier for your position. 10x leverage = 10x profits OR 10x losses. 
                        Higher leverage = higher risk of liquidation. Range: 1x-200x
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-orange-400 text-lg mb-2">Liquidation 💥</h3>
                      <p className="text-sm text-gray-300">
                        When your position loses 100% of your collateral. Your position is automatically closed. 
                        With 100x leverage, a 1% move against you = liquidation!
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-blue-400 text-lg mb-2">P&L (Profit & Loss) 💰</h3>
                      <p className="text-sm text-gray-300">
                        Your profit or loss on a trade. Positive P&L = profit, Negative P&L = loss. 
                        Used to rank players on the leaderboard.
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-purple-400 text-lg mb-2">Whole Number 🎯</h3>
                      <p className="text-sm text-gray-300">
                        A thousand-dollar level (e.g., $94,000, $95,000). These act as psychological barriers 
                        where price often bounces or breaks through.
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-cyan-400 text-lg mb-2">Coordinate 📍</h3>
                      <p className="text-sm text-gray-300">
                        The last 3 digits of the Bitcoin price (e.g., $94,536 = coordinate 536). 
                        Used in the Whole Number Strategy to identify optimal entry/exit points.
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <h3 className="font-bold text-pink-400 text-lg mb-2">The Beams 🔨</h3>
                      <p className="text-sm text-gray-300">
                        Support levels at +86, +113, +226 above the whole number. Breaking these beams 
                        signals potential for larger moves (Dwarf Toss setup).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Trading Fees & Mechanics */}
                <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                  <h2 className="text-2xl font-bold text-red-400 mb-4">⚙️ Trading Mechanics & Fees</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-yellow-400 mb-2 text-lg">📊 How Trading Fees Work</h3>
                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
                        <p>
                          <span className="font-semibold text-white">Trading Fee Formula:</span> Leverage × 0.05%
                        </p>
                        <ul className="ml-4 space-y-1">
                          <li>• 10x leverage = 0.5% fee</li>
                          <li>• 50x leverage = 2.5% fee</li>
                          <li>• 100x leverage = 5% fee</li>
                          <li>• 200x leverage = 10% fee</li>
                        </ul>
                        <p className="pt-2 text-yellow-300">
                          <span className="font-semibold">⚠️ Important:</span> Fees are deducted from your P&L when closing a position, not when opening.
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-cyan-400 mb-2 text-lg">💡 Why Positions Start in Negative P&L</h3>
                      <div className="bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
                        <p>
                          When you open a position, you&apos;ll notice it starts with <span className="text-red-400 font-semibold">negative P&L</span>. This is normal!
                        </p>
                        <p className="pt-2">
                          <span className="font-semibold text-white">Why?</span> The trading fee is already calculated into your unrealized profit/loss. This shows you the <span className="text-green-400 font-semibold">real break-even point</span> you need to reach to become profitable.
                        </p>
                        <p className="pt-2 text-yellow-300">
                          <span className="font-semibold">Example:</span> Open a 100x position with $100. Fee = 5% ($5). Your position starts at -$5. The price needs to move favorably by $5 for you to break even.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {learnSection === 'ranking' && (
              <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
                <h2 className="text-2xl font-bold text-yellow-400 mb-6">🏆 How Ranking Works</h2>
              
              <div className="space-y-4 text-gray-300">
                {/* Ranking Explanation */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-xl">🏆</span>
                    <span>Individual Rankings</span>
                  </h4>
                  <p className="text-sm">
                    Player rankings are determined by your <strong className="text-green-400">total P&L (Profit & Loss)</strong>. 
                    The more profit you make from your trades, the higher you climb on the leaderboard. 
                    Trade strategically using leverage (1x-200x) to maximize your gains!
                  </p>
                </div>

                {/* Army Airdrop Explanation */}
                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border-2 border-purple-500/50">
                  <h4 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <span className="text-xl">💎</span>
                    <span>Weekly Army Airdrop</span>
                  </h4>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong className="text-white">How We Determine the Winning Army:</strong>
                      <p className="mt-1">
                        Every week, we calculate the <strong className="text-green-400">combined P&L</strong> of all players in the 
                        <strong className="text-green-400"> 🐂 Bulls Army</strong> vs the combined P&L of all players in the 
                        <strong className="text-red-400"> 🐻 Bears Army</strong>. The army with the highest total profit wins!
                      </p>
                    </div>

                    <div className="bg-slate-900/50 rounded p-3 border border-slate-700">
                      <strong className="text-yellow-400">📅 Weekly Announcement:</strong>
                      <p className="mt-1">
                        Every Monday at a set time, we announce the winning army with detailed stats showing the P&L difference. 
                        <strong className="text-purple-400"> ALL players</strong> in the winning army receive a 
                        <strong className="text-purple-400"> juicy $BATTLE token airdrop!</strong>
                      </p>
                    </div>

                    <div>
                      <strong className="text-white">Strategic Army Switching:</strong>
                      <p className="mt-1">
                        Your army is determined by comparing your <strong className="text-blue-400">total positive P&L from longs</strong> vs 
                        <strong className="text-red-400"> total positive P&L from shorts</strong>. 
                        Bulls = more profit from longs, Bears = more profit from shorts. 
                        Switch armies by <strong className="text-yellow-400">closing winning positions</strong> in the opposite direction - 
                        even at the last second before the weekly snapshot! 
                        Only profitable trades count, so you can't sabotage your army.
                      </p>
                    </div>

                    <div className="bg-yellow-900/20 rounded p-3 border border-yellow-500/30">
                      <strong className="text-yellow-400">⚡ Pro Tip:</strong>
                      <p className="mt-1">
                        Watch the army standings closely in the final days. You can strategically switch to the winning army 
                        by closing profitable positions in the opposite direction - since only winning trades count toward 
                        army assignment, this is the only way to change your army affiliation before the weekly snapshot!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Weekly Reset */}
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <span>Weekly Reset</span>
                  </h4>
                  <p className="text-sm">
                    After each weekly airdrop, the ranking system continues as normal. A new week begins every Monday, 
                    but army assignments stay dynamic - they're always based on your current positions and can change anytime!
                  </p>
                </div>
              </div>
            </div>
            )}

            {learnSection === 'tips' && (
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

                  <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
                    <h3 className="font-bold text-yellow-400 mb-2">⚡ Pro Strategy: Screenshot Your Setups</h3>
                    <p className="text-sm text-gray-300">
                      When price breaks through beams, screenshot the coordinate! 
                      Second breaks always go deeper. Use your screenshot to know when to hold through volatility.
                    </p>
                  </div>

                  <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                    <h3 className="font-bold text-blue-400 mb-2">🔥 Army Strategy</h3>
                    <p className="text-sm text-gray-300">
                      Check the Battle tab to see which army is winning. You can switch armies by closing winning 
                      positions in the opposite direction before the weekly Monday snapshot!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Order: Leaders, Battle, Profile, Trade, Learn */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-slate-700 z-50">
        <div className="container mx-auto px-2">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'leaderboard' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-2xl">🏆</span>
              <span className="text-xs font-bold">Leaders</span>
            </button>
            
            <button
              onClick={() => setActiveTab('battle')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'battle' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-2xl">⚔️</span>
              <span className="text-xs font-bold">Battle</span>
            </button>
            
            {address && userData && (
              <button
                onClick={() => router.push(`/profile/${userData.fid || userData.wallet_address}`)}
                className="flex flex-col items-center gap-1 px-2 py-1 hover:opacity-80 transition-all -mt-4"
              >
                <div className="w-12 h-12 rounded-full border-2 border-yellow-400 bg-slate-800 overflow-hidden flex items-center justify-center">
                  {userData?.pfp_url ? (
                    <img src={userData.pfp_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <img src="/battlefield-logo.jpg" alt="Profile" className="w-full h-full object-cover" />
                  )}
                </div>
                <span className="text-[10px] font-bold text-yellow-400">Profile</span>
              </button>
            )}
            
            <button
              onClick={() => setActiveTab('trade')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'trade' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-bold">Trade</span>
            </button>
            
            <button
              onClick={() => setActiveTab('learn')}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'learn' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-2xl">📚</span>
              <span className="text-xs font-bold">Learn</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-8 text-center text-gray-400 space-y-3">
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
    </main>
  );
}
