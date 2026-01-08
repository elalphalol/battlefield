'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { WalletConnect } from './components/WalletConnect';
import { ArmySelection } from './components/ArmySelection';
import { PaperMoneyClaim } from './components/PaperMoneyClaim';
import { TradingPanel } from './components/TradingPanel';
import { Leaderboard } from './components/Leaderboard';
import { useBTCPrice } from './hooks/useBTCPrice';

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

  // Fetch or create user when wallet connects
  const fetchUserData = useCallback(async () => {
    if (!address) return;

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
            fid: Math.floor(Math.random() * 1000000), // Mock FID for now
            walletAddress: address,
            username: `Trader${address.slice(2, 8)}`,
            pfpUrl: '',
            army: 'bulls'
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
    if (address) {
      fetchUserData();
    } else {
      setUserData(null);
    }
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
        {/* BTC Price Display */}
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/50 rounded-lg p-6 mb-6 shadow-xl">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2 font-semibold">⚡ BITCOIN PRICE</div>
            <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-2">
              {isLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                `$${btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
            <div className="text-xs text-gray-500">
              Live Price • Updates every 5s
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
                <div className={`text-lg font-bold ${userData.total_pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {userData.total_pnl >= 0 ? '+' : ''}${userData.total_pnl.toFixed(2)}
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
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Army & Claims */}
            <div className="space-y-6">
              <ArmySelection 
                currentArmy={userData?.army}
                onArmyChange={handleArmyChange}
              />
              <PaperMoneyClaim onClaim={handleClaim} />
            </div>

            {/* Middle/Right Column - Trading */}
            <div className="lg:col-span-2">
              <TradingPanel
                btcPrice={btcPrice}
                paperBalance={userData?.paper_balance || 0}
                onTradeComplete={handleTradeComplete}
              />
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
