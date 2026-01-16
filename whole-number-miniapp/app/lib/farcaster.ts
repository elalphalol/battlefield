// Farcaster Authentication Integration
import sdk from '@farcaster/miniapp-sdk';

// Farcaster Mini App URL - used for referral links
// This opens the app within Farcaster client, ensuring users are authenticated
export const FARCASTER_MINIAPP_URL = 'https://farcaster.xyz/miniapps/5kLec5hSq3bP/battlefield';

// Helper to generate referral link that opens in Farcaster
export function getReferralLink(referralCode: string): string {
  return `${FARCASTER_MINIAPP_URL}?ref=${referralCode}`;
}

// Helper to get display-friendly short link (for UI display)
export function getShortReferralLink(referralCode: string): string {
  return `farcaster.xyz/miniapps/.../battlefield?ref=${referralCode}`;
}

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
  verifications?: string[];
}

interface FarcasterContext {
  user?: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
    custodyAddress?: string;
    verifications?: string[];
  };
}

export class FarcasterAuth {
  private static instance: FarcasterAuth;
  private isReady = false;
  private context: FarcasterContext | null = null;

  private constructor() {}

  static getInstance(): FarcasterAuth {
    if (!FarcasterAuth.instance) {
      FarcasterAuth.instance = new FarcasterAuth();
    }
    return FarcasterAuth.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      // Initialize the Farcaster Frame SDK
      this.context = await sdk.context;
      console.log('Farcaster SDK initialized:', this.context);
      this.isReady = true;
      return true;
    } catch (error) {
      console.log('Not running in Farcaster context:', error);
      this.isReady = false;
      return false;
    }
  }

  isInFarcasterFrame(): boolean {
    return this.isReady && this.context !== null;
  }

  async getFarcasterUser(): Promise<FarcasterUser | null> {
    try {
      if (!this.context || !this.context.user) {
        return null;
      }

      const user = this.context.user;
      
      // Get the first verified address as the wallet address
      const walletAddress = user.verifications && user.verifications.length > 0 
        ? user.verifications[0] 
        : null;

      return {
        fid: user.fid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        custody: user.custodyAddress,
        verifications: user.verifications || []
      };
    } catch (error) {
      console.error('Error getting Farcaster user:', error);
      return null;
    }
  }

  async signInWithFarcaster(): Promise<{ farcasterUser: FarcasterUser; walletAddress: string } | null> {
    try {
      const user = await this.getFarcasterUser();
      if (!user) {
        throw new Error('No Farcaster user found');
      }

      // Method 1: Try to get wallet from SDK's wallet provider
      let walletAddress = '';
      
      try {
        // Request wallet access from Farcaster Frame
        const provider = await sdk.wallet.ethProvider;
        if (provider) {
          const accounts = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            walletAddress = accounts[0];
            console.log('✅ Got wallet from eth_accounts:', walletAddress);
          }
        }
      } catch (providerError) {
        console.log('No eth provider available:', providerError);
      }

      // Method 2: Fallback to verifications or custody address
      if (!walletAddress) {
        walletAddress = user.verifications && user.verifications.length > 0
          ? user.verifications[0]
          : user.custody || '';
      }

      if (!walletAddress) {
        throw new Error('No wallet address found - user may need to connect wallet in Farcaster');
      }

      console.log('Farcaster sign-in successful:', { fid: user.fid, username: user.username, walletAddress });

      return {
        farcasterUser: user,
        walletAddress
      };
    } catch (error) {
      console.error('Farcaster sign-in failed:', error);
      return null;
    }
  }

  // Register or update user on backend
  async registerUser(farcasterUser: FarcasterUser, walletAddress: string, army?: 'bears' | 'bulls') {
    try {
      // Import getApiUrl dynamically to avoid circular dependencies
      const { getApiUrl } = await import('../config/api');
      
      const response = await fetch(getApiUrl('api/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fid: farcasterUser.fid,
          walletAddress: walletAddress.toLowerCase(),
          username: farcasterUser.username || farcasterUser.displayName || `User${farcasterUser.fid}`,
          pfpUrl: farcasterUser.pfpUrl,
          army: army || 'bulls'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.message || 'Failed to register user on backend');
      }

      const data = await response.json();
      console.log('✅ User registered/updated:', data);
      return data;
    } catch (error) {
      console.error('❌ Error registering user:', error);
      throw error;
    }
  }

  // Update existing user with Farcaster data if wallet already exists
  async updateExistingUser(walletAddress: string) {
    try {
      const user = await this.getFarcasterUser();
      if (!user) return null;

      const { getApiUrl } = await import('../config/api');
      
      const response = await fetch(getApiUrl('api/users/update-farcaster'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: walletAddress.toLowerCase(),
          fid: user.fid,
          username: user.username || user.displayName || `User${user.fid}`,
          pfpUrl: user.pfpUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Updated existing user with Farcaster data:', data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error updating existing user:', error);
      return null;
    }
  }
}

export const farcasterAuth = FarcasterAuth.getInstance();
