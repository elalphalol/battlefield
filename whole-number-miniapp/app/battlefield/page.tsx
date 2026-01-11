'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../config/api';
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
  const { address } = useAccount();
  const { price: btcPrice, isLoading } = useBTCPrice(5000);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<'trade' | 'leaderboard' | 'battle' | 'ranking'>('trade');
  const [strategy] = useState(() => new WholeNumberStrategy());

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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* BTC Price & Details */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">BITCOIN PRICE</div>
            <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-2">
              {isLoading ? 'Loading...' : `$${strategy.formatNumber(btcPrice)}`}
            </div>
            <div className="text-sm text-gray-500">
              Live • Updates every 5s
            </div>
          </div>

          {/* Whole Number Info */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6">
            <div className="bg-slate-900 rounded-lg p-2 sm:p-4 text-center overflow-hidden">
              <div className="text-xs text-gray-400 mb-1">Current Whole</div>
              <div className="text-sm sm:text-xl font-bold text-blue-400 break-words">
                ${strategy.formatNumber(wholeNumber)}
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-2 sm:p-4 text-center overflow-hidden">
              <div className="text-xs text-gray-400 mb-1">Coordinate</div>
              <div className="text-xl sm:text-2xl font-bold text-yellow-400">
                {coordinate.toString().padStart(3, '0')}
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-2 sm:p-4 text-center overflow-hidden">
              <div className="text-xs text-gray-400 mb-1">Next Whole</div>
              <div className="text-sm sm:text-xl font-bold text-green-400 break-words">
                ${strategy.formatNumber(nextWholeNumber)}
              </div>
            </div>
          </div>
        </div>

        {/* Battlefield Visual */}
        <div className="mb-6">
          <BattlefieldVisual
            coordinate={coordinate}
            wholeNumber={wholeNumber}
            nextWholeNumber={nextWholeNumber}
            beamsBroken={strategy.beamsBroken}
            zoneInfo={zoneInfo}
          />
        </div>

        {/* Battle Strategy - Clean 4-card layout */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 mb-6 text-center flex items-center justify-center gap-2 flex-wrap">
            <span>⚔️</span>
            <span>BATTLE STRATEGY</span>
            <span>⚔️</span>
          </h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            {/* Market Direction */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🧭</span>
                <h3 className="font-bold text-white">MARKET DIRECTION</h3>
              </div>
              <div className={`text-3xl font-bold text-center py-3 rounded ${
                direction === 'bullish' ? 'bg-green-900/30 text-green-400' :
                direction === 'bearish' ? 'bg-red-900/30 text-red-400' :
                'bg-slate-700 text-gray-400'
              }`}>
                {direction === 'bullish' ? '⬆️ BULLISH' :
                 direction === 'bearish' ? '⬇️ BEARISH' :
                 '↔️ NEUTRAL'}
              </div>
            </div>

            {/* Recommended Action */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⚡</span>
                <h3 className="font-bold text-white">RECOMMENDED ACTION</h3>
              </div>
              <div className={`text-2xl font-bold text-center py-3 rounded mb-2 ${
                recommendation.action === 'long' ? 'bg-green-600' :
                recommendation.action === 'short' ? 'bg-red-600' :
                recommendation.action === 'caution' ? 'bg-yellow-600' :
                'bg-gray-600'
              }`}>
                {recommendation.action.toUpperCase()}
              </div>
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                {recommendation.description}
              </p>
            </div>

            {/* Entry Zones */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🎯</span>
                <h3 className="font-bold text-white">ENTRY ZONES</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded border border-green-600 bg-green-900/20">
                  <span className="text-sm text-white">LONG ENTRY:</span>
                  <span className="text-sm font-bold text-green-400">${strategy.formatNumber(wholeNumber + 800)}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded border border-red-600 bg-red-900/20">
                  <span className="text-sm text-white">SHORT ENTRY:</span>
                  <span className="text-sm font-bold text-red-400">${strategy.formatNumber(nextWholeNumber + 150)}</span>
                </div>
              </div>
            </div>

            {/* The Beams */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🔨</span>
                <h3 className="font-bold text-white">THE BEAMS</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">226 BEAM:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">${strategy.formatNumber(wholeNumber + 226)}</span>
                    <span className="text-lg">{strategy.beamsBroken.beam226 ? '🔴' : '🟢'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">113 BEAM:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">${strategy.formatNumber(wholeNumber + 113)}</span>
                    <span className="text-lg">{strategy.beamsBroken.beam113 ? '🔴' : '🟢'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">086 BEAM:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">${strategy.formatNumber(wholeNumber + 86)}</span>
                    <span className="text-lg">{strategy.beamsBroken.beam086 ? '🔴' : '🟢'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Cycle - NYC Time */}
        <div className="mb-6">
          <MarketCycle />
        </div>

        {/* Strategy Guide - Expandable */}
        <div className="mb-6">
          <StrategyGuide />
        </div>

        {/* User Stats Bar (if logged in) */}
        {userData && (
          <div id="trading-section" className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-400">Army</div>
                <div className="text-lg font-bold">
                  {userData.army === 'bears' ? '🐻 Bears' : '🐂 Bulls'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Paper Balance</div>
                <div className="text-lg font-bold text-green-400">
                  ${Number(userData.paper_balance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Total P&L</div>
                <div className={`text-lg font-bold ${Number(userData.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {Number(userData.total_pnl) >= 0 ? '+' : ''}${Number(userData.total_pnl).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Win Rate</div>
                <div className="text-lg font-bold text-blue-400">
                  {userData.total_trades > 0 
                    ? ((userData.winning_trades / userData.total_trades) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Streak</div>
                <div className="text-lg font-bold text-yellow-400">
                  🔥 {userData.current_streak}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">$BATTLE Tokens</div>
                <div className="text-lg font-bold text-purple-400 flex items-center justify-center gap-1">
                  <img src="/battlefield-logo.jpg" alt="$BATTLE" className="w-5 h-5 rounded-full" />
                  {Number(userData.battle_tokens_earned).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

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
                />
                <UserStats userData={userData} />
              </div>

              {/* Middle Column - Trading Panel (Form Only) */}
              <div className="lg:col-span-6 space-y-4">
                <TradingPanel
                  btcPrice={btcPrice}
                  paperBalance={userData?.paper_balance || 0}
                  onTradeComplete={handleTradeComplete}
                />
              </div>

              {/* Right Column - Trade History */}
              <div className="lg:col-span-3">
                <div className="scale-90 origin-top">
                  <TradeHistory />
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

      {/* Sticky Navigation Buttons */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
        {/* Profile Button */}
        {address && userData && (
          <button
            onClick={() => window.location.href = `/profile/${userData.fid || userData.wallet_address}`}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 font-bold flex items-center gap-2"
            aria-label="My Profile"
          >
            <span className="text-2xl">👤</span>
            <span className="hidden sm:inline">Profile</span>
          </button>
        )}
        
        {/* Back to Battlefield Button */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 font-bold flex items-center gap-2"
          aria-label="Scroll to top"
        >
          <span className="text-2xl">⚔️</span>
          <span className="hidden sm:inline">Battlefield</span>
        </button>
        
        {/* Trade Now Button - Only show on trade tab */}
        {activeTab === 'trade' && (
          <button
            onClick={scrollToTrading}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-slate-900 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 font-bold flex items-center gap-2"
            aria-label="Scroll to trading section"
          >
            <span className="text-2xl">⚡</span>
            <span className="hidden sm:inline">Trade Now</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6 text-center text-gray-500 text-sm space-y-3">
        <p className="mb-2">⚔️ <strong>BATTLEFIELD</strong> ⚔️</p>
        <p className="text-xs">⚠️ Paper money only. No real funds at risk. High leverage trading is educational.</p>
        <p className="text-xs">Powered by $BATTLE token • Launching on Clanker.world</p>
        <div className="pt-4 border-t border-slate-800 space-y-1">
          <p className="text-xs">
            Created by{' '}
            <a 
              href="https://elalpha.lol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              elalpha.lol
            </a>
            {' '}• Follow:{' '}
            <a 
              href="https://warpcast.com/elalpha.eth" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              @elalpha.eth
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
