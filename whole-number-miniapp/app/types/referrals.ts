// Referral types - Single Source of Truth

export interface ReferralData {
  referral_code: string;
  referral_count: number;
  referral_earnings: number;
  pending_referrals: number;
  claimable_referrals: number;
}

export interface Referral {
  id: number;
  referrer_id: number;
  referred_user_id: number;
  status: 'pending' | 'claimable' | 'completed' | 'cancelled';
  referrer_reward: number;
  referred_reward: number;
  referrer_claimed: boolean;
  referred_claimed: boolean;
  created_at: string;
  completed_at: string | null;
  // Joined fields
  referred_username?: string;
  referred_pfp_url?: string;
  referrer_username?: string;
  referrer_pfp_url?: string;
}

export interface ReferralStats {
  total_referrals: number;
  pending_count: number;
  claimable_count: number;
  completed_count: number;
  total_earnings: number;
}
