'use client';

import { useState } from 'react';

export function WholeNumberStrategy() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 rounded-lg p-6">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-xl font-bold text-purple-300">
          🧠 The Whole Number Psychology Strategy
        </h3>
        <button className="text-purple-400 text-2xl">
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 text-gray-300">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-bold text-yellow-400 mb-2">📖 What is Whole Number Psychology?</h4>
            <p className="text-sm leading-relaxed">
              Whole number psychology is a powerful trading concept that recognizes how human psychology 
              creates natural support and resistance levels at round numbers ($90,000, $91,000, $92,000, etc.). 
              Traders tend to place orders at these "clean" numbers, creating predictable price action patterns.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-bold text-green-400 mb-2">🎯 How to Use It on BATTLEFIELD</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">1.</span>
                <span><strong>Watch for Whole Numbers:</strong> Pay attention when BTC approaches $90k, $91k, $92k, etc.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">2.</span>
                <span><strong>Expect Bounces:</strong> Price often bounces off these levels as buyers/sellers cluster their orders there.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">3.</span>
                <span><strong>Trade the Reaction:</strong> Go LONG when price bounces UP from a whole number, or SHORT when it breaks DOWN through one.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">4.</span>
                <span><strong>Use Leverage Wisely:</strong> Higher leverage = bigger gains BUT also bigger losses. Start small!</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-bold text-blue-400 mb-2">💡 Example Trade</h4>
            <div className="text-sm space-y-2">
              <p className="text-yellow-300 font-semibold">Scenario: BTC is at $90,500 and dropping...</p>
              <p>
                <strong className="text-red-400">SHORT at $90,100</strong> with 10x leverage for $1,000<br/>
                <span className="text-gray-400">→ Expecting it to break through $90,000 (whole number) and drop to $89,500</span>
              </p>
              <p className="text-green-400 font-semibold mt-2">
                ✅ If price drops to $89,500: +5.5% × 10x = +55% profit = $550!<br/>
                <span className="text-xs text-gray-400">(Minus 1% trading fee for 10x leverage = $10)</span>
              </p>
              <p className="text-red-400 font-semibold">
                ❌ If price goes back to $91,000: -10% × 10x = -100% = LIQUIDATED!
              </p>
            </div>
          </div>

          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
            <h4 className="font-bold text-red-400 mb-2">⚠️ Risk Management</h4>
            <ul className="space-y-1 text-sm">
              <li>• <strong>Never risk more than you can afford to lose</strong></li>
              <li>• Higher leverage = Higher fees (100x = 10% fee!)</li>
              <li>• Set mental stop-losses - close losers fast</li>
              <li>• The market can stay irrational longer than you can stay solvent</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-900/30 to-red-900/30 border border-yellow-500 rounded-lg p-4 text-center">
            <p className="font-bold text-yellow-300 text-lg mb-1">
              ⚔️ Bears vs Bulls ⚔️
            </p>
            <p className="text-sm text-gray-300">
              Choose your army and trade! Profits add to your army's total power. 
              The winning army gets glory and bragging rights!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
