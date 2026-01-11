-- Fix Farcaster Profile Data for Existing Users
-- Run this on Railway database to update profiles with correct Farcaster data

-- IMPORTANT: Replace these values with YOUR actual Farcaster data:

-- Update elalpha.eth profile (FID: 1452351)
UPDATE users 
SET 
  fid = 1452351,
  username = 'elalpha.eth',
  pfp_url = 'YOUR_PROFILE_PICTURE_URL_HERE'
WHERE LOWER(wallet_address) = LOWER('0x3a0f52510051E2b3D9C1a930D699ccc82f77a92E');

-- Update bullybort profile (FID: 939116)
UPDATE users
SET
  fid = 939116,
  username = 'bullybort',
  pfp_url = 'YOUR_PROFILE_PICTURE_URL_HERE'
WHERE LOWER(wallet_address) = LOWER('0x66834B79C41da2B5d709A68C874aEb2aAc082E94');

-- Verify the updates
SELECT fid, username, pfp_url, wallet_address 
FROM users 
WHERE fid IN (1452351, 939116)
ORDER BY fid;

-- Alternative: If you don't know the wallet addresses, find by partial username:
-- SELECT * FROM users WHERE username LIKE '%3a0f52%' OR username LIKE '%66834B%';
