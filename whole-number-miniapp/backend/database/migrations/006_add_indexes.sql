-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_trades_open_liquidation
  ON trades(status, liquidation_price) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_user_missions_composite
  ON user_missions(user_id, mission_id);

CREATE INDEX IF NOT EXISTS idx_trades_user_status
  ON trades(user_id, status);

CREATE INDEX IF NOT EXISTS idx_users_army
  ON users(army);

CREATE INDEX IF NOT EXISTS idx_referrals_status
  ON referrals(status);
