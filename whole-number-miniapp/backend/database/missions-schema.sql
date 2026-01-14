-- Missions System Schema
-- Run with: psql -U postgres -d battlefield -f missions-schema.sql

-- Missions definitions table
CREATE TABLE IF NOT EXISTS missions (
  id SERIAL PRIMARY KEY,
  mission_key VARCHAR(50) UNIQUE NOT NULL,
  mission_type VARCHAR(20) NOT NULL,  -- 'daily', 'weekly'
  title VARCHAR(100) NOT NULL,
  description TEXT,
  objective_type VARCHAR(50) NOT NULL,  -- 'follow', 'trade', 'win', 'claim', 'daily_streak', 'army_loyalty'
  objective_value INTEGER DEFAULT 1,
  reward_amount BIGINT DEFAULT 0,  -- Paper money reward in cents
  icon VARCHAR(10),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User mission progress table
CREATE TABLE IF NOT EXISTS user_missions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mission_id INTEGER REFERENCES missions(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  is_claimed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  claimed_at TIMESTAMP,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, mission_id, period_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_missions_user ON user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_period ON user_missions(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_user_missions_status ON user_missions(is_completed, is_claimed);
CREATE INDEX IF NOT EXISTS idx_missions_active ON missions(is_active);
CREATE INDEX IF NOT EXISTS idx_missions_type ON missions(mission_type);

-- Insert default missions (reward_amount in cents: $5,000 = 500000)
INSERT INTO missions (mission_key, mission_type, title, description, objective_type, objective_value, reward_amount, icon, display_order) VALUES
-- Daily missions
('follow_btcbattle', 'daily', 'Follow @btcbattle', 'Follow our official Farcaster account', 'follow', 1, 500000, '👋', 1),
('open_trade', 'daily', 'Open a Trade', 'Open at least 1 trade today', 'trade', 1, 200000, '📈', 2),
('win_trade', 'daily', 'Win a Trade', 'Close 1 profitable trade', 'win', 1, 300000, '💰', 3),
-- Weekly missions
('weekly_streak', 'weekly', 'Trading Streak', 'Trade on 5 different days', 'daily_streak', 5, 2500000, '🔥', 1),
('win_5_trades', 'weekly', 'Win 5 Trades', 'Close 5 profitable trades', 'win', 5, 2000000, '🏆', 2),
('claim_collector', 'weekly', 'Paper Collector', 'Claim paper money 10 times', 'claim', 10, 1500000, '💵', 3),
('army_loyalty', 'weekly', 'Army Loyalty', 'Keep same army for the entire week', 'army_loyalty', 1, 1000000, '⚔️', 4)
ON CONFLICT (mission_key) DO NOTHING;
