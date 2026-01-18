-- Add NOT NULL constraints to user_missions
ALTER TABLE user_missions ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_missions ALTER COLUMN mission_id SET NOT NULL;

-- Add CHECK constraint to referrals.status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_referral_status'
  ) THEN
    ALTER TABLE referrals ADD CONSTRAINT chk_referral_status
      CHECK (status IN ('pending', 'claimable', 'completed', 'cancelled'));
  END IF;
END $$;
