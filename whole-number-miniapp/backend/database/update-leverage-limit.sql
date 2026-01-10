-- Update leverage limit from 100x to 200x
-- This removes the old constraint and adds a new one

-- Drop the old constraint
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check;

-- Add new constraint allowing up to 200x
ALTER TABLE trades ADD CONSTRAINT trades_leverage_check CHECK (leverage >= 1 AND leverage <= 200);

-- Verify the change
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'trades_leverage_check';
