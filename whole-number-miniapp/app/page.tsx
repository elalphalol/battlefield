'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { WalletConnect } from './components/WalletConnect';
import { PaperMoneyClaim } from './components/PaperMoneyClaim';
import { TradingPanel } from './components/TradingPanel';
import { Leaderboard } from './components/Leaderboard';
import { BattlefieldVisual } from './components/BattlefieldVisual';
import { UserStats } from './components/UserStats';
import { TradeHistory } from './components/TradeHistory';
import { WholeNumberStrategy as StrategyGuide } from './components/WholeNumberStrategy';
import { MarketCycle } from './components/MarketCycle';
import { useBTCPrice } from './hooks/useBTCPrice';
import { WholeNumberStrategy } from './lib/strategy';

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
  const [activeTab, setActiveTab] = useState<'trade' | 'leaderboard'>('trade');
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
  const direction = useMemo(() => strategy.getMarketDirection(), [strategy]);
  const recommendation = useMemo(() => strategy.getRecommendedAction(coordinate, direction), [coordinate, direction, strategy]);

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
      const response = await fetch(`http://localhost:3001/api/users/${address}`);
      const data = await response.json();

      if (data.success) {
        setUserData(data.user);
      } else {
        // Create new user
        const createResponse = await fetch('http://localhost:3001/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fid: Math.floor(Math.random() * 1000000),
            walletAddress: address,
            username: `Trader${address.slice(2, 8)}`,
            pfpUrl: '',
            army: 'bulls' // Default army for backend
          })
        });

        const createData = await createResponse.json();
        if (createData.success) {
          setUserData(createData.user);
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b-2 border-yellow-500/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-yellow-400 flex items-center gap-2">
                ⚔️ BATTLEFIELD
              </h1>
              <p className="text-sm text-gray-400">
                Bears 🐻 vs Bulls 🐂 | Bitcoin Paper Trading
              </p>
            </div>
            <WalletConnect />
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
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Current Whole</div>
              <div className="text-xl font-bold text-blue-400">
                ${strategy.formatNumber(wholeNumber)}
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Coordinate</div>
              <div className="text-2xl font-bold text-yellow-400">
                {coordinate.toString().padStart(3, '0')}
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Next Whole</div>
              <div className="text-xl font-bold text-green-400">
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

        {/* Zone Info */}
        <div className={`rounded-lg p-6 mb-6 border-2 ${
          zoneInfo.signal === 'bullish' ? 'bg-green-900/20 border-green-500' :
          zoneInfo.signal === 'bearish' ? 'bg-red-900/20 border-red-500' :
          zoneInfo.signal === 'opportunity' ? 'bg-yellow-900/20 border-yellow-500' :
          'bg-slate-800 border-slate-600'
        }`}>
          <h3 className="text-2xl font-bold mb-2">{zoneInfo.name}</h3>
          <p className="text-gray-300">{zoneInfo.description}</p>
        </div>

        {/* Market Direction & Recommendation */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Direction */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              🧭 MARKET DIRECTION
            </h3>
            <div className={`text-4xl font-bold text-center py-4 rounded ${
              direction === 'bullish' ? 'bg-green-900/30 text-green-400' :
              direction === 'bearish' ? 'bg-red-900/30 text-red-400' :
              'bg-slate-700 text-gray-400'
            }`}>
              {direction === 'bullish' ? '⬆️ BULLISH' :
               direction === 'bearish' ? '⬇️ BEARISH' :
               '↔️ NEUTRAL'}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              ⚡ RECOMMENDATION
            </h3>
            <div className={`text-2xl font-bold px-4 py-2 rounded mb-3 text-center ${
              recommendation.action === 'long' ? 'bg-green-600' :
              recommendation.action === 'short' ? 'bg-red-600' :
              recommendation.action === 'caution' ? 'bg-yellow-600' :
              'bg-gray-600'
            }`}>
              {recommendation.action.toUpperCase()}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {recommendation.description}
            </p>
            <div className="mt-3 text-xs text-gray-500">
              Confidence: {recommendation.confidence.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Market Cycle - NYC Time */}
        <div className="mb-6">
          <MarketCycle />
        </div>

        {/* Beams Status */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h3 className="text-lg font-bold mb-4">🔨 THE BEAMS</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`p-4 rounded ${strategy.beamsBroken.beam226 ? 'bg-red-900/30' : 'bg-slate-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">226 BEAM</span>
                <span className="text-2xl">{strategy.beamsBroken.beam226 ? '🔴' : '🟢'}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                ${strategy.formatNumber(wholeNumber + 226)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {strategy.beamsBroken.beam226 ? 'BROKEN' : 'INTACT'}
              </div>
            </div>
            <div className={`p-4 rounded ${strategy.beamsBroken.beam113 ? 'bg-red-900/30' : 'bg-slate-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">113 BEAM</span>
                <span className="text-2xl">{strategy.beamsBroken.beam113 ? '🔴' : '🟢'}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                ${strategy.formatNumber(wholeNumber + 113)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {strategy.beamsBroken.beam113 ? 'BROKEN' : 'INTACT'}
              </div>
            </div>
            <div className={`p-4 rounded ${strategy.beamsBroken.beam086 ? 'bg-red-900/30' : 'bg-slate-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">086 BEAM</span>
                <span className="text-2xl">{strategy.beamsBroken.beam086 ? '🔴' : '🟢'}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                ${strategy.formatNumber(wholeNumber + 86)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {strategy.beamsBroken.beam086 ? 'BROKEN' : 'INTACT'}
              </div>
            </div>
          </div>
        </div>

        {/* User Stats Bar (if logged in) */}
        {userData && (
          <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-400">Army</div>
                <div className="text-lg font-bold">
                  {userData.army === 'bears' ? '🐻 Bears' : '🐂 Bulls'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Paper Balance</div>
                <div className="text-lg font-bold text-green-400">
                  ${userData.paper_balance.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Total P&L</div>
                <div className={`text-lg font-bold ${Number(userData.total_pnl) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {Number(userData.total_pnl) >= 0 ? '+' : ''}${Number(userData.total_pnl).toFixed(2)}
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
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('trade')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'trade'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            ⚔️ Trade
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            🏆 Leaderboard
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
                      const response = await fetch('http://localhost:3001/api/claims', {
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

            {/* Strategy Guide - Expandable */}
            <div className="mb-6">
              <StrategyGuide />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Claims & Stats */}
              <div className="space-y-6">
                <PaperMoneyClaim 
                  onClaim={handleClaim} 
                  paperBalance={userData?.paper_balance || 0} 
                />
                <UserStats userData={userData} />
              </div>

              {/* Middle Column - Trading Panel */}
              <div className="space-y-6">
                <TradingPanel
                  btcPrice={btcPrice}
                  paperBalance={userData?.paper_balance || 0}
                  onTradeComplete={handleTradeComplete}
                />
              </div>

              {/* Right Column - Trade History */}
              <div className="space-y-6">
                <TradeHistory />
              </div>
            </div>
          </div>
        ) : (
          <Leaderboard />
        )}

        {/* Info Section */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">📚 How to Play</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <div className="font-bold text-white mb-2">1️⃣ Choose Your Army</div>
              <p>Join the Bears 🐻 or Bulls 🐂. Your army affects leaderboard rankings and monthly rewards.</p>
            </div>
            <div>
              <div className="font-bold text-white mb-2">2️⃣ Start Trading</div>
              <p>Open leveraged positions (10x-100x). Profit from Bitcoin price movements with paper money.</p>
            </div>
            <div>
              <div className="font-bold text-white mb-2">3️⃣ Compete & Win</div>
              <p>Climb the leaderboard! Top traders earn $BATTLE tokens and glory for their army.</p>
            </div>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="mt-6 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-purple-400 mb-3 text-center">💎 Weekly Rewards</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="text-2xl mb-1">🥇</div>
              <div className="font-bold text-yellow-400">1st Place</div>
              <div className="text-purple-300">5M $BATTLE</div>
            </div>
            <div>
              <div className="text-2xl mb-1">🥈</div>
              <div className="font-bold text-gray-300">2nd Place</div>
              <div className="text-purple-300">3M $BATTLE</div>
            </div>
            <div>
              <div className="text-2xl mb-1">🥉</div>
              <div className="font-bold text-orange-400">3rd Place</div>
              <div className="text-purple-300">2M $BATTLE</div>
            </div>
            <div>
              <div className="text-2xl mb-1">🎯</div>
              <div className="font-bold text-blue-400">4th-10th</div>
              <div className="text-purple-300">1M each</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6 text-center text-gray-500 text-sm">
        <p className="mb-2">⚔️ <strong>BATTLEFIELD</strong> - Bears vs Bulls Paper Trading Game</p>
        <p className="text-xs">⚠️ Paper money only. No real funds at risk. High leverage trading is educational.</p>
        <p className="text-xs mt-2">Powered by $BATTLE token • Launching on Clanker.world</p>
      </footer>
    </main>
  );
}
