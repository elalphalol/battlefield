'use client';

import { usePaperTrading } from '../hooks/usePaperTrading';

interface PaperTradingProps {
  currentPrice: number;
  coordinate: number;
  formatNumber: (num: number) => string;
}

export function PaperTrading({ currentPrice, coordinate, formatNumber }: PaperTradingProps) {
  const {
    positions,
    closedPositions,
    leverage,
    setLeverage,
    positionSize,
    setPositionSize,
    stats,
    openPosition,
    closePosition,
  } = usePaperTrading(currentPrice);

  const winRate = stats.totalTrades > 0 
    ? ((stats.winningTrades / stats.totalTrades) * 100).toFixed(1)
    : '0';

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold mb-6 text-yellow-400">🎮 PAPER TRADING</h2>
      
      {/* Trading Controls */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Leverage Control */}
        <div className="bg-slate-900 rounded-lg p-4">
          <label className="text-sm text-gray-400 mb-2 block">
            Leverage: <span className="text-yellow-400 font-bold">{leverage}x</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setLeverage(10)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1 rounded"
            >
              10x
            </button>
            <button
              onClick={() => setLeverage(50)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1 rounded"
            >
              50x
            </button>
            <button
              onClick={() => setLeverage(86)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1 rounded"
            >
              86x
            </button>
          </div>
        </div>

        {/* Position Size Control */}
        <div className="bg-slate-900 rounded-lg p-4">
          <label className="text-sm text-gray-400 mb-2 block">
            Position Size: <span className="text-yellow-400 font-bold">${formatNumber(positionSize)}</span>
          </label>
          <input
            type="range"
            min="100"
            max="10000"
            step="100"
            value={positionSize}
            onChange={(e) => setPositionSize(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setPositionSize(1000)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1 rounded"
            >
              $1K
            </button>
            <button
              onClick={() => setPositionSize(5000)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1 rounded"
            >
              $5K
            </button>
            <button
              onClick={() => setPositionSize(10000)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1 rounded"
            >
              $10K
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-900 rounded-lg p-4 flex flex-col gap-3">
          <button
            onClick={() => openPosition('long', coordinate)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            🟢 OPEN LONG
          </button>
          <button
            onClick={() => openPosition('short', coordinate)}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            🔴 OPEN SHORT
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400 mb-1">Total Trades</div>
          <div className="text-2xl font-bold text-blue-400">{stats.totalTrades}</div>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400 mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-yellow-400">{winRate}%</div>
        </div>
        <div className="bg-slate-900 rounded-lg p-4 text-center">
          <div className="text-xs text-gray-400 mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}${formatNumber(Math.abs(stats.totalPnl))}
          </div>
        </div>
      </div>

      {/* Active Positions */}
      {positions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 flex items-center justify-between">
            <span>🔥 Active Positions ({positions.length})</span>
          </h3>
          <div className="space-y-3">
            {positions.map((position) => (
              <div
                key={position.id}
                className={`bg-slate-900 rounded-lg p-4 border-l-4 ${
                  position.type === 'long' ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-lg">
                      {position.type === 'long' ? '🟢 LONG' : '🔴 SHORT'} {position.leverage}x
                    </div>
                    <div className="text-sm text-gray-400">
                      Entry: ${formatNumber(position.entryPrice)} @ {position.entryCoordinate}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Size: ${formatNumber(position.size)} • {position.entryTime}
                    </div>
                  </div>
                  <button
                    onClick={() => closePosition(position.id)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-2 rounded text-sm transition-colors"
                  >
                    CLOSE
                  </button>
                </div>
                <div className={`text-right ${position.currentPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <div className="text-2xl font-bold">
                    {position.currentPnl >= 0 ? '+' : ''}${formatNumber(Math.abs(position.currentPnl))}
                  </div>
                  <div className="text-sm">
                    {position.currentPnl >= 0 ? '+' : ''}{position.currentPnlPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Closed Positions History */}
      {closedPositions.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3">📊 Trade History ({closedPositions.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {closedPositions.map((position) => (
              <div
                key={position.id}
                className={`bg-slate-900 rounded-lg p-3 text-sm border-l-2 ${
                  position.finalPnl >= 0 ? 'border-green-500' : 'border-red-500'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="font-semibold">
                      {position.type === 'long' ? '🟢' : '🔴'} {position.type.toUpperCase()} {position.leverage}x
                    </span>
                    <span className="text-gray-400 ml-2">
                      ${formatNumber(position.entryPrice)} → ${formatNumber(position.exitPrice)}
                    </span>
                  </div>
                  <div className={`font-bold ${position.finalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.finalPnl >= 0 ? '+' : ''}${formatNumber(Math.abs(position.finalPnl))}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {position.exitTime} • {position.finalPnl >= 0 ? '+' : ''}{position.finalPnlPercent.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {positions.length === 0 && closedPositions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">💤</div>
          <div>No positions yet. Open a trade to start!</div>
        </div>
      )}
    </div>
  );
}
