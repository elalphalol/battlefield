'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
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
  const { address: wagmiAddress } = useAccount();
  const { price: btcPrice, isLoading } = useBTCPrice(5000);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'trade' | 'leaderboard' | 'battle' | 'ranking'>('trade');
  const [strategy] = useState(() => new WholeNumberStrategy());
  const [farcasterWallet, setFarcasterWallet] = useState<string | null>(null);
  
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
        {/* BTC Price - SIMPLIFIED */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">BITCOIN PRICE</div>
            <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-2">
              {isLoading ? 'Loading...' : `$${strategy.formatNumber(btcPrice)}`}
            </div>
            <div className="text-sm text-gray-400 mt-3">
              📍 Coordinate: <span className="text-yellow-400 font-bold text-xl">{coordinate.toString().padStart(3, '0')}</span> → <span className="text-green-400 font-bold">{(coordinate + 1).toString().padStart(3, '0')}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('trade')}
            className={`flex-1 py-2 px-1 rounded-lg font-bold text-xs sm:text-sm md:text-base transition-all ${
              activeTab === 'trade'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            ⚔️ TRADE
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2 px-1 rounded-lg font-bold text-xs sm:text-sm md:text-base transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            🏆 LEADERBOARD
          </button>
          <button
            onClick={() => setActiveTab('battle')}
            className={`flex-1 py-2 px-1 rounded-lg font-bold text-xs sm:text-sm md:text-base transition-all ${
              activeTab === 'battle'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            ⚔️ BATTLE STATUS
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 py-2 px-1 rounded-lg font-bold text-xs sm:text-sm md:text-base transition-all ${
              activeTab === 'ranking'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            📊 RANKING SYSTEM
          </button>
        </div>

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

            <div className="grid lg:grid-cols-12 gap-4">
              {/* Left Column - Claims & Stats */}
              <div className="lg:col-span-3 space-y-4">
                <PaperMoneyClaim 
                  onClaim={handleClaim} 
                  paperBalance={userData?.paper_balance || 0}
                  walletAddress={address}
                />
                <UserStats userData={userData} />
              </div>

              {/* Middle Column - Trading Panel (Form Only) */}
              <div className="lg:col-span-6 space-y-4">
                <TradingPanel
                  btcPrice={btcPrice}
                  paperBalance={userData?.paper_balance || 0}
                  onTradeComplete={handleTradeComplete}
                  walletAddress={address}
                />
              </div>

              {/* Right Column - Trade History */}
              <div className="lg:col-span-3">
                <div className="scale-90 origin-top">
                  <TradeHistory walletAddress={address} />
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'leaderboard' ? (
          <div>
            {/* Top Trader Rewards - Moved to the very top */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-purple-400 mb-4 text-center">🏆 Top Trader Rewards (Individual)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl mb-2">🥇</div>
                  <div className="font-bold text-yellow-400 text-lg">1st Place</div>
                  <div className="text-purple-300 font-semibold">5M $BATTLE</div>
                </div>
                <div>
                  <div className="text-3xl mb-2">🥈</div>
                  <div className="font-bold text-gray-300 text-lg">2nd Place</div>
                  <div className="text-purple-300 font-semibold">3M $BATTLE</div>
                </div>
                <div>
                  <div className="text-3xl mb-2">🥉</div>
                  <div className="font-bold text-orange-400 text-lg">3rd Place</div>
                  <div className="text-purple-300 font-semibold">2M $BATTLE</div>
                </div>
                <div>
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="font-bold text-blue-400 text-lg">4th-10th</div>
                  <div className="text-purple-300 font-semibold">1M each</div>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <Leaderboard />
          </div>
        ) : activeTab === 'battle' ? (
          <div>
            {/* Army Battle Status */}
            <ArmyBattleStatus />
          </div>
        ) : (
          <div>
            {/* How the Ranking System Works */}
            <div className="bg-slate-800/50 border-2 border-yellow-500/50 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <span>📊</span>
                <span>How the Ranking System Works</span>
              </h3>
              
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

            {/* Individual Rewards Info */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-6 mb-6">
              <h3 className="text-2xl font-bold text-purple-400 mb-4 text-center">🏆 Top Trader Rewards (Individual)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl mb-2">🥇</div>
                  <div className="font-bold text-yellow-400 text-lg">1st Place</div>
                  <div className="text-purple-300 font-semibold">5M $BATTLE</div>
                </div>
                <div>
                  <div className="text-3xl mb-2">🥈</div>
                  <div className="font-bold text-gray-300 text-lg">2nd Place</div>
                  <div className="text-purple-300 font-semibold">3M $BATTLE</div>
                </div>
                <div>
                  <div className="text-3xl mb-2">🥉</div>
                  <div className="font-bold text-orange-400 text-lg">3rd Place</div>
                  <div className="text-purple-300 font-semibold">2M $BATTLE</div>
                </div>
                <div>
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="font-bold text-blue-400 text-lg">4th-10th</div>
                  <div className="text-purple-300 font-semibold">1M each</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-slate-700 z-50">
        <div className="container mx-auto px-2">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => setActiveTab('trade')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'trade' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-bold">Trade</span>
            </button>
            
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
                activeTab === 'leaderboard' ? 'text-yellow-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <span className="text-2xl">🏆</span>
              <span className="text-xs font-bold">Leaders</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/learn'}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">📚</span>
              <span className="text-xs font-bold">Learn</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/battle'}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">⚔️</span>
              <span className="text-xs font-bold">Battle</span>
            </button>
            
            {address && userData && (
              <button
                onClick={() => window.location.href = `/profile/${userData.fid || userData.wallet_address}`}
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
              >
                <span className="text-2xl">👤</span>
                <span className="text-xs font-bold">Profile</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6 text-center text-gray-500 text-sm space-y-3">
        <p className="mb-2">⚔️ <strong>BATTLEFIELD</strong> ⚔️</p>
        <p className="text-xs">⚠️ Paper money only. No real funds at risk. High leverage trading is educational.</p>
        <p className="text-xs">Powered by $BATTLE token • Launching on Clanker.world</p>
        <div className="pt-4 border-t border-slate-800 space-y-1">
          <p className="text-xs">
            Created by{' '}
            <button
              onClick={() => handleExternalLink('https://elalpha.lol')}
              className="text-purple-400 hover:text-purple-300 underline cursor-pointer"
            >
              elalpha.lol
            </button>
            {' '}• Follow:{' '}
            <button
              onClick={() => handleExternalLink('https://warpcast.com/elalpha.eth')}
              className="text-purple-400 hover:text-purple-300 cursor-pointer"
            >
              @elalpha.eth
            </button>
            {' '}•{' '}
            <button
              onClick={() => handleExternalLink('https://warpcast.com/btcbattle')}
              className="text-purple-400 hover:text-purple-300 cursor-pointer"
            >
              @btcbattle
            </button>
          </p>
        </div>
      </footer>
    </main>
  );
}
