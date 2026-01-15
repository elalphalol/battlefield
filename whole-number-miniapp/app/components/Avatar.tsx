'use client';

import { getBorderInfo, getBorderTier, getBorderClasses, getBorderEmoji, type BorderTier } from '../lib/borders';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  pfpUrl?: string | null;
  username?: string;
  army?: 'bears' | 'bulls' | null;
  winningTrades?: number;
  size?: AvatarSize;
  showBorderBadge?: boolean;
  showDecorations?: boolean;
  className?: string;
}

// Size classes: wrapper is full size, avatar is ~86% to leave room for decorations (like glossary: 14/12 ratio)
const sizeClasses: Record<AvatarSize, { wrapper: string; avatar: string; border: string; badge: string; fallbackText: string }> = {
  xs: { wrapper: 'w-8 h-8', avatar: 'w-7 h-7', border: 'border-2', badge: 'text-[8px] -bottom-1 -right-1 px-1', fallbackText: 'text-xs' },
  sm: { wrapper: 'w-10 h-10', avatar: 'w-[34px] h-[34px]', border: 'border-2', badge: 'text-[9px] -bottom-1 -right-1 px-1', fallbackText: 'text-sm' },
  md: { wrapper: 'w-14 h-14', avatar: 'w-12 h-12', border: 'border-2', badge: 'text-[10px] -bottom-1 -right-1 px-1.5', fallbackText: 'text-lg' },
  lg: { wrapper: 'w-20 h-20', avatar: 'w-[68px] h-[68px]', border: 'border-4', badge: 'text-xs -bottom-1 -right-1 px-2 py-0.5', fallbackText: 'text-2xl' },
  xl: { wrapper: 'w-24 h-24', avatar: 'w-[82px] h-[82px]', border: 'border-4', badge: 'text-sm -bottom-2 -right-2 px-2 py-0.5', fallbackText: 'text-3xl' },
};

// SVG decorative frames for each tier - exact coordinates from glossary
function FrameDecoration({ tier }: { tier: BorderTier }) {
  if (tier === 'none' || tier === 'bronze') return null;

  // Use inset-0 to fill the wrapper container exactly like glossary does
  const svgClass = 'absolute inset-0 w-full h-full pointer-events-none';

  // Silver: Simple corner accents
  if (tier === 'silver') {
    return (
      <svg className={svgClass} viewBox="0 0 100 100">
        <polygon points="0,15 0,0 15,0" fill="#d1d5db" opacity="0.8" />
        <polygon points="85,0 100,0 100,15" fill="#d1d5db" opacity="0.8" />
        <polygon points="100,85 100,100 85,100" fill="#d1d5db" opacity="0.8" />
        <polygon points="0,85 0,100 15,100" fill="#d1d5db" opacity="0.8" />
      </svg>
    );
  }

  // Gold: Star points with glow
  if (tier === 'gold') {
    return (
      <svg className={svgClass} viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.5))' }}>
        <polygon points="50,0 54,12 50,8 46,12" fill="#facc15" />
        <polygon points="100,50 88,54 92,50 88,46" fill="#facc15" />
        <polygon points="50,100 46,88 50,92 54,88" fill="#facc15" />
        <polygon points="0,50 12,46 8,50 12,54" fill="#facc15" />
        <polygon points="12,12 18,6 24,12 18,18" fill="#eab308" />
        <polygon points="88,12 82,6 76,12 82,18" fill="#eab308" />
        <polygon points="88,88 82,94 76,88 82,82" fill="#eab308" />
        <polygon points="12,88 18,94 24,88 18,82" fill="#eab308" />
      </svg>
    );
  }

  // Platinum: Crystalline spikes
  if (tier === 'platinum') {
    return (
      <svg className={svgClass} viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 8px rgba(103,232,249,0.6))' }}>
        <polygon points="50,-4 54,14 50,10 46,14" fill="#67e8f9" />
        <polygon points="104,50 86,54 90,50 86,46" fill="#67e8f9" />
        <polygon points="50,104 46,86 50,90 54,86" fill="#67e8f9" />
        <polygon points="-4,50 14,46 10,50 14,54" fill="#67e8f9" />
        <polygon points="15,15 8,8 22,12 18,22" fill="#22d3ee" />
        <polygon points="85,15 92,8 78,12 82,22" fill="#22d3ee" />
        <polygon points="85,85 92,92 78,88 82,78" fill="#22d3ee" />
        <polygon points="15,85 8,92 22,88 18,78" fill="#22d3ee" />
      </svg>
    );
  }

  // Diamond: Epic crown-like frame with animated glow
  if (tier === 'diamond') {
    return (
      <svg className={`${svgClass} animate-pulse`} viewBox="0 0 100 100" style={{ filter: 'drop-shadow(0 0 10px rgba(192,132,252,0.7))' }}>
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
    );
  }

  return null;
}

export function Avatar({
  pfpUrl,
  username,
  army,
  winningTrades = 0,
  size = 'md',
  showBorderBadge = false,
  showDecorations = false,
  className = '',
}: AvatarProps) {
  const tier = getBorderTier(winningTrades);
  const borderClasses = getBorderClasses(tier);
  const borderEmoji = getBorderEmoji(tier);
  const sizeConfig = sizeClasses[size];

  // Army emoji fallback
  const armyEmoji = army === 'bears' ? '🐻' : army === 'bulls' ? '🐂' : '👤';
  const armyBgColor = army === 'bears' ? 'bg-red-900/50' : army === 'bulls' ? 'bg-green-900/50' : 'bg-slate-700';

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeConfig.wrapper} ${className}`}>
      {/* Decorative Frame - fills wrapper, avatar is smaller inside */}
      {showDecorations && <FrameDecoration tier={tier} />}

      {/* Avatar Container - smaller than wrapper to leave room for decorations */}
      <div
        className={`
          ${sizeConfig.avatar}
          ${sizeConfig.border}
          ${borderClasses}
          rounded-full overflow-hidden flex-shrink-0 relative z-10
          ${tier === 'platinum' || tier === 'diamond' ? 'transition-shadow duration-300' : ''}
        `}
      >
        {pfpUrl ? (
          <img
            src={pfpUrl}
            alt={username || 'User avatar'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${armyBgColor} flex items-center justify-center`}>
            <span className={sizeConfig.fallbackText}>{armyEmoji}</span>
          </div>
        )}
      </div>

      {/* Border Tier Badge */}
      {showBorderBadge && tier !== 'none' && (
        <div
          className={`
            absolute ${sizeConfig.badge}
            bg-slate-800 rounded-full
            border border-slate-600
            flex items-center justify-center
            font-bold z-20
          `}
          title={`${getBorderInfo(winningTrades).name} Border`}
        >
          {borderEmoji}
        </div>
      )}
    </div>
  );
}

// Small badge component to show border tier inline
export function BorderBadge({ winningTrades }: { winningTrades: number }) {
  const info = getBorderInfo(winningTrades);

  if (info.tier === 'none') return null;

  const tierColors: Record<BorderTier, string> = {
    none: '',
    bronze: 'text-amber-600',
    silver: 'text-gray-300',
    gold: 'text-yellow-400',
    platinum: 'text-cyan-300',
    diamond: 'text-purple-400',
  };

  return (
    <span className={`inline-flex items-center gap-1 ${tierColors[info.tier]} font-semibold text-sm`}>
      {info.emoji} {info.name}
    </span>
  );
}
