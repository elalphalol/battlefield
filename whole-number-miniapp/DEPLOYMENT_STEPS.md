# 🚀 BATTLEFIELD Deployment Steps - Quick Guide

## Current Status
✅ **Frontend**: Deployed on Vercel (working)  
❌ **Backend**: NOT deployed (causing data issues)  
❌ **Database**: NOT set up

## What You Need to Do

### Step 1: Deploy Backend to Railway (15 minutes)

1. **Go to Railway.app**
   - Visit: https://railway.app/
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `battlefield` repository
   - Railway will auto-detect the backend

3. **Add PostgreSQL Database**
   - In your project, click "+ New"
   - Select "Database" → "PostgreSQL"
   - Railway will create the database automatically

4. **Set Environment Variables**
   - Click on your backend service
   - Go to "Variables" tab
   - Add these variables:
     ```
     NODE_ENV=production
     PORT=3001
     ```
   - `DATABASE_URL` will be auto-added when you link the database

5. **Link Database to Backend**
   - The database should auto-link
   - Verify `DATABASE_URL` appears in your backend variables

6. **Initialize Database Schema**
   - After deployment, click on backend service
   - Go to "Deployments" → "View Logs"
   - In the console tab, run:
     ```bash
     node setup-db.js
     ```

7. **Generate Public Domain**
   - Go to backend service → "Settings" → "Domains"
   - Click "Generate Domain"
   - **Copy this URL** (example: `https://battlefield-backend.up.railway.app`)

### Step 2: Update Vercel Environment Variables (5 minutes)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your BATTLEFIELD project

2. **Add Environment Variable**
   - Go to "Settings" → "Environment Variables"
   - Click "Add New"
   - Enter:
     ```
     Name: NEXT_PUBLIC_API_URL
     Value: [YOUR_RAILWAY_BACKEND_URL]
     ```
     (Paste the Railway URL from Step 1.7)

3. **Redeploy Frontend**
   - Go to "Deployments" tab
   - Click "Redeploy" on the latest deployment
   - OR push a new commit to GitHub to trigger auto-deploy

### Step 3: Test Everything (5 minutes)

1. **Test Backend Health**
   - Open: `https://your-railway-url.up.railway.app/health`
   - Should return: `{"status":"healthy","database":"connected",...}`

2. **Test Frontend**
   - Open your Vercel deployment
   - Connect wallet
   - Check if leaderboard loads
   - Try claiming paper money
   - Try opening a trade

## Troubleshooting

### Backend Not Starting?
- Check Railway logs: Backend Service → "Deployments" → "View Logs"
- Verify `DATABASE_URL` is set
- Make sure you ran `node setup-db.js`

### Frontend Still Not Loading Data?
- Verify `NEXT_PUBLIC_API_URL` is set in Vercel
- Make sure you redeployed after adding the variable
- Check browser console for errors
- Verify Railway backend URL doesn't have trailing slash

### Database Connection Failed?
- Check PostgreSQL service is running in Railway
- Verify the database is linked to backend
- Try manually setting `DATABASE_URL` from PostgreSQL service variables

## Cost Estimate

- **Railway**: $5-8/month
  - Backend hosting: ~$5/month
  - PostgreSQL: ~$1-2/month
  - Free trial: $5 credit to start

- **Vercel**: FREE (Hobby plan)

**Total**: ~$6-8/month

## Important Files Created

1. ✅ `RAILWAY_DEPLOYMENT_GUIDE.md` - Complete deployment guide
2. ✅ `backend/railway.json` - Railway configuration
3. ✅ `app/lib/api.ts` - API configuration (for future updates)

## Next Steps After Deployment

**Note**: The frontend code currently uses hardcoded `localhost:3001` URLs. While the environment variable setup is ready in `app/lib/api.ts`, you'll need to update each component to use it. For now, the deployment will work once you:

1. Deploy backend to Railway ✓
2. Set `NEXT_PUBLIC_API_URL` in Vercel ✓
3. Redeploy frontend ✓

The data should then flow correctly!

## Need Help?

- **Railway Issues**: Check their docs at https://docs.railway.app/
- **Vercel Issues**: Check https://vercel.com/docs
- **Database Issues**: Make sure `setup-db.js` completed successfully

---

🎮 **Ready to deploy?** Start with Step 1 above!
