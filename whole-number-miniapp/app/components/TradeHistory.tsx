'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../config/api';

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

export function TradeHistory() {
  const { address } = useAccount();
  const [history, setHistory] = useState<ClosedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [openShareMenuId, setOpenShareMenuId] = useState<number | null>(null);

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

          const handleShare = (platform: 'farcaster' | 'twitter' | 'copy') => {
            const imageUrl = generateImageUrl();
            const websiteUrl = window.location.origin;
            const army = userData?.army || 'bulls';
            const armyEmoji = army === 'bears' ? '🐻' : '🐂';
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            const shareText = `${armyEmoji} Just ${isProfit ? 'won' : 'lost'} ${isProfit ? '+' : ''}$${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} on @Battlefield!\n\n${trade.position_type.toUpperCase()} ${trade.leverage}x | ${isProfit ? '+' : ''}${pnlPercentage.toFixed(1)}%\n\n⚔️ Bears vs Bulls`;

            if (platform === 'farcaster') {
              if (isMobile) {
                // Mobile: Use Warpcast with image embed
                const encodedText = encodeURIComponent(shareText);
                const encodedImage = encodeURIComponent(imageUrl);
                window.open(`https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedImage}`, '_blank');
              } else {
                // Desktop: Open Warpcast with just text
                const encodedText = encodeURIComponent(shareText);
                window.open(`https://warpcast.com/~/compose?text=${encodedText}`, '_blank');
              }
            } else if (platform === 'twitter') {
              const encodedText = encodeURIComponent(shareText + `\n\n${websiteUrl}`);
              window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, '_blank');
            } else if (platform === 'copy') {
              // Just copy the image URL for easy sharing
              navigator.clipboard.writeText(imageUrl);
              alert('✅ Image URL copied! Paste in any app.');
            }
            
            setOpenShareMenuId(null);
          };

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
                  {isProfit ? '+' : ''}${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  <span className="text-xs ml-1">
                    ({isProfit ? '+' : ''}{pnlPercentage.toFixed(1)}%)
                  </span>
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
                <div className="relative">
                  <button
                    onClick={() => setOpenShareMenuId(openShareMenuId === trade.id ? null : trade.id)}
                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded font-bold transition-all flex items-center gap-1"
                  >
                    📤 Share
                  </button>
                  
                  {openShareMenuId === trade.id && (
                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-slate-900 border-2 border-purple-500 rounded-lg shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={() => handleShare('farcaster')}
                        className="w-full text-left px-4 py-3 hover:bg-purple-600 text-white text-sm font-bold transition-all flex items-center gap-2 border-b border-slate-700"
                      >
                        <span className="text-lg">🟪</span> Farcaster
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="w-full text-left px-4 py-3 hover:bg-green-600 text-white text-sm font-bold transition-all flex items-center gap-2"
                      >
                        <span className="text-lg">📋</span> Copy Link
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
