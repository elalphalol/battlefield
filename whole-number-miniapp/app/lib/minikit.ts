import sdk from '@farcaster/frame-sdk';

export interface FarcasterUser {
  fid?: number;
  username?: string;
  displayName?: string;
}

export interface FarcasterContext {
  user: FarcasterUser | null;
  isReady: boolean;
}

export async function initializeMiniKit(): Promise<FarcasterContext> {
  try {
    const context = await sdk.context;
    console.log('Farcaster Context:', context);
    
    return {
      user: context.user as FarcasterUser,
      isReady: true,
    };
  } catch (error) {
    console.error('MiniKit initialization error:', error);
    return {
      user: null,
      isReady: false,
    };
  }
}

export async function shareToFarcaster(text: string, imageUrl?: string): Promise<{ success: boolean; error?: unknown }> {
  try {
    // Open URL in Warpcast composer
    const castText = encodeURIComponent(text);
    const embedUrl = imageUrl ? `&embeds[]=${encodeURIComponent(imageUrl)}` : '';
    const composerUrl = `https://warpcast.com/~/compose?text=${castText}${embedUrl}`;
    
    await sdk.actions.openUrl(composerUrl);
    return { success: true };
  } catch (error) {
    console.error('Share error:', error);
    return { success: false, error };
  }
}

export async function getFarcasterUser(): Promise<FarcasterUser | null> {
  try {
    const context = await sdk.context;
    return context.user as FarcasterUser;
  } catch (error) {
    console.error('Error getting Farcaster user:', error);
    return null;
  }
}

export function isInFarcasterFrame(): boolean {
  if (typeof window === 'undefined') return false;
  return window.parent !== window;
}
