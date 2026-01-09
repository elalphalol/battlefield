# 🔧 Frontend API Fix Guide

## Problem
Your frontend has hardcoded `http://localhost:3001` URLs that only work locally. We need to replace them with environment variables.

## Step 1: Get Your CORRECT Backend URL

⚠️ **IMPORTANT**: You added the **database URL** to Vercel, not your backend API URL!

### Find Your Backend API URL in Railway:

1. **Go to Railway Dashboard**: https://railway.app/
2. **Click on your backend SERVICE** (the Node.js app, NOT PostgreSQL)
3. **Go to Settings → Domains**
4. **Click "Generate Domain"** if you haven't
5. **Copy the URL** - it should look like:
   ```
   https://battlefield-production-XXXX.up.railway.app
   ```
   OR
   ```
   https://your-app.up.railway.app
   ```

## Step 2: Update Vercel Environment Variable

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your BATTLEFIELD project**
3. **Go to Settings → Environment Variables**
4. **EDIT the existing `NEXT_PUBLIC_API_URL`** (don't create a new one)
5. **Change the value to your backend URL** (with https://)
   ```
   https://your-backend-url.up.railway.app
   ```
6. **Click Save**

## Step 3: Replace All Hardcoded localhost URLs

### Option A: Using VS Code Find & Replace (RECOMMENDED)

1. **Open VS Code**
2. **Press Ctrl+Shift+H** (Windows) or **Cmd+Shift+H** (Mac)
3. **In "Find" box**, paste:
   ```
   http://localhost:3001
   ```
4. **In "Replace" box**, paste:
   ```
   ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}
   ```
5. **Click the folder icon** to search in specific folder
6. **Select** `whole-number-miniapp/app` folder
7. **Review each match** before replacing
8. **Click "Replace All"** or replace one by one

### Option B: Manual Search (if you prefer control)

Search for all instances of `localhost:3001` in these files and replace with the helper:

**Files to update:**
- `app/page.tsx` (2 instances)
- `app/components/PaperMoneyClaim.tsx` (2 instances)
- `app/components/TradingPanel.tsx` (3 instances) 
- `app/components/Leaderboard.tsx` (2 instances)
- `app/components/TradeHistory.tsx` (1 instance)
- `app/components/ArmySelection.tsx` (1 instance if exists)

### Better Approach: Use the API Helper

1. **Import the helper** at the top of each component:
   ```typescript
   import { getApiUrl } from '../config/api';
   ```

2. **Replace fetch calls** from:
   ```typescript
   fetch('http://localhost:3001/api/users')
   ```
   
   To:
   ```typescript
   fetch(getApiUrl('api/users'))
   ```

## Step 4: Quick Example Fix

Here's how to fix the `page.tsx` file:

### Before:
```typescript
const response = await fetch(`http://localhost:3001/api/users/${address}`);
```

### After:
```typescript
import { getApiUrl } from './config/api';

const response = await fetch(getApiUrl(`api/users/${address}`));
```

## Step 5: Commit and Push to GitHub

After making changes:

```bash
cd whole-number-miniapp
git add .
git commit -m "fix: use environment variable for API URL"
git push origin main
```

Vercel will auto-deploy your changes!

## Step 6: Verify Everything Works

1. **Wait for Vercel deployment** to complete
2. **Open your Vercel site**
3. **Open Browser Console** (F12)
4. **Look for**: `🔧 API URL: https://your-backend-url...`
5. **Test**:
   - Connect wallet
   - Check leaderboard loads
   - Try claiming paper money
   - Try opening a trade

## Quick Checklist

- [ ] Found correct backend URL from Railway (backend service, NOT database)
- [ ] Updated `NEXT_PUBLIC_API_URL` in Vercel with backend URL
- [ ] Replaced all `localhost:3001` in frontend code
- [ ] Committed and pushed changes
- [ ] Vercel redeployed automatically
- [ ] Tested: Leaderboard loads
- [ ] Tested: Can claim paper money
- [ ] Tested: Can open trades

## Still Not Working?

### Check Railway Backend:
- Visit: `https://your-backend-url.up.railway.app/health`
- Should return: `{"status":"healthy","database":"connected"}`
- If not, check Railway logs

### Check Vercel:
- Verify environment variable is set correctly
- Make sure it has `https://` not `postgres://`
- Make sure there's no trailing slash

### Check Browser Console:
- Look for CORS errors
- Look for 404 errors  
- Check what URL is being called

## Summary

The key issue is that you added the **PostgreSQL database URL** instead of your **backend API URL** to Vercel. The database URL starts with `postgres://` while your backend API URL should start with `https://`. Get the right URL from your Railway backend service!
