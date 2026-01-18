'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../lib/api';
import { INTERVALS } from '../constants/time';
import type { UserData } from '../types';

interface UserContextType {
  userData: UserData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  walletAddress: string | null;
  farcasterWallet: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const { address: wagmiAddress } = useAccount();
  const [farcasterWallet, setFarcasterWallet] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use Farcaster wallet if available, otherwise wagmi
  const walletAddress = farcasterWallet || wagmiAddress || null;

  // Resolve Farcaster wallet once on mount
  useEffect(() => {
    const resolveFarcasterWallet = async () => {
      try {
        const { default: sdk } = await import('@farcaster/miniapp-sdk');
        const context = await sdk.context;
        if (context?.user?.fid) {
          const response = await fetch(getApiUrl(`api/users/fid/${context.user.fid}`));
          const data = await response.json();
          if (data.success && data.user?.wallet_address) {
            setFarcasterWallet(data.user.wallet_address);
          }
        }
      } catch (e) {
        // Not in Farcaster context - that's okay
        console.log('Not in Farcaster context');
      }
    };
    resolveFarcasterWallet();
  }, []);

  const refetch = useCallback(async () => {
    if (!walletAddress) {
      setUserData(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl(`api/users/${walletAddress}`));
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch user');
      }
    } catch (e) {
      setError('Failed to fetch user data');
      console.error('Error fetching user:', e);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    refetch();
    const interval = setInterval(refetch, INTERVALS.USER_REFRESH);
    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <UserContext.Provider value={{ userData, isLoading, error, refetch, walletAddress, farcasterWallet }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
