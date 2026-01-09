-- Migration: Remove score system and rank ONLY by PNL
-- This completely eliminates the score calculation and ranks users purely by total_pnl

-- Drop the existing view completely first (needed because we're changing column data types)
DROP VIEW IF EXISTS current_leaderboard;

-- Create the view to rank by PNL only
CREATE VIEW current_leaderboard AS
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
  -- REMOVED: Complex score formula
  -- NEW: Rank purely by total_pnl (highest PNL = best rank)
  u.total_pnl as score,
  u.last_active
FROM users u
WHERE u.total_trades > 0
ORDER BY u.total_pnl DESC;

-- Verify the change
SELECT 'Leaderboard now ranks by PNL only!' as message;
SELECT username, total_pnl, score FROM current_leaderboard LIMIT 10;
