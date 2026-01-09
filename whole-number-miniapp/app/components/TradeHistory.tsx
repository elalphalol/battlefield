'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface ClosedTrade {
  id: number;
  position_type: 'long' | 'short';
  leverage: number;
  entry_price: number;
  exit_price: number;
  position_size: number;
  pnl: number;
  status: 'closed' | 'liquidated';
  opened_at: string;
  closed_at: string;
}

export function TradeHistory() {
  const { address } = useAccount();
  const [history, setHistory] = useState<ClosedTrade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
      fetchHistory();
      // Refresh every 30 seconds
      const interval = setInterval(fetchHistory, 30000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchHistory = async () => {
    if (!address) return;

    try {
      const response = await fetch(`http://localhost:3001/api/trades/${address}/history?limit=10`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.trades);
      }
    } catch (error) {
      console.error('Error fetching trade history:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!address) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">📜 Trade History</h3>
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">📜 Trade History</h3>
        <p className="text-gray-400 text-center py-4">No closed trades yet. Open your first position!</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
      <h3 className="text-xl font-bold text-yellow-400 mb-4">📜 Trade History (Last 10)</h3>
      
      <div className="space-y-2">
        {history.map((trade) => {
          const pnl = Number(trade.pnl);
          const pnlPercentage = (pnl / Number(trade.position_size)) * 100;
          const isProfit = pnl >= 0;
          const isLiquidated = trade.status === 'liquidated';

          return (
            <div
              key={trade.id}
              className={`border-2 rounded-lg p-3 ${
                isLiquidated
                  ? 'border-red-900 bg-red-950/30'
                  : isProfit
                  ? 'border-green-900 bg-green-950/30'
                  : 'border-red-700 bg-red-950/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${trade.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.position_type === 'long' ? '📈' : '📉'}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {trade.position_type.toUpperCase()} {trade.leverage}x
                  </span>
                  {isLiquidated && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">
                      LIQUIDATED
                    </span>
                  )}
                </div>
                <div className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                  {isProfit ? '+' : ''}${pnl.toFixed(2)}
                  <span className="text-xs ml-1">
                    ({isProfit ? '+' : ''}{pnlPercentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div>
                  <span className="text-gray-500">Entry:</span> ${Number(trade.entry_price).toFixed(2)}
                </div>
                <div>
                  <span className="text-gray-500">Exit:</span> ${Number(trade.exit_price).toFixed(2)}
                </div>
                <div>
                  <span className="text-gray-500">Size:</span> ${Number(trade.position_size)}
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                {new Date(trade.closed_at).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
