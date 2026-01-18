'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../lib/api';
import sdk from '@farcaster/miniapp-sdk';
import toast from 'react-hot-toast';
import { getReferralLink } from '../lib/farcaster';

// Farcaster icon component
const FarcasterIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <img
    src="/farcaster-icon.svg"
    alt=""
    className={className}
  />
);

interface ClosedTrade {
  id: number;
  position_type: 'long' | 'short';
  leverage: number;
  entry_price: number;
  exit_price: number;
  position_size: number;
  pnl: number;
  status: 'closed' | 'liquidated' | 'voided';
  stop_loss: number | null;
  closed_by: 'manual' | 'stop_loss' | 'liquidation' | 'voided' | null;
  opened_at: string;
  closed_at: string;
}

interface UserData {
  army: 'bears' | 'bulls';
  username?: string;
  referral_code?: string;
  rank?: number;
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
      // Fetch user data and leaderboard rank in parallel
      const [userResponse, leaderboardResponse] = await Promise.all([
        fetch(getApiUrl(`api/users/${address}`)),
        fetch(getApiUrl('api/leaderboard?limit=500'))
      ]);

      const userData = await userResponse.json();
      const leaderboardData = await leaderboardResponse.json();

      if (userData.success) {
        // Find user's rank in leaderboard
        let rank = 0;
        if (leaderboardData.success && leaderboardData.leaderboard) {
          const userIndex = leaderboardData.leaderboard.findIndex(
            (entry: { wallet_address: string }) =>
              entry.wallet_address?.toLowerCase() === address?.toLowerCase()
          );
          if (userIndex !== -1) {
            rank = userIndex + 1; // Rank is 1-indexed
          }
        }

        setUserData({ ...userData.user, rank });
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
          const pnlCents = Number(trade.pnl);
          const pnl = pnlCents / 100; // Convert cents to dollars for display
          const pnlPercentage = (pnlCents / Number(trade.position_size)) * 100; // Both in cents, ratio is correct
          const isProfit = pnl >= 0;
          const isLiquidated = trade.status === 'liquidated';
          const isVoided = trade.status === 'voided';
          // Check if trade was closed by stop loss using the closed_by field
          const wasStopLoss = trade.closed_by === 'stop_loss';

          const generateImageUrl = () => {
            const army = userData?.army || 'bulls';
            const username = userData?.username || address?.slice(0, 8);
            const referralCode = userData?.referral_code || '';
            const rank = userData?.rank || 0;

            // Don't use toLocaleString for URL params - it adds commas that get encoded
            const params = new URLSearchParams({
              army,
              type: trade.position_type,
              leverage: trade.leverage.toString(),
              pnl: Math.round(pnl).toString(),
              pnlPercent: Math.round(pnlPercentage).toString(),
              username: username || 'Trader',
              v: Date.now().toString() // Cache buster
            });

            // Add referral code if available
            if (referralCode) {
              params.set('ref', referralCode);
            }

            // Add rank if available
            if (rank > 0) {
              params.set('rank', rank.toString());
            }

            return `${window.location.origin}/api/share-card?${params.toString()}`;
          };

          const handleCast = async () => {
            const imageUrl = generateImageUrl();
            const army = userData?.army || 'bulls';
            const armyEmoji = army === 'bears' ? '🐻' : '🐂';
            const exitPrice = Math.round(Number(trade.exit_price)).toLocaleString('en-US');

            // Generate status text based on trade outcome
            let statusText: string;
            let statusEmoji = '';
            if (isLiquidated) {
              statusText = '💥 LIQUIDATED';
              statusEmoji = ' 💥';
            } else if (wasStopLoss) {
              statusText = 'Tactical exit at stop loss';
              statusEmoji = ' 🛡️';
            } else if (isProfit) {
              statusText = 'won';
            } else {
              statusText = 'lost';
            }

            // Build share text with exit price for stop loss trades
            let shareText: string;
            if (wasStopLoss) {
              shareText = `${armyEmoji} ${statusText} ${isProfit ? '+' : ''}$${Math.round(pnl).toLocaleString('en-US')} on @btcbattle!\n\n${trade.position_type.toUpperCase()} ${trade.leverage}x | Exit: $${exitPrice} | ${isProfit ? '+' : ''}${Math.round(pnlPercentage)}%${statusEmoji}\n\n⚔️ Bears vs Bulls`;
            } else {
              shareText = `${armyEmoji} Just ${statusText} ${isProfit ? '+' : ''}$${Math.round(pnl).toLocaleString('en-US')} on @btcbattle!\n\n${trade.position_type.toUpperCase()} ${trade.leverage}x | ${isProfit ? '+' : ''}${Math.round(pnlPercentage)}%${statusEmoji}\n\n⚔️ Bears vs Bulls`;
            }

            // Track the cast for mission progress
            try {
              await fetch(getApiUrl('api/missions/complete'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: address, missionKey: 'cast_result' })
              });
            } catch (err) {
              console.error('Failed to track cast mission:', err);
            }

            // Use Farcaster Frame SDK composeCast for better integration
            try {
              const referralCode = userData?.referral_code;

              // Build embeds array - Farcaster SDK accepts up to 2 embeds
              const embeds: [string] | [string, string] = referralCode
                ? [imageUrl, getReferralLink(referralCode)]
                : [imageUrl];

              await sdk.actions.composeCast({
                text: shareText,
                embeds: embeds,
              });
              toast.success('🎯 Mission done! Claim $500 in Missions tab');
            } catch (error) {
              console.error('Error casting to Farcaster:', error);
              // Fallback: try warpcast URL
              try {
                const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(imageUrl)}`;
                await sdk.actions.openUrl(castUrl);
                toast.success('🎯 Mission done! Claim $500 in Missions tab');
              } catch (urlError) {
                // Last resort: copy to clipboard
                try {
                  await navigator.clipboard.writeText(shareText);
                  toast.success('Copied! 🎯 Claim $500 in Missions tab');
                } catch (clipError) {
                  toast.error('❌ Unable to create cast. Please try again.');
                }
              }
            }
          };

          return (
            <div
              key={trade.id}
              className={`border-2 rounded-lg p-3 relative overflow-hidden ${
                isVoided
                  ? 'border-gray-700 bg-gray-950/30'
                  : isLiquidated
                  ? 'border-red-900 bg-red-950/30'
                  : wasStopLoss
                  ? 'border-yellow-700 bg-yellow-950/20'
                  : isProfit
                  ? 'border-green-900 bg-green-950/30'
                  : 'border-red-700 bg-red-950/20'
              }`}
            >
              {/* Voided Stamp Overlay */}
              {isVoided && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="text-gray-500 font-black text-3xl opacity-30 rotate-[-15deg] border-4 border-gray-500 px-4 py-2 rounded">
                    VOIDED
                  </div>
                </div>
              )}
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
                  {/* Stop Loss Indicator - inline with position type */}
                  {wasStopLoss && (
                    <span className="text-xs bg-yellow-600/80 text-yellow-100 px-1.5 py-0.5 rounded font-bold">
                      🛡️
                    </span>
                  )}
                  {/* Voided Indicator */}
                  {isVoided && (
                    <span className="text-xs bg-gray-600/80 text-gray-200 px-1.5 py-0.5 rounded font-bold">
                      🚫 Voided
                    </span>
                  )}
                </div>
                <div className={`text-right ${isVoided ? 'text-gray-500' : isProfit ? 'text-green-400' : 'text-red-400'}`}>
                  <div className="text-sm font-bold whitespace-nowrap">
                    {isProfit ? '+' : ''}${Math.round(pnl).toLocaleString('en-US')}
                  </div>
                  <div className="text-xs">
                    ({isProfit ? '+' : ''}{Math.round(pnlPercentage)}%)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                <div>
                  <span className="text-gray-500">Entry:</span> ${Math.round(Number(trade.entry_price)).toLocaleString('en-US')}
                </div>
                <div>
                  <span className="text-gray-500">Exit:</span> ${Math.round(Number(trade.exit_price)).toLocaleString('en-US')}
                </div>
                <div>
                  <span className="text-gray-500">Size:</span> ${Math.round(Number(trade.position_size) / 100).toLocaleString('en-US')}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {new Date(trade.closed_at).toLocaleString()}
                </div>
                {!isVoided && (
                  <button
                    onClick={handleCast}
                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3 py-1 rounded font-bold transition-all flex items-center gap-1"
                  >
                    <FarcasterIcon className="w-4 h-4" /> Cast
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
