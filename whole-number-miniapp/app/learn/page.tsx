'use client';

import { useState } from 'react';
import { WholeNumberStrategy } from '../components/WholeNumberStrategy';
import { MarketCycle } from '../components/MarketCycle';

export default function LearnPage() {
  const [activeSection, setActiveSection] = useState<'strategy' | 'cycles' | 'glossary' | 'ranking' | 'tips'>('strategy');

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b-2 border-yellow-500/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/battlefield'}
                className="text-2xl hover:scale-110 transition-transform"
              >
                ⬅️
              </button>
              <h1 className="text-2xl md:text-4xl font-bold text-yellow-400">
                📚 Learn to Trade
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl pb-24">
        {/* Section Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          <button
            onClick={() => setActiveSection('strategy')}
            className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
              activeSection === 'strategy'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            📈 Strategy
          </button>
          <button
            onClick={() => setActiveSection('cycles')}
            className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
              activeSection === 'cycles'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            🕐 Market Cycles
          </button>
          <button
            onClick={() => setActiveSection('glossary')}
            className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
              activeSection === 'glossary'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            📖 Glossary
          </button>
          <button
            onClick={() => setActiveSection('ranking')}
            className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
              activeSection === 'ranking'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            🏆 Ranking
          </button>
          <button
            onClick={() => setActiveSection('tips')}
            className={`py-3 px-2 rounded-lg font-bold text-xs md:text-sm transition-all ${
              activeSection === 'tips'
                ? 'bg-yellow-500 text-slate-900'
                : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
            }`}
          >
            💡 Tips
          </button>
        </div>

        {/* Content Sections */}
        {activeSection === 'strategy' && (
          <div>
            <WholeNumberStrategy />
          </div>
        )}

        {activeSection === 'cycles' && (
          <div>
            <MarketCycle />
            
            <div className="bg-slate-800/50 rounded-lg p-6 mt-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4">Understanding Market Cycles</h2>
              
              <div className="space-y-4 text-gray-300">
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2">🌅 Asian Session (7pm - 4am EST)</h3>
                  <p className="text-sm">Lower volatility period. Good for setting up positions before major moves.</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2">🇬🇧 London Session (3am - 12pm EST)</h3>
                  <p className="text-sm">High volume! Major price movements often start here. Great for trend trading.</p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="font-bold text-white mb-2">🇺🇸 NYC Session (8am - 5pm EST)</h3>
                  <p className="text-sm">Highest volume and volatility. Major moves happen during overlap with London.</p>
                </div>

                <div className="bg-yellow-900/20 rounded p-4 border border-yellow-500/30">
                  <strong className="text-yellow-400">💡 Pro Tip:</strong>
                  <p className="text-sm mt-1">
                    Most explosive moves happen during the London/NYC overlap (8am-12pm EST). 
                    Trade with caution during low-volume Asian session.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'glossary' && (
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">📖 Trading Glossary</h2>
            
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-green-400 text-lg mb-2">LONG 🐂</h3>
                <p className="text-sm text-gray-300">
                  Betting that the price will go UP. You profit when Bitcoin rises.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-red-400 text-lg mb-2">SHORT 🐻</h3>
                <p className="text-sm text-gray-300">
                  Betting that the price will go DOWN. You profit when Bitcoin falls.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-yellow-400 text-lg mb-2">Leverage ⚡</h3>
                <p className="text-sm text-gray-300">
                  Multiplier for your position. 10x leverage = 10x profits OR 10x losses. 
                  Higher leverage = higher risk of liquidation. Range: 1x-200x
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-orange-400 text-lg mb-2">Liquidation 💥</h3>
                <p className="text-sm text-gray-300">
                  When your position loses 100% of your collateral. Your position is automatically closed. 
                  With 100x leverage, a 1% move against you = liquidation!
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-blue-400 text-lg mb-2">P&L (Profit & Loss) 💰</h3>
                <p className="text-sm text-gray-300">
                  Your profit or loss on a trade. Positive P&L = profit, Negative P&L = loss. 
                  Used to rank players on the leaderboard.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-purple-400 text-lg mb-2">Whole Number 🎯</h3>
                <p className="text-sm text-gray-300">
                  A thousand-dollar level (e.g., $94,000, $95,000). These act as psychological barriers 
                  where price often bounces or breaks through.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-cyan-400 text-lg mb-2">Coordinate 📍</h3>
                <p className="text-sm text-gray-300">
                  The last 3 digits of the Bitcoin price (e.g., $94,536 = coordinate 536). 
                  Used in the Whole Number Strategy to identify optimal entry/exit points.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-pink-400 text-lg mb-2">The Beams 🔨</h3>
                <p className="text-sm text-gray-300">
                  Support levels at +86, +113, +226 above the whole number. Breaking these beams 
                  signals potential for larger moves (Dwarf Toss setup).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'ranking' && (
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">🏆 How Ranking Works</h2>
            
            <div className="space-y-4 text-gray-300">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <span>Individual Rankings</span>
                </h3>
                <p className="text-sm">
                  Player rankings are determined by your <strong className="text-green-400">total P&L (Profit & Loss)</strong>. 
                  The more profit you make from your trades, the higher you climb on the leaderboard. 
                  Trade strategically using leverage (1x-200x) to maximize your gains!
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border-2 border-purple-500/50">
                <h3 className="font-bold text-purple-300 mb-3 flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  <span>Weekly Army Airdrop</span>
                </h3>
                
                <div className="space-y-3 text-sm">
                  <p>
                    Every week, we calculate the combined P&L of all players in the 
                    <strong className="text-green-400"> 🐂 Bulls Army</strong> vs 
                    <strong className="text-red-400"> 🐻 Bears Army</strong>. 
                    The army with the highest total profit wins!
                  </p>

                  <div className="bg-slate-900/50 rounded p-3">
                    <strong className="text-yellow-400">📅 Weekly Announcement:</strong>
                    <p className="mt-1">
                      Every Monday, we announce the winning army. 
                      <strong className="text-purple-400"> ALL players</strong> in the winning army receive a 
                      <strong className="text-purple-400"> $BATTLE token airdrop!</strong>
                    </p>
                  </div>

                  <div>
                    <strong className="text-white">Army Assignment:</strong>
                    <p className="mt-1">
                      Your army is determined by comparing your total positive P&L from longs vs shorts. 
                      More profit from longs = Bulls. More profit from shorts = Bears.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4">
                <h3 className="font-bold text-purple-400 mb-3">🏆 Top Trader Rewards</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl mb-1">🥇</div>
                    <div className="font-bold text-yellow-400">1st Place</div>
                    <div className="text-purple-300 text-sm">5M $BATTLE</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-1">🥈</div>
                    <div className="font-bold text-gray-300">2nd Place</div>
                    <div className="text-purple-300 text-sm">3M $BATTLE</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-1">🥉</div>
                    <div className="font-bold text-orange-400">3rd Place</div>
                    <div className="text-purple-300 text-sm">2M $BATTLE</div>
                  </div>
                  <div>
                    <div className="text-3xl mb-1">🎯</div>
                    <div className="font-bold text-blue-400">4th-10th</div>
                    <div className="text-purple-300 text-sm">1M each</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'tips' && (
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">💡 Trading Tips & Best Practices</h2>
            
            <div className="space-y-4">
              <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                <h3 className="font-bold text-green-400 mb-2">✅ DO: Start with Low Leverage</h3>
                <p className="text-sm text-gray-300">
                  Begin with 1x-5x leverage to learn. Higher leverage amplifies both gains AND losses. 
                  Work your way up as you understand the strategy better.
                </p>
              </div>

              <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                <h3 className="font-bold text-green-400 mb-2">✅ DO: Use the Whole Number Strategy</h3>
                <p className="text-sm text-gray-300">
                  Buy dips around +800 coordinates, short pumps around +150 coordinates. 
                  The beams (+86, +113, +226) act as resistance levels.
                </p>
              </div>

              <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                <h3 className="font-bold text-green-400 mb-2">✅ DO: Take Profits</h3>
                <p className="text-sm text-gray-300">
                  Don't be greedy! Close winning positions. A 10% gain with 10x leverage = 100% profit!
                </p>
              </div>

              <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                <h3 className="font-bold text-red-400 mb-2">❌ DON'T: Use Maximum Leverage Immediately</h3>
                <p className="text-sm text-gray-300">
                  200x leverage looks tempting, but a 0.5% move against you = liquidation! 
                  Start small and work your way up.
                </p>
              </div>

              <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                <h3 className="font-bold text-red-400 mb-2">❌ DON'T: Go All-In on One Trade</h3>
                <p className="text-sm text-gray-300">
                  Never risk your entire balance. Keep some paper money for future trades. 
                  If you get liquidated with nothing left, claim more paper money and try again.
                </p>
              </div>

              <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                <h3 className="font-bold text-red-400 mb-2">❌ DON'T: Hold Losing Positions Forever</h3>
                <p className="text-sm text-gray-300">
                  Cut your losses! Better to lose 20% than wait and get liquidated at -100%. 
                  Live to trade another day.
                </p>
              </div>

              <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-500/30">
                <h3 className="font-bold text-yellow-400 mb-2">⚡ Pro Strategy: Screenshot Your Setups</h3>
                <p className="text-sm text-gray-300">
                  When price breaks through beams, screenshot the coordinate! 
                  Second breaks always go deeper. Use your screenshot to know when to hold  through volatility.
                </p>
              </div>

              <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                <h3 className="font-bold text-blue-400 mb-2">🔥 Army Strategy</h3>
                <p className="text-sm text-gray-300">
                  Check the Battle tab to see which army is winning. You can switch armies by closing winning 
                  positions in the opposite direction before the weekly Monday snapshot!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-slate-700 z-50">
        <div className="container mx-auto px-2">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => window.location.href = '/battlefield'}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-bold">Trade</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/battlefield'}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">🏆</span>
              <span className="text-xs font-bold">Leaders</span>
            </button>
            
            <button
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-yellow-400"
            >
              <span className="text-2xl">📚</span>
              <span className="text-xs font-bold">Learn</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/battle'}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">⚔️</span>
              <span className="text-xs font-bold">Battle</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-8 text-center text-gray-400 space-y-3">
        <p className="text-sm font-bold">⚔️ <strong>BATTLEFIELD</strong> ⚔️</p>
        
        <div className="space-y-2">
          <p className="text-sm">
            Created by{' '}
            <a
              href="https://elalpha.lol"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline font-semibold"
            >
              elalpha.lol
            </a>
          </p>
          <p className="text-sm">
            Follow on Farcaster:{' '}
            <a
              href="https://warpcast.com/elalpha.eth"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              @elalpha.eth
            </a>
            {' • '}
            <a
              href="https://warpcast.com/btcbattle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300"
            >
              @btcbattle
            </a>
          </p>
          <p className="text-sm text-purple-400 font-semibold">
            Launching on Clanker.world
          </p>
        </div>
        
        <div className="pt-4 border-t border-slate-800">
          <p className="text-xs text-gray-500">
            ⚠️ Paper trading only. No real funds at risk. High leverage trading is educational.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This is a game. Trade responsibly. DYOR.
          </p>
        </div>
      </footer>
    </main>
  );
}
