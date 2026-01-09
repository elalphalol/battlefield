'use client';

import { useState, useEffect } from 'react';

export function MarketCycle() {
  const [nycTime, setNycTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNycTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
    <div className={`bg-gradient-to-r ${phase.bgColor} border-2 ${phase.borderColor} rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">⏰ Market Cycle</h3>
        <div className="text-right">
          <div className="text-xs text-gray-400">New York Time</div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">{nycTimeString}</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-lg font-bold text-white mb-2">{phase.name}</div>
        <p className="text-sm text-gray-300 leading-relaxed">{phase.description}</p>
      </div>

      {/* Time-based trading tips */}
      <div className="bg-slate-900/50 rounded p-3 text-xs text-gray-400">
        <strong className="text-white">Trading Tip:</strong>{' '}
        {phase.sentiment === 'opportunity' && 'Look for dip entries in 888-700 zones. Quick scalps possible!'}
        {phase.sentiment === 'bullish' && 'Long positions below whole numbers. Ride the morning momentum!'}
        {phase.sentiment === 'active' && 'High volatility. Watch BEAMS closely for breakdown signals.'}
        {phase.sentiment === 'neutral' && 'Consolidation phase. Wait for clearer directional signals.'}
        {phase.sentiment === 'bearish' && 'Caution with longs. Consider shorts above whole numbers or stay flat.'}
      </div>
    </div>
  );
}
