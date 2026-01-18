-- BATTLEFIELD PostgreSQL Database Schema
-- Bitcoin Paper Trading Battle Game
-- Bears 🐻 vs Bulls 🐂

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  fid INTEGER UNIQUE NOT NULL,                      -- Farcaster ID
  wallet_address VARCHAR(42) UNIQUE NOT NULL,       -- Ethereum wallet address
  username VARCHAR(255),                            -- Farcaster username
  pfp_url TEXT,                                     -- Profile picture URL
  army VARCHAR(10) CHECK (army IN ('bears', 'bulls')), -- Which army they fight for
  paper_balance DECIMAL(18, 2) DEFAULT 10000.00,   -- Current paper money balance
  last_claim_time TIMESTAMP,                        -- Last time they claimed $1K
  total_pnl DECIMAL(18, 2) DEFAULT 0.00,           -- Total profit/loss (paper)
  total_trades INTEGER DEFAULT 0,                   -- Total number of trades
  winning_trades INTEGER DEFAULT 0,                 -- Number of winning trades
  current_streak INTEGER DEFAULT 0,                 -- Current win streak
  best_streak INTEGER DEFAULT 0,                    -- Best win streak ever
  times_liquidated INTEGER DEFAULT 0,               -- How many times liquidated
  battle_tokens_earned BIGINT DEFAULT 0,            -- Total $BATTLE earned
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TRADES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  position_type VARCHAR(10) CHECK (position_type IN ('long', 'short')),
  leverage INTEGER CHECK (leverage >= 1 AND leverage <= 100),
  entry_price DECIMAL(18, 2) NOT NULL,              -- BTC price when opened
  exit_price DECIMAL(18, 2),                        -- BTC price when closed
  position_size DECIMAL(18, 2) NOT NULL,            -- Amount of paper money used
  pnl DECIMAL(18, 2),                               -- Profit/Loss in paper money
  liquidation_price DECIMAL(18, 2),                 -- Price at which liquidated
  status VARCHAR(20) CHECK (status IN ('open', 'closed', 'liquidated')) DEFAULT 'open',
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

-- ============================================
-- PAPER MONEY CLAIMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(18, 2) DEFAULT 100000.00,           -- Amount claimed ($1,000 = 100,000 cents)
  claimed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- LEADERBOARD SNAPSHOTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard_snapshot (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score DECIMAL(18, 2) NOT NULL,                    -- Calculated score
  paper_balance DECIMAL(18, 2),                     -- Balance at snapshot time
  total_pnl DECIMAL(18, 2),                         -- Total P&L at snapshot
  win_rate DECIMAL(5, 2),                           -- Win rate percentage
  total_trades INTEGER,                             -- Total trades at snapshot
  snapshot_date DATE NOT NULL,
  period VARCHAR(20) CHECK (period IN ('weekly', 'monthly', 'all_time')) NOT NULL,
  UNIQUE(user_id, snapshot_date, period)
);

-- ============================================
-- REWARDS HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rewards_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,                           -- Amount of $BATTLE tokens
  reason VARCHAR(255) NOT NULL,                     -- Why reward was given
  reward_type VARCHAR(50) CHECK (reward_type IN ('weekly', 'monthly', 'achievement', 'army_bonus')),
  tx_hash VARCHAR(66),                              -- Blockchain transaction hash
  distributed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  achievement_type VARCHAR(100) NOT NULL,           -- Type of achievement
  achievement_name VARCHAR(255) NOT NULL,           -- Display name
  description TEXT,                                 -- Description
  reward_amount BIGINT,                             -- $BATTLE token reward
  nft_token_id INTEGER,                             -- NFT token ID if minted
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- ============================================
-- ARMY STATS TABLE (Cached)
-- ============================================
CREATE TABLE IF NOT EXISTS army_stats (
  id SERIAL PRIMARY KEY,
  army VARCHAR(10) CHECK (army IN ('bears', 'bulls')) UNIQUE NOT NULL,
  total_members INTEGER DEFAULT 0,
  total_paper_wealth DECIMAL(18, 2) DEFAULT 0.00,
  total_pnl DECIMAL(18, 2) DEFAULT 0.00,
  average_pnl DECIMAL(18, 2) DEFAULT 0.00,
  active_traders INTEGER DEFAULT 0,
  army_score DECIMAL(18, 2) DEFAULT 0.00,           -- Combined performance score
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial army stats
INSERT INTO army_stats (army, total_members, updated_at) 
VALUES ('bears', 0, NOW()), ('bulls', 0, NOW())
ON CONFLICT (army) DO NOTHING;

-- ============================================
-- SYSTEM CONFIG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial system config
INSERT INTO system_config (key, value, description) VALUES
('battle_token_address', '', 'Clanker deployed $BATTLE token address'),
('rewards_wallet_address', '', 'AI-managed rewards wallet address'),
('claim_cooldown_minutes', '10', 'Minutes between paper money claims'),
('claim_amount', '100000', 'Amount of paper money per claim (cents)'),
('starting_balance', '10000', 'Starting paper money balance'),
('weekly_rewards_enabled', 'false', 'Whether weekly rewards are active'),
('monthly_rewards_enabled', 'false', 'Whether monthly rewards are active')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_fid ON users(fid);
CREATE INDEX IF NOT EXISTS idx_users_army ON users(army);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);

-- Trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_opened ON trades(opened_at);
CREATE INDEX IF NOT EXISTS idx_trades_user_status ON trades(user_id, status);

-- Claims indexes
CREATE INDEX IF NOT EXISTS idx_claims_user ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_claims_time ON claims(claimed_at);

-- Leaderboard indexes
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_snapshot(period, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_snapshot(period, snapshot_date, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_period ON leaderboard_snapshot(user_id, period);

-- Rewards indexes
CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards_history(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards_history(reward_type);
CREATE INDEX IF NOT EXISTS idx_rewards_date ON rewards_history(distributed_at);

-- Achievements indexes
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_type ON achievements(achievement_type);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update user stats after trade closes
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
      last_active = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user stats
DROP TRIGGER IF EXISTS trigger_update_user_stats ON trades;
CREATE TRIGGER trigger_update_user_stats
  AFTER UPDATE ON trades
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_after_trade();

-- Function to update army stats
CREATE OR REPLACE FUNCTION update_army_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update Bears stats
  UPDATE army_stats
  SET 
    total_members = (SELECT COUNT(*) FROM users WHERE army = 'bears'),
    total_paper_wealth = (SELECT COALESCE(SUM(paper_balance), 0) FROM users WHERE army = 'bears'),
    total_pnl = (SELECT COALESCE(SUM(total_pnl), 0) FROM users WHERE army = 'bears'),
    average_pnl = (SELECT COALESCE(AVG(total_pnl), 0) FROM users WHERE army = 'bears'),
    active_traders = (SELECT COUNT(*) FROM users WHERE army = 'bears' AND last_active > NOW() - INTERVAL '24 hours'),
    updated_at = NOW()
  WHERE army = 'bears';
  
  -- Update Bulls stats
  UPDATE army_stats
  SET 
    total_members = (SELECT COUNT(*) FROM users WHERE army = 'bulls'),
    total_paper_wealth = (SELECT COALESCE(SUM(paper_balance), 0) FROM users WHERE army = 'bulls'),
    total_pnl = (SELECT COALESCE(SUM(total_pnl), 0) FROM users WHERE army = 'bulls'),
    average_pnl = (SELECT COALESCE(AVG(total_pnl), 0) FROM users WHERE army = 'bulls'),
    active_traders = (SELECT COUNT(*) FROM users WHERE army = 'bulls' AND last_active > NOW() - INTERVAL '24 hours'),
    updated_at = NOW()
  WHERE army = 'bulls';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update army stats when user changes
DROP TRIGGER IF EXISTS trigger_update_army_stats ON users;
CREATE TRIGGER trigger_update_army_stats
  AFTER INSERT OR UPDATE OF army, paper_balance, total_pnl ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_army_stats();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Current leaderboard view
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
  CASE 
    WHEN u.total_trades > 0 THEN ROUND((u.winning_trades::DECIMAL / u.total_trades) * 100, 2)
    ELSE 0 
  END as win_rate,
  u.current_streak,
  u.best_streak,
  u.times_liquidated,
  u.battle_tokens_earned,
  -- Score is simply total P&L (simple and clear!)
  u.total_pnl as score,
  u.last_active
FROM users u
WHERE u.total_trades > 0
ORDER BY u.total_pnl DESC;

-- Active positions view
CREATE OR REPLACE VIEW active_positions AS
SELECT 
  t.id as trade_id,
  t.user_id,
  u.username,
  u.wallet_address,
  t.position_type,
  t.leverage,
  t.entry_price,
  t.position_size,
  t.liquidation_price,
  t.opened_at,
  EXTRACT(EPOCH FROM (NOW() - t.opened_at)) / 3600 as hours_open
FROM trades t
JOIN users u ON t.user_id = u.id
WHERE t.status = 'open'
ORDER BY t.opened_at DESC;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Stores all user information including paper balance and stats';
COMMENT ON TABLE trades IS 'Records all paper trading positions opened by users';
COMMENT ON TABLE claims IS 'Logs all paper money claims ($1K every 10 minutes)';
COMMENT ON TABLE leaderboard_snapshot IS 'Historical snapshots of leaderboard rankings';
COMMENT ON TABLE rewards_history IS 'Tracks all $BATTLE token distributions';
COMMENT ON TABLE achievements IS 'Stores earned achievements and NFT badges';
COMMENT ON TABLE army_stats IS 'Cached statistics for Bears and Bulls armies';
COMMENT ON TABLE system_config IS 'System-wide configuration parameters';

-- ============================================
-- INITIAL DATA VERIFICATION
-- ============================================

-- Verify army stats initialized
SELECT * FROM army_stats;

-- Verify system config
SELECT * FROM system_config;

-- Table counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'trades', COUNT(*) FROM trades
UNION ALL
SELECT 'claims', COUNT(*) FROM claims
UNION ALL
SELECT 'rewards_history', COUNT(*) FROM rewards_history
UNION ALL
SELECT 'achievements', COUNT(*) FROM achievements;

-- ============================================
-- SCHEMA COMPLETE
-- ============================================
-- Database ready for BATTLEFIELD! ⚔️
-- Bears 🐻 vs Bulls 🐂
-- ============================================
