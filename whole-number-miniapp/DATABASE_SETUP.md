# 🗄️ Database Setup Guide

## The Problem
Your backend is deployed but the database tables haven't been created yet, so no data shows on the website.

## ✅ Solution Options

### Option 1: Use Railway CLI (Recommended - 3 minutes)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```
   This will open a browser window - authorize the CLI

3. **Link to your project**:
   ```bash
   cd whole-number-miniapp/backend
   railway link
   ```
   Select your battlefield project when prompted

4. **Run the setup script**:
   ```bash
   railway run node setup-db.js
   ```

This will create all your database tables!

---

### Option 2: Use PostgreSQL Client (5 minutes)

1. **Get your Database URL**:
   - Railway → PostgreSQL service → **Connect** → Copy **DATABASE_URL**

2. **Install PostgreSQL client** (if you don't have it):
   - Windows: https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Or use online tool: https://sqliteonline.com/

3. **Connect to your database**:
   ```bash
   psql "your-database-url-here"
   ```

4. **Run the schema file**:
   ```bash
   \i whole-number-miniapp/backend/database/schema.sql
   ```

---

### Option 3: Direct SQL (Copy-Paste - 2 minutes)

1. **Get your Database URL**:
   - Railway → PostgreSQL service → **Connect**
   - Copy the **DATABASE_URL**

2. **Use a PostgreSQL GUI Tool**:
   - Download: https://www.pgadmin.org/
   - OR use: https://www.elephantsql.com/sql-browser.html

3. **Connect and run** the SQL from`whole-number-miniapp/backend/database/schema.sql`

---

### Option 4: Modify Backend to Auto-Initialize (Easiest!)

Let me create a modified setup that runs automatically!

---

## 🔍 How to Verify Database is Set Up

### Check from Railway:
1. Go to your **PostgreSQL service** in Railway
2. Click **"Data"** tab
3. You should see these tables:
   - users
   - trades  
   - claims
   - army_stats
   - current_leaderboard
   - system_config

### Test Your Backend:
Visit: `https://your-backend-url.up.railway.app/health`

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

### Test from Frontend:
1. Visit your Vercel site
2. Open browser console (F12)
3. Look for API calls - they should return data, not errors

---

## ⚠️ Common Issues

### "Cannot connect to database"
- **Check** if PostgreSQL service is running in Railway
- **Verify** DATABASE_URL is set in backend environment variables
- **Make sure** backend and database are in the same Railway project

### "Tables already exist"
- This is OK! It means someone already ran the setup
- If data still isn't showing, the issue is with your Vercel environment variable

### Backend returns 500 errors
- **Check** Railway logs for the backend service
- **Look for** database connection errors
- **Verify** DATABASE_URL format is correct

---

## ✅ Quick Checklist

After database setup, verify:
- [ ] PostgreSQL service is running in Railway
- [ ] Backend service is running in Railway
- [ ] Backend `/health` endpoint returns "connected"
- [ ] Vercel has `NEXT_PUBLIC_API_URL` set to backend URL (NOT database!)
- [ ] Vercel site Root Directory is set to `whole-number-miniapp`
- [ ] Can see database tables in Railway Data tab

---

## 🚀 Recommended: Use Railway CLI

The Railway CLI is the easiest way:

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Go to backend directory
cd whole-number-miniapp/backend

# Link project
railway link

# Initialize database
railway run node setup-db.js

# Verify
railway run node -e "console.log('Database URL:', process.env.DATABASE_URL)"
```

Done! Your database is now ready! 🎉
