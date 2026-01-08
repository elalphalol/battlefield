-- Migration: Update leverage constraint to allow any value between 1-100
-- This fixes the issue where 86x leverage was not allowed

-- Drop the old constraint
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check;

-- Add the new constraint
ALTER TABLE trades ADD CONSTRAINT trades_leverage_check CHECK (leverage >= 1 AND leverage <= 100);

-- Verify the change
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'trades_leverage_check';
