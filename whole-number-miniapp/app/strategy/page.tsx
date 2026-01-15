'use client';

import Link from 'next/link';
import sdk from '@farcaster/miniapp-sdk';

export default function StrategyPage() {
  const handleExternalLink = async (url: string) => {
    try {
      await sdk.actions.openUrl(url);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            The Whole Number Psychology Strategy
          </h1>
          <p className="text-gray-400 mt-2">Deep Dive: Understanding the Psychology Behind Bitcoin's Movement</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        
        {/* Introduction */}
        <section className="mb-12">
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-2 border-purple-500/50 rounded-lg p-8">
            <h2 className="text-3xl font-bold text-yellow-400 mb-4">📖 What is Whole Number Psychology?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Whole number psychology is a powerful trading concept that recognizes how human psychology 
              creates natural support and resistance levels at round numbers. These "psychological barriers" 
              occur at clean thousand-dollar increments like $90,000, $91,000, $92,000, and so on.
            </p>
            <p className="text-gray-300 leading-relaxed">
              The strategy is based on a simple truth: <strong className="text-yellow-400">traders are human</strong>, 
              and humans naturally gravitate toward "clean" numbers. When setting buy or sell orders, most people 
              choose round numbers because they're easier to remember and feel more significant psychologically.
            </p>
          </div>
        </section>

        {/* Core Concept */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">🎯 Core Concept: Reading Humanity</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-green-400 mb-3">Why Whole Numbers Matter</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">•</span>
                  <span><strong className="text-white">Psychological Clustering:</strong> Traders cluster their orders at round numbers, creating dense zones of buying/selling pressure</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">•</span>
                  <span><strong className="text-white">Predictable Reactions:</strong> Price tends to bounce, stall, or react strongly at these levels</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 text-xl">•</span>
                  <span><strong className="text-white">Order Flow Concentration:</strong> Major stop-losses and take-profits are set at whole numbers</span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-blue-400 mb-3">The Strategy Philosophy</h3>
              <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-300">
                "Reading humanity is priceless. Technical analysis is worthless. We're not predicting 
                price movements—we're reading the collective psychology of thousands of traders 
                making the same predictable decisions at key levels."
              </blockquote>
            </div>
          </div>
        </section>

        {/* The Number System */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">🔢 The Coordinate System</h2>
          
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700 mb-6">
            <h3 className="text-xl font-bold text-orange-400 mb-4">Understanding Coordinates</h3>
            <p className="text-gray-300 mb-4">
              Each whole number (e.g., $90,000) is divided into 1,000 points called <strong className="text-yellow-400">coordinates</strong>. 
              These coordinates range from 000 to 999, representing every dollar between two whole numbers.
            </p>
            <div className="bg-slate-900/50 rounded p-4 font-mono text-sm">
              <div className="text-cyan-400">Example: Bitcoin at $90,350</div>
              <div className="text-gray-400 ml-4">• Whole Number: $90,000</div>
              <div className="text-gray-400 ml-4">• Coordinate: 350</div>
              <div className="text-gray-400 ml-4">• Position: 350 points above $90k</div>
            </div>
          </div>

          {/* Key Zones */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-900/30 to-green-700/20 border-2 border-green-500 rounded-lg p-6">
              <h4 className="text-lg font-bold text-green-400 mb-2">🟢 The 900s - Acceleration Zone (Bullish)</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                When Bitcoin reaches the 900s (like $90,900), it signals <strong>acceleration</strong> toward 
                the next whole number. If price <strong>holds</strong> in this zone, there's high probability 
                of breaking through to $91,000. This is where bulls are strongest.
              </p>
            </div>

            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-700/20 border-2 border-yellow-500 rounded-lg p-6">
              <h4 className="text-lg font-bold text-yellow-400 mb-2">🟡 The 400s-600s - Neutral Zone</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                The middle ranges ($90,400-$90,600) indicate <strong>indecision</strong>. 
                Direction is not yet determined. Wait for confirmation before entering trades in this zone.
              </p>
            </div>

            <div className="bg-gradient-to-r from-red-900/30 to-red-700/20 border-2 border-red-500 rounded-lg p-6">
              <h4 className="text-lg font-bold text-red-400 mb-2">🔴 The 300s and Below - Weakness Zone (Bearish)</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                When price falls into the 300s ($90,300) or lower, it signals <strong>weakness</strong> and 
                potential breakdown. Bears are gaining control and whole number may break downward.
              </p>
            </div>
          </div>
        </section>

        {/* The BEAMS */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">🔨 The BEAMS System</h2>
          
          <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-2 border-orange-500 rounded-lg p-6 mb-6">
            <p className="text-gray-300 leading-relaxed mb-4">
              The <strong className="text-yellow-400">BEAMS</strong> are critical breakdown coordinates that 
              act as the final psychological barriers before a whole number breaks completely. Think of them 
              as three layers of ice that must crack before the floor gives way.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-6 border-l-4 border-orange-500">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">📍</span>
                <h4 className="text-xl font-bold text-orange-400">BEAM 1: Coordinate 226</h4>
              </div>
              <p className="text-gray-300 text-sm">
                <strong>First Warning Sign.</strong> When price breaks below 226 (e.g., $90,226), 
                it's the first crack in the ice. The whole number is under pressure.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6 border-l-4 border-red-500">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">⚠️</span>
                <h4 className="text-xl font-bold text-red-400">BEAM 2: Coordinate 113</h4>
              </div>
              <p className="text-gray-300 text-sm">
                <strong>Second Warning Sign.</strong> Breaking 113 (e.g., $90,113) means the sellers 
                are winning. The whole number is very likely to break.
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🔨</span>
                <h4 className="text-xl font-bold text-purple-400">BEAM 3: Coordinate 086 - The Sledgehammer</h4>
              </div>
              <p className="text-gray-300 text-sm mb-3">
                <strong>Definitive Break Signal.</strong> When 086 breaks (e.g., $90,086), it's like 
                a sledgehammer hitting ice. The whole number <strong>WILL</strong> break. This is the most important signal.
              </p>
              <div className="bg-purple-900/30 rounded p-3 text-xs text-gray-400">
                💡 <strong>Pro Tip:</strong> Don't short immediately when 086 breaks. Use the "Dwarf Tossing" 
                technique (explained below) to maximize profit by shorting the bounce after the initial break.
              </div>
            </div>
          </div>
        </section>

        {/* Dip Buying Zone */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">🎯 The Dip Buying Zone: 888-700</h2>
          
          <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500 rounded-lg p-6">
            <p className="text-gray-300 leading-relaxed mb-4">
              Perhaps the most powerful psychological zone in the strategy: <strong className="text-cyan-400">the 
              888 to 700 range</strong> below any whole number.
            </p>
            <div className="bg-slate-900/50 rounded p-4 mb-4">
              <div className="font-mono text-sm space-y-2">
                <div className="text-cyan-400">Examples of Dip Buying Zones:</div>
                <div className="text-gray-400">• $90,888 to $90,700</div>
                <div className="text-gray-400">• $95,888 to $95,700</div>
                <div className="text-gray-400">• $118,888 to $118,700</div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed mb-3">
              <strong className="text-yellow-400">Why this zone works:</strong> Traders psychologically view 
              these levels as "good dip entries." The number 888 appears lucky and attractive, while 700 
              represents a clean round-ish number below the whole number. This creates consistent buying pressure.
            </p>
            <div className="bg-green-900/20 border border-green-500 rounded p-4">
              <strong className="text-green-400">Trade Strategy:</strong>
              <ul className="mt-2 space-y-1 text-sm text-gray-300">
                <li>• <strong>If Bullish:</strong> Long positions in the 888-700 range</li>
                <li>• <strong>If Bearish:</strong> Wait for the inevitable pump from this zone, then short it</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Advanced Techniques */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">⚔️ Advanced Techniques</h2>
          
          {/* Dwarf Tossing */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-orange-500 mb-6">
            <h3 className="text-2xl font-bold text-orange-400 mb-4">Dwarf Tossing Technique</h3>
            <p className="text-gray-300 mb-4">
              When a whole number is about to break (086 beam breaks), don't be the first to short. 
              Instead, use this powerful technique:
            </p>
            <div className="space-y-3 text-sm">
              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-cyan-400 font-bold mb-2">Step 1: Let It Break First</div>
                <p className="text-gray-400">Don't short immediately. Watch as others take the bait.</p>
              </div>
              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-cyan-400 font-bold mb-2">Step 2: Take a Screenshot</div>
                <p className="text-gray-400">Capture how deep it goes (e.g., to 888 or 700). This is your "map."</p>
              </div>
              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-cyan-400 font-bold mb-2">Step 3: Wait for the Buy-Back</div>
                <p className="text-gray-400">They will always buy the dip, especially in the 888-700 zone.</p>
              </div>
              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-cyan-400 font-bold mb-2">Step 4: Short the Pump</div>
                <p className="text-gray-400">When price pumps back with low velocity, enter your short.</p>
              </div>
              <div className="bg-slate-900/50 rounded p-4">
                <div className="text-cyan-400 font-bold mb-2">Step 5: Use Your Map</div>
                <p className="text-gray-400">Hold confidently knowing it will break again to your mapped depth.</p>
              </div>
            </div>
            <div className="mt-4 bg-orange-900/20 border border-orange-500 rounded p-3 text-sm">
              <strong className="text-orange-400">Why it works:</strong> Second breaks always go deeper than 
              first breaks. Your screenshot gives you confidence to hold through volatility.
            </div>
          </div>

          {/* Velocity Reading */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-blue-500">
            <h3 className="text-2xl font-bold text-blue-400 mb-4">Reading Velocity</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-900/20 border border-green-500 rounded p-4">
                <h4 className="font-bold text-green-400 mb-2">High Velocity 🚀</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Shoots through whole number</li>
                  <li>• Goes 300-500+ points beyond</li>
                  <li>• Strong momentum</li>
                  <li>• Don't fight the trend</li>
                </ul>
              </div>
              <div className="bg-red-900/20 border border-red-500 rounded p-4">
                <h4 className="font-bold text-red-400 mb-2">Low Velocity 🐌</h4>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>• Barely crosses whole number</li>
                  <li>• Only 50-200 points beyond</li>
                  <li>• Falls back quickly</li>
                  <li>• Perfect for reversal trades</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Trading Rules */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">✅ Trading Rules & Best Practices</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-900/20 border-2 border-green-500 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-400 mb-4">✅ DO's</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✅ Long below whole numbers when bullish</li>
                <li>✅ Short above whole numbers when bearish</li>
                <li>✅ Wait for 086 beam before major shorts</li>
                <li>✅ Use Dwarf Tossing technique</li>
                <li>✅ Enter in 888-700 dip buying zone</li>
                <li>✅ Watch velocity of moves</li>
                <li>✅ Scale into positions gradually</li>
                <li>✅ Take screenshots for mapping</li>
              </ul>
            </div>

            <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">❌ DON'Ts</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>❌ Don't long at fresh whole numbers</li>
                <li>❌ Don't short first break of whole number</li>
                <li>❌ Don't trade in neutral zone (400s-600s)</li>
                <li>❌ Don't ignore the beams</li>
                <li>❌ Don't fight high velocity moves</li>
                <li>❌ Don't overtrade</li>
                <li>❌ Don't panic - stick to the plan</li>
                <li>❌ Don't ignore time cycles</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Time Cycles */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">⏰ Time Cycles & Market Rhythm</h2>
          
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🌅</span>
                <h4 className="text-lg font-bold text-blue-400">6:30 AM NY Time - The Morning Low</h4>
              </div>
              <p className="text-gray-300 text-sm">
                Overnight dumps typically end around 6:30 AM. This is often the lowest point of the day 
                and presents quick scalp opportunities.
              </p>
            </div>

            <div className="bg-green-900/20 border border-green-500 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📈</span>
                <h4 className="text-lg font-bold text-green-400">8:00-9:30 AM - The AM Pump</h4>
              </div>
              <p className="text-gray-300 text-sm">
                Momentum builds through the morning. Stock market opens at 9:30 AM, often triggering 
                pumps. Expect bullish price action during these hours.
              </p>
            </div>

            <div className="bg-purple-900/20 border border-purple-500 rounded-lg p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🌙</span>
                <h4 className="text-lg font-bold text-purple-400">Overnight - The Witching Hour</h4>
              </div>
              <p className="text-gray-300 text-sm">
                Price often dumps overnight due to lower volume. The "witching hour" (4-6:30 AM) 
                sees the most dramatic moves down.
              </p>
            </div>
          </div>
        </section>

        {/* Risk Management */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">🛡️ Risk Management</h2>
          
          <div className="bg-red-900/20 border-2 border-red-500 rounded-lg p-6">
            <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Critical Risk Warning</h3>
            <div className="space-y-3 text-gray-300 text-sm">
              <p>
                <strong className="text-yellow-400">Trading with leverage is extremely risky.</strong> The strategy 
                described here uses 50x-100x leverage, which can result in total loss of capital very quickly.
              </p>
              <ul className="space-y-2 ml-4">
                <li>• Never risk more than you can afford to lose</li>
                <li>• Start with small position sizes</li>
                <li>• Practice on paper first</li>
                <li>• Maintain proper position sizing (max 40% of wallet)</li>
                <li>• Always use stop losses or maintain proper gaps</li>
                <li>• Past performance does not guarantee future results</li>
              </ul>
              <div className="mt-4 p-4 bg-slate-900/50 rounded border border-yellow-500">
                <p className="text-yellow-300 font-bold">
                  This strategy requires significant practice, discipline, and emotional control. 
                  Do your own research (DYOR) before trading.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* On BATTLEFIELD */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">⚔️ Using the Strategy on BATTLEFIELD</h2>
          
          <div className="bg-gradient-to-br from-green-900/20 via-yellow-900/20 to-red-900/20 border-2 border-yellow-500 rounded-lg p-6">
            <p className="text-gray-300 leading-relaxed mb-4">
              BATTLEFIELD makes it easy to practice the Whole Number Strategy with <strong className="text-yellow-400">paper money</strong>. 
              You can:
            </p>
            <ul className="space-y-2 text-gray-300 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-yellow-400">🎯</span>
                <span>Watch the BTC price and identify whole number levels in real-time</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400">🎯</span>
                <span>Open LONG positions below whole numbers when bullish</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400">🎯</span>
                <span>Open SHORT positions above whole numbers when bearish</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400">🎯</span>
                <span>Track coordinate positions (350, 888, 226, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400">🎯</span>
                <span>Use leverage up to 100x to simulate real trading conditions</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-400">🎯</span>
                <span>Compete with other traders: Bears 🐻 vs Bulls 🐂</span>
              </li>
            </ul>
            <div className="bg-purple-900/30 border border-purple-500 rounded p-4 text-center">
              <p className="text-lg text-purple-300 font-bold">
                Practice risk-free, master the strategy, then apply it to real markets!
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12">
          <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-yellow-400 mb-3">Ready to Trade?</h3>
            <p className="text-gray-300 mb-6">
              Put your knowledge to the test on the BATTLEFIELD!
            </p>
            <Link
              href="/battlefield"
              className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-lg transition-all"
            >
              Return to BATTLEFIELD ⚔️
            </Link>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 py-8 pb-12 text-center text-gray-400 space-y-3">
        <p className="text-sm font-bold">⚔️ <strong>BATTLEFIELD</strong> ⚔️</p>

        <div className="space-y-2">
          <p className="text-sm">
            Created by{' '}
            <button
              onClick={() => handleExternalLink('https://elalpha.lol')}
              className="text-purple-400 hover:text-purple-300 underline cursor-pointer font-semibold"
            >
              elalpha.lol
            </button>
          </p>
          <p className="text-sm">
            Follow on Farcaster:{' '}
            <button
              onClick={() => handleExternalLink('https://warpcast.com/elalpha.eth')}
              className="text-purple-400 hover:text-purple-300 cursor-pointer"
            >
              @elalpha.eth
            </button>
            {' • '}
            <button
              onClick={() => handleExternalLink('https://warpcast.com/btcbattle')}
              className="text-purple-400 hover:text-purple-300 cursor-pointer"
            >
              @btcbattle
            </button>
          </p>
          <p className="text-sm text-purple-400 font-semibold">
            Launching on clanker.world
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
    </div>
  );
}
