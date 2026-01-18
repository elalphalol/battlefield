'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useBTCPrice, PriceDirection } from '../hooks/useBTCPrice';
import { INTERVALS } from '../constants/time';

interface PriceContextType {
  btcPrice: number;
  priceTimestamp: number;
  isLoading: boolean;
  error: string | null;
  wholeNumber: number;
  coordinate: number;
  priceDirection: PriceDirection;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export function PriceProvider({ children }: { children: ReactNode }) {
  const { price: btcPrice, priceTimestamp, isLoading, error, priceDirection } = useBTCPrice(INTERVALS.PRICE_UPDATE);

  // Calculate whole number and coordinate
  const wholeNumber = Math.floor(btcPrice / 1000) * 1000;
  const coordinate = Math.round(btcPrice - wholeNumber);

  return (
    <PriceContext.Provider value={{ btcPrice, priceTimestamp, isLoading, error, wholeNumber, coordinate, priceDirection }}>
      {children}
    </PriceContext.Provider>
  );
}

export function usePrice() {
  const context = useContext(PriceContext);
  if (!context) {
    throw new Error('usePrice must be used within PriceProvider');
  }
  return context;
}
