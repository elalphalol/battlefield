// Trading types - Single Source of Truth

// Base trade fields (shared between open and closed)
export interface TradeBase {
  id: number;
  position_type: 'long' | 'short';
  leverage: number;
  entry_price: number;
  position_size: number;
  stop_loss: number | null;
  opened_at: string;
}

// Open trade (active position)
export interface Trade extends TradeBase {
  liquidation_price: number;
}

// Closed trade (historical)
export interface ClosedTrade extends TradeBase {
  exit_price: number;
  pnl: number;
  status: 'closed' | 'liquidated' | 'voided';
  closed_by: 'manual' | 'stop_loss' | 'liquidation' | 'voided' | null;
  closed_at: string;
}

// Position with calculated P&L (frontend only)
export interface Position extends Trade {
  currentPnl: number;
  currentPnlPercent: number;
}

// Trade response from API
export interface TradeResponse {
  id: number;
  user_id: number;
  position_type: 'long' | 'short';
  leverage: number;
  entry_price: string;
  exit_price: string | null;
  position_size: string;
  pnl: string | null;
  liquidation_price: string;
  stop_loss: string | null;
  status: 'open' | 'closed' | 'liquidated' | 'voided';
  closed_by: 'manual' | 'stop_loss' | 'liquidation' | 'voided' | null;
  opened_at: string;
  closed_at: string | null;
}
