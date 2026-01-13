'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { WalletConnect } from '../components/WalletConnect';
import { ArmyBattleStatus } from '../components/ArmyBattleStatus';
import { ArmySelection } from '../components/ArmySelection';
import { BattleAlerts } from '../components/BattleAlerts';
import { BattlefieldVisual } from '../components/BattlefieldVisual';
import { WholeNumberStrategy as StrategyGuide } from '../components/WholeNumberStrategy';
import { useBTCPrice } from '../hooks/useBTCPrice';
import { WholeNumberStrategy } from '../lib/strategy';
import { getApiUrl } from '../config/api';

interface UserData {
  army: 'bears' | 'bulls';
  [key: string]: any;
}

export default function BattlePage() {
  const router = useRouter();
  const { address: wagmiAddress } = useAccount();
  const { price: btcPrice } = useBTCPrice(5000);
  const [strategy] = useState(() => new WholeNumberStrategy());
  const [userData, setUserData] = useState<UserData | null>(null);
  const [farcasterWallet, setFarcasterWallet] = useState<string | null>(null);
  
  // Use Farcaster wallet if available, otherwise use wagmi wallet
  const address = farcasterWallet || wagmiAddress;

  // Initialize Farcaster and get wallet address
  useEffect(() => {
    const initFarcaster = async () => {
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

  // Check beams
  useEffect(() => {
    if (btcPrice > 0) {
      strategy.checkBeams(coordinate, wholeNumber);
    }
  }, [btcPrice, coordinate, wholeNumber, strategy]);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      if (!address) return;
      try {
        const response = await fetch(getApiUrl(`api/users/${address}`));
        const data = await response.json();
        if (data.success) {
          setUserData(data.user);
          console.log('✅ User data loaded:', data.user);
        } else {
          console.warn('⚠️ User not found in database');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, [address]);

  const handleArmyChange = (army: 'bears' | 'bulls') => {
    if (userData) {
      setUserData({ ...userData, army });
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b-2 border-yellow-500/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/battlefield'}
                className="text-2xl hover:scale-110 transition-transform"
              >
                ⬅️
              </button>
              <h1 className="text-2xl md:text-4xl font-bold text-yellow-400">
                ⚔️ Bulls vs Bears Battle
              </h1>
            </div>
            <div className="flex-shrink-0">
              <WalletConnect />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl pb-24">
        
        {/* Army Selection */}
        <div className="mb-6">
          <ArmySelection 
            currentArmy={userData?.army}
            onArmyChange={handleArmyChange}
          />
        </div>

        {/* Battle Alerts */}
        <div className="mb-6">
          <BattleAlerts 
            btcPrice={btcPrice}
            coordinate={coordinate}
            beamsBroken={strategy.beamsBroken}
          />
        </div>

        {/* Army Battle Status */}
        <div className="mb-6">
          <ArmyBattleStatus />
        </div>

        {/* Battlefield Visual */}
        <div className="mb-6">
          <BattlefieldVisual 
            coordinate={coordinate}
            wholeNumber={wholeNumber}
            nextWholeNumber={nextWholeNumber}
            zoneInfo={zoneInfo}
            beamsBroken={strategy.beamsBroken}
          />
        </div>

        {/* Strategy Guide */}
        <div className="mb-6">
          <StrategyGuide />
        </div>

        {/* Army Battle Info */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-lg p-6 mb-6">
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

        {/* Battle Strategy Tips */}
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
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-yellow-400"
            >
              <span className="text-2xl">⚔️</span>
              <span className="text-xs font-bold">Battle</span>
            </button>
            
            {address ? (
              <button
                onClick={() => {
                  if (userData) {
                    router.push(`/profile/${userData.fid || userData.wallet_address}`);
                  } else {
                    router.push('/battlefield');
                  }
                }}
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
            ) : (
              <button
                onClick={() => router.push('/battlefield')}
                className="flex flex-col items-center gap-1 px-2 py-1 hover:opacity-80 transition-all -mt-4"
              >
                <div className="w-12 h-12 rounded-full border-2 border-yellow-400 bg-slate-800 overflow-hidden flex items-center justify-center">
                  <img src="/battlefield-logo.jpg" alt="Home" className="w-full h-full object-cover" />
                </div>
                <span className="text-[10px] font-bold text-yellow-400">Home</span>
              </button>
            )}
            
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

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-8 text-center text-gray-400 space-y-3">
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
    </main>
  );
}
