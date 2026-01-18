// Backend TypeScript Types
// Single Source of Truth for database row types and API responses

// ============================================
// DATABASE ROW TYPES (snake_case - matches PostgreSQL)
// ============================================

export interface UserRow {
  id: number;
  fid: number | null;
  wallet_address: string;
  username: string | null;
  pfp_url: string | null;
  army: 'bears' | 'bulls' | null;
  paper_balance: string; // DECIMAL comes as string from pg
  total_pnl: string;
  total_trades: number;
  winning_trades: number;
  current_streak: number;
  best_streak: number;
  times_liquidated: number;
  battle_tokens_earned: string;
  referral_code: string | null;
  referred_by: number | null;
  referral_count: number;
  referral_earnings: string;
  total_volume: string | null;
  last_claim_time: Date | null;
  last_emergency_claim: Date | null;
  created_at: Date;
  last_active: Date;
}

export interface TradeRow {
  id: number;
  user_id: number;
  wallet_address: string;
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
  opened_at: Date;
  closed_at: Date | null;
}

export interface ReferralRow {
  id: number;
  referrer_id: number;
  referred_user_id: number;
  status: 'pending' | 'claimable' | 'completed' | 'cancelled';
  referrer_reward: string;
  referred_reward: string;
  referrer_claimed: boolean;
  referred_claimed: boolean;
  created_at: Date;
  completed_at: Date | null;
}

export interface MissionRow {
  id: number;
  mission_key: string;
  mission_type: 'daily' | 'weekly' | 'onetime';
  title: string;
  description: string;
  objective_type: string;
  objective_value: number;
  reward_amount: string; // DECIMAL
  icon: string;
  is_active: boolean;
  created_at: Date;
}

export interface UserMissionRow {
  id: number;
  user_id: number;
  mission_id: number;
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  reward_paid: string; // DECIMAL
  period_start: Date;
  period_end: Date;
  completed_at: Date | null;
  claimed_at: Date | null;
}

export interface ClaimRow {
  id: number;
  user_id: number;
  claim_type: 'daily' | 'emergency' | 'referral' | 'mission' | 'airdrop';
  amount: string;
  created_at: Date;
}

export interface LeaderboardSnapshotRow {
  id: number;
  user_id: number;
  wallet_address: string;
  username: string | null;
  pfp_url: string | null;
  army: 'bears' | 'bulls' | null;
  total_pnl: string;
  total_trades: number;
  winning_trades: number;
  rank: number;
  snapshot_date: Date;
  created_at: Date;
}

export interface ArmyStatsRow {
  army: 'bears' | 'bulls';
  total_users: number;
  total_pnl: string;
  total_trades: number;
  total_wins: number;
  avg_pnl: string;
  win_rate: number;
  updated_at: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UserResponse {
  success: boolean;
  user: UserRow;
  message?: string;
}

export interface UsersResponse {
  success: boolean;
  users: UserRow[];
  total?: number;
}

export interface TradeResponse {
  success: boolean;
  trade?: TradeRow;
  trades?: TradeRow[];
  message?: string;
}

export interface TradesResponse {
  success: boolean;
  trades: TradeRow[];
  total?: number;
}

export interface CloseTradeResponse {
  success: boolean;
  pnl: number;
  status: string;
  message?: string;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  total?: number;
}

export interface LeaderboardEntry {
  wallet_address: string;
  username: string | null;
  pfp_url: string | null;
  army: 'bears' | 'bulls' | null;
  total_pnl: string;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  total_volume: string | null;
  rank?: number;
}

export interface ArmyStatsResponse {
  success: boolean;
  stats: {
    bears: ArmyStatsRow;
    bulls: ArmyStatsRow;
  };
}

export interface ReferralResponse {
  success: boolean;
  referrals?: ReferralRow[];
  stats?: {
    total_referrals: number;
    pending_referrals: number;
    completed_referrals: number;
    total_earnings: string;
  };
  message?: string;
}

export interface MissionResponse {
  success: boolean;
  missions?: MissionRow[];
  userMissions?: UserMissionRow[];
  message?: string;
}

export interface ClaimResponse {
  success: boolean;
  newBalance?: number;
  amount?: number;
  nextClaimTime?: string;
  message?: string;
}

export interface HealthResponse {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: boolean;
  uptime: number;
  timestamp: string;
}

// ============================================
// REQUEST BODY TYPES
// ============================================

export interface CreateUserRequest {
  fid?: number | null;
  walletAddress: string;
  username?: string;
  pfpUrl?: string;
  army?: 'bears' | 'bulls';
  referralCode?: string;
}

export interface OpenTradeRequest {
  walletAddress: string;
  type: 'long' | 'short';
  leverage: number;
  size: number; // in cents
  entryPrice: number;
  stopLoss?: number | null;
  priceTimestamp?: number;
}

export interface CloseTradeRequest {
  tradeId: number;
  exitPrice: number;
}

export interface AddCollateralRequest {
  tradeId: number;
  additionalCollateral: number; // in cents
  walletAddress: string;
  currentPrice: number;
}

export interface UpdateStopLossRequest {
  tradeId: number;
  stopLoss: number | null;
  walletAddress: string;
}

export interface AutoLiquidateRequest {
  currentPrice: number;
}

export interface CompleteMissionRequest {
  walletAddress: string;
  missionKey: string;
}

export interface ApplyReferralRequest {
  walletAddress: string;
  referralCode: string;
}

// ============================================
// UTILITY TYPES
// ============================================

export type TradeStatus = 'open' | 'closed' | 'liquidated' | 'voided';
export type CloseReason = 'manual' | 'stop_loss' | 'liquidation' | 'voided';
export type Army = 'bears' | 'bulls';
export type MissionType = 'daily' | 'weekly' | 'onetime';
export type ClaimType = 'daily' | 'emergency' | 'referral' | 'mission' | 'airdrop';
