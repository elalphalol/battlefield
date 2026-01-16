'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { getApiUrl } from '../config/api';
import sdk from '@farcaster/miniapp-sdk';
import toast from 'react-hot-toast';
import { TradeResultToast } from './TradeResultToast';

// Farcaster icon component
const FarcasterIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <img
    src="/farcaster-icon.svg"
    alt=""
    className={className}
  />
);

interface Trade {
  id: number;
  position_type: 'long' | 'short';
  leverage: number;
  entry_price: number;
  position_size: number;
  liquidation_price: number;
  stop_loss: number | null;
  opened_at: string;
}

interface StoppedTradeInfo {
  pnl: number;
  isLiquidated: boolean;
  isStopLoss: boolean;
}

interface TradingPanelProps {
  btcPrice: number;
  paperBalance: number;
  onTradeComplete: () => void;
  walletAddress?: string; // Add optional wallet address prop
  stoppedTradeInfo?: StoppedTradeInfo | null; // Info from auto-liquidation/stop loss
  onStoppedTradeShown?: () => void; // Callback when notification is shown
}

export function TradingPanel({ btcPrice, paperBalance, onTradeComplete, walletAddress, stoppedTradeInfo, onStoppedTradeShown }: TradingPanelProps) {
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
  const [showCollateralModal, setShowCollateralModal] = useState(false);
  const [collateralAmount, setCollateralAmount] = useState('');
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);

  // Stop loss states
  const [stopLossEnabled, setStopLossEnabled] = useState(false);
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [showStopLossModal, setShowStopLossModal] = useState(false);
  const [editingStopLossTrade, setEditingStopLossTrade] = useState<Trade | null>(null);
  const [editStopLossPrice, setEditStopLossPrice] = useState('');
  const [updatingStopLossTradeId, setUpdatingStopLossTradeId] = useState<number | null>(null);

  // Trade result toast state
  const [showResultToast, setShowResultToast] = useState(false);
  const [resultPnl, setResultPnl] = useState(0);
  const [resultIsLiquidated, setResultIsLiquidated] = useState(false);
  const [resultIsStopLoss, setResultIsStopLoss] = useState(false);

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

  // Handle stopped/liquidated trade notifications from parent
  useEffect(() => {
    if (stoppedTradeInfo) {
      setResultPnl(stoppedTradeInfo.pnl);
      setResultIsLiquidated(stoppedTradeInfo.isLiquidated);
      setResultIsStopLoss(stoppedTradeInfo.isStopLoss);
      setShowResultToast(true);
      // Notify parent that we've shown the notification
      if (onStoppedTradeShown) {
        onStoppedTradeShown();
      }
    }
  }, [stoppedTradeInfo, onStoppedTradeShown]);

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

  const handleOpenTrade = async (type: 'long' | 'short') => {
    // Check position limit
    if (openTrades.length >= 10) {
      toast.error('❌ Maximum 10 open positions allowed. Please close some positions first.');
      return;
    }

    // Check minimum position size
    if (positionSize <= 0 || positionSize < 1) {
      toast.error('❌ Please enter a position size. Minimum: $1');
      return;
    }

    if (!address || positionSize > Number(paperBalance)) {
      toast.error(`Insufficient balance. Available: $${Math.round(Number(paperBalance)).toLocaleString('en-US')}`);
      return;
    }

    setTradeType(type);
    setIsOpening(true);
    try {
      const stopLoss = stopLossEnabled && stopLossPrice ? Number(stopLossPrice) : null;

      console.log('🚀 Opening trade with:', {
        walletAddress: address,
        type: type,
        leverage,
        size: positionSize,
        entryPrice: btcPrice,
        stopLoss
      });

      const response = await fetch(getApiUrl('api/trades/open'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          type: type,
          leverage,
          size: positionSize,
          entryPrice: btcPrice,
          stopLoss
        })
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📊 Response data:', data);

      if (data.success) {
        console.log('✅ Trade opened successfully');
        // Show confirmation toast with trade details
        const emoji = type === 'long' ? '🐂' : '🐻';
        const direction = type === 'long' ? 'LONG' : 'SHORT';
        toast.success(`${emoji} ${direction} ${leverage}x opened! $${positionSize.toLocaleString()}`);
        // Reset stop loss fields and position size
        setStopLossEnabled(false);
        setStopLossPrice('');
        setPositionSizePercent(0);
        setInputValue('0');
        setIsManualInput(false);
        fetchOpenTrades();
        onTradeComplete();
      } else {
        console.error('❌ Trade failed:', data.message);
        toast.error(`❌ ${data.message || 'Failed to open trade'}`);
      }
    } catch (error) {
      console.error('💥 Error opening trade:', error);
      toast.error(`❌ Failed to open trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        console.log('✅ Trade closed successfully');

        // Show trade result toast
        const closedPnl = data.pnl || 0;
        const wasLiquidated = data.status === 'liquidated';
        setResultPnl(closedPnl);
        setResultIsLiquidated(wasLiquidated);
        setShowResultToast(true);

        fetchOpenTrades();
        onTradeComplete();
      } else {
        console.error('❌ Close failed:', data.message);
        toast.error(`❌ ${data.message || 'Failed to close trade'}`);
      }
    } catch (error) {
      console.error('💥 Error closing trade:', error);
      toast.error(`❌ Failed to close trade: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  const openCollateralModal = (tradeId: number) => {
    setSelectedTradeId(tradeId);
    setCollateralAmount('');
    setShowCollateralModal(true);
  };

  const handleAddCollateral = async () => {
    if (!address || !selectedTradeId) return;

    const additionalCollateral = Number(collateralAmount);
    
    if (!additionalCollateral || additionalCollateral <= 0) {
      toast.error('❌ Enter valid amount');
      return;
    }
    
    if (additionalCollateral > Number(paperBalance)) {
      toast.error(`❌ Insufficient balance: $${Number(paperBalance).toFixed(0)}`);
      return;
    }

    setAddingCollateralTradeId(selectedTradeId);
    setShowCollateralModal(false);
    
    try {
      const response = await fetch(getApiUrl('api/trades/add-collateral'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId: selectedTradeId,
          additionalCollateral,
          walletAddress: address,
          currentPrice: btcPrice
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`+$${additionalCollateral.toFixed(0)} added! New Liq: $${data.newLiquidationPrice.toFixed(0)}`);
        fetchOpenTrades();
        onTradeComplete();
      } else {
        toast.error(`❌ ${data.message || 'Failed'}`);
      }
    } catch (error) {
      console.error('Error adding collateral:', error);
      toast.error(`❌ Failed to add margin`);
    } finally {
      setAddingCollateralTradeId(null);
      setSelectedTradeId(null);
    }
  };

  const openStopLossModal = (trade: Trade) => {
    setEditingStopLossTrade(trade);
    setEditStopLossPrice(trade.stop_loss ? trade.stop_loss.toString() : '');
    setShowStopLossModal(true);
  };

  const handleUpdateStopLoss = async (forceRemove: boolean = false) => {
    if (!address || !editingStopLossTrade) return;

    const newStopLoss = forceRemove ? null : (editStopLossPrice ? Number(editStopLossPrice) : null);
    const tradeId = editingStopLossTrade.id; // Capture before any state changes

    setUpdatingStopLossTradeId(tradeId);
    setShowStopLossModal(false);
    setEditingStopLossTrade(null); // Clear early so modal closes

    try {
      const response = await fetch(getApiUrl('api/trades/update-stop-loss'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeId: tradeId,
          stopLoss: newStopLoss,
          walletAddress: address
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(newStopLoss ? `🛑 Stop loss set at $${newStopLoss.toLocaleString()}` : '✓ Stop loss removed');
        // Update local state immediately using the server response
        const updatedTrade = data.trade;
        setOpenTrades(prevTrades => {
          const newTrades = prevTrades.map(trade =>
            trade.id === tradeId
              ? { ...trade, stop_loss: updatedTrade.stop_loss }
              : trade
          );
          return [...newTrades]; // Force new array reference
        });
      } else {
        toast.error(`❌ ${data.message || 'Failed to update stop loss'}`);
      }
    } catch (error) {
      console.error('Error updating stop loss:', error);
      toast.error('❌ Failed to update stop loss');
    } finally {
      setUpdatingStopLossTradeId(null);
    }
  };

  const handleCastOpenPosition = async (trade: Trade, pnl: number, percentage: number) => {
    const army = userData?.army || 'bulls';
    const armyEmoji = army === 'bears' ? '🐻' : '🐂';
    const websiteUrl = window.location.origin;
    const username = userData?.username || address?.slice(0, 8);

    // Check if we're in Farcaster miniapp context
    let isInMiniApp = false;
    try {
      const context = await sdk.context;
      isInMiniApp = !!context?.user?.fid;
    } catch {
      isInMiniApp = false;
    }

    // If not in miniapp, open Farcaster referral link in new tab
    if (!isInMiniApp) {
      window.open('https://farcaster.xyz/~/code/C46NY7', '_blank');
      return;
    }

    // Create params for share card image
    const params = new URLSearchParams({
      army,
      type: trade.position_type,
      leverage: trade.leverage.toString(),
      pnl: Math.round(pnl).toString(),
      pnlPercent: Math.round(percentage).toString(),
      username: username || 'Trader',
      v: Date.now().toString()
    });
    const imageUrl = `${websiteUrl}/api/share-card?${params.toString()}`;

    // Open position text
    const statusText = pnl >= 0 ? `up +$${Math.round(Math.abs(pnl)).toLocaleString('en-US')}` : `down -$${Math.round(Math.abs(pnl)).toLocaleString('en-US')}`;
    const shareText = `${armyEmoji} I have an OPEN position on @btcbattle!\n\n${trade.position_type.toUpperCase()} ${trade.leverage}x | Currently ${statusText} (${percentage >= 0 ? '+' : ''}${Math.round(percentage)}%)\n\n💭 Should I close it?\n\n⚔️ Bears vs Bulls`;

    // Track the cast for mission progress
    try {
      await fetch(getApiUrl('api/missions/complete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, missionKey: 'cast_result' })
      });
    } catch (err) {
      console.error('Failed to track cast mission:', err);
    }

    // Use Farcaster Frame SDK to open composer
    try {
      const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=${encodeURIComponent(imageUrl)}`;
      await sdk.actions.openUrl(castUrl);
      toast.success('🎯 Mission done! Claim $500 in Missions tab');
    } catch (error) {
      console.error('Error casting to Farcaster:', error);
      // Fallback: open Farcaster referral link
      window.open('https://farcaster.xyz/~/code/C46NY7', '_blank');
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
      {/* Trade Result Toast */}
      <TradeResultToast
        isVisible={showResultToast}
        pnl={resultPnl}
        isLiquidated={resultIsLiquidated}
        isStopLoss={resultIsStopLoss}
        onDismiss={() => setShowResultToast(false)}
      />

      {/* Open New Position */}
      <div className="bg-slate-800 border-2 border-slate-700 rounded-lg p-6">
        {/* LONG/SHORT Buttons - Main triggers at top */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => handleOpenTrade('long')}
            disabled={isOpening || positionSize < 1 || positionSize > Number(paperBalance)}
            className="w-full py-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/50 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOpening && tradeType === 'long' ? '...' : `LONG ${leverage}x`}
          </button>
          <button
            onClick={() => handleOpenTrade('short')}
            disabled={isOpening || positionSize < 1 || positionSize > Number(paperBalance)}
            className="w-full py-6 rounded-xl font-bold text-xl transition-all transform hover:scale-105 shadow-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-red-500/50 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOpening && tradeType === 'short' ? '...' : `SHORT ${leverage}x`}
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
              className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              style={{ WebkitAppearance: 'none' }}
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
            className="w-full h-4 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            style={{ WebkitAppearance: 'none' }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span>
            <span className="text-gray-500">{Math.round(positionSizePercent)}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Stop Loss (Optional) */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setStopLossEnabled(!stopLossEnabled)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                stopLossEnabled ? 'bg-orange-500 border-orange-500' : 'border-slate-500 hover:border-slate-400'
              }`}
            >
              {stopLossEnabled && <span className="text-white text-xs">✓</span>}
            </button>
            <label className="text-sm font-semibold text-gray-300 cursor-pointer" onClick={() => setStopLossEnabled(!stopLossEnabled)}>
              Stop Loss <span className="text-gray-500">(optional)</span>
            </label>
          </div>

          {stopLossEnabled && (
            <div className="space-y-2">
              {/* Quick Stop Loss Buttons - Based on PnL % loss */}
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((pnlLossPercent) => {
                  // Calculate price that would cause this PnL loss
                  // PnL% = priceChange% * leverage
                  // priceChange% = pnlLossPercent / leverage
                  const priceChangePercent = pnlLossPercent / leverage;
                  const slPrice = tradeType === 'long'
                    ? Math.round(btcPrice * (1 - priceChangePercent / 100))
                    : Math.round(btcPrice * (1 + priceChangePercent / 100));

                  // Disable if this stop loss would trigger instantly due to fee
                  // Fee = leverage * 0.05% of collateral (e.g., 200x = 10% fee)
                  const currentFeePercent = leverage * 0.05;
                  const isDisabled = pnlLossPercent <= currentFeePercent;

                  return (
                    <button
                      key={pnlLossPercent}
                      onClick={() => !isDisabled && setStopLossPrice(slPrice.toString())}
                      disabled={isDisabled}
                      className={`py-1.5 rounded border text-xs font-semibold transition-all ${
                        isDisabled
                          ? 'border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed'
                          : stopLossPrice === slPrice.toString()
                          ? 'border-orange-500 bg-orange-900/30 text-orange-400'
                          : 'border-slate-600 bg-slate-700/30 text-gray-400 hover:border-slate-500'
                      }`}
                      title={isDisabled ? `Fee is ${currentFeePercent.toFixed(0)}% - stop loss would trigger instantly` : ''}
                    >
                      -{pnlLossPercent}%
                    </button>
                  );
                })}
              </div>
              {feePercentage >= 5 && (
                <p className="text-xs text-yellow-500">
                  ⚠️ Fee: {feePercentage.toFixed(0)}% - greyed options would trigger instantly
                </p>
              )}
              <input
                type="number"
                inputMode="decimal"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                placeholder={tradeType === 'long' ? `Below $${Math.round(btcPrice).toLocaleString()}` : `Above $${Math.round(btcPrice).toLocaleString()}`}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-orange-500/50 focus:border-orange-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500">
                Stop loss at PnL % loss (fee: {feePercentage.toFixed(1)}%)
              </p>
            </div>
          )}
        </div>

        {/* Trade Summary */}
        <div className="bg-slate-700/50 rounded-lg p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Collateral:</span>
            <span className="text-cyan-400 font-bold">${Math.round(positionSize).toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Size ({leverage}x):</span>
            <span className="text-purple-400 font-bold">${Math.round(positionSize * leverage).toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Entry Price:</span>
            <span className="text-white font-bold">${Math.round(btcPrice).toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Liquidation Price:</span>
            <span className="text-red-400 font-bold">${Math.round(calculateLiquidationPrice()).toLocaleString('en-US')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Available Balance:</span>
            <span className="text-green-400 font-bold">${Math.round(Number(paperBalance)).toLocaleString('en-US')}</span>
          </div>
        </div>

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
                  key={`${trade.id}-${trade.stop_loss ?? 'none'}`}
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
                      {pnl >= 0 ? '+' : ''}${Math.round(pnl).toLocaleString('en-US')}
                      <div className="text-xs">
                        ({percentage >= 0 ? '+' : ''}{Math.round(percentage)}%)
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-3">
                    <div>Entry: ${Math.round(Number(trade.entry_price)).toLocaleString('en-US')}</div>
                    <div>Now: ${Math.round(btcPrice).toLocaleString('en-US')}</div>
                    <div>Size: ${Math.round(Number(trade.position_size)).toLocaleString('en-US')}</div>
                    <div>Total: ${Math.round(Number(trade.position_size) * Number(trade.leverage)).toLocaleString('en-US')}</div>
                    <div>Liq: ${Math.round(Number(trade.liquidation_price)).toLocaleString('en-US')}</div>
                    <div
                      onClick={() => openStopLossModal(trade)}
                      className={`cursor-pointer hover:text-orange-400 transition-colors underline decoration-dashed underline-offset-2 ${trade.stop_loss ? 'text-green-400 decoration-green-400/50' : 'text-orange-400 decoration-orange-400/50'}`}
                      title="Click to set/edit stop loss"
                    >
                      {trade.stop_loss ? '🟢' : '🔴'} SL: {trade.stop_loss ? `$${Math.round(Number(trade.stop_loss)).toLocaleString('en-US')}` : <span className="text-orange-400 font-semibold">Click to set</span>}
                    </div>
                  </div>

                  {isLiquidationWarning && (
                    <div className="bg-red-500/20 border border-red-500 rounded px-2 py-1 mb-2 text-xs text-red-300 text-center font-bold">
                      ⚠️ LIQUIDATION WARNING!
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openCollateralModal(trade.id)}
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
                      <FarcasterIcon className="w-4 h-4" /> Cast
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Collateral Modal */}
      {showCollateralModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border-2 border-blue-500 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-4">Add Margin</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Amount ($)</label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={collateralAmount}
                onChange={(e) => setCollateralAmount(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-lg"
                placeholder="100"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">Balance: ${Number(paperBalance).toFixed(0)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCollateralModal(false)}
                className="bg-slate-600 hover:bg-slate-500 text-white py-3 rounded font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCollateral}
                className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-semibold transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stop Loss Modal */}
      {showStopLossModal && editingStopLossTrade && (() => {
        // Calculate current PnL for this trade using the same function as position display
        const entryPrice = Number(editingStopLossTrade.entry_price);
        const tradeLeverage = Number(editingStopLossTrade.leverage);
        const { percentage: currentPnlPercent } = calculatePnL(editingStopLossTrade);
        const isInProfit = currentPnlPercent > 0;

        // Check if entry price SL would trigger instantly (only valid when in profit)
        const canSetEntryAsSL = isInProfit;

        return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border-2 border-orange-500 rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">🛑 Set Stop Loss</h3>

            {/* Current position status */}
            <div className={`text-xs mb-3 px-2 py-1 rounded ${isInProfit ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              Current P&L: {currentPnlPercent >= 0 ? '+' : ''}{currentPnlPercent.toFixed(1)}%
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Stop Loss Price ($)</label>

              {/* Entry Price / Break Even Button - Always show but disable when not in profit */}
              <button
                onClick={() => canSetEntryAsSL && setEditStopLossPrice(Math.round(entryPrice).toString())}
                disabled={!canSetEntryAsSL}
                className={`w-full mb-2 py-2 rounded border text-sm font-semibold transition-all ${
                  !canSetEntryAsSL
                    ? 'border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed'
                    : editStopLossPrice === Math.round(entryPrice).toString()
                    ? 'border-green-500 bg-green-900/30 text-green-400'
                    : 'border-green-600/50 bg-green-900/20 text-green-400 hover:border-green-500'
                }`}
                title={!canSetEntryAsSL ? 'Position must be in profit to set break-even SL' : 'Set stop loss at entry price (break even)'}
              >
                Entry (${Math.round(entryPrice).toLocaleString('en-US')})
              </button>

              {/* Quick Stop Loss Buttons - Based on PnL % loss */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[5, 10, 15, 20].map((pnlLossPercent) => {
                  // Calculate price that would cause this PnL loss from entry
                  const priceChangePercent = pnlLossPercent / tradeLeverage;
                  const slPrice = editingStopLossTrade.position_type === 'long'
                    ? Math.round(entryPrice * (1 - priceChangePercent / 100))
                    : Math.round(entryPrice * (1 + priceChangePercent / 100));

                  // Disable if current loss already exceeds this % (SL would trigger instantly)
                  // currentPnlPercent is negative when at loss, so -13% means we're at -13% loss
                  // If current loss is worse than button's loss %, disable it
                  const currentLossPercent = Math.abs(Math.min(0, currentPnlPercent)); // 0 if in profit, positive if in loss
                  const wouldTriggerInstantly = currentLossPercent >= pnlLossPercent;

                  const isDisabled = wouldTriggerInstantly;

                  return (
                    <button
                      key={pnlLossPercent}
                      onClick={() => !isDisabled && setEditStopLossPrice(slPrice.toString())}
                      disabled={isDisabled}
                      className={`py-1.5 rounded border text-xs font-semibold transition-all ${
                        isDisabled
                          ? 'border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed'
                          : editStopLossPrice === slPrice.toString()
                          ? 'border-orange-500 bg-orange-900/30 text-orange-400'
                          : 'border-slate-600 bg-slate-700/30 text-gray-400 hover:border-slate-500'
                      }`}
                      title={isDisabled ? `Current loss (${currentLossPercent.toFixed(0)}%) exceeds this - SL would trigger instantly` : `Set SL at $${slPrice.toLocaleString('en-US')}`}
                    >
                      -{pnlLossPercent}%
                    </button>
                  );
                })}
              </div>
              <input
                type="number"
                inputMode="decimal"
                value={editStopLossPrice}
                onChange={(e) => setEditStopLossPrice(e.target.value)}
                className="w-full bg-slate-700 text-white px-4 py-3 rounded border border-slate-600 focus:border-orange-500 focus:outline-none text-lg"
                placeholder="Enter price"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to remove stop loss
              </p>
            </div>

            <div className={`grid gap-3 ${editingStopLossTrade.stop_loss ? 'grid-cols-3' : 'grid-cols-2'}`}>
              <button
                onClick={() => {
                  setShowStopLossModal(false);
                  setEditingStopLossTrade(null);
                }}
                className="bg-slate-600 hover:bg-slate-500 text-white py-3 rounded font-semibold transition-all"
              >
                Cancel
              </button>
              {editingStopLossTrade.stop_loss && (
                <button
                  onClick={() => handleUpdateStopLoss(true)}
                  className="bg-red-600 hover:bg-red-500 text-white py-3 rounded font-semibold transition-all"
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => handleUpdateStopLoss(false)}
                className="bg-orange-600 hover:bg-orange-500 text-white py-3 rounded font-semibold transition-all"
              >
                {editStopLossPrice ? 'Save' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
