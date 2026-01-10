-- SAFE UPGRADE: Leverage from 100x to 200x
-- This handles existing data gracefully without crashes
-- Bears 🐻 vs Bulls 🐂

-- ==============================================
-- STEP 1: Verify current constraint
-- ==============================================
DO $$ 
BEGIN
  RAISE NOTICE 'Checking existing leverage constraint...';
END $$;

SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'trades_leverage_check';

-- ==============================================
-- STEP 2: Check for any trades that might be affected
-- ==============================================
DO $$ 
DECLARE
  max_leverage INTEGER;
  trade_count INTEGER;
BEGIN
  SELECT MAX(leverage), COUNT(*) 
  INTO max_leverage, trade_count
  FROM trades;
  
  RAISE NOTICE 'Current max leverage in database: %', COALESCE(max_leverage, 0);
  RAISE NOTICE 'Total trades in database: %', COALESCE(trade_count, 0);
  
  -- All existing trades should be <= 100x, so this is safe
  IF max_leverage > 100 THEN
    RAISE EXCEPTION 'Found trades with leverage > 100x. Please investigate before proceeding.';
  END IF;
END $$;

-- ==============================================
-- STEP 3: Drop the old constraint (if it exists)
-- ==============================================
DO $$ 
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'trades_leverage_check'
  ) THEN
    ALTER TABLE trades DROP CONSTRAINT trades_leverage_check;
    RAISE NOTICE '✅ Old constraint dropped successfully';
  ELSE
    RAISE NOTICE 'ℹ️  No existing constraint found';
  END IF;
END $$;

-- ==============================================
-- STEP 4: Add new constraint allowing up to 200x
-- ==============================================
DO $$ 
BEGIN
  ALTER TABLE trades ADD CONSTRAINT trades_leverage_check 
    CHECK (leverage >= 1 AND leverage <= 200);
  RAISE NOTICE '✅ New constraint added: leverage 1x-200x';
END $$;

-- ==============================================
-- STEP 5: Verify the upgrade
-- ==============================================
DO $$ 
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE '✅ UPGRADE COMPLETE!';
  RAISE NOTICE 'Leverage limit increased from 100x to 200x';
  RAISE NOTICE '==============================================';
END $$;

-- Display the new constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'trades_leverage_check';

-- Show summary of trades
SELECT 
  MIN(leverage) as min_leverage,
  MAX(leverage) as max_leverage,
  ROUND(AVG(leverage), 2) as avg_leverage,
  COUNT(*) as total_trades,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_trades
FROM trades;

-- ==============================================
-- UPGRADE COMPLETE! 🚀
-- Database now supports up to 200x leverage
-- ==============================================
