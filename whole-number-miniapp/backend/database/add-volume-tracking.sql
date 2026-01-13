-- Add volume tracking to BATTLEFIELD
-- Volume = position_size × leverage (notional value traded)

-- Add total_volume field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_volume DECIMAL(18, 2) DEFAULT 0.00;

COMMENT ON COLUMN users.total_volume IS 'Total trading volume (position_size × leverage) across all trades';

-- Update existing users with calculated volume from closed trades
UPDATE users u
SET total_volume = COALESCE(
  (SELECT SUM(position_size * leverage) 
   FROM trades 
   WHERE user_id = u.id 
   AND status IN ('closed', 'liquidated')),
  0
);

-- Create index for volume queries
CREATE INDEX IF NOT EXISTS idx_users_volume ON users(total_volume DESC);

-- Update the trigger function to also track volume
CREATE OR REPLACE FUNCTION update_user_stats_after_trade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('closed', 'liquidated') AND OLD.status = 'open' THEN
    UPDATE users
    SET 
      total_trades = total_trades + 1,
      winning_trades = CASE 
        WHEN NEW.pnl > 0 THEN winning_trades + 1 
        ELSE winning_trades 
      END,
      current_streak = CASE
        WHEN NEW.pnl > 0 THEN current_streak + 1
        ELSE 0
      END,
      best_streak = GREATEST(
        best_streak,
        CASE WHEN NEW.pnl > 0 THEN current_streak + 1 ELSE current_streak END
      ),
      total_pnl = total_pnl + COALESCE(NEW.pnl, 0),
      times_liquidated = CASE
        WHEN NEW.status = 'liquidated' THEN times_liquidated + 1
        ELSE times_liquidated
      END,
      -- Add volume tracking
      total_volume = total_volume + (NEW.position_size * NEW.leverage),
      last_active = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the leaderboard view to include volume
CREATE OR REPLACE VIEW current_leaderboard AS
SELECT 
  u.id,
  u.fid,
  u.username,
  u.pfp_url,
  u.wallet_address,
  u.army,
  u.paper_balance,
  u.total_pnl,
  u.total_trades,
  u.total_volume,
  CASE 
    WHEN u.total_trades > 0 THEN ROUND((u.winning_trades::DECIMAL / u.total_trades) * 100, 2)
    ELSE 0 
  END as win_rate,
  u.current_streak,
  u.best_streak,
  u.times_liquidated,
  u.battle_tokens_earned,
  u.total_pnl as score,
  u.last_active
FROM users u
WHERE u.total_trades > 0
ORDER BY u.total_pnl DESC;

-- Verification: Show current global volume
SELECT 
  'Global Trading Volume' as metric,
  TO_CHAR(COALESCE(SUM(total_volume), 0), 'FM$999,999,999,999') as value
FROM users
UNION ALL
SELECT 
  'Total Traders',
  TO_CHAR(COUNT(*), 'FM999,999') 
FROM users WHERE total_trades > 0
UNION ALL
SELECT 
  'Average Volume Per Trader',
  TO_CHAR(COALESCE(AVG(total_volume), 0), 'FM$999,999,999')
FROM users WHERE total_trades > 0;

-- ============================================
-- VOLUME TRACKING COMPLETE
-- ============================================
