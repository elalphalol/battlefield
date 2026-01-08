# BATTLEFIELD - Base Sepolia Testing Guide

Complete guide for testing BATTLEFIELD on Base Sepolia testnet before mainnet launch.

---

## 📋 Prerequisites

### 1. System Requirements
- **Node.js** 18+ installed
- **PostgreSQL** 14+ installed
- **Git** installed
- **MetaMask** or compatible wallet
- **Base Sepolia ETH** for gas fees

### 2. Get Base Sepolia ETH
- Visit [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- Or use [Alchemy Faucet](https://sepoliafaucet.com/)
- You need ~0.1 ETH for testing

---

## 🚀 Step 1: Setup PostgreSQL Database

### Option A: Local PostgreSQL

```bash
# 1. Install PostgreSQL (if not installed)
# Windows: Download from https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# 2. Start PostgreSQL service
# Windows: Service starts automatically
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# 3. Create database
psql postgres
CREATE DATABASE battlefield;
\q

# 4. Run schema
cd whole-number-miniapp/backend/database
psql battlefield < schema.sql

# 5. Verify setup
psql battlefield -c "SELECT * FROM army_stats;"
psql battlefield -c "SELECT * FROM system_config;"
```

### Option B: Cloud PostgreSQL (Railway - Recommended for testing)

```bash
# 1. Sign up at https://railway.app
# 2. Create new project → Add PostgreSQL
# 3. Copy DATABASE_URL (looks like: postgresql://user:pass@host:5432/railway)
# 4. Connect and run schema
psql "postgresql://user:pass@host:5432/railway" < backend/database/schema.sql
```

### Option C: Supabase (Free tier available)

```bash
# 1. Sign up at https://supabase.com
# 2. Create new project
# 3. Go to Settings → Database → Connection string
# 4. Use SQL Editor to paste schema.sql contents
```

---

## 🔧 Step 2: Configure Environment Variables

### Backend Environment (.env in backend directory)

```bash
# Create backend/.env file
cd backend
cat > .env << EOL
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/battlefield

# Server
PORT=3001
NODE_ENV=development

# Base Sepolia (for future blockchain integration)
CHAIN_ID=84532
RPC_URL=https://sepolia.base.org

# Optional: If you have a rewards wallet
REWARDS_WALLET_ADDRESS=0x...
REWARDS_WALLET_PRIVATE_KEY=0x...
EOL
```

### Frontend Environment (.env.local in root)

```bash
# Create .env.local file in whole-number-miniapp/
cd ..
cat > .env.local << EOL
# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Base Sepolia RPC
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

EOL
```

---

## 📦 Step 3: Install Dependencies

### Backend Dependencies

```bash
cd backend
npm install

# Verify installation
npm list
```

### Frontend Dependencies

```bash
cd ..
npm install

# Verify installation
npm list
```

---

## 🏃 Step 4: Start Development Servers

### Terminal 1: Start Backend

```bash
cd backend
npm run dev

# You should see:
# ⚔️  BATTLEFIELD API Server
# 🐻 Bears vs Bulls 🐂
# ✅ Server running on port 3001
# 🗄️  Database: Connected
```

### Terminal 2: Start Frontend

```bash
cd whole-number-miniapp
npm run dev

# You should see:
# ▲ Next.js 14.x.x
# - Local:        http://localhost:3000
```

---

## 🧪 Step 5: Test Application Locally

### 1. Open Browser
```
http://localhost:3000
```

### 2. Connect Wallet
- Click "Connect Wallet"
- Connect MetaMask
- Switch to Base Sepolia network
  - Network Name: Base Sepolia
  - RPC URL: https://sepolia.base.org
  - Chain ID: 84532
  - Currency Symbol: ETH
  - Block Explorer: https://sepolia.basescan.org

### 3. Test User Flow

#### A. Choose Army
- ✅ Select Bears 🐻 or Bulls 🐂
- ✅ Verify army selection saves
- ✅ Check user stats bar appears

#### B. Claim Paper Money
- ✅ Click "Claim $1,000 Now!"
- ✅ Verify balance increases to $11,000
- ✅ Wait 10 minutes, claim again
- ✅ Check cooldown timer works

#### C. Open Trading Position
- ✅ Select LONG or SHORT
- ✅ Choose leverage (10x, 25x, 50x, 100x)
- ✅ Set position size ($100-$5000)
- ✅ Click "Open Position"
- ✅ Verify position appears in "Open Positions"
- ✅ Check liquidation price calculation

#### D. Monitor Position
- ✅ Watch real-time P&L updates
- ✅ Verify liquidation warning at -90%
- ✅ Close position
- ✅ Check balance updates correctly

#### E. Check Leaderboard
- ✅ Switch to "Leaderboard" tab
- ✅ Verify your rank appears
- ✅ Filter by army (All/Bears/Bulls)
- ✅ Check stats display correctly

### 4. Test Backend API Directly

```bash
# Health check
curl http://localhost:3001/health

# Create user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "fid": 12345,
    "walletAddress": "0x1234567890123456789012345678901234567890",
    "username": "TestTrader",
    "army": "bulls"
  }'

# Get leaderboard
curl http://localhost:3001/api/leaderboard?limit=10

# Get army stats
curl http://localhost:3001/api/army/stats
```

---

## 🌐 Step 6: Deploy to Base Sepolia Testnet

### Option A: Vercel (Frontend)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd whole-number-miniapp
vercel

# 4. Add environment variables in Vercel dashboard
# Go to: Settings → Environment Variables
# Add all variables from .env.local
```

### Option B: Railway (Backend + Database)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
cd backend
railway init

# 4. Add PostgreSQL
railway add postgresql

# 5. Deploy
railway up

# 6. Get deployment URL
railway status
# Note the URL (e.g., https://battlefield-backend-production.up.railway.app)

# 7. Update frontend .env.local with new backend URL
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### Option C: Render (Full Stack)

```bash
# 1. Go to https://render.com
# 2. Connect GitHub repository
# 3. Create Web Service (Backend)
#    - Build Command: cd backend && npm install && npm run build
#    - Start Command: cd backend && npm start
#    - Add environment variables
# 4. Create Web Service (Frontend)
#    - Build Command: npm install && npm run build
#    - Start Command: npm start
#    - Add environment variables
```

---

## 🔍 Step 7: Testing Checklist

### Core Functionality
- [ ] User registration/login works
- [ ] Army selection works
- [ ] Paper money claims work (10 min cooldown)
- [ ] Trading positions open correctly
- [ ] Real-time P&L calculations accurate
- [ ] Liquidation warnings appear
- [ ] Positions close correctly
- [ ] Leaderboard displays properly
- [ ] Army stats update

### Edge Cases
- [ ] Insufficient balance prevents trading
- [ ] Can't claim before cooldown ends
- [ ] Liquidation at -100% works
- [ ] Multiple positions track correctly
- [ ] Large numbers format properly
- [ ] Mobile responsive design works

### Performance
- [ ] Page loads in <3 seconds
- [ ] BTC price updates every 5 seconds
- [ ] No memory leaks on long sessions
- [ ] Smooth animations
- [ ] Quick API responses (<500ms)

### Security
- [ ] Wallet connection secure
- [ ] API endpoints protected
- [ ] SQL injection prevented
- [ ] XSS protection enabled
- [ ] CORS configured correctly

---

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
# Windows: services.msc → PostgreSQL
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# Test connection
psql postgresql://username:password@localhost:5432/battlefield

# Check .env DATABASE_URL is correct
```

### Backend Won't Start
```bash
# Check port 3001 is available
# Windows: netstat -ano | findstr :3001
# Mac/Linux: lsof -i :3001

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend Errors
```bash
# Check Next.js version
npm list next

# Clear .next cache
rm -rf .next
npm run dev

# Check all environment variables set
cat .env.local
```

### Wallet Connection Issues
- Make sure MetaMask is unlocked
- Switch to Base Sepolia network
- Clear MetaMask activity data
- Try different wallet (WalletConnect, Coinbase Wallet)

### API Requests Failing
```bash
# Check CORS settings in backend/server.ts
# Make sure frontend URL is allowed

# Test with curl
curl -v http://localhost:3001/health

# Check browser console for errors
```

---

## 📊 Monitoring & Logs

### Backend Logs
```bash
# Watch logs in real-time
cd backend
npm run dev

# Logs show:
# - API requests
# - Database queries
# - Errors and warnings
```

### Database Queries
```bash
# Monitor active connections
psql battlefield -c "SELECT * FROM pg_stat_activity;"

# Check table sizes
psql battlefield -c "
  SELECT tablename, 
    pg_size_pretty(pg_total_relation_size(tablename::text)) 
  FROM pg_tables 
  WHERE schemaname = 'public';"

# View recent trades
psql battlefield -c "SELECT * FROM trades ORDER BY opened_at DESC LIMIT 10;"
```

### Frontend Logs
- Open Browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls
- Check Application tab for state

---

## 🎯 Success Criteria

Before moving to mainnet, ensure:

✅ **Stability**
- [ ] No crashes after 1 hour of use
- [ ] All API calls succeed
- [ ] No database errors

✅ **Accuracy**
- [ ] P&L calculations correct
- [ ] Liquidation prices accurate
- [ ] Leaderboard rankings proper
- [ ] Balance updates precise

✅ **Performance**
- [ ] <2s page load time
- [ ] <500ms API response time
- [ ] Smooth real-time updates
- [ ] No lag on interactions

✅ **Security**
- [ ] Input validation works
- [ ] SQL injection blocked
- [ ] XSS protection active
- [ ] Rate limiting enabled

---

## 🚀 Next Steps After Testing

1. **Fix any bugs found**
2. **Optimize performance**
3. **Add rate limiting**
4. **Set up monitoring (Sentry, LogRocket)**
5. **Deploy $BATTLE token on Clanker.world**
6. **Launch on Farcaster!** 🎉

---

## 📞 Support

- **GitHub**: https://github.com/elalphalol/battlefield
- **Documentation**: See README files in each directory
- **Database Schema**: backend/database/schema.sql
- **API Docs**: backend/README.md

---

**⚔️ Bears 🐻 vs Bulls 🐂 - Let the BATTLEFIELD begin!**
