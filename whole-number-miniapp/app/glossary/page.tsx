'use client';

import { useRouter } from 'next/navigation';

export default function GlossaryPage() {
  const router = useRouter();

  const titleRankings = [
    { rarity: 'Mythic', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', titles: ['Battlefield Champion (#1)'] },
    { rarity: 'Legendary', color: 'bg-gradient-to-r from-purple-500 to-pink-500', titles: ['Legendary Conqueror (Top 3)', 'Top 10 Elite (Top 10)', 'Legendary Profit King ($100K+ P&L)'] },
    { rarity: 'Epic', color: 'bg-gradient-to-r from-blue-500 to-cyan-500', titles: ['Whale Trader ($50K+ P&L)', 'Precision Expert (80%+ WR, 200+ trades)', 'Streak Legend (50+ streak)'] },
    { rarity: 'Rare', color: 'bg-gradient-to-r from-green-500 to-emerald-500', titles: ['Master Trader (1000+ trades)', 'Elite Trader (500+ trades)', 'Moon Walker ($10K+ P&L)'] },
    { rarity: 'Uncommon', color: 'bg-gradient-to-r from-gray-500 to-slate-500', titles: ['Hot Trader ($5K+ P&L)', 'Sharpshooter (70%+ WR, 100+ trades)', 'Veteran Warrior (100+ trades)', 'Profitable Trader ($1K+ P&L)'] },
    { rarity: 'Common', color: 'bg-gradient-to-r from-slate-600 to-slate-700', titles: ['Unstoppable (10+ streak)', 'Skilled Trader (50+ trades)', 'Apprentice Trader (10+ trades)', 'Battlefield Recruit (Starter)'] },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="bg-slate-800 border-2 border-yellow-500 rounded-lg p-8 text-center">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">📚 Battlefield Glossary</h1>
          <p className="text-gray-400">Complete guide to player titles, achievements, and their requirements</p>
        </div>

        {/* Title Rarity Rankings */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">🏆 Player Title Rankings by Rarity</h2>
          <p className="text-gray-400 text-sm mb-6">
            Player titles are automatically assigned based on your best achievement. Higher rarity titles are rarer and more prestigious!
          </p>
          <div className="space-y-4">
            {titleRankings.map((tier) => (
              <div key={tier.rarity} className={`${tier.color} rounded-lg p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-bold text-white">{tier.rarity}</h3>
                  <div className="flex-1 h-1 bg-white/30 rounded"></div>
                </div>
                <ul className="space-y-1">
                  {tier.titles.map((title, idx) => (
                    <li key={idx} className="text-sm text-white/90 flex items-center gap-2">
                      <span className="text-white">•</span>
                      {title}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Complete Achievement List */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-purple-400 mb-4">📋 Complete Achievement List</h2>
          <p className="text-sm text-gray-400 mb-6">All 32 achievements and their exact unlock requirements:</p>
          
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

        {/* Avatar Frames */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">🖼️ Avatar Frames</h2>
          <p className="text-gray-400 text-sm mb-6">
            Unlock special avatar borders based on your trading performance. Higher tiers have epic decorative frames with spikes and glowing effects!
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="w-14 h-14 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-slate-600 flex items-center justify-center bg-slate-800">
                  <span className="text-xl">👤</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-400">No Frame</p>
                <p className="text-xs text-gray-500">Less than 10 trades</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="w-14 h-14 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-amber-600 flex items-center justify-center bg-slate-800">
                  <span className="text-xl">🔶</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-600">Bronze Frame</p>
                <p className="text-xs text-gray-400">10+ trades (any win rate) - Thick border</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="absolute inset-0 w-14 h-14" viewBox="0 0 100 100">
                  <polygon points="0,15 0,0 15,0" fill="#d1d5db" opacity="0.8" />
                  <polygon points="85,0 100,0 100,15" fill="#d1d5db" opacity="0.8" />
                  <polygon points="100,85 100,100 85,100" fill="#d1d5db" opacity="0.8" />
                  <polygon points="0,85 0,100 15,100" fill="#d1d5db" opacity="0.8" />
                </svg>
                <div className="w-12 h-12 rounded-full border-4 border-gray-300 flex items-center justify-center bg-slate-800 z-10">
                  <span className="text-xl">⬡</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-300">Silver Frame</p>
                <p className="text-xs text-gray-400">25+ trades with 40%+ win rate - Corner accents</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="absolute inset-0 w-14 h-14" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.5))' }}>
                  <polygon points="50,0 54,12 50,8 46,12" fill="#facc15" />
                  <polygon points="100,50 88,54 92,50 88,46" fill="#facc15" />
                  <polygon points="50,100 46,88 50,92 54,88" fill="#facc15" />
                  <polygon points="0,50 12,46 8,50 12,54" fill="#facc15" />
                  <polygon points="12,12 18,6 24,12 18,18" fill="#eab308" />
                  <polygon points="88,12 82,6 76,12 82,18" fill="#eab308" />
                  <polygon points="88,88 82,94 76,88 82,82" fill="#eab308" />
                  <polygon points="12,88 18,94 24,88 18,82" fill="#eab308" />
                </svg>
                <div className="w-12 h-12 rounded-full border-4 border-yellow-400 flex items-center justify-center bg-slate-800 z-10">
                  <span className="text-xl">⭐</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-yellow-400">Gold Frame</p>
                <p className="text-xs text-gray-400">50+ trades with 50%+ win rate - Star points + glow</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="absolute inset-0 w-14 h-14" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 8px rgba(103,232,249,0.6))' }}>
                  <polygon points="50,-4 54,14 50,10 46,14" fill="#67e8f9" />
                  <polygon points="104,50 86,54 90,50 86,46" fill="#67e8f9" />
                  <polygon points="50,104 46,86 50,90 54,86" fill="#67e8f9" />
                  <polygon points="-4,50 14,46 10,50 14,54" fill="#67e8f9" />
                  <polygon points="15,15 8,8 22,12 18,22" fill="#22d3ee" />
                  <polygon points="85,15 92,8 78,12 82,22" fill="#22d3ee" />
                  <polygon points="85,85 92,92 78,88 82,78" fill="#22d3ee" />
                  <polygon points="15,85 8,92 22,88 18,78" fill="#22d3ee" />
                </svg>
                <div className="w-12 h-12 rounded-full border-4 border-cyan-300 shadow-[0_0_15px_rgba(103,232,249,0.5)] flex items-center justify-center bg-slate-800 z-10">
                  <span className="text-xl">✦</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-cyan-300">Platinum Frame</p>
                <p className="text-xs text-gray-400">100+ trades with 60%+ win rate - Crystal spikes</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="absolute inset-0 w-14 h-14 animate-pulse" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 10px rgba(192,132,252,0.7))' }}>
                  <polygon points="50,-6 54,16 50,10 46,16" fill="#c084fc" />
                  <polygon points="35,2 40,18 35,14 30,16" fill="#a855f7" />
                  <polygon points="65,2 60,18 65,14 70,16" fill="#a855f7" />
                  <polygon points="106,50 84,54 88,50 84,46" fill="#c084fc" />
                  <polygon points="-6,50 16,46 12,50 16,54" fill="#c084fc" />
                  <polygon points="50,106 46,84 50,88 54,84" fill="#c084fc" />
                  <polygon points="12,12 6,6 18,2 22,14 14,18 2,18" fill="#c084fc" />
                  <polygon points="88,12 94,6 82,2 78,14 86,18 98,18" fill="#c084fc" />
                  <polygon points="88,88 94,94 82,98 78,86 86,82 98,82" fill="#c084fc" />
                  <polygon points="12,88 6,94 18,98 22,86 14,82 2,82" fill="#c084fc" />
                </svg>
                <div className="w-12 h-12 rounded-full border-4 border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.6)] flex items-center justify-center bg-slate-800 z-10">
                  <span className="text-xl">💎</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-purple-400">Diamond Frame</p>
                <p className="text-xs text-gray-400">200+ trades with 70%+ win rate - Crown + animated glow</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Frames are automatically applied based on your stats. Keep trading to unlock higher tiers!
          </p>
        </div>

        {/* Missions System */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">🎯 Missions System</h2>
          <p className="text-gray-400 text-sm mb-6">
            Complete missions to earn paper money rewards! Missions reset automatically.
          </p>

          <div className="space-y-6">
            {/* One-Time Bonus */}
            <div>
              <h3 className="font-bold text-orange-400 mb-3 text-lg">🎁 Welcome Bonus (One-Time)</h3>
              <ul className="text-sm text-gray-300 space-y-2 ml-4">
                <li>👋 <span className="font-semibold">Follow @btcbattle</span> - Follow our Farcaster account → <span className="text-green-400">$5,000</span></li>
              </ul>
            </div>

            {/* Daily Missions */}
            <div>
              <h3 className="font-bold text-yellow-400 mb-3 text-lg">📅 Daily Missions (Reset at 12:00 UTC)</h3>
              <ul className="text-sm text-gray-300 space-y-2 ml-4">
                <li>📈 <span className="font-semibold">Open a Trade</span> - Open at least 1 trade today → <span className="text-green-400">$2,000</span></li>
                <li>💰 <span className="font-semibold">Win a Trade</span> - Close 1 profitable trade → <span className="text-green-400">$3,000</span></li>
              </ul>
            </div>

            {/* Weekly Missions */}
            <div>
              <h3 className="font-bold text-purple-400 mb-3 text-lg">📆 Weekly Missions (Reset Monday 12:00 UTC)</h3>
              <ul className="text-sm text-gray-300 space-y-2 ml-4">
                <li>🔥 <span className="font-semibold">Trading Streak</span> - Trade on 5 different days → <span className="text-green-400">$25,000</span></li>
                <li>🏆 <span className="font-semibold">Win 5 Trades</span> - Close 5 profitable trades → <span className="text-green-400">$20,000</span></li>
                <li>💵 <span className="font-semibold">Paper Collector</span> - Claim paper money 10 times → <span className="text-green-400">$15,000</span></li>
                <li>⚔️ <span className="font-semibold">Army Loyalty</span> - Keep same army for the entire week → <span className="text-green-400">$10,000</span></li>
              </ul>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Missions progress is tracked automatically. Claim rewards from the Missions tab!
          </p>
        </div>

        {/* Army System */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-400 mb-4">⚔️ Army System</h2>
          <p className="text-gray-400 text-sm mb-6">
            Join the Bulls or Bears army and battle for dominance!
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-green-900/20 rounded-lg border border-green-500/30">
              <span className="text-4xl">🐂</span>
              <div>
                <h3 className="font-bold text-green-400">Bulls Army</h3>
                <p className="text-sm text-gray-400">Bullish traders who believe BTC is going up. Going LONG adds to army strength.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
              <span className="text-4xl">🐻</span>
              <div>
                <h3 className="font-bold text-red-400">Bears Army</h3>
                <p className="text-sm text-gray-400">Bearish traders who believe BTC is going down. Going SHORT adds to army strength.</p>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-bold text-yellow-400 mb-2">How Army Battles Work</h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-4">
                <li>• Your army is chosen when you first join</li>
                <li>• Each trade contributes to your army&apos;s total P&L</li>
                <li>• The army with the highest total P&L wins the week</li>
                <li>• Stay loyal to earn the Army Loyalty mission reward!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Paper Money */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-4">💵 Paper Money</h2>
          <p className="text-gray-400 text-sm mb-4">
            Paper money is the virtual currency used for trading. It has no real value - this is a paper trading game!
          </p>

          <div className="space-y-3">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-bold text-cyan-400 mb-2">How to Get Paper Money</h3>
              <ul className="text-sm text-gray-300 space-y-1 ml-4">
                <li>• <span className="text-green-400">Starting Balance:</span> $10,000 when you join</li>
                <li>• <span className="text-green-400">Claim Button:</span> Claim $1,000 every hour</li>
                <li>• <span className="text-green-400">Missions:</span> Complete daily/weekly missions for rewards</li>
                <li>• <span className="text-green-400">Referrals:</span> Get 10% of your referrals&apos; claims</li>
                <li>• <span className="text-green-400">Trading Profits:</span> Win trades to grow your balance</li>
              </ul>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <h3 className="font-bold text-orange-400 mb-2">What Happens When You Lose?</h3>
              <p className="text-sm text-gray-300">
                If your balance hits zero or you get liquidated, don&apos;t worry! You can always claim more paper money
                using the Claim button. This is a risk-free way to practice trading strategies.
              </p>
            </div>
          </div>
        </div>

        {/* Trading Mechanics & Fees */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
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

        {/* Footer Note */}
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
          <p className="text-sm text-gray-400 text-center">
            💡 Achievements unlock exactly as described above! Your highest rarity title is automatically displayed on your profile.
          </p>
        </div>
      </div>
    </div>
  );
}
