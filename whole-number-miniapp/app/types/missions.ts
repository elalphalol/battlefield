// Mission types - Single Source of Truth

// Base mission definition
export interface MissionBase {
  id: number;
  mission_key: string;
  mission_type: 'daily' | 'weekly' | 'onetime';
  title: string;
  description: string;
  objective_type: string;
  objective_value: number;
  reward_amount: number; // in cents
  icon: string;
}

// User-facing mission with progress
export interface Mission extends MissionBase {
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  period_start: string;
  period_end: string;
}

// Admin view of mission
export interface MissionAdmin extends MissionBase {
  is_active: boolean;
  completions_count?: number;
  claims_count?: number;
}

// User mission progress record
export interface UserMission {
  id: number;
  user_id: number;
  mission_id: number;
  progress: number;
  is_completed: boolean;
  is_claimed: boolean;
  reward_paid: number;
  period_start: string;
  period_end: string;
  completed_at: string | null;
  claimed_at: string | null;
}
