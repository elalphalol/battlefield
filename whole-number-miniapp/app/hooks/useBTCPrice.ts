'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export function useBTCPrice(updateInterval: number = 5000) {
  const [price, setPrice] = useState<number>(0);
  const [priceTimestamp, setPriceTimestamp] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    const apiSources = [
      {
        name: 'Coinbase',
        fetch: async () => {
          const response = await axios.get('https://api.coinbase.com/v2/prices/BTC-USD/spot');
          return parseFloat(response.data.data.amount);
        }
      },
      {
        name: 'Blockchain.info',
        fetch: async () => {
          const response = await axios.get('https://blockchain.info/ticker');
          return parseFloat(response.data.USD.last);
        }
      },
      {
        name: 'CoinGecko',
        fetch: async () => {
          const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
          return parseFloat(response.data.bitcoin.usd);
        }
      },
    ];

    for (const source of apiSources) {
      try {
        const fetchedPrice = await source.fetch();
        
        if (!fetchedPrice || isNaN(fetchedPrice) || fetchedPrice <= 0) {
          console.warn(`${source.name} returned invalid price:`, fetchedPrice);
          continue;
        }
        
        setPrice(fetchedPrice);
        setPriceTimestamp(Date.now());
        setError(null);
        setIsLoading(false);
        return;
      } catch (err) {
        console.warn(`${source.name} API failed:`, err);
      }
    }
    
    // All APIs failed
    setError('All price sources failed. Using last known price.');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, updateInterval);
    
    return () => clearInterval(interval);
  }, [fetchPrice, updateInterval]);

  return { price, priceTimestamp, isLoading, error, refetch: fetchPrice };
}
