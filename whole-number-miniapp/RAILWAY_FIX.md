# 🚀 Railway Deployment Fix

## The Problem
Railway is failing because it's trying to deploy from the root directory, but your backend code is in `whole-number-miniapp/backend`.

## ✅ Solution: Configure Root Directory in Railway

### Step 1: Go to Railway Service Settings
1. Open your Railway project
2. Click on your **backend service** (the one that's failing)
3. Go to **Settings** tab

### Step 2: Set Root Directory
1. Scroll down to find **"Root Directory"** setting
2. Set it to: `whole-number-miniapp/backend`
3. Click **Save**

### Step 3: Set Environment Variables
While in Settings, add these environment variables:
```
NODE_ENV=production
PORT=3001
```

The `DATABASE_URL` should already be there if you linked the PostgreSQL database.

### Step 4: Trigger Redeploy
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. OR make a small change and push to GitHub

### Step 5: Initialize Database (After Successful Deployment)
Once the backend deploys successfully:
1. Go to backend service
2. Click on **Deployments** → **View Logs**
3. Find the **Terminal** or **Console** tab
4. Run: `node setup-db.js`

This will create all the necessary database tables.

---

## Alternative: Use Railway CLI (Advanced)

If the above doesn't work, you can deploy using Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Deploy backend specifically
cd whole-number-miniapp/backend
railway up
```

---

## After Backend Deploys Successfully

### 1. Get Your Backend URL
- Go to backend service → **Settings** → **Networking**
- Click **Generate Domain**
- Copy the URL (e.g., `https://battlefield-backend-production.up.railway.app`)

### 2. Update Vercel Environment Variable
- Go to Vercel → Your Project → **Settings** → **Environment Variables**
- Find `NEXT_PUBLIC_API_URL`
- Change it to your Railway backend URL (NOT the database URL!)
- Click **Save**

### 3. Redeploy Vercel
- Go to **Deployments** tab
- Click **Redeploy** on the latest deployment

---

## Checklist

- [ ] Set Root Directory to `whole-number-miniapp/backend` in Railway
- [ ] Set environment variables in Railway (NODE_ENV, PORT)
- [ ] Verify DATABASE_URL is linked from PostgreSQL
- [ ] Redeploy backend in Railway
- [ ] Run `node setup-db.js` in Railway console
- [ ] Generate public domain for backend
- [ ] Update NEXT_PUBLIC_API_URL in Vercel with backend URL
- [ ] Redeploy frontend in Vercel
- [ ] Test the site!

---

## Expected Result

Your backend should deploy successfully and you'll see:
```
✅ Build succeeded
✅ Deploy succeeded
🚀 Server running on port 3001
```

Then your Vercel frontend will be able to connect to it! 🎉
