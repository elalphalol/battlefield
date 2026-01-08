# BATTLEFIELD Quick Start Guide

## 🚀 5-Minute Setup with Railway

### Step 1: Setup Railway Database (2 minutes)

1. **Go to Railway**: https://railway.app
2. **Sign up with GitHub** (free account)
3. **Create New Project** → **Provision PostgreSQL**
4. **Copy Connection String**:
   - Click on PostgreSQL service
   - Go to "Connect" tab
   - Copy the "Postgres Connection URL"
   - It looks like: `postgresql://user:password@hostname:port/railway`

### Step 2: Configure Backend (1 minute)

Create `backend/.env` file:

```bash
DATABASE_URL=your_railway_connection_url_here
PORT=3001
NODE_ENV=development
```

### Step 3: Install Dependencies (1 minute)

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ..
npm install
```

### Step 4: Setup Database Schema (30 seconds)

```bash
# From root directory
cd whole-number-miniapp
npm install -g pg

# Run schema (replace with your Railway URL)
psql "postgresql://user:pass@hostname:port/railway" < backend/database/schema.sql
```

OR use Railway's built-in SQL Console:
1. Go to Railway dashboard
2. Click PostgreSQL service
3. Click "Query" tab
4. Copy/paste contents of `backend/database/schema.sql`
5. Click "Run"

### Step 5: Start Servers (30 seconds)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd whole-number-miniapp
npm run dev
```

### Step 6: Open App

Visit: http://localhost:3000

---

## ⚡ Super Quick Alternative (Skip Database for Now)

If you want to test frontend only first:

```bash
cd whole-number-miniapp
npm install
npm run dev
```

Open http://localhost:3000

(Some features won't work without backend, but you can see the UI)

---

## 🎯 What You'll See

1. **Connect Wallet** button in header
2. **BTC Price** display (live updates)
3. **Choose Army** (Bears/Bulls)
4. **Paper Money Claim** ($1K every 10 min)
5. **Trading Panel** (open positions)
6. **Leaderboard** tab

---

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Kill the process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Then restart
npm run dev
```

### Railway connection fails
- Make sure you copied the full connection string
- Check Railway dashboard shows database is running
- Try pinging the hostname

### Backend won't start
```bash
# Make sure you're in backend directory
cd backend

# Check .env file exists
dir .env

# Reinstall dependencies
npm install

# Try again
npm run dev
```

---

## ✅ Success Check

Backend running when you see:
```
⚔️  BATTLEFIELD API Server
✅ Server running on port 3001
🗄️  Database: Connected
```

Frontend running when you see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

---

**Need help? Check BASE_SEPOLIA_TESTING_GUIDE.md for detailed instructions!**
