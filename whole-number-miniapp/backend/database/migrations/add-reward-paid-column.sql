-- Migration: Add reward_paid column to user_missions table
-- This fixes mission reward tracking

ALTER TABLE user_missions ADD COLUMN IF NOT EXISTS reward_paid BIGINT DEFAULT 0;

-- Add index for aggregation queries (e.g., total rewards paid)
CREATE INDEX IF NOT EXISTS idx_user_missions_reward_paid ON user_missions(reward_paid) WHERE reward_paid > 0;
