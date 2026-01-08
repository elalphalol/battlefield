# 🚀 ADVANCED FEATURES PLAN - BATTLEFIELD

## 🎯 Phase 2 Features Overview

### 1. 🏆 Leaderboard System
### 2. 🪙 $BATTLE Token on Clanker.world
### 3. 🔔 Farcaster Notifications
### 4. 💰 Paper Money Trading System

---

## 🪙 TOKEN DESIGN - BATTLEFIELD ($BATTLE)

### Token Specifications

```
Token Name: BATTLEFIELD
Ticker: $BATTLE
Platform: Clanker.world (Farcaster Native)
Total Supply: 100,000,000,000 BATTLE (100 Billion)
Distribution: 
  - 50% (50B) - Leaderboard Rewards Wallet (AI Managed)
  - 20% (20B) - Liquidity Pool
  - 15% (15B) - Community Treasury
  - 10% (10B) - Development & Operations
  - 5% (5B) - Initial Distribution (handled by you)
```

### Token Utility
1. **Leaderboard Rewards**: Top traders earn $BATTLE weekly/monthly
2. **Paper Money Recharge**: Buy paper money with $BATTLE tokens (future feature)
3. **Premium Features**: Access to advanced analytics and tools
4. **Army Boosts**: Boost your Bear or Bull Army with token holdings
5. **Governance**: Vote on strategy parameters and game mechanics

### AI-Managed Rewards Wallet
- 50% supply (50 Billion tokens) held in rewards wallet
- Private key managed by AI system for automated distributions
- Weekly automatic payouts to top 10 leaderboard
- Monthly payouts for seasonal champions
- Achievement badge rewards
- Transparent on-chain transactions

---

## 💰 PAPER MONEY TRADING SYSTEM

### Starting Balance
- **Initial Paper Money**: $10,000 USD (virtual)
- Every user starts with this amount
- Can be used for leveraged paper trading
- No real money at risk

### Liquidation Mechanics
- **Liquidation Trigger**: -100% of position value
- When liquidated, user loses that paper money
- Balance can go to $0 if all positions liquidated
- Must recharge to continue trading

### Paper Money Recharge System

**Free Claim (Every 10 Minutes):**
```typescript
interface PaperMoneyClaim {
  amount: 1000,              // $1,000 per claim
  cooldownMinutes: 10,       // Can claim every 10 minutes
  maxClaimsPerDay: 144,      // Unlimited claims (24h ÷ 10min)
  requiresWallet: true,      // Must connect wallet
}
```

**Token-Based Recharge (Future Feature):**
```typescript
interface TokenRecharge {
  tokenCost: {
    1000: 100 BATTLE,        // $1,000 paper = 100 $BATTLE
    5000: 450 BATTLE,        // $5,000 paper = 450 $BATTLE (10% discount)
    10000: 850 BATTLE,       // $10,000 paper = 850 $BATTLE (15% discount)
  },
  instant: true,             // Immediate recharge
  noCooldown: true,          // No waiting period
}
```

### Paper Trading Rules
- Leverage: 10x, 25x, 50x, 100x available
- Liquidation at -100% loss
- Win = profit added to paper balance
- Loss = deducted from paper balance
- Can open multiple positions
- Positions tracked per user wallet

---

## 🏆 LEADERBOARD SYSTEM

### Army Structure

**BEAR ARMY 🐻 vs BULL ARMY 🐂**

```typescript
enum Army {
  BEARS = 'bears',    // Formerly "Short Army" - Bearish traders
  BULLS = 'bulls',    // Formerly "Long Army" - Bullish traders
}

interface ArmyStats {
  totalMembers: number;
  totalPaperWealth: number;      // Combined paper money
  averagePnL: number;
  activeTraders: number;
  armyScore: number;             // Combined performance score
}
```

### Leaderboard Structure

```typescript
interface LeaderboardEntry {
  fid: number;                    // Farcaster ID
  username: string;               // Farcaster username
  pfp: string;                    // Profile picture
  walletAddress: string;          // Connected wallet
  army: 'bears' | 'bulls';        // Which army they fight for
  stats: {
    paperBalance: number;         // Current paper money balance
    totalPnl: number;             // Total profit/loss (paper)
    totalTrades: number;          // Number of trades
    winRate: number;              // Win percentage
    bestTrade: number;            // Largest profit
    worstTrade: number;           // Largest loss
    avgLeverage: number;          // Average leverage used
    daysActive: number;           // Days active
    streak: number;               // Current win streak
    timesLiquidated: number;      // Times went broke
    rechargeClaims: number;       // Number of recharges claimed
  };
  rank: number;                   // Current rank
  battleTokensEarned: number;     // Total $BATTLE earned
  lastActive: Date;               // Last activity
  lastClaim: Date;                // Last recharge claim time
}
```

### Ranking Algorithm

**Score Formula:**
```
Score = (Paper Balance × 0.3) + 
        (Total P&L × 0.4) + 
        (Win Rate × Total Trades × 0.2) + 
        (Streak × 100 × 0.1) - 
        (Times Liquidated × 500)
```

### Reward Structure

**Weekly Rewards (Top 10):**
```
1st Place:  5,000,000 $BATTLE + 🥇 NFT Badge
2nd Place:  3,000,000 $BATTLE + 🥈 NFT Badge
3rd Place:  2,000,000 $BATTLE + 🥉 NFT Badge
4th-10th:   1,000,000 $BATTLE each
```

**Monthly Rewards (Top 10):**
```
1st Place:  20,000,000 $BATTLE + Legendary NFT
2nd Place:  15,000,000 $BATTLE + Epic NFT
3rd Place:  10,000,000 $BATTLE + Rare NFT
4th-10th:   5,000,000 $BATTLE each
```

**Army Victory Bonus:**
```
Winning Army (Monthly): Distributed among top 50 members
Total Pool: 50,000,000 $BATTLE
Split based on individual contribution to army score
```

**Achievement Badges (NFTs):**
```
🎯 "Sniper" - 90%+ win rate over 50 trades - 500K $BATTLE
⚡ "Speed Demon" - 100 trades in 1 day - 500K $BATTLE
🔥 "Hot Streak" - 20 wins in a row - 1M $BATTLE
💎 "Diamond Hands" - Hold position through 10% drawdown to profit - 750K $BATTLE
🐻 "Bear General" - Lead Bears army monthly - 2M $BATTLE
🐂 "Bull Champion" - Lead Bulls army monthly - 2M $BATTLE
🚀 "Moon Shot" - Single trade 500%+ profit - 1M $BATTLE
❄️ "Ice Cold" - Stay calm, 0 losses in 20 trades - 1M $BATTLE
💰 "Paper Millionaire" - Reach $1,000,000 paper balance - 2M $BATTLE
🎲 "Phoenix" - Recover from liquidation to top 10 - 1.5M $BATTLE
```

---

## 🔗 SMART CONTRACT ARCHITECTURE

### Note on Clanker.world
Since deployment is on Clanker.world (Farcaster's native token platform), the token contract is handled by Clanker. We need to focus on:
1. **Leaderboard Database** (off-chain with Base eventually)
2. **Rewards Distribution System** (automated via rewards wallet)
3. **Paper Trading Backend** (Node.js/PostgreSQL)
4. **Achievement NFT Contract** (Base L2)

### 1. Rewards Distribution System (Backend)

```typescript
// backend/rewards/distributor.ts
interface RewardsWallet {
  address: string;
  privateKey: string;           // Securely stored
  balance: bigint;              // 50B $BATTLE
}

class RewardsDistributor {
  private wallet: RewardsWallet;
  
  async distributeWeeklyRewards(topTen: LeaderboardEntry[]) {
    const rewards = [
      5000000, 3000000, 2000000, 1000000, 1000000,
      1000000, 1000000, 1000000, 1000000, 1000000
    ];
    
    for (let i = 0; i < topTen.length; i++) {
      await this.sendBattleTokens(
        topTen[i].walletAddress,
        rewards[i]
      );
    }
  }
  
  async distributeMonthlyRewards(topTen: LeaderboardEntry[]) {
    // Monthly distribution logic
  }
  
  async distributeAchievementReward(
    walletAddress: string,
    achievement: string,
    amount: number
  ) {
    // Achievement reward logic
  }
  
  private async sendBattleTokens(to: string, amount: number) {
    // Use Web3 to send tokens from rewards wallet
    // Transaction signing with private key
    // Log transaction on-chain
  }
}
```

### 2. Paper Trading Database Schema

```sql
-- PostgreSQL Schema
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

CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(18, 2) DEFAULT 1000.00,
  claimed_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

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

CREATE TABLE rewards_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  amount BIGINT,
  reason VARCHAR(255),
  tx_hash VARCHAR(66),
  distributed_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Achievement NFT Contract (Base Sepolia for Testing)

```solidity
// contracts/BattlefieldAchievements.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BattlefieldAchievements is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => string) public achievementTypes;
    mapping(address => mapping(string => bool)) public hasAchievement;
    mapping(uint256 => address) public tokenToOwner;
    
    event AchievementMinted(
        address indexed to,
        uint256 indexed tokenId,
        string achievementType,
        uint256 rewardAmount
    );
    
    constructor() ERC721("Battlefield Achievements", "BFIELD") {}
    
    function mintAchievement(
        address to,
        string memory achievementType,
        uint256 rewardAmount
    ) 
        external 
        onlyOwner 
        returns (uint256) 
    {
        require(
            !hasAchievement[to][achievementType],
            "Already has this achievement"
        );
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        
        achievementTypes[tokenId] = achievementType;
        hasAchievement[to][achievementType] = true;
        tokenToOwner[tokenId] = to;
        
        emit AchievementMinted(to, tokenId, achievementType, rewardAmount);
        
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        return string(abi.encodePacked(
            "ipfs://YOUR_BASE_URI/",
            achievementTypes[tokenId],
            ".json"
        ));
    }
    
    function getPlayerAchievements(address player)
        external
        view
        returns (uint256[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (tokenToOwner[i] == player) {
                count++;
            }
        }
        
        uint256[] memory achievements = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (tokenToOwner[i] == player) {
                achievements[index] = i;
                index++;
            }
        }
        
        return achievements;
    }
}
```

---

## 🔔 NOTIFICATION SYSTEM

### Notification Types

```typescript
enum NotificationType {
  PRICE_ALERT = 'price_alert',
  LIQUIDATION_WARNING = 'liquidation_warning',
  LIQUIDATED = 'liquidated',
  LEADERBOARD_CHANGE = 'leaderboard_change',
  REWARD_EARNED = 'reward_earned',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  PAPER_MONEY_LOW = 'paper_money_low',
  CLAIM_AVAILABLE = 'claim_available',
  ARMY_VICTORY = 'army_victory',
  WEEKLY_SUMMARY = 'weekly_summary',
}
```

### Notification Examples

**Liquidation Warnings:**
```
⚠️ LIQUIDATION WARNING!
Your 100x LONG position
Entry: $91,500
Current: $90,185
Loss: -95.8%
Paper Balance Risk: $5,000
Close now or get liquidated!
```

**Liquidated:**
```
💥 LIQUIDATED!
Your 50x SHORT position
Lost: $2,500 paper money
Remaining Balance: $1,234
Claim $1,000 in 2 minutes!
```

**Claim Available:**
```
💰 Recharge Available!
Claim $1,000 paper money
Cooldown: Ready now!
Keep fighting for your army! 🐻/🐂
```

**Army Notifications:**
```
🐻 BEAR ARMY UPDATE!
Current Lead: +$45,230
Bulls closing in fast!
Rally the troops!
```

**Reward Earned:**
```
🎉 WEEKLY REWARD!
Rank: #3
Reward: 2,000,000 $BATTLE
Now in your wallet!
Keep dominating! 🐂
```

---

## 📱 FRONTEND COMPONENTS

### 1. Paper Money Dashboard

```typescript
// app/components/PaperMoneyDashboard.tsx
interface PaperMoneyProps {
  balance: number;
  totalPnL: number;
  lastClaim: Date;
  canClaim: boolean;
}

Features:
- Large paper balance display
- P&L tracker (green/red)
- Claim button with countdown
- Transaction history
- Budget warnings at low balance
```

### 2. Army Selection & Stats

```typescript
// app/components/ArmyPanel.tsx

Features:
- Choose Bear 🐻 or Bull 🐂 army
- Live army battle stats
- Army leaderboard
- Army chat/community
- Switch armies (with cooldown)
```

### 3. Trading Interface

```typescript
// app/components/TradingPanel.tsx

Features:
- BTC price live feed
- Long/Short buttons
- Leverage selector (10x, 25x, 50x, 100x)
- Position size input (from paper balance)
- Liquidation price calculator
- Open positions display
- Quick close buttons
```

### 4. Leaderboard with Army Battles

```typescript
// app/components/Leaderboard.tsx

Features:
- Bears vs Bulls army scores
- Individual rankings
- Filter by army
- User highlight
- Reward countdown timers
- Live updates
```

---

## 🛠️ IMPLEMENTATION ROADMAP

### Phase 1: Core Infrastructure (Week 1-2) - TESTNET
- [x] Plan documentation complete
- [ ] Setup Node.js backend with Express
- [ ] Setup PostgreSQL database
- [ ] Create paper trading engine
- [ ] Implement claim system (10-min cooldown)
- [ ] Build basic API endpoints
- [ ] Deploy to Base Sepolia testnet
- [ ] Create test $BATTLE token on testnet

### Phase 2: Frontend & Game Mechanics (Week 2-3) - TESTNET
- [ ] Convert React components for paper trading
- [ ] Build army selection UI
- [ ] Implement trading interface
- [ ] Add liquidation mechanics (-100%)
- [ ] Build claim interface
- [ ] Add paper balance tracking
- [ ] Test all game loops

### Phase 3: Leaderboard & Rewards (Week 3-4) - TESTNET
- [ ] Build leaderboard system
- [ ] Implement ranking algorithm
- [ ] Create rewards distributor backend
- [ ] Deploy Achievement NFT contract (testnet)
- [ ] Test automated distributions
- [ ] Build rewards claiming UI

### Phase 4: Clanker Integration (Week 4-5)
- [ ] Deploy $BATTLE on Clanker.world
- [ ] Handle distribution of 95% supply
- [ ] Setup rewards wallet with 50% supply
- [ ] Integrate token contract addresses
- [ ] Enable token-based recharge (future)
- [ ] Test mainnet transactions

### Phase 5: Testing & Polish (Week 5-6)
- [ ] Full testnet testing with users
- [ ] Fix bugs and edge cases
- [ ] Optimize database queries
- [ ] Security audit
- [ ] Gas optimization
- [ ] UI/UX improvements

### Phase 6: Mainnet Launch (Week 6)
- [ ] Deploy to production
- [ ] Clanker token launch
- [ ] Distribute initial supply
- [ ] Activate rewards system
- [ ] Marketing campaign on Farcaster
- [ ] Monitor and iterate

---

## 💰 TOKENOMICS - BATTLEFIELD ($BATTLE)

### Total Supply: 100 Billion Tokens

**Distribution Breakdown:**

```
50% (50B) - Leaderboard Rewards Wallet
├── Weekly Rewards Pool: ~28B (2 years)
├── Monthly Rewards Pool: ~15B (2 years)
├── Achievement Rewards: ~5B
└── Army Victory Bonuses: ~2B

20% (20B) - Liquidity Pool
├── Clanker.world initial liquidity
└── Future DEX listings

15% (15B) - Community Treasury
├── Partnerships
├── Events & competitions
├── Bug bounties
└── Community initiatives

10% (10B) - Development & Operations
├── Team compensation
├── Infrastructure costs
├── Marketing
└── 4-year vesting

5% (5B) - Initial Distribution
└── Handled by you (airdrops, early adopters, etc.)
```

### Token Utility Expansion (Future)

1. **Paper Money Purchase**: Buy paper money with $BATTLE
2. **Premium Features**: Analytics, alerts, advanced tools
3. **Army Boosts**: Temporary multipliers for your army
4. **Tournament Entry**: Special high-stakes competitions
5. **Governance**: Vote on new features and parameters
6. **Staking**: Earn rewards by staking $BATTLE

---

## 🔒 SECURITY CONSIDERATIONS

### Rewards Wallet Security
- Private key encrypted and stored securely
- Multi-sig backup option
- Rate limiting on distributions
- Transaction monitoring
- Automated alerts for unusual activity

### Paper Trading Security
- Server-side validation of all trades
- Anti-cheat mechanisms
- Rate limiting on claims
- Wallet verification required
- Transaction logging

### Database Security
- Encrypted connections
- Regular backups
- SQL injection prevention
- Input validation
- Access control

---

## 📊 SUCCESS METRICS

### Engagement
- Daily Active Users (DAU)
- Paper trades per day
- Army participation rate
- Claim frequency
- Retention rate

### Token Metrics
- $BATTLE price stability
- Holder distribution
- Trading volume
- Rewards claimed vs held

### Social
- Farcaster casts about game
- Army rivalry engagement
- Community growth
- Virality metrics

---

## 🚀 LAUNCH STRATEGY

### Pre-Launch (Week -1)
- Teaser campaign on Farcaster
- Bear vs Bull army hype
- Early bird signups
- Influencer outreach

### Launch Day
- Deploy $BATTLE on Clanker.world
- Open registration
- Initial distribution
- First weekly competition starts
- Heavy social media push

### Post-Launch (Week 1-4)
- Daily engagement content
- Army battle updates
- Weekly winner announcements
- Feature releases
- Community events

---

## 🎮 GAME LOOP

**Daily Player Loop:**
1. Log in → Check paper balance
2. Choose/stay in army (Bears 🐻 or Bulls 🐂)
3. Analyze BTC price & strategy
4. Place paper trades with leverage
5. Monitor positions
6. Close trades or get liquidated
7. Claim $1K if needed (10min cooldown)
8. Check leaderboard rank
9. Share wins on Farcaster
10. Earn $BATTLE rewards

**Weekly Cycle:**
1. Monday: New weekly competition starts
2. Daily: Trade, climb leaderboard
3. Sunday: Weekly rewards distributed automatically
4. Top 10 earn $BATTLE
5. Reset for next week

**Monthly Cycle:**
1. Month start: Army battle begins
2. Daily: Contribute to army score
3. Month end: Army winner declared
4. Top 10 + Army bonuses distributed
5. Legendary NFTs minted
6. New month begins

---

## 🎯 NEXT STEPS

1. **✅ Documentation complete**
2. **→ Setup development environment - TESTNET**
3. **→ Build paper trading backend**
4. **→ Create frontend components**
5. **→ Test everything on Base Sepolia**
6. **→ Deploy $BATTLE on Clanker.world**
7. **→ Launch! 🚀**

---

**Ready to build BATTLEFIELD and start the epic war between BEARS 🐻 and BULLS 🐂!**

Let's conquer the whole number battlefield! ⚔️
