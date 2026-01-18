'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { getApiUrl } from '../lib/api';
import { useUser } from './UserContext';
import { INTERVALS } from '../constants/time';
import type { Trade, ClosedTrade } from '../types';

interface TradeContextType {
  openTrades: Trade[];
  closedTrades: ClosedTrade[];
  isLoading: boolean;
  refetchOpen: () => Promise<void>;
  refetchClosed: () => Promise<void>;
  refetchAll: () => Promise<void>;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export function TradeProvider({ children }: { children: ReactNode }) {
  const { walletAddress } = useUser();
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetchOpen = useCallback(async () => {
    if (!walletAddress) {
      setOpenTrades([]);
      return;
    }
    try {
      const response = await fetch(getApiUrl(`api/trades/${walletAddress}/open`));
      const data = await response.json();
      if (data.success) {
        setOpenTrades(data.trades || []);
      }
    } catch (e) {
      console.error('Failed to fetch open trades:', e);
    }
  }, [walletAddress]);

  const refetchClosed = useCallback(async () => {
    if (!walletAddress) {
      setClosedTrades([]);
      return;
    }
    try {
      const response = await fetch(getApiUrl(`api/trades/${walletAddress}/history?limit=50`));
      const data = await response.json();
      if (data.success) {
        setClosedTrades(data.trades || []);
      }
    } catch (e) {
      console.error('Failed to fetch closed trades:', e);
    }
  }, [walletAddress]);

  const refetchAll = useCallback(async () => {
    await Promise.all([refetchOpen(), refetchClosed()]);
  }, [refetchOpen, refetchClosed]);

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (walletAddress) {
      setIsLoading(true);
      Promise.all([refetchOpen(), refetchClosed()]).finally(() => setIsLoading(false));

      // Different refresh intervals for open vs closed trades
      const openInterval = setInterval(refetchOpen, INTERVALS.TRADES_REFRESH);
      const closedInterval = setInterval(refetchClosed, INTERVALS.HISTORY_REFRESH);

      return () => {
        clearInterval(openInterval);
        clearInterval(closedInterval);
      };
    } else {
      setOpenTrades([]);
      setClosedTrades([]);
      setIsLoading(false);
    }
  }, [walletAddress, refetchOpen, refetchClosed]);

  return (
    <TradeContext.Provider value={{ openTrades, closedTrades, isLoading, refetchOpen, refetchClosed, refetchAll }}>
      {children}
    </TradeContext.Provider>
  );
}

export function useTrades() {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrades must be used within TradeProvider');
  }
  return context;
}
