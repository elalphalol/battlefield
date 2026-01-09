'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface PaperMoneyClaimProps {
  onClaim: (newBalance: number) => void;
  paperBalance: number;
}

export function PaperMoneyClaim({ onClaim, paperBalance }: PaperMoneyClaimProps) {
  const { address } = useAccount();
  const [claiming, setClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(true);

  // Can claim if balance is below $100 AND cooldown is over
  const canClaim = Number(paperBalance) < 100 && !cooldownActive;

  useEffect(() => {
    if (!address) return;

    // Check claim status every second
    const checkStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/claims/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address })
        });
        
        const data = await response.json();
        if (data.success) {
          setCooldownActive(!data.canClaim);
          setTimeLeft(data.timeLeft || 0);
        }
      } catch (error) {
        console.error('Error checking claim status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    
    return () => clearInterval(interval);
  }, [address]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClaim = async () => {
    if (!address || !canClaim || claiming) return;
    
    setClaiming(true);
    try {
      const response = await fetch('http://localhost:3001/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      if (data.success) {
        onClaim(data.newBalance);
      } else {
        alert(data.message || 'Failed to claim paper money');
      }
    } catch (error) {
      console.error('Error claiming paper money:', error);
      alert('Failed to claim paper money');
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
      <h3 className="text-xl font-bold text-green-400 mb-4">💰 Claim</h3>
      
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
        ) : canClaim ? (
          <>
            <span className="mr-2">💵</span>
            Claim $1,000 Now!
          </>
        ) : cooldownActive ? (
          <>
            <span className="mr-2">⏰</span>
            On Cooldown
          </>
        ) : (
          <>
            <span className="mr-2">💰</span>
            Balance too high: ${Number(paperBalance).toFixed(0)}
          </>
        )}
      </button>

      {!canClaim && cooldownActive && timeLeft > 0 && (
        <div className="mt-3 text-center text-sm text-yellow-400">
          ⏰ {formatTime(timeLeft)}
        </div>
      )}

      <div className="mt-3 text-center text-xs leading-relaxed text-gray-400">
        Claim $1,000 when balance &lt; $100<br/>(10min cooldown)
      </div>
    </div>
  );
}

