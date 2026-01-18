-- Migration: Fix users.referred_by foreign key cascade
-- Issue #15: Missing ON DELETE SET NULL on users.referred_by constraint
-- This ensures that when a referrer is deleted, the referred_by field is set to NULL
-- instead of causing a foreign key violation error.

-- Drop the existing constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_referred_by_fkey;

-- Add the constraint with proper ON DELETE SET NULL behavior
ALTER TABLE users ADD CONSTRAINT users_referred_by_fkey
  FOREIGN KEY (referred_by) REFERENCES users(id) ON DELETE SET NULL;

-- Verify the constraint was created properly
SELECT
  conname as constraint_name,
  confdeltype as delete_action
FROM pg_constraint
WHERE conname = 'users_referred_by_fkey';
-- delete_action: 'n' = SET NULL, 'r' = RESTRICT, 'c' = CASCADE, 'a' = NO ACTION
