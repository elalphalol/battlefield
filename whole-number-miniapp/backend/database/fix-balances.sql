-- Fix Balance Calculation
-- This script recalculates paper_balance for all users based on:
-- Starting balance (10000) + Total P&L + Claims - Open Position Costs

-- Step 1: Calculate correct balances
UPDATE users u
SET paper_balance = (
  -- Starting balance
  10000.00 + 
  
  -- Add all claims
  COALESCE((
    SELECT SUM(amount) 
    FROM claims 
    WHERE user_id = u.id
  ), 0) +
  
  -- Add net P&L from all closed/liquidated trades
  COALESCE((
    SELECT SUM(pnl) 
    FROM trades 
    WHERE user_id = u.id 
    AND status IN ('closed', 'liquidated')
  ), 0) -
  
  -- Subtract collateral + fees locked in open positions
  COALESCE((
    SELECT SUM(position_size * (1 + (CASE WHEN leverage > 1 THEN leverage * 0.1 ELSE 0 END) / 100))
    FROM trades 
    WHERE user_id = u.id 
    AND status = 'open'
  ), 0)
);

-- Show results
SELECT 
  u.fid,
  u.username,
  u.paper_balance as new_balance,
  u.total_pnl,
  (SELECT COUNT(*) FROM trades WHERE user_id = u.id AND status = 'open') as open_positions,
  (SELECT COUNT(*) FROM trades WHERE user_id = u.id AND status IN ('closed', 'liquidated')) as closed_trades
FROM users u
WHERE u.total_trades > 0
ORDER BY u.total_pnl DESC
LIMIT 20;
