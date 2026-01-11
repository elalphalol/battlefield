-- Make FID column nullable (allow NULL for non-Farcaster users)
-- Run this FIRST before updating any FIDs to null

-- Step 1: Make the fid column nullable
ALTER TABLE users 
ALTER COLUMN fid DROP NOT NULL;

-- Step 2: Verify the column is now nullable
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'fid';

-- Step 3: Now update that specific user's FID to null
UPDATE users 
SET fid = NULL
WHERE wallet_address = '0xe3bc63e57bb5890a5fa39c731a7afb8fd0f6bf2b';

-- Step 4: Verify the update worked
SELECT wallet_address, fid, username, pfp_url 
FROM users 
WHERE wallet_address = '0xe3bc63e57bb5890a5fa39c731a7afb8fd0f6bf2b';
