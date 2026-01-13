'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../config/api';
import sdk from '@farcaster/frame-sdk';

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
  walletAddress?: string; // Add optional wallet address prop
}

export function TradingPanel({ btcPrice, paperBalance, onTradeComplete, walletAddress }: TradingPanelProps) {
  const { address: wagmiAddress } = useAccount();
  // Use passed wallet address if available, otherwise fall back to wagmi
  const address = walletAddress || wagmiAddress;
  const [tradeType, setTradeType] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(50);
  const [positionSizePercent, setPositionSizePercent] = useState(0); // Percentage of balance - starts at 0
  const [inputValue, setInputValue] = useState(''); // Separate state for input
  const [isTyping, setIsTyping] = useState(false); // Track if user is actively typing
  const [isManualInput, setIsManualInput] = useState(false); // Track if user manually entered a value
  const [openTrades, setOpenTrades] = useState<Trade[]>([]);
  const [isOpening, setIsOpening] = useState(false);
  const [closingTradeId, setClosingTradeId] = useState<number | null>(null);
  const [userData, setUserData] = useState<{ army: 'bears' | 'bulls'; username?: string } | null>(null);
  const [addingCollateralTradeId, setAddingCollateralTradeId] = useState<number | null>(null);
  const [collateralAmount, setCollateralAmount] = useState('');

  // Calculate actual position size from percentage
  // NEW SYSTEM: Fees are deducted from P&L when closing, NOT when opening
  // So we just use the percentage of balance directly
  // Only show decimals if user manually input them, otherwise round to whole numbers
  const positionSize = isManualInput 
    ? Number(((positionSizePercent / 100) * Number(paperBalance)).toFixed(2))
    : Math.floor((positionSizePercent / 100) * Number(paperBalance));
  
  // Update input value when position size changes from slider (but not when typing)
  useEffect(() => {
    if (!isTyping) {
      setInputValue(positionSize.toString());
    }
  }, [positionSize, isTyping]);
  
  // Calculate fee for display purposes only (will be deducted from P&L later)
  const feePercentage = leverage > 1 ? leverage * 0.05 : 0;

  useEffect(() => {
    if (address) {
      fetchOpenTrades();
      fetchUserData();
      // Refresh every 10 seconds
      const interval = setInterval(fetchOpenTrades, 10000);
      return () => clearInterval(interval);
    }
  }, [address]);

  const fetchUserData = async () => {
    if (!address) return;
    try {
      const response = await fetch(getApiUrl(`api/users/${address}`));
      const data = await response.json();
      if (data.success) {
        setUserData(data.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

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
    // Check position limit
    if (openTrades.length >= 10) {
      alert('❌ Maximum 10 open positions allowed. Please close some positions first.');
      return;
    }

    // Check minimum position size
    if (positionSize <= 0 || positionSize < 1) {
      alert('❌ Please enter a position size. Minimum: $1');
      return;
    }

    if (!address || positionSize > Number(paperBalance)) {
      alert(`Insufficient balance. Available: $${Number(paperBalance).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
      return;
    }

    setIsOpening(true);
    try {
      console.log('🚀 Opening trade with:', {
        walletAddress: address,
        type: tradeType,
        leverage,
        size: positionSize,
        entryPrice: btcPrice
      });

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

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);

      if (data.success) {
        // Silently open position - no alert
        console.log('✅ Trade opened successfully');
        fetchOpenTrades();
        onTradeComplete();
      } else {
        console.error('❌ Trade failed:', data.message);
        alert(`❌ ${data.message || 'Failed to open trade'}`);
      }
    } catch (error) {
      console.error('💥 Error opening trade:', error);
      alert(`❌ Failed to open trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsOpening(false);
    }
  };

  const handleCloseTrade = async (tradeId: number) => {
    if (!address) return;

    setClosingTradeId(tradeId);
    try {
      console.log('🔄 Closing trade:', { tradeId, exitPrice: btcPrice });

      const response = await fetch(getApiUrl('api/trades/close'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId,
          exitPrice: btcPrice
        })
      });

      console.log('📡 Close response status:', response.status);
      const data = await response.json();
      console.log('📊 Close response data:', data);

      if (data.success) {
        // Silently close position - no alert
        console.log('✅ Trade closed successfully');
        fetchOpenTrades();
        onTradeComplete();
      } else {
        console.error('❌ Close failed:', data.message);
        alert(`❌ ${data.message || 'Failed to close trade'}`);
      }
    } catch (error) {
      console.error('💥 Error closing trade:', error);
      alert(`❌ Failed to close trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const feePercentage = tradeLeverage > 1 ? tradeLeverage * 0.05 : 0;
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

  const handleAddCollateral = async (tradeId: number) => {
    if (!address) return;

    const amount = prompt('Enter additional collateral amount (in $):');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      if (amount !== null) { // Only show error if user didn't cancel
        alert('❌ Please enter a valid amount greater than 0');
      }
      return;
    }

    const additionalCollateral = Number(amount);
    
    if (additionalCollateral > Number(paperBalance)) {
      alert(`❌ Insufficient balance. Available: $${Number(paperBalance).toFixed(2)}`);
      return;
    }

    setAddingCollateralTradeId(tradeId);
    try {
      const response = await fetch(getApiUrl('api/trades/add-collateral'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId,
          additionalCollateral,
          walletAddress: address,
          currentPrice: btcPrice
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Added $${additionalCollateral.toFixed(2)} at $${btcPrice.toFixed(2)}!\n\n` +
              `Old Entry: $${data.oldEntryPrice.toFixed(2)}\n` +
              `New Entry: $${data.newEntryPrice.toFixed(2)} (avg)\n` +
              `Old Liq: $${data.oldLiquidationPrice.toFixed(2)}\n` +
              `New Liq: $${data.newLiquidationPrice.toFixed(2)}\n` +
              `Leverage: ${data.leverage}x (unchanged)`);
        fetchOpenTrades();
        onTradeComplete();
      } else {
        alert(`❌ ${data.message || 'Failed to add collateral'}`);
      }
    } catch (error) {
      console.error('Error adding collateral:', error);
      alert(`❌ Failed to add collateral: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAddingCollateralTradeId(null);
    }
  };

  const handleCastOpenPosition = async (trade: Trade, pnl: number, percentage: number) => {
    const army = userData?.army || 'bulls';
    const armyEmoji = army === 'bears' ? '🐻' : '🐂';
    const websiteUrl = window.location.origin;
    const username = userData?.username || address?.slice(0, 8);
    
    // Create params for share card image
    const params = new URLSearchParams({
      army,
      type: trade.position_type,
      leverage: trade.leverage.toString(),
      pnl: pnl.toFixed(2),
      pnlPercent: percentage.toFixed(1),
      username: username || 'Trader',
      v: Date.now().toString()
    });
    const imageUrl = `${websiteUrl}/api/share-card?${params.toString()}`;
    
    // Open position text
    const statusText = pnl >= 0 ? `up +$${Math.abs(pnl).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `down -$${Math.abs(pnl).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    const shareText = `${armyEmoji} I have an OPEN position on @btcbattle!\n\n${trade.position_type.toUpperCase()} ${trade.leverage}x | Currently ${statusText} (${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%)\n\n💭 Should I close it?\n\n⚔️ Bears vs Bulls`;

    // Use Farcaster Frame SDK to open composer
    try {
      const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(imageUrl)}`;
      await sdk.actions.openUrl(castUrl);
    } catch (error) {
      console.error('Error casting to Farcaster:', error);
      // Fallback: try copying to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('✅ Cast text copied to clipboard!');
      } catch (clipError) {
        alert('❌ Unable to create cast. Please try again.');
      }
    }
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

        {/* Trade Type Selection - CLEAN TABS */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setTradeType('long')}
            className={`py-5 px-6 rounded-xl border-4 font-bold text-xl transition-all transform hover:scale-105 ${
              tradeType === 'long'
                ? 'border-green-500 bg-green-600 text-white shadow-lg shadow-green-500/50'
                : 'border-slate-600 bg-slate-700/30 text-gray-400 hover:border-green-400'
            }`}
          >
            LONG
          </button>
          <button
            onClick={() => setTradeType('short')}
            className={`py-5 px-6 rounded-xl border-4 font-bold text-xl transition-all transform hover:scale-105 ${
              tradeType === 'short'
                ? 'border-red-500 bg-red-600 text-white shadow-lg shadow-red-500/50'
                : 'border-slate-600 bg-slate-700/30 text-gray-400 hover:border-red-400'
            }`}
          >
            SHORT
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
            Position Size: <span className="text-cyan-400">${positionSize.toLocaleString()}</span>
          </label>
          
          {/* Direct Dollar Input */}
          <div className="mb-3">
            <input
              type="text"
              value={inputValue}
              onFocus={() => setIsTyping(true)}
              onChange={(e) => {
                const value = e.target.value;
                // Allow digits and decimal point, max 2 decimal places
                if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                  setInputValue(value);
                  const numValue = parseFloat(value) || 0;
                  const maxBalance = Number(paperBalance);
                  // Mark as manual input if user entered decimals
                  if (value.includes('.')) {
                    setIsManualInput(true);
                  } else {
                    setIsManualInput(false);
                  }
                  if (numValue > 0 && numValue <= maxBalance) {
                    // Calculate exact percentage without rounding to avoid drift
                    const exactPercent = (numValue / maxBalance) * 100;
                    setPositionSizePercent(exactPercent);
                  } else if (numValue === 0 || value === '') {
                    setPositionSizePercent(0);
                  }
                }
              }}
              onBlur={() => {
                setIsTyping(false);
                // Ensure value is valid on blur
                const numValue = parseFloat(inputValue) || 0;
                const maxBalance = Number(paperBalance);
                if (numValue < 0) {
                  setPositionSizePercent(0);
                  setInputValue('0');
                  setIsManualInput(false);
                } else if (numValue > maxBalance) {
                  setPositionSizePercent(100);
                  setInputValue(maxBalance.toFixed(2));
                  setIsManualInput(true);
                }
              }}
              className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-cyan-500 focus:outline-none"
              placeholder="Enter amount in $ (e.g., 25.16)"
            />
          </div>
          
          {/* Percentage Slider */}
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={positionSizePercent}
            onChange={(e) => {
              setPositionSizePercent(Number(e.target.value));
              setIsManualInput(false); // Clear manual input flag when using slider
            }}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span className="text-gray-500">{positionSizePercent.toFixed(2)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Trade Summary */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Collateral:</span>
            <span className="text-cyan-400 font-bold">${positionSize.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Size ({leverage}x):</span>
            <span className="text-purple-400 font-bold">${(positionSize * leverage).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
          </div>
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

        {/* Open Button - ENLARGED */}
        <button
          onClick={handleOpenTrade}
          disabled={isOpening || positionSize < 1 || positionSize > Number(paperBalance)}
          className={`w-full py-6 rounded-xl font-bold text-2xl transition-all transform hover:scale-105 shadow-xl ${
            tradeType === 'long'
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/50'
              : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/50'
          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isOpening ? '⏳ Opening...' : 
           positionSize < 1 ? 'Enter Position Size' :
           `🚀 OPEN ${tradeType.toUpperCase()} ${leverage}x`}
        </button>
      </div>

      {/* Open Positions */}
      {openTrades.length > 0 && (
        <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-4">
          <h3 className="text-xl font-bold text-yellow-400 mb-4">📊 Open Positions ({openTrades.length}/10)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {openTrades.map((trade) => {
              const { pnl, percentage } = calculatePnL(trade);
              const isLiquidationWarning = isNearLiquidation(trade);
              
              return (
                <div
                  key={trade.id}
                  className={`border-2 rounded-lg p-3 ${
                    isLiquidationWarning
                      ? 'border-red-500 bg-red-900/20 animate-pulse'
                      : pnl >= 0
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-red-500 bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-base ${trade.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.position_type === 'long' ? '📈' : '📉'}
                      </span>
                      <span className={`font-bold text-sm ${trade.position_type === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.position_type.toUpperCase()} {trade.leverage}x
                      </span>
                    </div>
                    <div className={`font-bold text-sm text-right ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pnl >= 0 ? '+' : ''}${pnl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      <div className="text-xs">
                        ({percentage >= 0 ? '+' : ''}{percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                    <div>Entry: ${Number(trade.entry_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div>Now: ${btcPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                    <div>Size: ${Number(trade.position_size).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                    <div>Total: ${(Number(trade.position_size) * Number(trade.leverage)).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                    <div className="col-span-2">Liq: ${Number(trade.liquidation_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                  </div>

                  {isLiquidationWarning && (
                    <div className="bg-red-500/20 border border-red-500 rounded px-2 py-1 mb-2 text-xs text-red-300 text-center font-bold">
                      ⚠️ LIQUIDATION WARNING!
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleAddCollateral(trade.id)}
                      disabled={addingCollateralTradeId === trade.id}
                      className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded text-xs font-semibold transition-all disabled:opacity-50"
                      title="Add collateral to lower liquidation price"
                    >
                      {addingCollateralTradeId === trade.id ? '...' : '+Margin'}
                    </button>
                    <button
                      onClick={() => handleCloseTrade(trade.id)}
                      disabled={closingTradeId === trade.id}
                      className="bg-slate-600 hover:bg-slate-500 text-white py-2 rounded text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {closingTradeId === trade.id ? '...' : 'Close'}
                    </button>
                    <button
                      onClick={() => handleCastOpenPosition(trade, pnl, percentage)}
                      className="bg-purple-600 hover:bg-purple-500 text-white py-2 rounded text-xs font-semibold transition-all flex items-center justify-center gap-1"
                    >
                      🟪 Cast
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
