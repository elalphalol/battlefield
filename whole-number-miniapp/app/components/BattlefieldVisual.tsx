'use client';

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
  coordinate, 
  wholeNumber, 
  nextWholeNumber, 
  beamsBroken,
  zoneInfo 
}: BattlefieldVisualProps) {
  // Calculate position percentage (0-100)
  const positionPercent = (coordinate / 1000) * 100;
  
  // Determine zone colors
  const getZoneColor = () => {
    if (coordinate >= 900) return 'from-green-600 to-emerald-600';
    if (coordinate >= 700) return 'from-yellow-600 to-amber-600';
    if (coordinate >= 500) return 'from-blue-600 to-cyan-600';
    if (coordinate >= 300) return 'from-orange-600 to-red-600';
    return 'from-red-600 to-red-800';
  };

  // Calculate army percentages (visual representation)
  const bullPercent = coordinate / 10; // 0-100
  const bearPercent = 100 - bullPercent;

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl border-2 border-yellow-500/50 p-6 shadow-2xl">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-yellow-400 flex items-center justify-center gap-3">
          🎯 THE BATTLEFIELD 🎯
        </h2>
      </div>

      {/* Coordinate Display */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-lg p-8 mb-6 border border-slate-600">
        <div className="text-center">
          <div className={`text-8xl font-black bg-gradient-to-r ${getZoneColor()} bg-clip-text text-transparent mb-2`}>
            {coordinate.toString().padStart(3, '0')}
          </div>
          <p className="text-gray-400 text-lg">Current Coordinate</p>
        </div>
      </div>

      {/* Whole Number Labels */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-center">
          <div className="text-xl font-bold text-red-400">⚠️</div>
          <div className="text-2xl font-bold text-white mt-1">
            ${(wholeNumber / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-green-400">⚡</div>
          <div className="text-2xl font-bold text-white mt-1">
            ${(nextWholeNumber / 1000).toFixed(0)}K
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
                <div className="text-3xl">🐻</div>
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
                <div className="text-3xl">🐂</div>
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
            <div className="text-2xl">⚡</div>
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
      <div className="grid grid-cols-5 gap-2 mb-6 text-xs text-center">
        <div className="p-2 bg-red-900/30 rounded border border-red-500/50">
          <div className="font-bold">0-226</div>
          <div className="text-red-400">BEAMS</div>
        </div>
        <div className="p-2 bg-orange-900/30 rounded border border-orange-500/50">
          <div className="font-bold">226-500</div>
          <div className="text-orange-400">WEAK</div>
        </div>
        <div className="p-2 bg-blue-900/30 rounded border border-blue-500/50">
          <div className="font-bold">500-700</div>
          <div className="text-blue-400">MIDDLE</div>
        </div>
        <div className="p-2 bg-yellow-900/30 rounded border border-yellow-500/50">
          <div className="font-bold">700-888</div>
          <div className="text-yellow-400">DIP BUY</div>
        </div>
        <div className="p-2 bg-green-900/30 rounded border border-green-500/50">
          <div className="font-bold">900s</div>
          <div className="text-green-400">ROCKET</div>
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
          <div className="text-red-400 font-bold animate-pulse">
            🔨 SLEDGEHAMMER ACTIVE - ALL BEAMS BROKEN!
          </div>
        )}
        {beamsBroken.beam113 && !beamsBroken.beam086 && (
          <div className="text-orange-400 font-bold">
            🔨 BEAM ZONE - 113 Broken!
          </div>
        )}
        {beamsBroken.beam226 && !beamsBroken.beam113 && (
          <div className="text-yellow-400 font-bold">
            🔨 BEAM ZONE - 226 Active
          </div>
        )}
      </div>
    </div>
  );
}
