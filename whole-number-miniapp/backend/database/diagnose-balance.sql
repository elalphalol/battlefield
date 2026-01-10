-- Diagnostic Query to Check Balance Accounting
-- This shows the complete breakdown for each user

WITH user_accounting AS (
  SELECT 
    u.id,
    u.fid,
    u.username,
    u.paper_balance as current_balance,
    u.total_pnl,
    
    -- Starting balance
    10000.00 as starting_balance,
    
    -- Total claims
    COALESCE((
      SELECT SUM(amount) FROM claims WHERE user_id = u.id
    ), 0) as total_claims,
    
    -- Total P&L from closed/liquidated trades
    COALESCE((
      SELECT SUM(pnl) FROM trades 
      WHERE user_id = u.id AND status IN ('closed', 'liquidated')
    ), 0) as closed_pnl,
    
    -- Cost of open positions (collateral locked)
    COALESCE((
      SELECT SUM(position_size) FROM trades 
      WHERE user_id = u.id AND status = 'open'
    ), 0) as open_collateral,
    
    -- Fees paid on open positions (already deducted)
    COALESCE((
      SELECT SUM(position_size * (CASE WHEN leverage > 1 THEN leverage * 0.1 ELSE 0 END) / 100)
      FROM trades 
      WHERE user_id = u.id AND status = 'open'
    ), 0) as open_fees,
    
    -- Count trades
    (SELECT COUNT(*) FROM trades WHERE user_id = u.id AND status = 'open') as open_count,
    (SELECT COUNT(*) FROM trades WHERE user_id = u.id AND status IN ('closed', 'liquidated')) as closed_count
    
  FROM users u
  WHERE u.fid IN (508981, 83940) -- Trader3a0f52 and Trader83d940
)
SELECT 
  fid,
  username,
  current_balance,
  total_pnl,
  
  -- Expected balance calculation
  (starting_balance + total_claims + closed_pnl - open_collateral - open_fees) as expected_balance,
  
  -- Difference
  (current_balance - (starting_balance + total_claims + closed_pnl - open_collateral - open_fees)) as difference,
  
  -- Breakdown
  starting_balance,
  total_claims,
  closed_pnl,
  open_collateral,
  open_fees,
  open_count,
  closed_count
FROM user_accounting;

-- Also show individual claims for these users
SELECT 
  u.fid,
  u.username,
  c.amount,
  c.claimed_at
FROM claims c
JOIN users u ON c.user_id = u.id
WHERE u.fid IN (508981, 83940)
ORDER BY u.fid, c.claimed_at;

-- Show all trades for these users with fees
SELECT 
  u.fid,
  u.username,
  t.id as trade_id,
  t.position_type,
  t.leverage,
  t.position_size as collateral,
  (t.position_size * (CASE WHEN t.leverage > 1 THEN t.leverage * 0.1 ELSE 0 END) / 100) as fee_paid,
  t.entry_price,
  t.exit_price,
  t.pnl,
  t.status,
  t.opened_at,
  t.closed_at
FROM trades t
JOIN users u ON t.user_id = u.id
WHERE u.fid IN (508981, 83940)
ORDER BY u.fid, t.opened_at;
