-- Fix users with random FIDs (non-Farcaster users)
-- Run this on Railway to set their FIDs to NULL

-- Update the specific user you mentioned
UPDATE users 
SET fid = NULL
WHERE wallet_address = '0xe3bc63e57bb5890a5fa39c731a7afb8fd0f6bf2b';

-- OPTIONAL: Fix ALL users with random FIDs that aren't real Farcaster users
-- (Only run this if you're sure these are all non-Farcaster random FIDs)
-- UPDATE users 
-- SET fid = NULL
-- WHERE fid IS NOT NULL 
-- AND fid NOT IN (SELECT fid FROM users WHERE pfp_url LIKE 'https://i.imgur.com/%' OR pfp_url LIKE 'https://res.cloudinary.com/%');

-- Verify the changes
SELECT wallet_address, fid, username, pfp_url 
FROM users 
WHERE wallet_address = '0xe3bc63e57bb5890a5fa39c731a7afb8fd0f6bf2b';
