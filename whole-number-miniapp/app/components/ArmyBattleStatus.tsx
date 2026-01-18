'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api';
import { Swords, Crown, Diamond, Lightbulb, Loader2 } from 'lucide-react';
import { BearIcon, BullIcon } from './icons';

interface ArmyStats {
  bulls: {
    totalPnl: number;
    playerCount: number;
  };
  bears: {
    totalPnl: number;
    playerCount: number;
  };
  weekEndsAt: string;
}

export function ArmyBattleStatus() {
  const [armyStats, setArmyStats] = useState<ArmyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArmyStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchArmyStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchArmyStats = async () => {
    try {
      const response = await fetch(getApiUrl('api/army/stats'));
      const data = await response.json();
      
      if (data.success) {
        setArmyStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching army stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6 mb-6">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-yellow-400 mx-auto mb-2" />
          <p className="text-gray-400">Loading army battle status...</p>
        </div>
      </div>
    );
  }

  if (!armyStats) {
    return null;
  }

  // totalPnl is in CENTS, convert to dollars for display
  const bullsTotalCents = armyStats.bulls.totalPnl || 0;
  const bearsTotalCents = armyStats.bears.totalPnl || 0;
  const bullsTotal = bullsTotalCents / 100;
  const bearsTotal = bearsTotalCents / 100;
  const difference = Math.abs(bullsTotal - bearsTotal);
  const winningArmy = bullsTotal > bearsTotal ? 'bulls' : 'bears';

  // Calculate percentage for progress bar (50% is the middle)
  // Handle edge cases where both could be 0 or negative
  const totalAbsolute = Math.abs(bullsTotal) + Math.abs(bearsTotal);
  const bullsPercentage = totalAbsolute === 0 ? 50 : Math.min(100, Math.max(0, (bullsTotal / totalAbsolute + 1) * 50));

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!armyStats.weekEndsAt) {
      return 'Calculating...';
    }
    
    const now = new Date().getTime();
    const end = new Date(armyStats.weekEndsAt).getTime();
    const distance = end - now;

    if (distance < 0) {
      return 'Snapshot imminent!';
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-yellow-500/50 rounded-lg mb-6 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b-2 border-yellow-500/30 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <Swords className="w-6 h-6" />
            <span>Army Battle Status</span>
          </h3>
          <div className="text-right">
            <div className="text-xs text-gray-400">Weekly Snapshot In:</div>
            <div className="text-lg font-bold text-yellow-400">{getTimeRemaining()}</div>
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="p-6">
        {/* Army Stats Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {/* Bulls Army */}
          <div className={`bg-gradient-to-br ${
            winningArmy === 'bulls' 
              ? 'from-green-900/40 to-green-800/20 border-2 border-green-500 shadow-lg shadow-green-500/20' 
              : 'from-green-900/20 to-green-800/10 border border-green-500/30'
          } rounded-lg p-5 relative overflow-hidden transition-all duration-500`}>
            {winningArmy === 'bulls' && (
              <div className="absolute top-2 right-2">
                <Crown className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <BullIcon className="w-10 h-10 text-green-400" />
              <div>
                <h4 className="text-xl font-bold text-green-400">Bulls Army</h4>
                <p className="text-xs text-gray-400">{armyStats.bulls.playerCount} Warriors</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Combined P&L</div>
              <div className={`text-3xl font-bold ${bullsTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {bullsTotal >= 0 ? '+' : ''}${Math.round(bullsTotal).toLocaleString('en-US')}
              </div>
            </div>
          </div>

          {/* Bears Army */}
          <div className={`bg-gradient-to-br ${
            winningArmy === 'bears'
              ? 'from-red-900/40 to-red-800/20 border-2 border-red-500 shadow-lg shadow-red-500/20'
              : 'from-red-900/20 to-red-800/10 border border-red-500/30'
          } rounded-lg p-5 relative overflow-hidden transition-all duration-500`}>
            {winningArmy === 'bears' && (
              <div className="absolute top-2 right-2">
                <Crown className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-4">
              <BearIcon className="w-10 h-10 text-red-400" />
              <div>
                <h4 className="text-xl font-bold text-red-400">Bears Army</h4>
                <p className="text-xs text-gray-400">{armyStats.bears.playerCount} Warriors</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Combined P&L</div>
              <div className={`text-3xl font-bold ${bearsTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {bearsTotal >= 0 ? '+' : ''}${Math.round(bearsTotal).toLocaleString('en-US')}
              </div>
            </div>
          </div>
        </div>

        {/* Battle Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-green-400 flex items-center gap-1"><BullIcon className="w-4 h-4" /> Bulls Leading</span>
            <span className="text-sm font-bold text-red-400 flex items-center gap-1">Bears Leading <BearIcon className="w-4 h-4" /></span>
          </div>
          <div className="relative h-8 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-1000"
              style={{ width: `${bullsPercentage}%` }}
            />
            <div 
              className="absolute top-0 right-0 h-full bg-gradient-to-l from-red-600 to-red-500 transition-all duration-1000"
              style={{ width: `${100 - bullsPercentage}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg flex items-center gap-1">
                {winningArmy === 'bulls' ? <BullIcon className="w-4 h-4" /> : <BearIcon className="w-4 h-4" />} {winningArmy.toUpperCase()} WINNING BY ${Math.round(difference).toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Airdrop Info */}
        <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Diamond className="w-5 h-5 text-purple-300" />
            <span className="font-bold text-purple-300">Weekly Army Airdrop</span>
          </div>
          <p className="text-sm text-gray-300">
            All warriors in the <strong className={`inline-flex items-center gap-1 ${winningArmy === 'bulls' ? 'text-green-400' : 'text-red-400'}`}>
              {winningArmy === 'bulls' ? <><BullIcon className="w-4 h-4" /> Bulls</> : <><BearIcon className="w-4 h-4" /> Bears</>}
            </strong> army will receive $BATTLE tokens when snapshot is taken!
          </p>
          <p className="text-xs text-gray-400 mt-2 flex items-center justify-center gap-1">
            <Lightbulb className="w-3 h-3" /> Switch armies by closing winning positions in the opposite direction. Only positive P&L counts!
          </p>
        </div>
      </div>
    </div>
  );
}
