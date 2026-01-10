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
