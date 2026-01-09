'use client';

import { useState, useEffect } from 'react';

export function MarketCycle() {
  const [nycTime, setNycTime] = useState<Date | null>(null);

  useEffect(() => {
    // Initialize time on mount
    setNycTime(new Date());
    
    const timer = setInterval(() => {
      setNycTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Don't render time until mounted to avoid hydration mismatch
  if (!nycTime) {
    return (
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-slate-600 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">⏰ Market Cycle</h3>
          <div className="text-right">
            <div className="text-xs text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Get NYC time (EST/EDT - UTC-5/UTC-4)
  const nycTimeString = nycTime.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const nycHour = parseInt(nycTime.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    hour12: false
  }));

  // Determine market phase based on NYC time
  const getMarketPhase = (hour: number) => {
    if (hour >= 4 && hour < 7) {
      return {
        name: '🌅 Morning Low Phase',
        description: 'Overnight dumps typically end. 6:30 AM often marks the daily low - opportunity for quick scalps.',
        sentiment: 'opportunity',
        bgColor: 'from-blue-900/30 to-cyan-900/30',
        borderColor: 'border-cyan-500'
      };
    } else if (hour >= 7 && hour < 10) {
      return {
        name: '📈 AM Pump Phase',
        description: 'Momentum builds toward stock market open at 9:30 AM. Expect bullish price action and whole number breakouts.',
        sentiment: 'bullish',
        bgColor: 'from-green-900/30 to-emerald-900/30',
        borderColor: 'border-green-500'
      };
    } else if (hour >= 10 && hour < 16) {
      return {
        name: '☀️ Daytime Trading',
        description: 'Active trading hours with higher volume. Price action more predictable. Good for position trading.',
        sentiment: 'active',
        bgColor: 'from-yellow-900/30 to-orange-900/30',
        borderColor: 'border-yellow-500'
      };
    } else if (hour >= 16 && hour < 20) {
      return {
        name: '🌆 Evening Session',
        description: 'Post-market hours. Volume decreases. Watch for consolidation around key whole numbers.',
        sentiment: 'neutral',
        bgColor: 'from-purple-900/30 to-pink-900/30',
        borderColor: 'border-purple-500'
      };
    } else {
      return {
        name: '🌙 Witching Hour',
        description: 'Overnight session (8 PM - 4 AM). Expect dumps with lower volume. Most dramatic moves down occur 4-6:30 AM.',
        sentiment: 'bearish',
        bgColor: 'from-red-900/30 to-rose-900/30',
        borderColor: 'border-red-500'
      };
    }
  };

  const phase = getMarketPhase(nycHour);

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center flex items-center justify-center gap-2">
        <span>🕐</span> TIME CYCLE INDICATOR
      </h2>
      
      <div className="grid md:grid-cols-2 gap-4">
        {/* Current NY Time */}
        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
          <div className="text-sm text-gray-400 mb-2 text-center">Current NY Time:</div>
          <div className="text-4xl font-bold text-yellow-400 font-mono text-center">{nycTimeString}</div>
        </div>

        {/* Market Phase */}
        <div className={`bg-gradient-to-r ${phase.bgColor} rounded-lg p-6 border-2 ${phase.borderColor}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="text-4xl">
              {phase.sentiment === 'opportunity' && '🌅'}
              {phase.sentiment === 'bullish' && '📈'}
              {phase.sentiment === 'active' && '☀️'}
              {phase.sentiment === 'neutral' && '🌆'}
              {phase.sentiment === 'bearish' && '🌙'}
            </div>
            <div>
              <div className="text-lg font-bold text-white">{phase.name}</div>
              <div className="text-xs text-gray-300">{phase.description}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
