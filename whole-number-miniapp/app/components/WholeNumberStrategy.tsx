'use client';

import { useState } from 'react';
import Link from 'next/link';

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
            <h4 className="font-bold text-orange-400 mb-2">📍 Understanding Coordinates</h4>
            <p className="text-sm leading-relaxed mb-2">
              Each whole number ($90k, $91k, $92k) is divided into 1,000 points called <strong className="text-yellow-400">coordinates</strong>. 
              When BTC is at $90,350, that's coordinate <strong className="text-yellow-400">350</strong> between $90k and $91k.
            </p>
            <p className="text-sm leading-relaxed text-gray-400">
              Coordinates help you precisely track Bitcoin's position and predict which direction it will move next.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <h4 className="font-bold text-purple-400 mb-2">🔨 The BEAMS System</h4>
            <p className="text-sm leading-relaxed mb-2">
              The three BEAMS are critical support/resistance levels that act as psychological barriers:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span><strong className="text-cyan-400">086 BEAM</strong> - Minor resistance at coordinate 86</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span><strong className="text-blue-400">113 BEAM</strong> - Mid-level barrier at coordinate 113</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span><strong className="text-purple-400">226 BEAM</strong> - Strong resistance at coordinate 226</span>
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-gray-400 mt-3">
              When price breaks through a BEAM, it signals momentum shift. Broken beams often become the next support or resistance level.
            </p>
          </div>

          {/* Deep Dive Button */}
          <div className=" mt-6 text-center">
            <Link 
              href="/strategy"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              <span>📚 Want to go deeper?</span>
              <span className="text-xl">→</span>
            </Link>
            <p className="mt-2 text-xs text-gray-400">
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
