'use client';

import { useState, useEffect } from 'react';
import sdk from '@farcaster/miniapp-sdk';
import { ConfettiCanvas } from './ConfettiCanvas';
import type { Notification } from '../hooks/useNotificationManager';

interface AchievementModalProps {
  notification: Notification;
  onDismiss: () => void;
}

function getRarityColor(rarity?: string): string {
  switch (rarity) {
    case 'common':
      return 'bg-gray-600 text-gray-200';
    case 'uncommon':
      return 'bg-green-700 text-green-200';
    case 'rare':
      return 'bg-blue-600 text-blue-200';
    case 'epic':
      return 'bg-purple-600 text-purple-200';
    case 'legendary':
      return 'bg-yellow-500 text-yellow-900';
    case 'mythic':
      return 'bg-pink-600 text-pink-200';
    default:
      return 'bg-slate-600 text-slate-200';
  }
}

export function AchievementModal({ notification, onDismiss }: AchievementModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => {
      setIsVisible(true);
      setShowConfetti(true);
    }, 50);

    // Auto-dismiss after 10s if not interacted
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoDismissTimer);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for exit animation
  };

  const handleShare = async () => {
    // Generate share text (outside try block so it's accessible in catch)
    const shareText = `Just unlocked ${notification.data.title} on @btcbattle! 🏆\n\n${notification.data.description}${notification.data.points ? `\n\n+${notification.data.points} points earned!` : ''}`;

    // Use btcbattlefield.com URL which has fc:miniapp meta tag for proper thumbnail
    const miniappUrl = 'https://btcbattlefield.com';

    try {
      // Use Warpcast composer with embed to show thumbnail
      const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(miniappUrl)}`;

      await sdk.actions.openUrl(castUrl);
      handleDismiss();
    } catch (error) {
      console.error('Error sharing achievement:', error);
      // Fallback: try copying to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        // Could show a toast here
      } catch (clipError) {
        console.error('Failed to copy to clipboard:', clipError);
      }
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Confetti canvas */}
      {showConfetti && <ConfettiCanvas />}

      {/* Modal content */}
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div
          className={`bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-yellow-400 rounded-xl p-8 max-w-md w-full transform transition-transform duration-500 ${
            isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
          }`}
          style={{
            boxShadow: '0 0 40px rgba(250, 204, 21, 0.3)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-2 animate-bounce">🏆</div>
            <h2 className="text-2xl font-bold text-yellow-400 uppercase tracking-wider">
              {notification.type === 'achievement' && 'Achievement Unlocked!'}
              {notification.type === 'rank' && 'Rank Achievement!'}
              {notification.type === 'milestone' && 'Milestone Reached!'}
              {notification.type === 'streak' && 'Win Streak!'}
            </h2>
          </div>

          {/* Achievement card */}
          <div className="bg-slate-700/50 border-2 border-slate-600 rounded-lg p-6 mb-6">
            <div className="text-center">
              {/* Icon with glow */}
              <div
                className="text-6xl mb-4"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.8))',
                  animation: 'glow 2s ease-in-out infinite',
                }}
              >
                {notification.data.icon || '⭐'}
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-white mb-2">
                {notification.data.title}
              </h3>

              {/* Description */}
              <p className="text-gray-300 text-sm mb-4">
                {notification.data.description}
              </p>

              {/* Rarity badge */}
              {notification.data.rarity && (
                <div
                  className={`inline-block px-4 py-2 rounded-full text-sm font-bold mb-2 ${getRarityColor(
                    notification.data.rarity
                  )}`}
                >
                  ⭐ {notification.data.rarity.toUpperCase()} ⭐
                </div>
              )}

              {/* Points */}
              {notification.data.points && (
                <div className="text-yellow-400 font-bold text-lg mt-2">
                  +{notification.data.points} Points
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
            >
              Continue
            </button>
            <button
              onClick={handleShare}
              className="flex-1 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
            >
              🟪 Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
