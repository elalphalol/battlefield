import sdk from '@farcaster/frame-sdk';

export interface FarcasterUser {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
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
      user: {
        fid: context.user?.fid,
        username: context.user?.username,
        displayName: context.user?.displayName,
        pfpUrl: context.user?.pfpUrl,
      } as FarcasterUser,
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

export async function connectWallet(): Promise<{ address: string | null; error?: unknown }> {
  try {
    // Check if we're in a Farcaster frame
    if (!isInFarcasterFrame()) {
      return { address: null, error: 'Not in Farcaster frame' };
    }

    // Try to get wallet address from MiniKit
    const walletAddress = await sdk.wallet.requestAddress();
    console.log('Wallet address from MiniKit:', walletAddress);
    
    return { address: walletAddress || null };
  } catch (error) {
    console.error('Wallet connection error:', error);
    return { address: null, error };
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
    return {
      fid: context.user?.fid,
      username: context.user?.username,
      displayName: context.user?.displayName,
      pfpUrl: context.user?.pfpUrl,
    } as FarcasterUser;
  } catch (error) {
    console.error('Error getting Farcaster user:', error);
    return null;
  }
}

export async function sendTransaction(transaction: {
  to: string;
  value: string;
  data?: string;
}): Promise<{ success: boolean; txHash?: string; error?: unknown }> {
  try {
    const result = await sdk.wallet.sendTransaction(transaction);
    return { success: true, txHash: result };
  } catch (error) {
    console.error('Transaction error:', error);
    return { success: false, error };
  }
}

export function isInFarcasterFrame(): boolean {
  if (typeof window === 'undefined') return false;
  return window.parent !== window;
}
