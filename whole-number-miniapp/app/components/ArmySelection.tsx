'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../config/api';

interface ArmySelectionProps {
  currentArmy?: 'bears' | 'bulls';
  onArmyChange: (army: 'bears' | 'bulls') => void;
}

export function ArmySelection({ currentArmy, onArmyChange }: ArmySelectionProps) {
  const { address } = useAccount();
  const [selectedArmy, setSelectedArmy] = useState<'bears' | 'bulls'>(currentArmy || 'bulls');
  const [isChanging, setIsChanging] = useState(false);

  const handleArmySelect = async (army: 'bears' | 'bulls') => {
    if (!address || army === currentArmy) return;
    
    setIsChanging(true);
    setSelectedArmy(army);
    
    try {
      const response = await fetch(getApiUrl(`api/users/${address}/army`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ army })
      });
      
      const data = await response.json();
      if (data.success) {
        onArmyChange(army);
      } else {
        alert('Failed to change army');
        setSelectedArmy(currentArmy || 'bulls');
      }
    } catch (error) {
      console.error('Error changing army:', error);
      alert('Failed to change army');
      setSelectedArmy(currentArmy || 'bulls');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-4 text-yellow-400">
        ⚔️ Choose Your Army ⚔️
      </h2>
      
      <p className="text-center text-gray-300 mb-6">
        Pick your side in the eternal battle
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* BEAR ARMY */}
        <button
          onClick={() => handleArmySelect('bears')}
          disabled={isChanging || !address}
          className={`
            relative p-6 rounded-lg border-4 transition-all transform hover:scale-105
            ${selectedArmy === 'bears' 
              ? 'border-red-500 bg-red-900/30 shadow-lg shadow-red-500/50' 
              : 'border-slate-600 bg-slate-700/30 hover:border-red-400'
            }
            ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-center">
            <div className="text-6xl mb-3">🐻</div>
            <h3 className="text-2xl font-bold text-red-400 mb-2">BEAR ARMY</h3>
            <p className="text-sm text-gray-300 mb-3">Bearish Traders</p>
            <div className="space-y-1 text-xs text-gray-400">
              <div>• Short positions</div>
              <div>• Profit from drops</div>
              <div>• Strategic sellers</div>
            </div>
          </div>
          
          {selectedArmy === 'bears' && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center px-2 py-1 rounded bg-red-500 text-white text-xs font-bold">
                ✓ ACTIVE
              </span>
            </div>
          )}
        </button>

        {/* BULL ARMY */}
        <button
          onClick={() => handleArmySelect('bulls')}
          disabled={isChanging || !address}
          className={`
            relative p-6 rounded-lg border-4 transition-all transform hover:scale-105
            ${selectedArmy === 'bulls' 
              ? 'border-green-500 bg-green-900/30 shadow-lg shadow-green-500/50' 
              : 'border-slate-600 bg-slate-700/30 hover:border-green-400'
            }
            ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <div className="text-center">
            <div className="text-6xl mb-3">🐂</div>
            <h3 className="text-2xl font-bold text-green-400 mb-2">BULL ARMY</h3>
            <p className="text-sm text-gray-300 mb-3">Bullish Traders</p>
            <div className="space-y-1 text-xs text-gray-400">
              <div>• Long positions</div>
              <div>• Profit from rises</div>
              <div>• Growth believers</div>
            </div>
          </div>
          
          {selectedArmy === 'bulls' && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center px-2 py-1 rounded bg-green-500 text-white text-xs font-bold">
                ✓ ACTIVE
              </span>
            </div>
          )}
        </button>
      </div>

      {!address && (
        <div className="mt-4 text-center text-yellow-500 text-sm">
          Connect your wallet to choose an army
        </div>
      )}

      {isChanging && (
        <div className="mt-4 text-center text-blue-400 text-sm">
          Changing army...
        </div>
      )}

      <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
        <p className="text-xs text-gray-400 text-center">
          💡 <strong>Tip:</strong> Your army choice affects leaderboard rankings and monthly bonuses. 
          Choose wisely and lead your army to victory!
        </p>
      </div>
    </div>
  );
}
