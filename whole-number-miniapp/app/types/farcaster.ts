// Farcaster types - Single Source of Truth

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
  verifications?: string[];
}

export interface FarcasterContext {
  user: FarcasterUser | null;
  isReady: boolean;
}

// For SDK responses that may have optional fid
export interface FarcasterUserPartial extends Partial<FarcasterUser> {
  fid?: number;
}

// Farcaster frame context from SDK
export interface FrameContext {
  user?: {
    fid?: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
  client?: {
    clientFid?: number;
    added?: boolean;
  };
}
