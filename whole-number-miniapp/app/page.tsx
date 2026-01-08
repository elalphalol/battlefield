'use client';

import { useState, useEffect, useMemo } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { PaperTrading } from './components/PaperTrading';
import { WholeNumberStrategy } from './lib/strategy';
import { useBTCPrice } from './hooks/useBTCPrice';
import { initializeMiniKit, shareToFarcaster, FarcasterUser } from './lib/minikit';

export default function Home() {
  const { price, isLoading } = useBTCPrice(5000);
  const [strategy] = useState(() => new WholeNumberStrategy());
  const [farcasterUser, setFarcasterUser] = useState<FarcasterUser | null>(null);
  const [isInFrame, setIsInFrame] = useState(false);

  // Update strategy with new price
  useEffect(() => {
    if (price > 0) {
      strategy.updatePrice(price);
    }
  }, [price, strategy]);

  // Initialize Farcaster MiniKit
  useEffect(() => {
    initializeMiniKit().then(({ user, isReady }) => {
      setFarcasterUser(user);
      setIsInFrame(isReady);
    });
  }, []);

  // Calculate strategy values
  const coordinate = useMemo(() => strategy.getCoordinate(price), [price, strategy]);
  const wholeNumber = useMemo(() => strategy.getWholeNumber(price), [price, strategy]);
  const nextWholeNumber = useMemo(() => strategy.getNextWholeNumber(price), [price, strategy]);
  const zoneInfo = useMemo(() => strategy.getZoneInfo(coordinate), [coordinate, strategy]);
  const direction = useMemo(() => strategy.getMarketDirection(), [strategy]);
  const recommendation = useMemo(() => strategy.getRecommendedAction(coordinate, direction), [coordinate, direction, strategy]);

  // Check beams
  useEffect(() => {
    if (price > 0) {
      strategy.checkBeams(coordinate, wholeNumber);
    }
  }, [price, coordinate, wholeNumber, strategy]);

  const handleShare = async () => {
    const text = `⚔️ Just played Whole Number War!\n\nBTC: $${strategy.formatNumber(price)}\nCoordinate: ${coordinate}\nZone: ${zoneInfo.name}\n\n#WholeNumberWar #Bitcoin #Base`;
    
    const result = await shareToFarcaster(text);
    if (result.success) {
      alert('📤 Opening Warpcast composer...');
    } else {
      alert('❌ Failed to share. Make sure you\'re in Warpcast!');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
              ⚔️ WHOLE NUMBER WAR
            </h1>
            <p className="text-sm text-gray-400">RED ARMY vs GREEN ARMY</p>
          </div>
          <div className="flex gap-4 items-center">
            {farcasterUser && (
              <div className="text-sm text-gray-400 hidden md:block">
                Welcome, {farcasterUser.displayName || farcasterUser.username}!
              </div>
            )}
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Price Section */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">BITCOIN PRICE</div>
            <div className="text-5xl md:text-6xl font-bold text-yellow-400 mb-2">
              {isLoading ? 'Loading...' : `$${strategy.formatNumber(price)}`}
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Whole Number Info */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Current Whole</div>
              <div className="text-xl font-bold text-blue-400">
                ${strategy.formatNumber(wholeNumber)}
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Coordinate</div>
              <div className="text-2xl font-bold text-yellow-400">
                {coordinate.toString().padStart(3, '0')}
              </div>
            </div>
            <div className="bg-slate-900 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-400 mb-1">Next Whole</div>
              <div className="text-xl font-bold text-green-400">
                ${strategy.formatNumber(nextWholeNumber)}
              </div>
            </div>
          </div>
        </div>

        {/* Zone Info */}
        <div className={`rounded-lg p-6 mb-6 border-2 ${
          zoneInfo.signal === 'bullish' ? 'bg-green-900/20 border-green-500' :
          zoneInfo.signal === 'bearish' ? 'bg-red-900/20 border-red-500' :
          zoneInfo.signal === 'opportunity' ? 'bg-yellow-900/20 border-yellow-500' :
          'bg-slate-800 border-slate-600'
        }`}>
          <h3 className="text-2xl font-bold mb-2">{zoneInfo.name}</h3>
          <p className="text-gray-300">{zoneInfo.description}</p>
        </div>

        {/* Market Direction & Recommendation */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Direction */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              🧭 MARKET DIRECTION
            </h3>
            <div className={`text-4xl font-bold text-center py-4 rounded ${
              direction === 'bullish' ? 'bg-green-900/30 text-green-400' :
              direction === 'bearish' ? 'bg-red-900/30 text-red-400' :
              'bg-slate-700 text-gray-400'
            }`}>
              {direction === 'bullish' ? '⬆️ BULLISH' :
               direction === 'bearish' ? '⬇️ BEARISH' :
               '↔️ NEUTRAL'}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              ⚡ RECOMMENDATION
            </h3>
            <div className={`text-2xl font-bold px-4 py-2 rounded mb-3 text-center ${
              recommendation.action === 'long' ? 'bg-green-600' :
              recommendation.action === 'short' ? 'bg-red-600' :
              recommendation.action === 'caution' ? 'bg-yellow-600' :
              'bg-gray-600'
            }`}>
              {recommendation.action.toUpperCase()}
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {recommendation.description}
            </p>
            <div className="mt-3 text-xs text-gray-500">
              Confidence: {recommendation.confidence.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Beams Status */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <h3 className="text-lg font-bold mb-4">🔨 THE BEAMS</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className={`p-4 rounded ${strategy.beamsBroken.beam226 ? 'bg-red-900/30' : 'bg-slate-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">226 BEAM</span>
                <span className="text-2xl">{strategy.beamsBroken.beam226 ? '🔴' : '🟢'}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                ${strategy.formatNumber(wholeNumber + 226)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {strategy.beamsBroken.beam226 ? 'BROKEN' : 'INTACT'}
              </div>
            </div>
            <div className={`p-4 rounded ${strategy.beamsBroken.beam113 ? 'bg-red-900/30' : 'bg-slate-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">113 BEAM</span>
                <span className="text-2xl">{strategy.beamsBroken.beam113 ? '🔴' : '🟢'}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                ${strategy.formatNumber(wholeNumber + 113)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {strategy.beamsBroken.beam113 ? 'BROKEN' : 'INTACT'}
              </div>
            </div>
            <div className={`p-4 rounded ${strategy.beamsBroken.beam086 ? 'bg-red-900/30' : 'bg-slate-700'}`}>
              <div className="flex justify-between items-center">
                <span className="font-semibold">086 BEAM</span>
                <span className="text-2xl">{strategy.beamsBroken.beam086 ? '🔴' : '🟢'}</span>
              </div>
              <div className="text-sm text-gray-400 mt-1">
                ${strategy.formatNumber(wholeNumber + 86)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {strategy.beamsBroken.beam086 ? 'BROKEN' : 'INTACT'}
              </div>
            </div>
          </div>
        </div>

        {/* Paper Trading */}
        <div className="mb-6">
          <PaperTrading 
            currentPrice={price}
            coordinate={coordinate}
            formatNumber={(num) => strategy.formatNumber(num)}
          />
        </div>

        {/* Share Button */}
        <div className="text-center">
          <button
            onClick={handleShare}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            📤 Share to Farcaster
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-12 py-6 text-center text-gray-500 text-sm">
        {isInFrame && (
          <p className="text-green-400 mb-2 font-semibold">
            🎯 Running in Farcaster Frame
          </p>
        )}
        <p>⚠️ Educational purposes only. High leverage trading carries substantial risk.</p>
        <p className="mt-2">Based on the Oracle WHOLE NUMBER Strategy</p>
      </footer>
    </main>
  );
}
