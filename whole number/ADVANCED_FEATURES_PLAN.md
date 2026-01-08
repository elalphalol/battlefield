# 🚀 ADVANCED FEATURES PLAN - Whole Number War

## 🎯 Phase 2 Features Overview

### 1. 🏆 Leaderboard System
### 2. 🪙 Reward Token on Base
### 3. 🔔 Farcaster Notifications

---

## 🪙 TOKEN DESIGN

### Token Name & Ticker Ideas

**Option 1: Battle-Themed** ⚔️
- **Name**: War Token / Whole Number Token
- **Ticker**: $WAR / $WHOLE
- **Concept**: Represents battle victories in the war

**Option 2: Number-Themed** 🔢
- **Name**: Coordinate Token / Number Token
- **Ticker**: $COORD / $NUM
- **Concept**: Represents mastery of the whole number system

**Option 3: Army-Themed** 🎖️
- **Name**: Soldier Token / Victory Token
- **Ticker**: $SOLDIER / $VICTORY
- **Concept**: Rank and achievements in the war

**RECOMMENDED: $WAR TOKEN** ⚔️
```
Token Name: War Token
Ticker: $WAR
Blockchain: Base (ERC-20)
Total Supply: 1,000,000 WAR
Distribution: 
  - 50% (500k) - Leaderboard Rewards (vested)
  - 20% (200k) - Liquidity Pool
  - 15% (150k) - Community Treasury
  - 10% (100k) - Team (1-year lock)
  - 5% (50k) - Initial Airdrop
```

### Token Utility
1. **Governance**: Vote on strategy parameters
2. **Multiplier**: Boost paper trading rewards
3. **Access**: Premium features/analytics
4. **Staking**: Earn more from holding

---

## 🏆 LEADERBOARD SYSTEM

### Structure

```typescript
interface LeaderboardEntry {
  fid: number;                    // Farcaster ID
  username: string;               // Farcaster username
  pfp: string;                    // Profile picture
  walletAddress: string;          // Connected wallet
  stats: {
    totalPnl: number;             // Total profit/loss
    totalTrades: number;          // Number of trades
    winRate: number;              // Win percentage
    bestTrade: number;            // Largest profit
    worstTrade: number;           // Largest loss
    avgLeverage: number;          // Average leverage used
    daysActive: number;           // Days active
    streak: number;               // Current win streak
  };
  rank: number;                   // Current rank
  warTokensEarned: number;        // Total $WAR earned
  lastActive: Date;               // Last activity
}
```

### Ranking Algorithm

**Score Formula:**
```
Score = (Total P&L × 0.4) + 
        (Win Rate × Total Trades × 0.3) + 
        (Streak × 100 × 0.2) + 
        (Days Active × 10 × 0.1)
```

### Reward Structure

**Weekly Rewards (Top 10):**
```
1st Place:  500 $WAR + 🥇 NFT Badge
2nd Place:  300 $WAR + 🥈 NFT Badge
3rd Place:  200 $WAR + 🥉 NFT Badge
4th-10th:   100 $WAR each
```

**Monthly Rewards (Top 10):**
```
1st Place:  2,000 $WAR + Legendary NFT
2nd Place:  1,500 $WAR + Epic NFT
3rd Place:  1,000 $WAR + Rare NFT
4th-10th:   500 $WAR each
```

**Achievement Badges (NFTs):**
```
🎯 "Sniper" - 90%+ win rate over 50 trades
⚡ "Speed Demon" - 100 trades in 1 day
🔥 "Hot Streak" - 20 wins in a row
💎 "Diamond Hands" - Hold position through 10% drawdown to profit
🪓 "Dwarf Tosser" - Successfully execute dwarf toss strategy 10 times
🚀 "Moon Shot" - Single trade 500%+ profit
❄️ "Ice Cold" - Stay calm, 0 losses in 20 trades
```

---

## 🔗 SMART CONTRACT ARCHITECTURE

### 1. WAR Token Contract (ERC-20)

```solidity
// contracts/WARToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WARToken is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10**18;
    
    mapping(address => bool) public minters;
    
    constructor() ERC20("War Token", "WAR") {
        _mint(msg.sender, TOTAL_SUPPLY);
    }
    
    modifier onlyMinter() {
        require(minters[msg.sender], "Not authorized");
        _;
    }
    
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
    }
    
    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
}
```

### 2. Leaderboard Contract

```solidity
// contracts/WholeNumberLeaderboard.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./WARToken.sol";

contract WholeNumberLeaderboard is Ownable, ReentrancyGuard {
    WARToken public warToken;
    
    struct TraderStats {
        address wallet;
        uint256 fid;              // Farcaster ID
        int256 totalPnl;
        uint256 totalTrades;
        uint256 winningTrades;
        uint256 lastUpdate;
        uint256 warEarned;
    }
    
    mapping(address => TraderStats) public traders;
    mapping(uint256 => address) public fidToWallet;
    address[] public leaderboard;
    
    uint256 public weeklyPrizePool;
    uint256 public lastWeeklyDistribution;
    
    event StatsUpdated(address trader, int256 pnl, uint256 trades);
    event RewardDistributed(address trader, uint256 amount);
    event WeeklyWinner(address trader, uint256 rank, uint256 reward);
    
    constructor(address _warToken) {
        warToken = WARToken(_warToken);
        lastWeeklyDistribution = block.timestamp;
    }
    
    function submitStats(
        address wallet,
        uint256 fid,
        int256 totalPnl,
        uint256 totalTrades,
        uint256 winningTrades
    ) external {
        require(msg.sender == owner() || msg.sender == wallet, "Unauthorized");
        
        TraderStats storage trader = traders[wallet];
        trader.wallet = wallet;
        trader.fid = fid;
        trader.totalPnl = totalPnl;
        trader.totalTrades = totalTrades;
        trader.winningTrades = winningTrades;
        trader.lastUpdate = block.timestamp;
        
        fidToWallet[fid] = wallet;
        
        _updateLeaderboard(wallet);
        
        emit StatsUpdated(wallet, totalPnl, totalTrades);
    }
    
    function _updateLeaderboard(address trader) internal {
        bool exists = false;
        for (uint i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i] == trader) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            leaderboard.push(trader);
        }
        
        // Bubble sort (gas inefficient, but works for small arrays)
        for (uint i = 0; i < leaderboard.length - 1; i++) {
            for (uint j = i + 1; j < leaderboard.length; j++) {
                if (_getScore(leaderboard[j]) > _getScore(leaderboard[i])) {
                    address temp = leaderboard[i];
                    leaderboard[i] = leaderboard[j];
                    leaderboard[j] = temp;
                }
            }
        }
    }
    
    function _getScore(address trader) internal view returns (uint256) {
        TraderStats memory stats = traders[trader];
        if (stats.totalTrades == 0) return 0;
        
        uint256 winRate = (stats.winningTrades * 100) / stats.totalTrades;
        uint256 pnlScore = stats.totalPnl > 0 ? uint256(stats.totalPnl) : 0;
        
        return (pnlScore * 4 / 10) + (winRate * stats.totalTrades * 3 / 10);
    }
    
    function distributeWeeklyRewards() external onlyOwner nonReentrant {
        require(block.timestamp >= lastWeeklyDistribution + 7 days, "Too soon");
        
        uint256[] memory rewards = new uint256[](10);
        rewards[0] = 500 * 10**18;  // 500 WAR
        rewards[1] = 300 * 10**18;  // 300 WAR
        rewards[2] = 200 * 10**18;  // 200 WAR
        for (uint i = 3; i < 10; i++) {
            rewards[i] = 100 * 10**18;  // 100 WAR each
        }
        
        uint256 topCount = leaderboard.length < 10 ? leaderboard.length : 10;
        
        for (uint i = 0; i < topCount; i++) {
            address winner = leaderboard[i];
            uint256 reward = rewards[i];
            
            warToken.transfer(winner, reward);
            traders[winner].warEarned += reward;
            
            emit WeeklyWinner(winner, i + 1, reward);
            emit RewardDistributed(winner, reward);
        }
        
        lastWeeklyDistribution = block.timestamp;
    }
    
    function getTopTraders(uint256 count) external view returns (address[] memory) {
        uint256 returnCount = count > leaderboard.length ? leaderboard.length : count;
        address[] memory top = new address[](returnCount);
        
        for (uint i = 0; i < returnCount; i++) {
            top[i] = leaderboard[i];
        }
        
        return top;
    }
    
    function getTraderRank(address trader) external view returns (uint256) {
        for (uint i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i] == trader) {
                return i + 1;
            }
        }
        return 0;
    }
}
```

### 3. Achievement NFT Contract

```solidity
// contracts/AchievementNFT.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AchievementNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    
    mapping(uint256 => string) public achievementTypes;
    mapping(address => mapping(string => bool)) public hasAchievement;
    
    event AchievementMinted(address to, uint256 tokenId, string achievementType);
    
    constructor() ERC721("Whole Number War Achievements", "WNWA") {}
    
    function mintAchievement(address to, string memory achievementType) 
        external 
        onlyOwner 
        returns (uint256) 
    {
        require(!hasAchievement[to][achievementType], "Already has this achievement");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        
        achievementTypes[tokenId] = achievementType;
        hasAchievement[to][achievementType] = true;
        
        emit AchievementMinted(to, tokenId, achievementType);
        
        return tokenId;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Return metadata URL for the achievement
        return string(abi.encodePacked(
            "ipfs://YOUR_BASE_URI/",
            achievementTypes[tokenId],
            ".json"
        ));
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
  LEADERBOARD_CHANGE = 'leaderboard_change',
  REWARD_EARNED = 'reward_earned',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  WEEKLY_SUMMARY = 'weekly_summary',
}

interface Notification {
  id: string;
  userId: number;              // Farcaster FID
  type: NotificationType;
  title: string;
  message: string;
  data: any;
  timestamp: Date;
  read: boolean;
}
```

### Price Alert Examples

```typescript
// BTC price breaks whole number
"🚨 BTC just broke $92,000! 
Green Army Victory! 
Coordinate: 012"

// Beam broken
"⚠️ BEAM 226 BROKEN! 
Price: $91,174
Whole number under pressure!"

// Entering acceleration zone
"🚀 ENTERING 900s!
Price: $91,924
Acceleration zone - watch for breakout!"
```

### Liquidation Warnings

```typescript
// Position at risk
"⚠️ LIQUIDATION WARNING!
Your LONG 10x position
Entry: $91,500
Current: $90,650
Loss: -9.3%
Close now to avoid liquidation!"

// Position recovered
"✅ Position Safe
Your LONG 10x position
Back in profit: +$45 (+0.49%)"
```

### Leaderboard Notifications

```typescript
// Rank changed
"📊 You moved up! 
Rank #15 → #12
Keep trading to reach top 10!"

// Close to rewards
"🏆 Almost there!
Rank #11 (1 spot from rewards)
Total P&L: +$2,450"

// Weekly winner
"🎉 WEEKLY WINNER!
Rank: #1
Reward: 500 $WAR + 🥇 NFT
Congratulations!"
```

---

## 📱 FRONTEND COMPONENTS

### 1. Leaderboard Component

```typescript
// app/components/Leaderboard.tsx
interface LeaderboardProps {
  userFid?: number;
}

Features:
- Live updating rankings
- User highlighting
- Filter by timeframe (weekly/monthly/all-time)
- Pagination
- Search by username
- Stats breakdown on hover
- Connect wallet to claim rewards
```

### 2. Token Rewards Panel

```typescript
// app/components/TokenRewards.tsx

Features:
- $WAR balance display
- Claimable rewards counter
- Claim button (triggers contract transaction)
- Reward history
- Token price chart
- Staking interface
```

### 3. Notification Center

```typescript
// app/components/NotificationCenter.tsx

Features:
- Bell icon with unread count
- Dropdown notification list
- Filter by type
- Mark as read/unread
- Notification preferences
- Enable/disable Farcaster notifications
```

### 4. Achievement Gallery

```typescript
//app/components/Achievements.tsx

Features:
- Grid of NFT badges
- Locked/unlocked states
- Progress bars for achievements
- Rarity indicators
- Share to Farcaster button
```

---

## 🛠️ IMPLEMENTATION ROADMAP

### Phase 2A: Smart Contracts (Week 1-2)
- [ ] Deploy $WAR token on Base
- [ ] Deploy Leaderboard contract
- [ ] Deploy Achievement NFT contract
- [ ] Create liquidity pool on Uniswap
- [ ] Verify contracts on BaseScan
- [ ] Set up Chainlink automation for weekly rewards

### Phase 2B: Backend Infrastructure (Week 2-3)
- [ ] Database setup (PostgreSQL/Supabase)
- [ ] API endpoints for leaderboard
- [ ] Cron jobs for stats aggregation
- [ ] Notification service (Firebase/Novu)
- [ ] Farcaster webhook integration
- [ ] IPFS setup for NFT metadata

### Phase 2C: Frontend Components (Week 3-4)
- [ ] Leaderboard UI component
- [ ] Token rewards panel
- [ ] Notification center
- [ ] Achievement gallery
- [ ] Claim rewards flow
- [ ] Transaction status tracker

### Phase 2D: Integration & Testing (Week 4-5)
- [ ] Connect contracts to frontend
- [ ] Test reward claiming
- [ ] Test notifications
- [ ] Test leaderboard updates
- [ ] Gas optimization
- [ ] Security audit

### Phase 2E: Launch (Week 5-6)
- [ ] Deploy to production
- [ ] Airdrop initial $WAR tokens
- [ ] Announce on Farcaster
- [ ] Marketing campaign
- [ ] Monitor and iterate

---

## 💰 TOKENOMICS DETAILS

### $WAR Token Vesting Schedule

```
Leaderboard Rewards (500k tokens):
- Released weekly over 2 years
- ~4,800 WAR per week
- Distributed to top 10

Team (100k tokens):
- 1-year cliff
- 4-year linear vesting

Community Treasury (150k):
- Governance controlled
- Can be used for partnerships, events, bounties
```

### Token Burn Mechanism

```
5% of claimed rewards are burned
Creates deflationary pressure
Increases scarcity over time
```

---

## 📊 SUCCESS METRICS

### Engagement
- Daily Active Users (DAU)
- Trading volume
- Leaderboard participation rate

### Token Metrics
- $WAR price stability
- Liquidity depth
- Holder distribution

### Social
- Farcaster casts mentioning app
- Twitter mentions
- Community growth

---

## 🔒 SECURITY CONSIDERATIONS

1. **Smart Contract Security**
   - OpenZeppelin audited contracts
   - Reentrancy guards
   - Access control
   - Rate limiting

2. **Off-chain Security**
   - API rate limiting
   - DDoS protection
   - Data validation
   - Secure key management

3. **User Protection**
   - Paper trading only (no real funds at risk)
   - Clear disclaimers
   - Position size limits
   - Cooldown periods

---

## 🚀 NEXT STEPS

1. **Review & approve this plan**
2. **Choose token name/ticker**
3. **Deploy smart contracts to Base Sepolia (testnet)**
4. **Build leaderboard backend API**
5. **Create frontend components**
6. **Test everything thoroughly**
7. **Deploy to mainnet**
8. **Launch!**

**Ready to build these features? Let's start with smart contract deployment!** 🎯⚔️
