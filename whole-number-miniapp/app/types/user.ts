// User types - Single Source of Truth

// Base user from database
export interface UserBase {
  id: number;
  fid: number;
  wallet_address: string;
  username: string;
  pfp_url: string;
  army: 'bears' | 'bulls';
}

// Full user with all stats
export interface UserData extends UserBase {
  paper_balance: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  battle_tokens_earned: number;
  referral_code?: string;
  total_volume?: number;
}

// Subset for stats display
export interface UserStats {
  paper_balance: number;
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  battle_tokens_earned: number;
}

// Minimal user for trade history context
export interface UserContext {
  army: 'bears' | 'bulls';
  username?: string;
  referral_code?: string;
  rank?: number;
}
