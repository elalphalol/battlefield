# 🚂 Railway Backend Deployment Guide

## Step 1: Deploy Backend to Railway

### 1.1 Install Railway CLI (Optional)
```bash
npm install -g @railway/cli
```

### 1.2 Prepare Backend for Deployment

Create a `railway.json` in the `backend` folder:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 1.3 Deploy via Railway Dashboard (RECOMMENDED)

1. **Go to Railway**: https://railway.app/
2. **Sign up/Login** with GitHub
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Connect your GitHub** and select your `battlefield` repository
6. **Railway will auto-detect** the backend folder

### 1.4 Or Deploy via CLI
```bash
cd whole-number-miniapp/backend
railway login
railway init
railway up
```

## Step 2: Set Up PostgreSQL Database on Railway

### 2.1 Add PostgreSQL Service
1. In your Railway project dashboard
2. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically provision a PostgreSQL database

### 2.2 Get Database Connection String
1. Click on your **PostgreSQL service**
2. Go to **"Variables"** tab
3. Copy the **`DATABASE_URL`** value
   - It will look like: `postgresql://postgres:password@region.railway.app:5432/railway`

## Step 3: Configure Backend Environment Variables

### 3.1 Set Environment Variables in Railway

In your **Backend service** (not the database):

1. Go to **"Variables"** tab
2. Click **"+ New Variable"**
3. Add these variables:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=[YOUR_POSTGRESQL_DATABASE_URL_FROM_STEP_2.2]
```

**Note**: Railway will automatically provide the `DATABASE_URL` if you link the database

### 3.2 Link Database to Backend (Automatic Connection)
1. In your backend service
2. Click **"Settings"** → **"Service Variables"**  
3. Look for **"Add Reference"** or the database should auto-link
4. The `DATABASE_URL` will be automatically injected

## Step 4: Initialize Database Schema

After deploying, you need to set up the database tables.

### 4.1 Run Database Setup

**Option A: Via Railway CLI**
```bash
# Connect to your Railway project
railway link

# Run the setup script
railway run node backend/setup-db.js
```

**Option B: Via Railway Dashboard**
1. Go to your backend service
2. Click **"Deployments"** tab
3. Find the latest deployment
4. Click **"View Logs"**
5. In the **"Console"** tab, run:
```bash
node setup-db.js
```

**Option C: Connect Directly to PostgreSQL**
1. Get the `DATABASE_URL` from Railway
2. Use a PostgreSQL client (TablePlus, pgAdmin, DBeaver)
3. Run the SQL from `backend/database/schema.sql` manually

## Step 5: Get Your Backend URL

### 5.1 Find Your Railway Backend URL
1. In Railway dashboard, click your **backend service**
2. Go to **"Settings"** → **"Domains"**
3. Click **"Generate Domain"**
4. You'll get a URL like: `https://your-app-name.up.railway.app`

**Copy this URL** - you'll need it for the frontend!

## Step 6: Update Frontend Environment Variables

### 6.1 Update Vercel Environment Variables

1. Go to your **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **BATTLEFIELD project**
3. Go to **"Settings"** → **"Environment Variables"**
4. Add a new variable:

```
Name: NEXT_PUBLIC_API_URL
Value: https://your-app-name.up.railway.app
```

5. Click **"Save"**

### 6.2 Update Frontend Code (for environment variable usage)

You need to update your frontend code to use the environment variable instead of hardcoded localhost.

Create a file: `whole-number-miniapp/lib/api.ts`
```typescript
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

## Step 7: Redeploy Frontend on Vercel

After setting the environment variable:

1. Go to **Vercel Dashboard**
2. Select your project
3. Go to **"Deployments"**
4. Click **"Redeploy"** on the latest deployment
   - Or push a new commit to trigger auto-deployment

## Step 8: Test the Connection

### 8.1 Test Backend Health Check
Open in browser:
```
https://your-app-name.up.railway.app/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

### 8.2 Test Frontend
1. Open your Vercel deployment
2. Connect your wallet
3. Try to:
   - View leaderboard
   - Claim paper money
   - Open a trade
   - Check your balance

## Troubleshooting

### Backend Not Starting
- **Check Logs**: Railway Dashboard → Backend Service → "Deployments" → "View Logs"
- **Common Issue**: Database not connected
  - Solution: Verify `DATABASE_URL` is set correctly
  - Make sure you ran `setup-db.js`

### CORS Errors
The backend already has CORS enabled in `server.ts`:
```typescript
app.use(cors());
```

If you still get CORS errors, update to:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app'
  ]
}));
```

### Database Connection Errors
- **Check**: DATABASE_URL format is correct
- **Check**: PostgreSQL service is running in Railway
- **Check**: SSL settings (Railway uses SSL by default)

### Frontend Still Uses Localhost
- **Verify**: Environment variable is set in Vercel
- **Verify**: You redeployed after setting the variable
- **Check**: Browser console for any errors

## Railway Pricing

Railway offers:
- **Free Trial**: $5 credit (good for testing)
- **Developer Plan**: $5/month + usage
- **PostgreSQL**: ~$1-2/month for small database

Estimated cost for BATTLEFIELD: **$6-8/month**

## Quick Checklist

- [ ] Backend deployed to Railway
- [ ] PostgreSQL database created
- [ ] Environment variables set (NODE_ENV, PORT, DATABASE_URL)
- [ ] Database schema initialized (run setup-db.js)
- [ ] Backend domain generated and copied
- [ ] NEXT_PUBLIC_API_URL set in Vercel
- [ ] Frontend redeployed on Vercel
- [ ] Health check endpoint working
- [ ] Tested: Leaderboard loads
- [ ] Tested: Can claim paper money
- [ ] Tested: Can open/close trades

## Support

- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Need help? Check Railway logs first!

---

🎮 Once deployed, your BATTLEFIELD game will be fully operational with persistent data!
