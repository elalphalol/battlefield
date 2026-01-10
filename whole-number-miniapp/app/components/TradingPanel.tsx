'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../config/api';

interface Trade {
  id: number;
  position_type: 'long' | 'short';
  leverage: number;
  entry_price: number;
  position_size: number;
  liquidation_price: number;
  opened_at: string;
}

interface TradingPanelProps {
  btcPrice: number;
  paperBalance: number;
  onTradeComplete: () => void;
}

export function TradingPanel({ btcPrice, paperBalance, onTradeComplete }: TradingPanelProps) {
  const { address } = useAccount();
  const [tradeType, setTradeType] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(50);
  const [positionSizePercent, setPositionSizePercent] = useState(10); // Percentage of balance
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [closingTradeId, setClosingTradeId] = useState<number | null>(null);

  // Calculate actual position size from percentage
  // NEW SYSTEM: Fees are deducted from P&L when closing, NOT when opening
  // So we just use the percentage of balance directly
  const positionSize = Math.floor((positionSizePercent / 100) * Number(paperBalance));
  
  // Calculate fee for display purposes only (will be deducted from P&L later)
  const feePercentage = leverage > 1 ? leverage * 0.1 : 0;

  useEffect(() => {
    if (address) {
      fetchOpenTrades();
      // Refresh every 10 seconds
      const interval = setInterval(fetchOpenTrades, 10000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchOpenTrades = async () => {
    if (!address) return;

    try {
      const response = await fetch(getApiUrl(`api/trades/${address}/open`));
      const data = await response.json();
      if (data.success) {
        setOpenTrades(data.trades);
      }
    } catch (error) {
      console.error('Error fetching open trades:', error);
    }
  };

  const handleOpenTrade = async () => {
    if (!address || positionSize > Number(paperBalance)) {
      alert(`Insufficient balance. Available: $${Number(paperBalance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      return;
    }

    setIsOpening(true);
    try {
      const response = await fetch(getApiUrl('api/trades/open'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          type: tradeType,
          leverage,
          size: positionSize,
          entryPrice: btcPrice
        })
      });

      const data = await response.json();
      if (data.success) {
        // Silently open position - no alert
        fetchOpenTrades();
        onTradeComplete();
      } else {
        alert(`❌ ${data.message || 'Failed to open trade'}`);
      }
    } catch (error) {
      console.error('Error opening trade:', error);
      alert('❌ Failed to open trade');
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseTrade = async (tradeId: number) => {
    if (!address) return;

    setClosingTradeId(tradeId);
    try {
      const response = await fetch(getApiUrl('api/trades/close'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId,
          exitPrice: btcPrice
        })
      });

      const data = await response.json();
      if (data.success) {
        // Silently close position - no alert
        fetchOpenTrades();
        onTradeComplete();
      } else {
        alert(`❌ ${data.message || 'Failed to close trade'}`);
      }
    } catch (error) {
      console.error('Error closing trade:', error);
      alert('❌ Failed to close trade');
    } finally {
      setClosingTradeId(null);
    }
  };

  const calculateLiquidationPrice = () => {
    if (tradeType === 'long') {
      return btcPrice * (1 - 1 / leverage);
    } else {
      return btcPrice * (1 + 1 / leverage);
    }
  };

  const calculatePnL = (trade: Trade) => {
    const entryPrice = Number(trade.entry_price);
    const collateral = Number(trade.position_size); // This is the collateral/margin
    const tradeLeverage = Number(trade.leverage);
    
    // Calculate leveraged position size
    const leveragedPositionSize = collateral * tradeLeverage;
    
    // Calculate price-based P&L on the leveraged position
    const priceChange = trade.position_type === 'long'
      ? btcPrice - entryPrice
      : entryPrice - btcPrice;
    
    // P&L is based on leveraged position size and price change percentage
    const priceChangePercentage = priceChange / entryPrice;
    const pnlFromPriceMovement = priceChangePercentage * leveragedPositionSize;
    
    // Include the trading fee in the PNL so users see the break-even needed
    // Fee was paid upfront, so we subtract it to show real net P&L
    const feePercentage = tradeLeverage > 1 ? tradeLeverage * 0.1 : 0;
    const tradingFee = (feePercentage / 100) * collateral;
    const netPnl = pnlFromPriceMovement - tradingFee;
    
    // Calculate percentage return including fee impact
    const percentageReturn = (netPnl / collateral) * 100;
    
    return { 
      pnl: netPnl, 
      percentage: percentageReturn,
      leveragedPosition: leveragedPositionSize 
    };
  };

  const isNearLiquidation = (trade: Trade) => {
    const { percentage } = calculatePnL(trade);
    return percentage <= -90; // Warning at -90%
  };

  if (!address) {
    return (
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-2">📈 Trading Panel</h3>
        <p className="text-gray-400">Connect wallet to start trading</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Open New Position */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-yellow-400 mb-4">📈 Open Position</h3>

        {/* Trade Type Selection */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => setTradeType('long')}
            className={`p-4 rounded-lg border-2 font-bold transition-all ${
              tradeType === 'long'
                ? 'border-green-500 bg-green-900/30 text-green-400'
                : 'border-slate-600 bg-slate-700/30 text-gray-400'
            }`}
          >
            📈 LONG
          </button>
          <button
            onClick={() => setTradeType('short')}
            className={`p-4 rounded-lg border-2 font-bold transition-all ${
              tradeType === 'short'
                ? 'border-red-500 bg-red-900/30 text-red-400'
                : 'border-slate-600 bg-slate-700/30 text-gray-400'
            }`}
          >
            📉 SHORT
          </button>
        </div>

        {/* Leverage Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Leverage: <span className="text-yellow-400">{leverage}x</span>
          </label>
          
          {/* Quick Buttons */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[10, 50, 100, 200].map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`py-2 rounded border font-bold transition-all ${
                  leverage === lev
                    ? 'border-yellow-500 bg-yellow-900/30 text-yellow-400'
                    : 'border-slate-600 bg-slate-700/30 text-gray-400 hover:border-slate-500'
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
          
          {/* Leverage Slider */}
          <div>
            <input
              type="range"
              min="1"
              max="200"
              step="1"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1x</span>
              <span className="text-gray-500">Custom: {leverage}x</span>
              <span>200x</span>
            </div>
          </div>
        </div>

        {/* Position Size */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Position Size: <span className="text-cyan-400">{positionSizePercent}%</span> <span className="text-gray-500">(${positionSize.toLocaleString()})</span>
          </label>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={positionSizePercent}
            onChange={(e) => setPositionSizePercent(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>1%</span>
            <span className="text-gray-500">{positionSizePercent}% of balance</span>
            <span>100%</span>
          </div>
        </div>

        {/* Trade Summary */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Entry Price:</span>
            <span className="text-white font-bold">${btcPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Liquidation Price:</span>
            <span className="text-red-400 font-bold">${calculateLiquidationPrice().toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Available Balance:</span>
            <span className="text-green-400 font-bold">${Number(paperBalance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
        </div>

        {/* Open Button */}
        <button
          onClick={handleOpenTrade}
          disabled={isOpening || positionSize > Number(paperBalance)}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            tradeType === 'long'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500'
          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isOpening ? '⏳ Opening...' : `Open ${tradeType.toUpperCase()} ${leverage}x`}
        </button>
      </div>

      {/* Open Positions */}
      {openTrades.length > 0 && (
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">📊 Open Positions</h3>
          
          <div className="space-y-3">
            {openTrades.map((trade) => {
              const { pnl, percentage } = calculatePnL(trade);
              const isLiquidationWarning = isNearLiquidation(trade);
              
              return (
                <div
                  key={trade.id}
                  className={`border-2 rounded-lg p-4 ${
                    isLiquidationWarning
                      ? 'border-red-500 bg-red-900/20 animate-pulse'
                      : pnl >= 0
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-slate-600 bg-slate-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${trade.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.position_type === 'long' ? '📈' : '📉'}
                      </span>
                      <span className="font-bold text-white">
                        {trade.position_type.toUpperCase()} {trade.leverage}x
                      </span>
                    </div>
                    <div className={`text-lg font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      <span className="text-sm ml-1">({percentage >= 0 ? '+' : ''}{percentage.toFixed(1)}%)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                    <div>Entry: ${Number(trade.entry_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div>Current: ${btcPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div>Collateral: ${Number(trade.position_size).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div>Position: ${(trade.position_size * trade.leverage).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div className="col-span-2">Liq: ${Number(trade.liquidation_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </div>

                  {isLiquidationWarning && (
                    <div className="bg-red-500/20 border border-red-500 rounded p-2 mb-3 text-xs text-red-300 text-center font-bold">
                      ⚠️ LIQUIDATION WARNING! Close position now!
                    </div>
                  )}

                  <button
                    onClick={() => handleCloseTrade(trade.id)}
                    disabled={closingTradeId === trade.id}
                    className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 rounded font-semibold transition-all disabled:opacity-50"
                  >
                    {closingTradeId === trade.id ? '⏳ Closing...' : 'Close Position'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
