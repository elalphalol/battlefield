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
          <div className="space-y-6">
            {/* Trading Terms */}
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

            {/* Trading Fees & Mechanics */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-red-400 mb-4">⚙️ Trading Mechanics & Fees</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-yellow-400 mb-2 text-lg">📊 How Trading Fees Work</h3>
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
                    <p>
                      <span className="font-semibold text-white">Trading Fee Formula:</span> Leverage × 0.05%
                    </p>
                    <ul className="ml-4 space-y-1">
                      <li>• 10x leverage = 0.5% fee</li>
                      <li>• 50x leverage = 2.5% fee</li>
                      <li>• 100x leverage = 5% fee</li>
                      <li>• 200x leverage = 10% fee</li>
                    </ul>
                    <p className="pt-2 text-yellow-300">
                      <span className="font-semibold">⚠️ Important:</span> Fees are deducted from your P&L when closing a position, not when opening.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-cyan-400 mb-2 text-lg">💡 Why Positions Start in Negative P&L</h3>
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm text-gray-300">
                    <p>
                      When you open a position, you'll notice it starts with <span className="text-red-400 font-semibold">negative P&L</span>. This is normal!
                    </p>
                    <p className="pt-2">
                      <span className="font-semibold text-white">Why?</span> The trading fee is already calculated into your unrealized profit/loss. This shows you the <span className="text-green-400 font-semibold">real break-even point</span> you need to reach to become profitable.
                    </p>
                    <p className="pt-2 text-yellow-300">
                      <span className="font-semibold">Example:</span> Open a 100x position with $100. Fee = 5% ($5). Your position starts at -$5. The price needs to move favorably by $5 for you to break even.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Player Achievements */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-purple-400 mb-4">🏆 Player Achievements & Titles</h2>
              <p className="text-sm text-gray-400 mb-6">All achievements and their unlock requirements. Your highest rarity title is displayed on your profile!</p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-blue-400 mb-3 text-lg">📊 Trading Volume Achievements</h3>
                  <ul className="text-sm text-gray-300 space-y-2 ml-4">
                    <li>⚔️ <span className="font-semibold">First Blood</span> - Complete 1 trade</li>
                    <li>📈 <span className="font-semibold">Apprentice Trader</span> - Complete 10 trades</li>
                    <li>💹 <span className="font-semibold">Skilled Trader</span> - Complete 50 trades</li>
                    <li>🏅 <span className="font-semibold">Veteran Trader</span> - Complete 100 trades</li>
                    <li>👑 <span className="font-semibold">Elite Trader</span> - Complete 500 trades</li>
                    <li>🌟 <span className="font-semibold">Master Trader</span> - Complete 1,000 trades</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-green-400 mb-3 text-lg">💰 Profit & Loss Achievements</h3>
                  <ul className="text-sm text-gray-300 space-y-2 ml-4">
                    <li>💰 <span className="font-semibold">First Profit</span> - Reach $100 total P&L</li>
                    <li>💎 <span className="font-semibold">Profitable Trader</span> - Reach $1,000 total P&L</li>
                    <li>🔥 <span className="font-semibold">Hot Streak</span> - Reach $5,000 total P&L</li>
                    <li>🚀 <span className="font-semibold">To The Moon</span> - Reach $10,000 total P&L</li>
                    <li>🐋 <span className="font-semibold">Whale Status</span> - Reach $50,000 total P&L</li>
                    <li>🏆 <span className="font-semibold">Legendary Profit</span> - Reach $100,000 total P&L</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-purple-400 mb-3 text-lg">🎯 Win Rate Achievements</h3>
                  <ul className="text-sm text-gray-300 space-y-2 ml-4">
                    <li>⚖️ <span className="font-semibold">Balanced</span> - Maintain 50%+ win rate (min 20 trades)</li>
                    <li>✨ <span className="font-semibold">Consistent Winner</span> - Maintain 60%+ win rate (min 50 trades)</li>
                    <li>🎯 <span className="font-semibold">Sharpshooter</span> - Maintain 70%+ win rate (min 100 trades)</li>
                    <li>💫 <span className="font-semibold">Elite Precision</span> - Maintain 80%+ win rate (min 200 trades)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-orange-400 mb-3 text-lg">🔥 Win Streak Achievements</h3>
                  <ul className="text-sm text-gray-300 space-y-2 ml-4">
                    <li>🔥 <span className="font-semibold">On Fire</span> - Achieve 3-win streak</li>
                    <li>🌡️ <span className="font-semibold">Heating Up</span> - Achieve 5-win streak</li>
                    <li>💥 <span className="font-semibold">Unstoppable</span> - Achieve 10-win streak</li>
                    <li>⚡ <span className="font-semibold">Lightning</span> - Achieve 20-win streak</li>
                    <li>🌪️ <span className="font-semibold">Legendary Streak</span> - Achieve 50-win streak</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-yellow-400 mb-3 text-lg">🏅 Ranking Achievements</h3>
                  <ul className="text-sm text-gray-300 space-y-2 ml-4">
                    <li>🏅 <span className="font-semibold">Top 100</span> - Reach Top 100 on leaderboard</li>
                    <li>🥉 <span className="font-semibold">Top 50</span> - Reach Top 50 on leaderboard</li>
                    <li>🥈 <span className="font-semibold">Top 10 Elite</span> - Reach Top 10 on leaderboard</li>
                    <li>🥇 <span className="font-semibold">Legendary Conqueror</span> - Reach Top 3 on leaderboard</li>
                    <li>👑 <span className="font-semibold">Battlefield Champion</span> - Reach #1 on leaderboard</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-cyan-400 mb-3 text-lg">🛡️ Survival Achievements</h3>
                  <ul className="text-sm text-gray-300 space-y-2 ml-4">
                    <li>🛡️ <span className="font-semibold">Survivor</span> - Complete 50 trades without liquidation</li>
                    <li>🏰 <span className="font-semibold">Fortress</span> - Complete 100 trades without liquidation</li>
                    <li>💎 <span className="font-semibold">Diamond Hands</span> - Complete 500 trades without liquidation</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-pink-400 mb-3 text-lg">✨ Special Achievements</h3>
                  <ul className="text-sm text-gray-300 space-y-2 ml-4">
                    <li>🎭 <span className="font-semibold">The Comeback</span> - Recover from negative P&L to reach $1,000 profit (requires at least 1 liquidation)</li>
                    <li>🎲 <span className="font-semibold">High Roller</span> - Survive 10+ liquidations and still be profitable</li>
                    <li>💯 <span className="font-semibold">Perfect Score</span> - Maintain 100% win rate with 10+ trades</li>
                  </ul>
                </div>
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

      {/* Bottom Navigation - 5 buttons: Leaders, Battle, Profile, Trade, Learn */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-2 border-slate-700 z-50">
        <div className="container mx-auto px-2">
          <div className="flex justify-around items-center py-2">
            <button
              onClick={() => window.location.href = '/battlefield'}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">🏆</span>
              <span className="text-xs font-bold">Leaders</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/battle'}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">⚔️</span>
              <span className="text-xs font-bold">Battle</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/profile'}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">👤</span>
              <span className="text-xs font-bold">Profile</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/battlefield'}
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
            >
              <span className="text-2xl">🎯</span>
              <span className="text-xs font-bold">Trade</span>
            </button>
            
            <button
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-yellow-400"
            >
              <span className="text-2xl">📚</span>
              <span className="text-xs font-bold">Learn</span>
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
