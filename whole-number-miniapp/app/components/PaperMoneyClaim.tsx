'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface PaperMoneyClaimProps {
  onClaim: (newBalance: number) => void;
}

export function PaperMoneyClaim({ onClaim }: PaperMoneyClaimProps) {
  const { address } = useAccount();
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [claiming, setClaiming] = useState(false);

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
          setCanClaim(data.canClaim);
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
        setCanClaim(false);
        setTimeLeft(600); // 10 minutes
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500/50 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-green-400">💰 Paper Money Claim</h3>
        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
          Every 10 minutes
        </span>
      </div>
      
      <p className="text-gray-300 mb-4 text-sm">
        Claim <span className="font-bold text-green-400">$1,000</span> paper money to keep trading
      </p>
      
      {canClaim ? (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {claiming ? (
            <>
              <span className="inline-block animate-spin mr-2">⏳</span>
              Claiming...
            </>
          ) : (
            <>
              <span className="mr-2">💵</span>
              Claim $1,000 Now!
            </>
          )}
        </button>
      ) : (
        <div className="text-center p-6 bg-slate-700/50 rounded-lg">
          <div className="text-yellow-400 text-4xl font-bold mb-2">
            {formatTime(timeLeft)}
          </div>
          <p className="text-gray-400 text-sm">Next claim available</p>
          <div className="mt-3 w-full bg-slate-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${Math.max(0, 100 - (timeLeft / 600) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-slate-700/30 rounded text-xs text-gray-400 space-y-1">
        <div className="flex items-center">
          <span className="mr-2">📊</span>
          <span>Claimed paper money is added to your balance instantly</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2">⚡</span>
          <span>Use it to open new leveraged positions</span>
        </div>
        <div className="flex items-center">
          <span className="mr-2">🔄</span>
          <span>Claim as many times as you need (10min cooldown)</span>
        </div>
      </div>
    </div>
  );
}
