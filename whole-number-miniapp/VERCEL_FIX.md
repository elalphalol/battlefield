# 🚀 Vercel Deployment Fix

## The Problem
Vercel is trying to build from the repository root, but your Next.js app is in `whole-number-miniapp` subdirectory.

## ✅ Solution: Configure Root Directory in Vercel (2 minutes)

### Step 1: Go to Vercel Project Settings
1. **Open Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your BATTLEFIELD project**
3. **Go to Settings** tab

### Step 2: Set Root Directory
1. **Find "Root Directory" section** (scroll down in Settings)
2. **Click "Edit"**
3. **Enter**: `whole-number-miniapp`
4. **Click "Save"**

### Step 3: Redeploy
1. **Go to Deployments** tab
2. **Click "..." menu** on the latest deployment
3. **Click "Redeploy"**

That's it! Vercel will now build from the correct directory.

---

## After Vercel Deploys Successfully

### Step 1: Verify Environment Variable
Make sure you have the **CORRECT** backend URL:

1. **Go to Settings** → **Environment Variables**
2. **Find** `NEXT_PUBLIC_API_URL`
3. **Verify it's your Railway BACKEND URL**, not database URL
   - ✅ Correct: `https://battlefield-production-xxx.up.railway.app`
   - ❌ Wrong: `postgres-production-32c4...`

4. If wrong, **update it** and redeploy

### Step 2: Test Your Site
1. **Visit your Vercel deployment URL**
2. **Connect wallet**
3. **Check if**:
   - Leaderboard loads
   - Can claim paper money
   - Can open trades
   - Data persists after refresh

---

## Complete Deployment Checklist

### Railway Backend:
- [x] Root Directory set to `whole-number-miniapp/backend`
- [ ] Backend deployed successfully
- [ ] Database initialized (run `node setup-db.js`)
- [ ] Public domain generated
- [ ] Backend URL copied

### Vercel Frontend:
- [ ] Root Directory set to `whole-number-miniapp`
- [ ] `NEXT_PUBLIC_API_URL` set to Railway backend URL (NOT database!)
- [ ] Frontend redeployed
- [ ] Site loads without errors

### Testing:
- [ ] Wallet connects
- [ ] Leaderboard shows data
- [ ] Can claim paper money
- [ ] Can open trades
- [ ] Trades show in history
- [ ] User stats update

---

## Troubleshooting

### Vercel: "npm install" fails
- **Make sure** Root Directory is set to `whole-number-miniapp`
- **Redeploy** after changing Root Directory

### Frontend loads but no data
- **Check browser console** for errors
- **Verify** `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- **Test backend** directly: visit `https://your-backend.up.railway.app/health`
- **Make sure** backend URL doesn't have trailing slash

### "Database connection failed"
- **In Railway**, verify PostgreSQL is linked to backend
- **Check** `DATABASE_URL` environment variable is set
- **Run** `node setup-db.js` in Railway console

---

## Summary

The key steps:
1. **Railway**: Set Root Directory to `whole-number-miniapp/backend`
2. **Vercel**: Set Root Directory to `whole-number-miniapp`
3. **Vercel**: Set `NEXT_PUBLIC_API_URL` to your Railway **backend** URL
4. **Railway**: Initialize database with `node setup-db.js`
5. **Test**: Everything should work!

🎯 Both Railway and Vercel need to know which subdirectory to use. Set it in their respective dashboards, not in config files!
