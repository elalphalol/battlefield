'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

interface VolumeTrackerProps {
  walletAddress?: string;
  showUserVolume?: boolean;
  showExplanation?: boolean;
  minimal?: boolean;
}

export function VolumeTracker({ walletAddress, showUserVolume = false, showExplanation = true, minimal = false }: VolumeTrackerProps) {
  const [volumeStats, setVolumeStats] = useState<{
    globalVolume: number;
    totalTraders: number;
    userVolume?: number;
    userTrades?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolumeStats = async () => {
      try {
        const url = walletAddress && showUserVolume
          ? getApiUrl(`api/volume/stats?walletAddress=${walletAddress}`)
          : getApiUrl('api/volume/stats');
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
          setVolumeStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching volume stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolumeStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchVolumeStats, 10000);
    return () => clearInterval(interval);
  }, [walletAddress, showUserVolume]);

  if (loading || !volumeStats) {
    return (
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-2 border-blue-500/50 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    }
    return `$${volume.toLocaleString()}`;
  };

  // Minimal mode: Simple inline display
  if (minimal) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-400 mb-1">Global Trading Volume</p>
        <p className="text-xl font-bold text-blue-400">
          {formatVolume(volumeStats.globalVolume)}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {volumeStats.totalTraders} traders
        </p>
      </div>
    );
  }

  // Full mode: Card with border
  return (
    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-2 border-blue-500/50 rounded-lg p-4 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Global Volume */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-gray-400 mb-1">📈 Global Trading Volume</p>
          <p className="text-2xl sm:text-3xl font-bold text-blue-400">
            {formatVolume(volumeStats.globalVolume)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {volumeStats.totalTraders} traders
          </p>
        </div>

        {/* User Volume (if applicable) */}
        {showUserVolume && volumeStats.userVolume !== undefined && (
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-400 mb-1">💼 Your Trading Volume</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-400">
              {formatVolume(volumeStats.userVolume)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {volumeStats.userTrades} trades
            </p>
          </div>
        )}
      </div>

      {/* Info/Flex Message - Only show if showExplanation is true */}
      {showExplanation && (
        <div className="mt-4 pt-4 border-t border-blue-500/30">
          <p className="text-xs text-center text-gray-400">
            💪 <strong className="text-blue-400">Volume = Position Size × Leverage</strong> • Real trading power being moved!
          </p>
        </div>
      )}
    </div>
  );
}
