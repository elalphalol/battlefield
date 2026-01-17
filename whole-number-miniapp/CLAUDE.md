# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BATTLEFIELD (Whole Number War) is a Bitcoin paper trading battle game built as a Farcaster Mini App. Users join either Bears or Bulls armies and compete in leveraged paper trading.

**Live URL:** https://btcbattlefield.com
**Farcaster Mini App:** https://farcaster.xyz/miniapps/5kLec5hSq3bP/battlefield (always use this link for Farcaster posts)

## Common Commands

### Frontend (Next.js)
```bash
cd /var/www/battlefield/whole-number-miniapp
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint
```

### Backend (Express/TypeScript)
```bash
cd /var/www/battlefield/whole-number-miniapp/backend
npm run dev          # Development with hot reload (ts-node-dev)
npm run build        # Compile TypeScript to dist/
npm start            # Run production build (node dist/server.js)
```

### PM2 Process Management
```bash
pm2 restart battlefield-backend    # Restart backend
pm2 restart battlefield-frontend   # Restart frontend
pm2 logs battlefield-backend       # View backend logs
pm2 logs battlefield-frontend      # View frontend logs
pm2 list                           # Show all processes
```

### Database
```bash
# Connect to PostgreSQL
psql -U postgres -d battlefield

# Run migrations (from backend directory)
node setup-db.js
node run-migration.js
```

## Architecture

### Stack
- **Frontend:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **Backend:** Express.js, TypeScript, PostgreSQL 16
- **Blockchain:** Base L2 via OnchainKit, Wagmi, Viem
- **Social:** Farcaster MiniApp SDK
- **Monitoring:** Sentry
- **Reverse Proxy:** nginx with Cloudflare SSL

### Directory Structure
```
/var/www/battlefield/whole-number-miniapp/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (frame, share-card)
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks (useBTCPrice, usePaperTrading, etc.)
│   ├── lib/               # Utilities (api.ts, strategy.ts, farcaster.ts)
│   ├── config/            # API configuration
│   └── [routes]/          # Page routes (battle, battlefield, learn, profile)
├── backend/
│   ├── server.ts          # Main Express server (all routes)
│   ├── database/          # SQL schemas and migrations
│   └── dist/              # Compiled JavaScript
└── public/                # Static assets
```

### Key Files
- `backend/server.ts` - All API endpoints (users, trades, claims, leaderboard, army stats)
- `app/lib/api.ts` - Frontend API client
- `app/hooks/useBTCPrice.ts` - Real-time Bitcoin price fetching
- `app/hooks/usePaperTrading.ts` - Trading state management
- `app/components/TradingPanel.tsx` - Main trading interface
- `backend/database/schema.sql` - Complete database schema with triggers

### API Endpoints (Backend port 3001)
- `GET /health` - Health check
- `POST /api/users` - Create/update user
- `GET /api/users/:walletAddress` - Get user
- `GET /api/profile/:identifier` - Get user profile (by FID, wallet, or username)
- `POST /api/trades/open` - Open position
- `POST /api/trades/close` - Close position
- `GET /api/leaderboard` - Get rankings
- `GET /api/army/stats` - Bears vs Bulls statistics
- `GET /api/referrals/:walletAddress` - Get referral data
- `POST /api/referrals/apply` - Apply a referral code
- `POST /api/referrals/claim` - Claim referral rewards
- `POST /api/referrals/cancel` - Cancel pending referral (before claiming)

### Database Tables
- `users` - Player accounts, balances, stats, referral_code
- `trades` - Open/closed positions with P&L
- `claims` - Paper money claim history
- `referrals` - Referral relationships and claim status
- `missions` - Available missions
- `user_missions` - User mission progress and claims
- `army_stats` - Cached Bears/Bulls statistics
- `achievements` - Player achievements
- `leaderboard_snapshot` - Historical rankings

### Environment Variables
Frontend (`.env.local`):
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` - Coinbase OnchainKit key
- `NEXT_PUBLIC_CHAIN_ID` - Base network (8453 mainnet)

Backend (`.env`):
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (3001)

## Deployment

Services are managed by PM2:
- `battlefield-frontend` - Next.js on port 3000
- `battlefield-backend` - Express on port 3001

nginx proxies requests:
- `/api/*` → localhost:3001 (backend)
- `/*` → localhost:3000 (frontend)

After code changes:
```bash
# Backend
cd /var/www/battlefield/whole-number-miniapp/backend
npm run build && pm2 restart battlefield-backend

# Frontend
cd /var/www/battlefield/whole-number-miniapp
npm run build && pm2 restart battlefield-frontend
```
