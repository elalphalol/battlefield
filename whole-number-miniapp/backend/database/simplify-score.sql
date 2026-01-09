-- Migration: Simplify leaderboard to rank by P&L only
-- Simple is better!

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

SELECT 'Leaderboard simplified! Now ranked purely by P&L!' as message;
