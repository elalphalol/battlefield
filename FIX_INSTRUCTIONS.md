# 🔧 HOW TO FIX FARCASTER PROFILES

## The Problem
Your existing users in the database have placeholder data:
- FID 508981 should be 1452351 (elalpha.eth)
- Username "Trader3a0f52" should be "elalpha.eth"
- Missing profile pictures

## ⚠️ IMPORTANT
**I (the AI) cannot access your Railway database - YOU must run these updates!**

## 🚀 EASIEST FIX: Use Railway Database Console

### Step 1: Go to Railway
1. Visit: https://railway.app
2. Select your "battlefield" project
3. Click on your **PostgreSQL** database
4. Click **"Data"** tab at the top
5. Click **"Query"** to open SQL console

### Step 2: Run This SQL

Copy and paste this SQL and click "Run":

```sql
-- Fix elalpha.eth profile
UPDATE users 
SET 
  fid = 1452351,
  username = 'elalpha.eth',
  pfp_url = 'https://i.imgur.com/7cKCZQz.png'  -- Replace with your actual Farcaster PFP URL
WHERE LOWER(wallet_address) = LOWER('0x3a0f52510051E2b3D9C1a930D699ccc82f77a92E');

-- Verify the update
SELECT fid, username, pfp_url, wallet_address 
FROM users 
WHERE fid = 1452351;
```

### Step 3: Check Results
After running, you should see:
- **fid:** 1452351
- **username:** elalpha.eth
- **pfp_url:** (your picture URL)

### Step 4: Refresh Browser
- Go to: https://battlefield-roan.vercel.app
- Hard refresh (Ctrl+F5)
- Check your profile - should show "elalpha.eth" now!

## 📍 How to Get Your Farcaster PFP URL

1. Go to https://warpcast.com/elalpha.eth
2. Right-click on your profile picture
3. Click "Copy Image Address"
4. Replace the URL in the SQL above

## Alternative: Use Railway CLI

If SQL console doesn't work:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Connect to database
railway connect

# Run SQL
\# Then paste the UPDATE command
```

## ✅ What Happens After You Run This

1. Your profile will show: ✅ "elalpha.eth" instead of "Trader3a0f52"
2. FID will be: ✅ 1452351 instead of 508981  
3. Profile picture will show: ✅ Your actual Farcaster avatar
4. Leaderboard will display correctly ✅

## 🎯 FOR FUTURE USERS

Once you fix these existing users, **all new users will automatically get correct data** because the backend code is now fixed!

---

**YOU MUST DO THIS - I cannot access your database!** 🔐
