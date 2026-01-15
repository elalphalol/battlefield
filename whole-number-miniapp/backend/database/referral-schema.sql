-- Referral System Schema Migration
-- Run: sudo -u postgres psql -d battlefield -f /var/www/battlefield/whole-number-miniapp/backend/database/referral-schema.sql

-- Add referral columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_earnings BIGINT DEFAULT 0;

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);

-- Referrals tracking table (for history/audit)
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referred_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending (signed up), completed (first trade)
  referrer_reward BIGINT DEFAULT 500000,  -- $5,000 in cents
  referred_reward BIGINT DEFAULT 500000,  -- $5,000 in cents
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,  -- When first trade was made
  UNIQUE(referred_user_id)  -- Each user can only be referred once
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Generate referral codes for existing users who don't have one
DO $$
DECLARE
  user_record RECORD;
  new_code VARCHAR(50);
BEGIN
  FOR user_record IN
    SELECT id, username, fid FROM users WHERE referral_code IS NULL
  LOOP
    -- Generate code from username or fid
    IF user_record.username IS NOT NULL AND LENGTH(REGEXP_REPLACE(user_record.username, '[^a-zA-Z0-9]', '', 'g')) >= 3 THEN
      new_code := LOWER(REGEXP_REPLACE(user_record.username, '[^a-zA-Z0-9]', '', 'g')) || '.battle';
    ELSIF user_record.fid IS NOT NULL THEN
      new_code := 'soldier' || user_record.fid || '.battle';
    ELSE
      new_code := 'soldier' || user_record.id || '.battle';
    END IF;

    -- Truncate if too long
    new_code := LEFT(new_code, 50);

    -- Update user with new code (handle duplicates by appending id)
    BEGIN
      UPDATE users SET referral_code = new_code WHERE id = user_record.id;
    EXCEPTION WHEN unique_violation THEN
      UPDATE users SET referral_code = new_code || user_record.id WHERE id = user_record.id;
    END;
  END LOOP;
END $$;

SELECT 'Referral schema migration complete!' as status;
