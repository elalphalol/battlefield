'use client';

import { ArmyBattleStatus } from '../components/ArmyBattleStatus';
import { ArmySelection } from '../components/ArmySelection';
import { BattleAlerts } from '../components/BattleAlerts';

export default function BattlePage() {
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl pb-24">
        
        {/* Army Selection */}
        <div className="mb-6">
          <ArmySelection />
        </div>

        {/* Battle Alerts */}
        <div className="mb-6">
          <BattleAlerts />
        </div>

        {/* Army Battle Status */}
        <div className="mb-6">
          <ArmyBattleStatus />
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-slate-700 z-50">
        <div className="container mx-auto px-2">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => window.location.href = '/battlefield'}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-bold">Trade</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/battlefield'}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
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
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-yellow-400"
            >
              <span className="text-2xl">⚔️</span>
              <span className="text-xs font-bold">Battle</span>
            </button>
          </div>
        </div>
      </nav>
    </main>
  );
}
