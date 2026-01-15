'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import sdk from '@farcaster/miniapp-sdk';

export default function LandingPage() {
  const router = useRouter();

  const handleExternalLink = async (url: string) => {
    // Always try SDK first - it will only work in Farcaster miniapp
    try {
      await sdk.actions.openUrl(url);
      console.log('✅ Opened via Farcaster SDK');
    } catch (error) {
      // SDK failed (desktop browser) - use regular window.open
      console.log('⚠️ SDK failed, using window.open:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img 
            src="/battlefield-logo.jpg" 
            alt="BATTLEFIELD" 
            className="w-48 h-48 md:w-64 md:h-64 rounded-3xl shadow-2xl border-4 border-yellow-500/50"
          />
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 break-words">
            BATTLEFIELD
          </h1>
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-300 font-bold">
          </p>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
            Paper trade Bitcoin up to 200x leverage. Master the Whole Number Strategy. 
            Compete for glory and earn $BATTLE tokens!
          </p>
        </div>

        {/* Token Info */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-2 border-purple-500/50 rounded-2xl p-8 space-y-4">
          <div className="text-3xl md:text-4xl font-bold text-purple-400 flex items-center justify-center gap-3">
            <img src="/battlefield-logo.jpg" alt="$BATTLE" className="w-10 h-10 md:w-12 md:h-12 rounded-full" />
            $BATTLE TOKEN
          </div>
          <div className="space-y-2">
            <p className="text-gray-300 text-sm md:text-base">
              Earn tokens by dominating the leaderboard!
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/30">
              <p className="text-xs text-gray-500 mb-2">Contract Address (Coming Soon)</p>
              <p className="text-xs md:text-sm font-mono text-purple-300 break-all">
                Deploying Soon
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => router.push('/battlefield')}
          className="group relative inline-flex items-center justify-center px-6 sm:px-12 py-4 sm:py-6 text-xl sm:text-3xl md:text-4xl font-black text-slate-900 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 transform hover:scale-105"
        >
          <span className="relative z-10 text-center leading-tight">⚔️ ARE YOU READY? ⚔️</span>
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 via-orange-600 to-red-600 rounded-2xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
        </button>

        <p className="text-sm text-gray-500 italic">
          Join the war. Claim your army. Dominate the leaderboard.
        </p>

        {/* Credits */}
        <div className="pt-8 border-t border-slate-800 space-y-2">
          <p className="text-sm text-gray-500">
            Created by{' '}
            <button
              onClick={() => handleExternalLink('https://elalpha.lol')}
              className="text-purple-400 hover:text-purple-300 font-bold underline cursor-pointer"
            >
              elalpha.lol
            </button>
          </p>
          <p className="text-xs text-gray-600">
            Follow on Farcaster:{' '}
            <button
              onClick={() => handleExternalLink('https://warpcast.com/elalpha.eth')}
              className="text-purple-400 hover:text-purple-300 font-mono cursor-pointer"
            >
              @elalpha.eth
            </button>
            {' • '}
            <button
              onClick={() => handleExternalLink('https://warpcast.com/btcbattle')}
              className="text-purple-400 hover:text-purple-300 font-mono cursor-pointer"
            >
              @btcbattle
            </button>
          </p>
          <p className="text-sm text-purple-400 font-semibold mt-2">
            Launching on clanker.world
          </p>
        </div>

        {/* Footer Legal */}
        <div className="text-xs text-gray-600 max-w-2xl mx-auto pb-8">
          <p>⚠️ Paper trading only. No real funds at risk. High leverage trading is educational.</p>
          <p className="mt-2">This is a game. Trade responsibly. DYOR.</p>
        </div>
      </div>
    </div>
  );
}
