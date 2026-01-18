-- Migration: Add referrer_claimed and referred_claimed columns to referrals table
-- This fixes the referral claim tracking system

ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referrer_claimed BOOLEAN DEFAULT false;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_claimed BOOLEAN DEFAULT false;

-- Add index for performance on claim queries
CREATE INDEX IF NOT EXISTS idx_referrals_claims ON referrals(referrer_claimed, referred_claimed);

-- Add index for finding unclaimed referrals
CREATE INDEX IF NOT EXISTS idx_referrals_unclaimed ON referrals(status) WHERE status = 'claimable';
