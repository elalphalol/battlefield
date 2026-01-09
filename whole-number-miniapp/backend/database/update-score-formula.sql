-- Migration: Update leaderboard score formula to prioritize P&L (70%)
-- Run this to update the existing database without losing data

-- Drop and recreate the view with new score formula
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
  -- NEW: Ranking score formula (P&L is most important - 70%)
  -- OLD was: P&L 40%, Balance 30%, Win Rate 20%, Streak 10%
  -- NEW is:  P&L 70%, Balance 15%, Win Rate 10%, Streak 5%
  (u.total_pnl * 0.7) + 
  (u.paper_balance * 0.15) + 
  (CASE WHEN u.total_trades > 0 THEN (u.winning_trades::DECIMAL / u.total_trades) * u.total_trades * 0.1 ELSE 0 END) +
  (u.current_streak * 100 * 0.05) - 
  (u.times_liquidated * 500) as score,
  u.last_active
FROM users u
WHERE u.total_trades > 0
ORDER BY score DESC;

-- Verify the change
SELECT 'Score formula updated!' as message;
SELECT username, total_pnl, score FROM current_leaderboard LIMIT 10;
