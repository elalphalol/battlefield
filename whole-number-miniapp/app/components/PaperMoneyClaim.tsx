'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../config/api';
import toast from 'react-hot-toast';

interface PaperMoneyClaimProps {
  onClaim: (newBalance: number) => void;
  paperBalance: number;
  walletAddress?: string;
}

export function PaperMoneyClaim({ onClaim, paperBalance, walletAddress }: PaperMoneyClaimProps) {
  const { address: wagmiAddress } = useAccount();
  const address = walletAddress || wagmiAddress;
  const [claiming, setClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canClaimFromServer, setCanClaimFromServer] = useState(false);
  const [hasOpenPositions, setHasOpenPositions] = useState(false);
  const [isEmergencyClaim, setIsEmergencyClaim] = useState(false);

  // Can claim if server says OK AND no open positions
  const canClaim = canClaimFromServer && !hasOpenPositions;

  useEffect(() => {
    if (!address) return;

    const checkStatus = async () => {
      try {
        // Check claim status
        const response = await fetch(getApiUrl('api/claims/status'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address })
        });

        const data = await response.json();
        if (data.success) {
          setCanClaimFromServer(data.canClaim);
          setTimeLeft(data.timeLeft || 0);
          setIsEmergencyClaim(data.emergencyClaim || false);
        }

        // Check open positions
        const positionsResponse = await fetch(getApiUrl(`api/trades/${address}/open`));
        const positionsData = await positionsResponse.json();
        if (positionsData.success) {
          setHasOpenPositions(positionsData.trades.length > 0);
        }
      } catch (error) {
        console.error('Error checking claim status:', error);
      }
    };

    checkStatus();
    // Check every 10 seconds instead of every second (daily cooldown doesn't need frequent updates)
    const interval = setInterval(checkStatus, 10000);

    return () => clearInterval(interval);
  }, [address]);

  const formatTimeLeft = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleClaim = async () => {
    if (!address || !canClaim || claiming) return;

    setClaiming(true);
    try {
      const response = await fetch(getApiUrl('api/claims'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });

      const data = await response.json();
      if (data.success) {
        onClaim(data.newBalance);
        toast.success('$1,000 claimed!');
        // Refresh status
        setCanClaimFromServer(false);
      } else {
        toast.error(data.message || 'Failed to claim paper money');
      }
    } catch (error) {
      console.error('Error claiming paper money:', error);
      toast.error('Failed to claim paper money');
    } finally {
      setClaiming(false);
    }
  };

  if (!address) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-2">💰 Paper Money Claim</h3>
        <p className="text-gray-400 text-sm">Connect wallet to claim paper money</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500/50 rounded-lg p-5 shadow-lg">
      <h3 className="text-xl font-bold text-green-400 mb-4">💰 Daily Claim</h3>

      <button
        onClick={handleClaim}
        disabled={!canClaim || claiming}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-3 rounded-lg font-bold text-base transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {claiming ? (
          <>
            <span className="inline-block animate-spin mr-2">⏳</span>
            Claiming...
          </>
        ) : hasOpenPositions ? (
          <>
            <span className="mr-2">📊</span>
            Close positions first
          </>
        ) : canClaim ? (
          <>
            <span className="mr-2">💵</span>
            {isEmergencyClaim ? 'Emergency Claim $1,000!' : 'Claim $1,000 Now!'}
          </>
        ) : timeLeft > 0 ? (
          <>
            <span className="mr-2">⏰</span>
            Next claim in {formatTimeLeft(timeLeft)}
          </>
        ) : (
          <>
            <span className="mr-2">✅</span>
            Already claimed today
          </>
        )}
      </button>

      <div className="mt-3 text-center text-xs leading-relaxed text-gray-400">
        {hasOpenPositions ? (
          <>Close all positions to claim</>
        ) : (
          <>Daily $1,000 claim (resets at midnight UTC)<br/>Emergency claim available if balance &lt; $100</>
        )}
      </div>
    </div>
  );
}
