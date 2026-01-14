'use client';

import { useState, useEffect, useCallback } from 'react';
import { Position, ClosedPosition, Stats } from '../lib/strategy';
import toast from 'react-hot-toast';

export function usePaperTrading(currentPrice: number) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  const [leverage, setLeverage] = useState(10);
  const [positionSize, setPositionSize] = useState(1000);
  const [stats, setStats] = useState<Stats>({
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    totalPnl: 0,
  });

  // Update P&L for all open positions
  useEffect(() => {
    if (currentPrice === 0) return;

    setPositions(prevPositions => 
      prevPositions.map(position => {
        const priceDiff = position.type === 'long' 
          ? currentPrice - position.entryPrice
          : position.entryPrice - currentPrice;
        
        const pnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage;
        const pnlDollar = (position.size * pnlPercent) / 100;

        return {
          ...position,
          currentPnl: pnlDollar,
          currentPnlPercent: pnlPercent,
        };
      })
    );
  }, [currentPrice]);

  const openPosition = useCallback((type: 'long' | 'short', coordinate: number) => {
    if (currentPrice === 0) {
      toast.error('⚠️ Waiting for price data. Please wait...');
      return;
    }

    const newPosition: Position = {
      id: Date.now(),
      type,
      entryPrice: currentPrice,
      entryTime: new Date().toLocaleTimeString(),
      entryCoordinate: coordinate,
      leverage,
      size: positionSize,
      currentPnl: 0,
      currentPnlPercent: 0,
    };

    setPositions(prev => [...prev, newPosition]);
    
    const emoji = type === 'long' ? '🟢' : '🔴';
    const army = type === 'long' ? 'GREEN ARMY' : 'RED ARMY';
    console.log(`${emoji} ${army} POSITION OPENED! Entry: $${currentPrice.toFixed(2)} | Leverage: ${leverage}x | Size: $${positionSize}`);
  }, [currentPrice, leverage, positionSize]);

  const closePosition = useCallback((positionId: number) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;

    // Calculate final PNL
    const priceDiff = position.type === 'long' 
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;
    
    const pnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage;
    const pnlDollar = (position.size * pnlPercent) / 100;

    // Create closed position
    const closedPosition: ClosedPosition = {
      ...position,
      exitPrice: currentPrice,
      exitTime: new Date().toLocaleTimeString(),
      finalPnl: pnlDollar,
      finalPnlPercent: pnlPercent,
    };

    setClosedPositions(prev => [closedPosition, ...prev].slice(0, 20));
    
    // Update stats
    setStats(prev => ({
      totalTrades: prev.totalTrades + 1,
      winningTrades: prev.winningTrades + (pnlDollar > 0 ? 1 : 0),
      losingTrades: prev.losingTrades + (pnlDollar <= 0 ? 1 : 0),
      totalPnl: prev.totalPnl + pnlDollar,
    }));

    // Remove from active positions
    setPositions(prev => prev.filter(p => p.id !== positionId));

    const emoji = pnlDollar > 0 ? '💰' : '📉';
    const result = pnlDollar > 0 ? 'PROFIT' : 'LOSS';
    console.log(`${emoji} Position closed! ${result}: $${Math.abs(pnlDollar).toFixed(2)} (${pnlPercent.toFixed(2)}%)`);
  }, [positions, currentPrice]);

  const closeAllPositions = useCallback(() => {
    positions.forEach(position => closePosition(position.id));
  }, [positions, closePosition]);

  return {
    positions,
    closedPositions,
    leverage,
    setLeverage,
    positionSize,
    setPositionSize,
    stats,
    openPosition,
    closePosition,
    closeAllPositions,
  };
}
