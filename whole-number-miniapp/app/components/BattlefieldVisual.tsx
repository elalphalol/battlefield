'use client';

import { Target, AlertTriangle, Zap, Hammer } from 'lucide-react';
import { BearIcon, BullIcon } from './icons';

interface BattlefieldVisualProps {
  coordinate: number;
  wholeNumber: number;
  nextWholeNumber: number;
  beamsBroken: {
    beam226: boolean;
    beam113: boolean;
    beam086: boolean;
  };
  zoneInfo: {
    name: string;
    signal: 'bullish' | 'bearish' | 'neutral' | 'opportunity';
  };
}

export function BattlefieldVisual({
  coordinate = 0,
  wholeNumber = 0,
  nextWholeNumber = 0,
  beamsBroken = { beam226: false, beam113: false, beam086: false },
  zoneInfo = { name: 'Loading...', signal: 'neutral' as const }
}: BattlefieldVisualProps) {
  // Safety check - ensure we have valid numbers
  const safeCoordinate = typeof coordinate === 'number' && !isNaN(coordinate) ? coordinate : 0;
  const safeWholeNumber = typeof wholeNumber === 'number' && !isNaN(wholeNumber) ? wholeNumber : 0;
  const safeNextWholeNumber = typeof nextWholeNumber === 'number' && !isNaN(nextWholeNumber) ? nextWholeNumber : 0;

  // Calculate position percentage (0-100)
  const positionPercent = (safeCoordinate / 1000) * 100;

  // Determine zone colors
  const getZoneColor = () => {
    if (safeCoordinate >= 900) return 'from-green-600 to-emerald-600';
    if (safeCoordinate >= 700) return 'from-yellow-600 to-amber-600';
    if (safeCoordinate >= 500) return 'from-blue-600 to-cyan-600';
    if (safeCoordinate >= 300) return 'from-orange-600 to-red-600';
    return 'from-red-600 to-red-800';
  };

  // Calculate army percentages (visual representation)
  const bullPercent = safeCoordinate / 10; // 0-100
  const bearPercent = 100 - bullPercent;

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border-2 border-yellow-500/50 p-6 shadow-2xl">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          <Target className="w-6 h-6 sm:w-8 sm:h-8" />
          <span>THE BATTLEFIELD</span>
          <Target className="w-6 h-6 sm:w-8 sm:h-8" />
        </h2>
      </div>

      {/* Coordinate Display */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg p-8 mb-6 border border-slate-600">
        <div className="text-center">
          <div className={`text-8xl font-black bg-gradient-to-r ${getZoneColor()} bg-clip-text text-transparent mb-2`}>
            {safeCoordinate.toString().padStart(3, '0')}
          </div>
          <p className="text-gray-400 text-lg">Current Coordinate</p>
        </div>
      </div>

      {/* Whole Number Labels */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-center">
          <AlertTriangle className="w-5 h-5 text-red-400 mx-auto" />
          <div className="text-2xl font-bold text-white mt-1">
            ${(safeWholeNumber / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="text-center">
          <Zap className="w-5 h-5 text-green-400 mx-auto" />
          <div className="text-2xl font-bold text-white mt-1">
            ${(safeNextWholeNumber / 1000).toFixed(0)}K
          </div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="relative h-32 bg-slate-700 rounded-lg border-2 border-slate-600 overflow-hidden mb-6">
        {/* Background gradient showing armies */}
        <div className="absolute inset-0 flex">
          <div
            className="bg-gradient-to-r from-red-600 to-red-500 flex items-center justify-center transition-all duration-500"
            style={{ width: `${bearPercent}%` }}
          >
            {bearPercent > 20 && (
              <div className="text-white font-bold text-center px-2">
                <BearIcon className="w-8 h-8 mx-auto" />
                <div className="text-sm">BEARS</div>
                <div className="text-2xl font-black">{bearPercent.toFixed(0)}%</div>
              </div>
            )}
          </div>
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center transition-all duration-500"
            style={{ width: `${bullPercent}%` }}
          >
            {bullPercent > 20 && (
              <div className="text-white font-bold text-center px-2">
                <BullIcon className="w-8 h-8 mx-auto" />
                <div className="text-sm">BULLS</div>
                <div className="text-2xl font-black">{bullPercent.toFixed(0)}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Position indicator */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-yellow-400 shadow-lg shadow-yellow-400/50 transition-all duration-300 z-10"
          style={{ left: `${positionPercent}%` }}
        >
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <Zap className="w-6 h-6 text-yellow-400" />
          </div>
        </div>

        {/* Zone markers */}
        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
          <div className="flex-1 bg-red-700" />
          <div className="flex-1 bg-orange-600" />
          <div className="flex-1 bg-blue-600" />
          <div className="flex-1 bg-yellow-600" />
          <div className="flex-1 bg-green-600" />
        </div>
      </div>

      {/* Zone indicators */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-6 text-[10px] sm:text-xs text-center">
        <div className="p-1 sm:p-2 bg-red-900/30 rounded border border-red-500/50 overflow-hidden">
          <div className="font-bold truncate">0-226</div>
          <div className="text-red-400 truncate">BEAMS</div>
        </div>
        <div className="p-1 sm:p-2 bg-orange-900/30 rounded border border-orange-500/50 overflow-hidden">
          <div className="font-bold truncate">226-500</div>
          <div className="text-orange-400 truncate">WEAK</div>
        </div>
        <div className="p-1 sm:p-2 bg-blue-900/30 rounded border border-blue-500/50 overflow-hidden">
          <div className="font-bold truncate">500-700</div>
          <div className="text-blue-400 truncate">MIDDLE</div>
        </div>
        <div className="p-1 sm:p-2 bg-yellow-900/30 rounded border border-yellow-500/50 overflow-hidden">
          <div className="font-bold truncate">700-888</div>
          <div className="text-yellow-400 truncate">DIP BUY</div>
        </div>
        <div className="p-1 sm:p-2 bg-green-900/30 rounded border border-green-500/50 overflow-hidden">
          <div className="font-bold truncate">900s</div>
          <div className="text-green-400 truncate">ROCKET</div>
        </div>
      </div>

      {/* Current Zone Status */}
      <div className={`p-4 rounded-lg border-2 text-center ${
        zoneInfo.signal === 'bullish' ? 'bg-green-900/30 border-green-500' :
        zoneInfo.signal === 'bearish' ? 'bg-red-900/30 border-red-500' :
        zoneInfo.signal === 'opportunity' ? 'bg-yellow-900/30 border-yellow-500' :
        'bg-slate-800 border-slate-600'
      }`}>
        <div className="text-2xl font-bold mb-2">{zoneInfo.name}</div>
        {beamsBroken.beam086 && (
          <div className="text-red-400 font-bold animate-pulse flex items-center justify-center gap-1">
            <Hammer className="w-5 h-5" /> SLEDGEHAMMER ACTIVE - ALL BEAMS BROKEN!
          </div>
        )}
        {beamsBroken.beam113 && !beamsBroken.beam086 && (
          <div className="text-orange-400 font-bold flex items-center justify-center gap-1">
            <Hammer className="w-5 h-5" /> BEAM ZONE - 113 Broken!
          </div>
        )}
        {beamsBroken.beam226 && !beamsBroken.beam113 && (
          <div className="text-yellow-400 font-bold flex items-center justify-center gap-1">
            <Hammer className="w-5 h-5" /> BEAM ZONE - 226 Active
          </div>
        )}
      </div>
    </div>
  );
}
