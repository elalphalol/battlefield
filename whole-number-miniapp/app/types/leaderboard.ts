// Leaderboard types - Single Source of Truth

export interface LeaderboardEntry {
  rank: number;
  fid: number;
  wallet_address: string;
  username: string;
  pfp_url: string;
  army: 'bears' | 'bulls';
  total_pnl: number;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  battle_tokens_earned: number;
  current_streak: number;
  best_streak: number;
}

export interface LeaderboardResponse {
  success: boolean;
  leaderboard: LeaderboardEntry[];
  total_users: number;
  last_updated: string;
}

export interface ArmyStats {
  bears: {
    members: number;
    total_pnl: number;
    total_trades: number;
    avg_pnl: number;
  };
  bulls: {
    members: number;
    total_pnl: number;
    total_trades: number;
    avg_pnl: number;
  };
  leading_army: 'bears' | 'bulls';
}
