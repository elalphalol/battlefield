# 🚀 FARCASTER MINI APP CONVERSION GUIDE
## BATTLEFIELD - Farcaster Mini App Documentation

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [What is a Farcaster Mini App?](#what-is-a-farcaster-mini-app)
3. [Prerequisites](#prerequisites)
4. [Architecture Overview](#architecture-overview)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Clanker.world Token Integration](#clankerworld-token-integration)
7. [Paper Money System](#paper-money-system)
8. [Deployment Guide](#deployment-guide)
9. [Testing & Verification](#testing-verification)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This documentation guides you through converting the **BATTLEFIELD** strategy app into a fully-functional **Farcaster Mini App** using Base's OnchainKit and Farcaster's MiniKit. The mini app will enable users to:

- View the app directly within Farcaster/Warpcast
- Connect their Ethereum wallet seamlessly
- Join Bear Army 🐻 or Bull Army 🐂
- Trade with paper money ($10,000 starting balance)
- Earn $BATTLE tokens from Clanker.world
- Claim $1,000 paper money every 10 minutes
- Compete on leaderboards for token rewards
- Share their trading results and achievements
- Interact with smart contracts for rewards and NFT badges

**Key Features:**
- **Paper Money Trading**: Start with $10K, trade with leverage (10x-100x)
- **Army Warfare**: Bears vs Bulls - pick your side
- **$BATTLE Token**: 100 Billion supply on Clanker.world
- **Auto Rewards**: AI-managed wallet distributes tokens weekly/monthly
- **Liquidation**: Get liquidated at -100%, recharge every 10 minutes
- **Testnet First**: Full testing on Base Sepolia before mainnet

---

## 🤔 What is a Farcaster Mini App?

**Farcaster Mini Apps** are interactive applications that run inside Farcaster clients (like Warpcast). They provide:

- **Embedded Experience**: Apps run directly in the Farcaster feed
- **Wallet Integration**: Seamless connection to users' Ethereum wallets
- **Social Features**: Native sharing and casting capabilities
- **Onchain Interactions**: Built on Base L2 for low-cost transactions
- **Clanker Integration**: Deploy tokens natively on Farcaster

**Key Components:**
- **Frames**: The UI container that displays your app
- **OnchainKit**: Base's toolkit for blockchain interactions
- **MiniKit**: Farcaster's SDK for mini app functionality
- **Base Network**: Ethereum L2 where transactions occur
- **Clanker.world**: Farcaster's native token launchpad

---

## 📦 Prerequisites

### Required Knowledge
- ✅ Basic HTML, CSS, JavaScript
- ✅ React fundamentals (we'll be converting to React)
- ✅ Basic understanding of Web3/Ethereum
- ✅ Familiarity with npm/package management
- ✅ PostgreSQL for paper trading backend

### Required Tools
```bash
# Node.js (v18 or higher)
node --version  # Should be v18+

# npm or yarn
npm --version   # v9+

# PostgreSQL (for paper trading database)
psql --version

# Git (for version control)
git --version

# Code editor (VS Code recommended)
```

### Required Accounts
1. **Coinbase Developer Account**: For OnchainKit API keys
2. **Farcaster Account**: For testing and Clanker deployment
3. **Base Wallet**: For onchain interactions
4. **Vercel/Railway Account**: For deployment
5. **Clanker Access**: For deploying $BATTLE token

---

## 🏗️ Architecture Overview

### Current Structure (Vanilla JS)
```
whole-number/
├── index.html          # Main HTML structure
├── style.css           # Styling
├── script.js           # Core logic
├── README.md
└── assets/
```

### Target Structure (BATTLEFIELD Mini App)
```
battlefield-miniapp/
├── package.json
├── next.config.js
├── public/
│   ├── opengraph-image.png    # Frame preview image
│   └── icon.png                # App icon
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Main app page
│   ├── api/
│   │   ├── frame/route.ts      # Frame API endpoint
│   │   ├── trade/route.ts      # Paper trading API
│   │   ├── claim/route.ts      # Paper money claim API
│   │   └── leaderboard/route.ts # Leaderboard API
│   ├── components/
│   │   ├── WalletConnect.tsx   # Wallet connection UI
│   │   ├── ArmySelection.tsx   # Choose Bear/Bull army
│   │   ├── BattleField.tsx     # Main battlefield component
│   │   ├── PaperTrading.tsx    # Trading panel with leverage
│   │   ├── PaperMoneyClaim.tsx # Claim $1K every 10 min
│   │   ├── Leaderboard.tsx     # Rankings display
│   │   └── ShareButton.tsx     # Social sharing
│   ├── hooks/
│   │   ├── usePaperTrading.ts  # Paper trading logic
│   │   ├── useClaim.ts         # Claim cooldown logic
│   │   └── useArmy.ts          # Army selection logic
│   └── lib/
│       ├── strategy.ts         # Core whole number strategy
│       ├── onchain.ts          # OnchainKit utilities
│       ├── minikit.ts          # MiniKit utilities
│       └── database.ts         # PostgreSQL connection
├── backend/
│   ├── server.ts               # Express backend
│   ├── database/
│   │   ├── schema.sql          # Database schema
│   │   └── queries.ts          # Database queries
│   ├── rewards/
│   │   └── distributor.ts      # Auto rewards distribution
│   └── middleware/
│       └── auth.ts             # Wallet verification
└── .env.local                  # Environment variables
```

---

## 🔨 Step-by-Step Implementation

### STEP 1: Project Setup

#### 1.1 Create Next.js App
```bash
# Create new Next.js app
npx create-next-app@latest battlefield-miniapp

# When prompted:
# ✓ Would you like to use TypeScript? › Yes
# ✓ Would you like to use ESLint? › Yes
# ✓ Would you like to use Tailwind CSS? › Yes
# ✓ Would you like to use `src/` directory? › No
# ✓ Would you like to use App Router? › Yes
# ✓ Would you like to customize the default import alias? › No

cd battlefield-miniapp
```

#### 1.2 Install Required Dependencies
```bash
# Install OnchainKit
npm install @coinbase/onchainkit

# Install Wagmi & Viem (Web3 libraries)
npm install wagmi viem@2.x

# Install TanStack Query (for data fetching)
npm install @tanstack/react-query

# Install Farcaster SDK
npm install @farcaster/frame-sdk

# Install Backend dependencies
npm install express cors dotenv pg
npm install --save-dev @types/express @types/pg

# Install utilities
npm install date-fns axios zod
```

#### 1.3 Setup Environment Variables
Create `.env.local` in the root directory:
```bash
# Coinbase Developer Platform API Key
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here

# Base Network Configuration
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia (for testing)
# NEXT_PUBLIC_CHAIN_ID=8453  # Base Mainnet (for production)

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-domain.com

# Clanker Token (after deployment)
NEXTanım_PUBLIC_BATTLE_TOKEN_ADDRESS=0x...
REWARDS_WALLET_ADDRESS=0x...
REWARDS_WALLET_PRIVATE_KEY=...  # SECURE THIS!

# PostgreSQL Database
DATABASE_URL=postgresql://user:password@localhost:5432/battlefield

# Optional
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

**To get your OnchainKit API Key:**
1. Go to [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a new project
3. Copy your API key

---

### STEP 2: Database Setup

#### 2.1 Create PostgreSQL Database
```bash
# Create database
createdb battlefield

# Run schema
psql battlefield < backend/database/schema.sql
```

#### 2.2 Database Schema (`backend/database/schema.sql`)
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  fid INTEGER UNIQUE NOT NULL,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  username VARCHAR(255),
  army VARCHAR(10) CHECK (army IN ('bears', 'bulls')),
  paper_balance DECIMAL(18, 2) DEFAULT 10000.00,
  last_claim_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trades table
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  position_type VARCHAR(10) CHECK (position_type IN ('long', 'short')),
  leverage INTEGER CHECK (leverage IN (10, 25, 50, 100)),
  entry_price DECIMAL(18, 2),
  exit_price DECIMAL(18, 2),
  position_size DECIMAL(18, 2),
  pnl DECIMAL(18, 2),
  status VARCHAR(20) CHECK (status IN ('open', 'closed', 'liquidated')),
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

-- Claims table
CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(18, 2) DEFAULT 1000.00,
  claimed_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard snapshots
CREATE TABLE leaderboard_snapshot (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  rank INTEGER,
  score DECIMAL(18, 2),
  total_pnl DECIMAL(18, 2),
  win_rate DECIMAL(5, 2),
  snapshot_date DATE,
  period VARCHAR(20) CHECK (period IN ('weekly', 'monthly', 'all_time'))
);

-- Rewards history
CREATE TABLE rewards_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount BIGINT,
  reason VARCHAR(255),
  tx_hash VARCHAR(66),
  distributed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_fid ON users(fid);
CREATE INDEX idx_trades_user ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(status);
CREATE INDEX idx_leaderboard_period ON leaderboard_snapshot(period, snapshot_date);
```

---

### STEP 3: Backend API Setup

#### 3.1 Create Express Server (`backend/server.ts`)
```typescript
import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(express.json());

// Paper money claim endpoint
app.post('/api/claim', async (req, res) => {
  const { walletAddress } = req.body;
  
  try {
    // Check last claim time
    const user = await pool.query(
      'SELECT last_claim_time FROM users WHERE wallet_address = $1',
      [walletAddress]
    );
    
    const lastClaim = user.rows[0]?.last_claim_time;
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    
    if (lastClaim && lastClaim > tenMinutesAgo) {
      const timeLeft = Math.ceil((lastClaim.getTime() + 10 * 60 * 1000 - now.getTime()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Cooldown active. ${timeLeft}s remaining.`
      });
    }
    
    // Add $1,000 and update claim time
    await pool.query(
      'UPDATE users SET paper_balance = paper_balance + 1000, last_claim_time = NOW() WHERE wallet_address = $1',
      [walletAddress]
    );
    
    // Log claim
    await pool.query(
      'INSERT INTO claims (user_id, amount) SELECT id, 1000 FROM users WHERE wallet_address = $1',
      [walletAddress]
    );
    
    res.json({ success: true, amount: 1000 });
  } catch (error) {
    res.status(500).json({ success:  false, error: 'Claim failed' });
  }
});

// Open trade endpoint
app.post('/api/trade/open', async (req, res) => {
  const { walletAddress, type, leverage, size, entryPrice } = req.body;
  
  try {
    // Validate user has enough paper balance
    const user = await pool.query(
      'SELECT paper_balance FROM users WHERE wallet_address = $1',
      [walletAddress]
    );
    
    if (user.rows[0].paper_balance < size) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    
    // Deduct from balance and create trade
    await pool.query('BEGIN');
    
    await pool.query(
      'UPDATE users SET paper_balance = paper_balance - $1 WHERE wallet_address = $2',
      [size, walletAddress]
    );
    
    const trade = await pool.query(
      `INSERT INTO trades (user_id, position_type, leverage, entry_price, position_size, status)
       SELECT id, $1, $2, $3, $4, 'open' FROM users WHERE wallet_address = $5
       RETURNING *`,
      [type, leverage, entryPrice, size, walletAddress]
    );
    
    await pool.query('COMMIT');
    
    res.json({ success: true, trade: trade.rows[0] });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ success: false, error: 'Trade failed' });
  }
});

// Close trade endpoint
app.post('/api/trade/close', async (req, res) => {
  const { tradeId, exitPrice } = req.body;
  
  try {
    await pool.query('BEGIN');
    
    // Get trade details
    const trade = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND status = \'open\'',
      [tradeId]
    );
    
    if (trade.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trade not found' });
    }
    
    const t = trade.rows[0];
    
    // Calculate P&L
    const priceChange = t.position_type === 'long' 
      ? exitPrice - t.entry_price 
      : t.entry_price - exitPrice;
    const pnl = (priceChange / t.entry_price) * t.leverage * t.position_size;
    
    // Update trade
    await pool.query(
      'UPDATE trades SET exit_price = $1, pnl = $2, status = $3, closed_at = NOW() WHERE id = $4',
      [exitPrice, pnl, pnl <= -t.position_size ? 'liquidated' : 'closed', tradeId]
    );
    
    // Update user balance
    const finalAmount = t.position_size + pnl;
    if (finalAmount > 0) {
      await pool.query(
        'UPDATE users SET paper_balance = paper_balance + $1 WHERE id = $2',
        [finalAmount, t.user_id]
      );
    }
    
    await pool.query('COMMIT');
    
    res.json({ success: true, pnl, status: pnl <= -t.position_size ? 'liquidated' : 'closed' });
  } catch (error) {
    await pool.query('ROLLBACK');
    res.status(500).json({ success: false, error: 'Close failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
```

---

### STEP 4: Frontend Components

#### 4.1 Update `app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BATTLEFIELD - BTC Strategy Battle',
  description: 'The Epic War Between BEAR ARMY 🐻 vs BULL ARMY 🐂 - Earn $BATTLE tokens!',
  openGraph: {
    type: 'website',
    title: 'BATTLEFIELD',
    description: 'Bitcoin paper trading battle game in Farcaster. Join Bears or Bulls!',
    images: ['/opengraph-image.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': `${process.env.NEXT_PUBLIC_APP_URL}/opengraph-image.png`,
    'fc:frame:button:1': 'Launch App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': process.env.NEXT_PUBLIC_APP_URL || '',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

#### 4.2 Create Paper Money Claim Component
```typescript
// app/components/PaperMoneyClaim.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function PaperMoneyClaim() {
  const { address } = useAccount();
  const [canClaim, setCanClaim] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    // Check claim status every second
    const interval = setInterval(async () => {
      if (!address) return;
      
      const response = await fetch('/api/claim/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      setCanClaim(data.canClaim);
      setTimeLeft(data.timeLeft || 0);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [address]);

  const handleClaim = async () => {
    if (!address || !canClaim) return;
    
    setClaiming(true);
    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('✅ Claimed $1,000 paper money!');
      }
    } catch (error) {
      alert('❌ Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-green-900/30 border-2 border-green-500 rounded-lg p-4">
      <h3 className="text-xl font-bold text-green-400 mb-2">💰 Paper Money Claim</h3>
      <p className="text-gray-300 mb-4">Claim $1,000 every 10 minutes</p>
      
      {canClaim ? (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold w-full disabled:opacity-50"
        >
          {claiming ? 'Claiming...' : 'Claim $1,000 Now!'}
        </button>
      ) : (
        <div className="text-center">
          <p className="text-yellow-400 text-2xl font-bold">{formatTime(timeLeft)}</p>
          <p className="text-gray-400 text-sm">Next claim available</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🪙 Clanker.world Token Integration

### Deploying $BATTLE on Clanker

**Step 1: Prepare for Deployment**
1. Have a Farcaster account with good standing
2. Prepare deployment message:
   ```
   Deploy $BATTLE - BATTLEFIELD
   
   Total Supply: 100,000,000,000
   The epic war between Bear Army 🐻 and Bull Army 🐂
   
   Trade BTC with paper money, earn $BATTLE tokens on the leaderboard!
   ```

**Step 2: Deploy via Clanker**
1. Tag @clanker in a cast with your deployment message
2. Wait for Clanker to deploy the token
3. Clanker will provide the token contract address
4. Add the address to your `.env.local`

**Step 3: Token Distribution**
- **50%** (50B) - Transfer to rewards wallet (AI-managed for automated distribution)
- **20%**  (20B) - Liquidity pool (Clanker handles initial liquidity)
- **15%** (15B) - Community treasury wallet
- **10%** (10B) - Development wallet  
- **5%** (5B) - Your distribution wallet

**Step 4: Setup Rewards Wallet**
```typescript
// backend/rewards/distributor.ts
import { ethers } from 'ethers';

const BATTLE_TOKEN_ABI = [/* ERC-20 ABI */];

export class RewardsDistributor {
  private wallet: ethers.Wallet;
  private token: ethers.Contract;
  
  constructor() {
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    this.wallet = new ethers.Wallet(process.env.REWARDS_WALLET_PRIVATE_KEY!, provider);
    this.token = new ethers.Contract(
      process.env.NEXT_PUBLIC_BATTLE_TOKEN_ADDRESS!,
      BATTLE_TOKEN_ABI,
      this.wallet
    );
  }
  
  async distributeWeeklyRewards(winners: Array<{address: string, rank: number}>) {
    const rewards = [5000000, 3000000, 2000000, ...Array(7).fill(1000000)];
    
    for (let i = 0; i < winners.length; i++) {
      const amount = ethers.utils.parseUnits(rewards[i].toString(), 18);
      await this.token.transfer(winners[i].address, amount);
      console.log(`Sent ${rewards[i]} $BATTLE to ${winners[i].address}`);
    }
  }
}
```

---

## 💰 Paper Money System Implementation

### Key Features
- **Starting Balance**: $10,000 per user
- **Liquidation**: At -100% position loss
- **Recharge**: $1,000 every 10 minutes (free)
- **Future**: Buy paper money with $BATTLE tokens

### Frontend Hook (`app/hooks/usePaperTrading.ts`)
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

export function usePaperTrading() {
  const { address } = useAccount();
  const [balance, setBalance] = useState(10000);
  const [positions, setPositions] = useState([]);
  
  const openTrade = async (type: 'long' | 'short', leverage: number, size: number, entryPrice: number) => {
    const response = await fetch('/api/trade/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: address,
        type,
        leverage,
        size,
        entryPrice
      })
    });
    
    const data = await response.json();
    if (data.success) {
      setPositions([...positions, data.trade]);
      setBalance(balance - size);
    }
    return data;
  };
  
  const closeTrade = async (tradeId: number, exitPrice: number) => {
    const response = await fetch('/api/trade/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tradeId, exitPrice })
    });
    
    const data = await response.json();
    if (data.success) {
      // Update positions and balance
      setPositions(positions.filter(p => p.id !== tradeId));
      if (data.status !== 'liquidated') {
        // Add back position size + PnL
      }
    }
    return data;
  };
  
  return { balance, positions, openTrade, closeTrade };
}
```

---

## 🚀 Deployment Guide

### Phase 1: Testnet Deployment (Base Sepolia)

```bash
# 1. Build the frontend
npm run build

# 2. Deploy to Vercel
vercel --prod

# 3. Setup PostgreSQL on Railway/Supabase
# Add DATABASE_URL to environment variables

# 4. Deploy backend
# Use Railway or similar for Node.js backend

# 5. Test everything on Base Sepolia
```

### Phase 2: Mainnet Launch

```bash
# 1. Deploy $BATTLE on Clanker.world
# Tag @clanker with deployment message

# 2. Update environment variables with mainnet addresses
# NEXT_PUBLIC_CHAIN_ID=8453
# NEXT_PUBLIC_BATTLE_TOKEN_ADDRESS=...

# 3. Transfer 50B tokens to rewards wallet

# 4. Deploy to production
vercel --prod --env production

# 5. Announce on Farcaster! 🚀
```

---

## 🧪 Testing & Verification

### Testnet Testing Checklist

- [ ] Wallet connection works
- [ ] Army selection saves correctly
- [ ] Paper money starts at $10,000
- [ ] Can open long/short positions
- [ ] Leverage calculations correct (10x, 25x, 50x, 100x)
- [ ] Liquidation triggers at -100%
- [ ] Claim button works every 10 minutes
- [ ] Leaderboard updates
- [ ] Share to Farcaster works
- [ ] Rewards distribution (test with small amounts)

---

## 🎯 Next Steps

1. **✅ Documentation complete**
2. **→ Setup PostgreSQL database**
3. **→ Build backend API**
4. **→ Create frontend components**
5. **→ Test on Base Sepolia**
6. **→ Deploy $BATTLE on Clanker.world**
7. **→ Launch to Farcaster! 🚀**

---

**Ready to build BATTLEFIELD and start the epic war between BEARS 🐻 and BULLS 🐂!**

⚔️ Let the battle begin! ⚔️
