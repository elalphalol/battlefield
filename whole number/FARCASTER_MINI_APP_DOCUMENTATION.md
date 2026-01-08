# 🚀 FARCASTER MINI APP CONVERSION GUIDE
## Whole Number War - Farcaster Mini App Documentation

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [What is a Farcaster Mini App?](#what-is-a-farcaster-mini-app)
3. [Prerequisites](#prerequisites)
4. [Architecture Overview](#architecture-overview)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [OnchainKit Integration](#onchainkit-integration)
7. [MiniKit Integration](#minikit-integration)
8. [Deployment Guide](#deployment-guide)
9. [Testing & Verification](#testing-verification)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This documentation guides you through converting the **Whole Number War** strategy app into a fully-functional **Farcaster Mini App** using Base's OnchainKit and Farcaster's MiniKit. The mini app will enable users to:

- View the app directly within Farcaster/Warpcast
- Connect their Ethereum wallet seamlessly
- Share their trading results onchain
- Interact with smart contracts for potential future features (leaderboards, NFT badges, etc.)

---

## 🤔 What is a Farcaster Mini App?

**Farcaster Mini Apps** are interactive applications that run inside Farcaster clients (like Warpcast). They provide:

- **Embedded Experience**: Apps run directly in the Farcaster feed
- **Wallet Integration**: Seamless connection to users' Ethereum wallets
- **Social Features**: Native sharing and casting capabilities
- **Onchain Interactions**: Built on Base L2 for low-cost transactions

**Key Components:**
- **Frames**: The UI container that displays your app
- **OnchainKit**: Base's toolkit for blockchain interactions
- **MiniKit**: Farcaster's SDK for mini app functionality
- **Base Network**: Ethereum L2 where transactions occur

---

## 📦 Prerequisites

### Required Knowledge
- ✅ Basic HTML, CSS, JavaScript
- ✅ React fundamentals (we'll be converting to React)
- ✅ Basic understanding of Web3/Ethereum
- ✅ Familiarity with npm/package management

### Required Tools
```bash
# Node.js (v18 or higher)
node --version  # Should be v18+

# npm or yarn
npm --version   # v9+

# Git (for version control)
git --version

# Code editor (VS Code recommended)
```

### Required Accounts
1. **Coinbase Developer Account**: For OnchainKit API keys
2. **Farcaster Account**: For testing the mini app
3. **Base Wallet**: For onchain interactions
4. **Vercel/Netlify Account**: For deployment (recommended)

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

### Target Structure (Farcaster Mini App)
```
whole-number-miniapp/
├── package.json
├── next.config.js
├── public/
│   ├── opengraph-image.png    # Frame preview image
│   └── icon.png                # App icon
├── app/
│   ├── layout.tsx              # Root layout with metadata
│   ├── page.tsx                # Main app page
│   ├── api/
│   │   └── frame/
│   │       └── route.ts        # Frame API endpoint
│   ├── components/
│   │   ├── WalletConnect.tsx   # Wallet connection UI
│   │   ├── BattleField.tsx     # Main battlefield component
│   │   ├── PaperTrading.tsx    # Trading panel
│   │   └── ShareButton.tsx     # Social sharing
│   └── lib/
│       ├── strategy.ts         # Core strategy logic
│       ├── onchain.ts          # OnchainKit utilities
│       └── minikit.ts          # MiniKit utilities
└── .env.local                  # Environment variables
```

---

## 🔨 Step-by-Step Implementation

### STEP 1: Project Setup

#### 1.1 Create Next.js App with OnchainKit
```bash
# Create new Next.js app
npx create-next-app@latest whole-number-miniapp

# When prompted:
# ✓ Would you like to use TypeScript? › Yes
# ✓ Would you like to use ESLint? › Yes
# ✓ Would you like to use Tailwind CSS? › Yes
# ✓ Would you like to use `src/` directory? › No
# ✓ Would you like to use App Router? › Yes
# ✓ Would you like to customize the default import alias? › No

cd whole-number-miniapp
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

# Install additional utilities
npm install date-fns axios
```

#### 1.3 Setup Environment Variables
Create `.env.local` in the root directory:
```bash
# Coinbase Developer Platform API Key
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_api_key_here

# Base Network Configuration
NEXT_PUBLIC_CHAIN_ID=8453  # Base Mainnet
# NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia (for testing)

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-domain.com

# Optional: Analytics, etc.
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

**To get your OnchainKit API Key:**
1. Go to [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Create a new project
3. Copy your API key

---

### STEP 2: Configure Next.js for Frames

#### 2.1 Update `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['api.coinbase.com', 'blockchain.info'],
  },
  // Enable experimental features for Frames
  experimental: {
    serverActions: true,
  },
  // Headers for Frame security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

### STEP 3: Setup OnchainKit Providers

#### 3.1 Create `app/providers.tsx`
```typescript
'use client';

import { OnchainKitProvider } from '@coinbase/onchainkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base } from 'wagmi/chains';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { ReactNode } from 'react';

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
          chain={base}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

#### 3.2 Update `app/layout.tsx`
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Whole Number War - BTC Strategy Battle',
  description: 'The Battle Between RED ARMY (Shorts) vs GREEN ARMY (Longs) - Farcaster Mini App',
  openGraph: {
    type: 'website',
    title: 'Whole Number War',
    description: 'Bitcoin strategy battle game in Farcaster',
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

---

### STEP 4: Implement Frame API Endpoint

#### 4.1 Create `app/api/frame/route.ts`
```typescript
import { FrameRequest, getFrameMessage } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  const body: FrameRequest = await req.json();
  
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY,
  });

  if (!isValid) {
    return new NextResponse('Message not valid', { status: 500 });
  }

  // Handle different button actions
  const buttonId = message?.button;
  
  // Return frame response
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${process.env.NEXT_PUBLIC_APP_URL}/api/og" />
        <meta property="fc:frame:button:1" content="Open App" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${process.env.NEXT_PUBLIC_APP_URL}" />
      </head>
    </html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}

export const dynamic = 'force-dynamic';
```

---

### STEP 5: Implement Wallet Connection

#### 5.1 Create `app/components/WalletConnect.tsx`
```typescript
'use client';

import { 
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { 
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';
import { color } from '@coinbase/onchainkit/theme';

export function WalletConnect() {
  return (
    <div className="wallet-container">
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address className={color.foregroundMuted} />
            <EthBalance />
          </Identity>
          <WalletDropdownLink
            icon="wallet"
            href="https://keys.coinbase.com"
          >
            Wallet
          </WalletDropdownLink>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}
```

---

### STEP 6: Integrate MiniKit for Farcaster Context

#### 6.1 Create `app/lib/minikit.ts`
```typescript
import sdk from '@farcaster/frame-sdk';

export async function initializeMiniKit() {
  try {
    const context = await sdk.context;
    console.log('Farcaster Context:', context);
    
    return {
      user: context.user,
      isReady: true,
    };
  } catch (error) {
    console.error('MiniKit initialization error:', error);
    return {
      user: null,
      isReady: false,
    };
  }
}

export async function shareToFarcaster(text: string, imageUrl?: string) {
  try {
    await sdk.actions.cast({
      text,
      embeds: imageUrl ? [imageUrl] : [],
    });
    return { success: true };
  } catch (error) {
    console.error('Cast error:', error);
    return { success: false, error };
  }
}

export async function getFarcasterUser() {
  try {
    const context = await sdk.context;
    return context.user;
  } catch (error) {
    console.error('Error getting Farcaster user:', error);
    return null;
  }
}
```

---

### STEP 7: Convert Core Strategy Logic

#### 7.1 Create `app/lib/strategy.ts`
```typescript
// Port the core strategy logic from script.js
export class WholeNumberStrategy {
  currentPrice: number = 0;
  previousPrice: number = 0;
  
  getWholeNumber(price: number): number {
    return Math.floor(price / 1000) * 1000;
  }

  getNextWholeNumber(price: number): number {
    return Math.ceil(price / 1000) * 1000;
  }

  getCoordinate(price: number): number {
    const remainder = price % 1000;
    return Math.floor(remainder);
  }

  getZoneInfo(coordinate: number) {
    if (coordinate >= 900) {
      return {
        name: '🚀 ACCELERATION ZONE (900s)',
        description: 'Price is heading to next whole number!',
        type: 'acceleration-zone',
        signal: 'bullish',
      };
    }
    // ... implement other zones
    
    return {
      name: '⚖️ NEUTRAL ZONE',
      description: 'Waiting for direction',
      type: 'neutral-zone',
      signal: 'neutral',
    };
  }

  // ... implement other strategy methods
}
```

---

### STEP 8: Create Main App Component

#### 8.1 Update `app/page.tsx`
```typescript
'use client';

import { useState, useEffect } from 'react';
import { WalletConnect } from './components/WalletConnect';
import { BattleField } from './components/BattleField';
import { PaperTrading } from './components/PaperTrading';
import { initializeMiniKit, shareToFarcaster } from './lib/minikit';
import { WholeNumberStrategy } from './lib/strategy';

export default function Home() {
  const [strategy] = useState(() => new WholeNumberStrategy());
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [isInFrame, setIsInFrame] = useState(false);

  useEffect(() => {
    // Initialize MiniKit
    initializeMiniKit().then(({ user, isReady }) => {
      setFarcasterUser(user);
      setIsInFrame(isReady);
    });
  }, []);

  const handleShare = async () => {
    const coordinate = strategy.getCoordinate(strategy.currentPrice);
    const text = `⚔️ Just played Whole Number War!\nCoordinate: ${coordinate}\n#WholeNumberWar #Base`;
    
    await shareToFarcaster(text);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header with Wallet */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-400">
          ⚔️ WHOLE NUMBER WAR
        </h1>
        <div className="flex gap-4 items-center">
          {farcasterUser && (
            <div className="text-sm text-gray-400">
              Welcome, {farcasterUser.displayName}!
            </div>
          )}
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto p-4">
        <BattleField strategy={strategy} />
        <PaperTrading strategy={strategy} onShare={handleShare} />
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-gray-500 text-sm">
        {isInFrame && (
          <p className="text-green-400 mb-2">
            🎯 Running in Farcaster Frame
          </p>
        )}
        <p>⚠️ Educational purposes only. High leverage trading carries substantial risk.</p>
      </footer>
    </main>
  );
}
```

---

### STEP 9: Add Social Sharing Features

#### 9.1 Create `app/components/ShareButton.tsx`
```typescript
'use client';

import { shareToFarcaster } from '../lib/minikit';
import { useState } from 'react';

interface ShareButtonProps {
  stats: {
    totalPnl: number;
    winRate: number;
    totalTrades: number;
  };
  coordinate: number;
}

export function ShareButton({ stats, coordinate }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    
    const pnlSign = stats.totalPnl >= 0 ? '+' : '';
    const text = `⚔️ WHOLE NUMBER WAR Results!\n\n` +
      `� Coordinate: ${coordinate}\n` +
      `� P&L: ${pnlSign}$${Math.abs(stats.totalPnl).toFixed(2)}\n` +
      `🎯 Win Rate: ${stats.winRate}%\n` +
      `📈 Trades: ${stats.totalTrades}\n\n` +
      `#WholeNumberWar #BTC #Base`;
    
    const result = await shareToFarcaster(text);
    
    if (result.success) {
      alert('📤 Shared to Farcaster!');
    } else {
      alert('❌ Failed to share. Try again.');
    }
    
    setIsSharing(false);
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold disabled:opacity-50"
    >
      {isSharing ? '📤 Sharing...' : '📤 Share to Farcaster'}
    </button>
  );
}
```

---

### STEP 10: Future Onchain Features (Optional)

#### 10.1 Create Smart Contract for Leaderboard (Solidity)
```solidity
// contracts/WholeNumberLeaderboard.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract WholeNumberLeaderboard {
    struct Score {
        address player;
        int256 pnl;
        uint256 trades;
        uint256 timestamp;
    }
    
    Score[] public leaderboard;
    mapping(address => Score) public playerScores;
    
    event ScoreSubmitted(address indexed player, int256 pnl, uint256 trades);
    
    function submitScore(int256 _pnl, uint256 _trades) external {
        Score memory newScore = Score({
            player: msg.sender,
            pnl: _pnl,
            trades: _trades,
            timestamp: block.timestamp
        });
        
        playerScores[msg.sender] = newScore;
        leaderboard.push(newScore);
        
        emit ScoreSubmitted(msg.sender, _pnl, _trades);
    }
    
    function getTopPlayers(uint256 _count) external view returns (Score[] memory) {
        // Implementation for sorted top players
        // ...
    }
}
```

#### 10.2 Integrate Contract Interactions
```typescript
// app/lib/onchain.ts
import { useWriteContract, useReadContract } from 'wagmi';

const LEADERBOARD_ADDRESS = '0x...'; // Your deployed contract address

const LEADERBOARD_ABI = [
  {
    name: 'submitScore',
    type: 'function',
    inputs: [
      { name: '_pnl', type: 'int256' },
      { name: '_trades', type: 'uint256' },
    ],
  },
  // ... other ABI entries
];

export function useSubmitScore() {
  const { writeContract } = useWriteContract();
  
  const submitScore = async (pnl: number, trades: number) => {
    try {
      await writeContract({
        address: LEADERBOARD_ADDRESS,
        abi: LEADERBOARD_ABI,
        functionName: 'submitScore',
        args: [BigInt(pnl), BigInt(trades)],
      });
      return { success: true };
    } catch (error) {
      console.error('Submit score error:', error);
      return { success: false, error };
    }
  };
  
  return { submitScore };
}
```

---

## 🚀 Deployment Guide

### Option 1: Deploy to Vercel (Recommended)

#### Step 1: Prepare for Deployment
```bash
# Commit your code
git init
git add .
git commit -m "Initial commit - Whole Number War Mini App"

# Push to GitHub
git remote add origin your-repo-url
git push -u origin main
```

#### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings > Environment Variables
```

#### Step 3: Add Environment Variables in Vercel
1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add:
   - `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
   - `NEXT_PUBLIC_APP_URL` (your vercel domain)
   - Other variables from `.env.local`

### Option 2: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod
```

---

## 🧪 Testing & Verification

### Test Locally First

```bash
# Run development server
npm run dev

# Open in browser
# http://localhost:3000
```

### Test in Farcaster

1. **Install Warpcast** (mobile or desktop)
2. **Create a test cast** with your Frame URL:
   ```
   Check out my new mini app!
   https://your-app-url.vercel.app
   ```
3. **Click the frame preview** - should show your app
4. **Test wallet connection** - connect your wallet
5. **Test sharing** - share results to feed
6. **Test on mobile** - ensure responsive design works

### Validation Checklist

- ✅ Frame metadata loads correctly
- ✅ OG image displays properly
- ✅ Wallet connection works
- ✅ BTC price updates live
- ✅ Strategy calculations work
- ✅ Paper trading functions correctly
- ✅ Share to Farcaster works
- ✅ Mobile responsive
- ✅ Fast load times (<3 seconds)

---

## 🐛 Troubleshooting

### Common Issues

#### Frame Not Showing
```bash
# Check metadata in layout.tsx
# Ensure og:image is absolute URL
# Verify fc:frame tags are correct
```

#### Wallet Won't Connect
```bash
# Check OnchainKit API key is valid
# Verify chain ID matches (8453 for Base)
# Ensure providers are properly configured
```

#### MiniKit Not Initializing
```javascript
// Check if running in Frame context
if (typeof window !== 'undefined' &&  window.parent !== window) {
  // We're in a frame
  initializeMiniKit();
}
```

#### Price API Failing
```javascript
// Add error handling and fallbacks
try {
  const price = await fetchBTCPrice();
} catch (error) {
  console.error('Price fetch failed:', error);
  // Use cached price or show error state
}
```

---

## 📚 Additional Resources

### Documentation
- [Base Docs](https://docs.base.org)
- [OnchainKit Docs](https://onchainkit.xyz)
- [Farcaster Frames](https://docs.farcaster.xyz/developers/frames)
- [Warpcast API](https://docs.warpcast.com)

### Tools
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- [Frame Validator](https://warpcast.com/~/developers/frames)
- [Base Explorer](https://basescan.org)

### Community
- [Farcaster Discord](https://discord.gg/farcaster)
- [Base Discord](https://discord.gg/base)
- [OnchainKit GitHub](https://github.com/coinbase/onchainkit)

---

## ✅ Next Steps After Documentation

Once this documentation is complete, we will:

1. **Initialize the Next.js project**
2. **Set up all dependencies**
3. **Convert components to React/TypeScript**
4. **Implement OnchainKit wallet connection**
5. **Integrate MiniKit for Farcaster**
6. **Test locally**
7. **Deploy to Vercel**
8. **Test in Warpcast**
9. **Launch to community! 🚀**

---

## 📝 Notes

- This conversion maintains all existing features
- Adds Farcaster social integration
- Enables future onchain features (leaderboards, NFTs, etc.)
- Optimized for mobile and desktop
- Built on Base L2 for low transaction costs

**Ready to build? Let's convert this app to a Farcaster mini app!** 🎯⚔️
