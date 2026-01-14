'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../config/api';
import sdk from '@farcaster/miniapp-sdk';

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

interface UserData {
  army: 'bears' | 'bulls';
  username?: string;
}

interface TradeHistoryProps {
  walletAddress?: string; // Add optional wallet address prop
}

export function TradeHistory({ walletAddress }: TradeHistoryProps = {}) {
  const { address: wagmiAddress } = useAccount();
  // Use passed wallet address if available, otherwise fall back to wagmi
  const address = walletAddress || wagmiAddress;
  const [history, setHistory] = useState<ClosedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (address) {
      fetchHistory();
      fetchUserData();
      // Refresh every 30 seconds
      const interval = setInterval(fetchHistory, 30000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchUserData = async () => {
    if (!address) return;
    try {
      const response = await fetch(getApiUrl(`api/users/${address}`));
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchHistory = async () => {
    if (!address) return;

    try {
      const response = await fetch(getApiUrl(`api/trades/${address}/history?limit=5`));
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
      <h3 className="text-xl font-bold text-yellow-400 mb-4">📜 Trade History (Last 5)</h3>
      
      <div className="space-y-3">
        {history.map((trade) => {
          const pnl = Number(trade.pnl);
          const pnlPercentage = (pnl / Number(trade.position_size)) * 100;
          const isProfit = pnl >= 0;
          const isLiquidated = trade.status === 'liquidated';

          const generateImageUrl = () => {
            const army = userData?.army || 'bulls';
            const username = userData?.username || address?.slice(0, 8);
            
            // Don't use toLocaleString for URL params - it adds commas that get encoded
            const params = new URLSearchParams({
              army,
              type: trade.position_type,
              leverage: trade.leverage.toString(),
              pnl: pnl.toFixed(2),
              pnlPercent: pnlPercentage.toFixed(1),
              username: username || 'Trader',
              v: Date.now().toString() // Cache buster
            });

            return `${window.location.origin}/api/share-card?${params.toString()}`;
          };

          const handleCast = async () => {
            const imageUrl = generateImageUrl();
            const army = userData?.army || 'bulls';
            const armyEmoji = army === 'bears' ? '🐻' : '🐂';
            
            // Add liquidation status to share text
            const statusText = isLiquidated ? '💥 LIQUIDATED' : (isProfit ? 'won' : 'lost');
            const shareText = `${armyEmoji} Just ${statusText} ${isProfit ? '+' : ''}$${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} on @btcbattle!\n\n${trade.position_type.toUpperCase()} ${trade.leverage}x | ${isProfit ? '+' : ''}${pnlPercentage.toFixed(1)}%${isLiquidated ? ' 💥' : ''}\n\n⚔️ Bears vs Bulls`;

            // Use Farcaster Frame SDK to open composer
            try {
              const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(imageUrl)}`;
              await sdk.actions.openUrl(castUrl);
            } catch (error) {
              console.error('Error casting to Farcaster:', error);
              // Fallback: try copying to clipboard
              try {
                await navigator.clipboard.writeText(shareText);
                alert('✅ Cast text copied to clipboard!');
              } catch (clipError) {
                alert('❌ Unable to create cast. Please try again.');
              }
            }
          };

          return (
            <div
              key={trade.id}
              className={`border-2 rounded-lg p-3 relative overflow-hidden ${
                isLiquidated
                  ? 'border-red-900 bg-red-950/30'
                  : isProfit
                  ? 'border-green-900 bg-green-950/30'
                  : 'border-red-700 bg-red-950/20'
              }`}
            >
              {/* Liquidated Stamp Overlay */}
              {isLiquidated && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="text-red-500 font-black text-3xl opacity-20 rotate-[-15deg] border-4 border-red-500 px-4 py-2 rounded">
                    LIQUIDATED
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-2 relative z-20">
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${trade.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.position_type === 'long' ? '📈' : '📉'}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {trade.position_type.toUpperCase()} {trade.leverage}x
                  </span>
                </div>
                <div className={`text-right ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                  <div className="text-sm font-bold whitespace-nowrap">
                    {isProfit ? '+' : ''}${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                  <div className="text-xs">
                    ({isProfit ? '+' : ''}{pnlPercentage.toFixed(1)}%)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div>
                  <span className="text-gray-500">Entry:</span> ${Number(trade.entry_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div>
                  <span className="text-gray-500">Exit:</span> ${Number(trade.exit_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
                <div>
                  <span className="text-gray-500">Size:</span> ${Number(trade.position_size).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {new Date(trade.closed_at).toLocaleString()}
                </div>
                <button
                  onClick={handleCast}
                  className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded font-bold transition-all flex items-center gap-1"
                >
                  🟪 Cast
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
