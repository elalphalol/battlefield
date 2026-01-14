'use client';

import { useState, useEffect } from 'react';

interface TradeResultToastProps {
  isVisible: boolean;
  pnl: number;
  isLiquidated?: boolean;
  onDismiss: () => void;
}

const WIN_MESSAGES = [
  'Ka-ching!',
  'Easy money!',
  "You're on fire!",
  'Nice trade!',
  'Winner winner!',
];

const LOSS_MESSAGES = [
  'Oops!',
  'Rekt!',
  'Better luck next time!',
  'The market giveth and taketh',
  'Tough break!',
];

const LIQUIDATION_MESSAGES = [
  'LIQUIDATED!',
  'Wrecked!',
  'Margin call!',
];

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export function TradeResultToast({ isVisible, pnl, isLiquidated, onDismiss }: TradeResultToastProps) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  const isWin = pnl >= 0 && !isLiquidated;
  const formattedPnl = Math.abs(pnl).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  useEffect(() => {
    if (isVisible) {
      // Pick a random message
      if (isLiquidated) {
        setMessage(getRandomMessage(LIQUIDATION_MESSAGES));
      } else if (isWin) {
        setMessage(getRandomMessage(WIN_MESSAGES));
      } else {
        setMessage(getRandomMessage(LOSS_MESSAGES));
      }

      // Trigger entrance animation
      setTimeout(() => setShow(true), 50);

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onDismiss, 300);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, isWin, isLiquidated, onDismiss]);

  if (!isVisible) return null;

  const bgColor = isLiquidated
    ? 'from-red-900/95 to-orange-900/95'
    : isWin
    ? 'from-green-900/95 to-emerald-900/95'
    : 'from-red-900/95 to-rose-900/95';

  const borderColor = isLiquidated
    ? 'border-orange-500'
    : isWin
    ? 'border-green-500'
    : 'border-red-500';

  const glowColor = isLiquidated
    ? 'rgba(249, 115, 22, 0.4)'
    : isWin
    ? 'rgba(34, 197, 94, 0.4)'
    : 'rgba(239, 68, 68, 0.4)';

  const icon = isLiquidated ? '💥' : isWin ? '💰' : '📉';

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div
        className={`bg-gradient-to-r ${bgColor} border-2 ${borderColor} rounded-xl px-6 py-4 min-w-[280px] text-center`}
        style={{
          boxShadow: `0 0 30px ${glowColor}`,
        }}
      >
        {/* Icon */}
        <div className="text-4xl mb-2 animate-bounce">
          {icon}
        </div>

        {/* Message */}
        <div className="text-lg font-bold text-white mb-1">
          {message}
        </div>

        {/* P&L Amount */}
        <div
          className={`text-2xl font-bold ${
            isLiquidated
              ? 'text-orange-400'
              : isWin
              ? 'text-green-400'
              : 'text-red-400'
          }`}
        >
          {isWin ? '+' : '-'}${formattedPnl}
        </div>

        {/* Subtitle for liquidation */}
        {isLiquidated && (
          <div className="text-xs text-orange-300 mt-1">
            The market shows no mercy
          </div>
        )}
      </div>
    </div>
  );
}
