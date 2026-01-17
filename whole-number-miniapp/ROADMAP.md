# BATTLEFIELD - Project Roadmap

> **BTC Paper Trading Battle Game on Farcaster**
> Live at: https://btcbattlefield.com
> Farcaster Mini App: https://farcaster.xyz/miniapps/5kLec5hSq3bP/battlefield

---

## Project Timeline Overview

```
PHASE 1: Foundation ✅ COMPLETE
PHASE 2: Core Features ✅ COMPLETE
PHASE 3: Growth & Engagement ✅ COMPLETE
PHASE 4: Battle System Upgrade 🔄 IN PROGRESS
PHASE 5: Token Launch 📋 PLANNED
PHASE 6: AMM & DeFi Integration 📋 PLANNED
PHASE 7: Governance & Advanced Features 📋 FUTURE
```

---

## PHASE 1: Foundation ✅ COMPLETE

**Goal:** Build the core infrastructure for paper trading on Base/Farcaster

### Completed Features
- [x] Next.js 16 frontend with App Router
- [x] Express.js backend with TypeScript
- [x] PostgreSQL database with full schema
- [x] Farcaster Mini App SDK integration
- [x] Wallet connection via OnchainKit + Wagmi
- [x] Real-time BTC price fetching (5-second updates)
- [x] PM2 process management
- [x] nginx reverse proxy with Cloudflare SSL
- [x] Sentry error monitoring

### Technical Stack
- Frontend: Next.js, TypeScript, Tailwind CSS 4
- Backend: Express.js, TypeScript, PostgreSQL 16
- Blockchain: Base L2, OnchainKit, Wagmi, Viem
- Social: Farcaster MiniApp SDK, Neynar API

---

## PHASE 2: Core Features ✅ COMPLETE

**Goal:** Implement the full paper trading experience

### Trading System
- [x] Paper money system ($10,000 starting balance)
- [x] Long/Short positions with leverage (10x, 25x, 50x, 100x)
- [x] Real-time P&L calculation
- [x] Auto-liquidation at -100% loss
- [x] Stop-loss orders
- [x] Add collateral to existing positions
- [x] Paper money claims ($1,000 every 10 minutes)

### User Management
- [x] Farcaster authentication (FID, username, pfp)
- [x] User profiles with stats
- [x] Trade history with pagination
- [x] Last active tracking

### Leaderboard & Rankings
- [x] Global top 20 leaderboard
- [x] User rank calculation
- [x] Win rate tracking
- [x] Current/best streak tracking
- [x] Liquidation count tracking

---

## PHASE 3: Growth & Engagement ✅ COMPLETE

**Goal:** Add social features and retention mechanics

### Army System (Bears vs Bulls)
- [x] Army assignment based on trading P&L
- [x] Real-time army battle status
- [x] Weekly battle standings
- [x] Army stats API (total P&L, member count)
- [x] Army filtering on leaderboard

### Mission System
- [x] Daily missions (24h reset)
- [x] Weekly missions (7d reset)
- [x] One-time missions
- [x] Farcaster follow verification
- [x] Mission rewards in paper money
- [x] Progress tracking

### Achievement System (35+ achievements)
- [x] Trading volume milestones (1-1000+ trades)
- [x] P&L milestones ($100 - $100,000+)
- [x] Win rate achievements (50%-80%+)
- [x] Streak achievements (3-50+ wins)
- [x] Leaderboard rank achievements
- [x] Survival achievements (no liquidations)
- [x] Special achievements (comebacks, high-risk)
- [x] Rarity tiers: Common → Mythic

### Referral System
- [x] Automatic referral code generation
- [x] Referral link sharing (Farcaster + Web)
- [x] Two-sided confirmation (anti-exploit)
- [x] Referral earnings tracking
- [x] Circular referral prevention
- [x] FID requirement (both users)

### Genesis Airdrop System
- [x] 4-tier system: Ambassador, OG, Veteran, Recruit
- [x] Real-time qualification tracking
- [x] Tier stacking bonus (Ambassador + Trading tier)
- [x] Live rank within each tier
- [x] SECURED/AT RISK status display

### UI/UX Enhancements
- [x] 7-button bottom navigation bar
- [x] Avatar component with army border colors
- [x] Share cards for Farcaster
- [x] Achievement modal with confetti
- [x] Toast notifications
- [x] Responsive mobile-first design

### Admin & Operations
- [x] Admin panel with analytics
- [x] Maintenance mode toggle
- [x] Balance audit system
- [x] User balance adjustments
- [x] Mission management
- [x] Rate limiting (100 req/min)

---

## PHASE 4: Battle System Upgrade 🔄 IN PROGRESS

**Goal:** Full-featured army warfare with generals and prediction markets

### Current State
- Basic army assignment works (auto-calculated from P&L)
- Weekly battle standings display
- Army stats API functional
- Prediction market UI placeholder only

### To Build

#### 4.1 Generals System
- [ ] Database schema for generals
  - `army_generals` table (general_id, army, week_number, user_id)
  - `general_stats` table (wins, battles_led, bonus_earned)
- [ ] General selection logic
  - Top performer in each army becomes General
  - Weekly rotation (Monday 12:00 UTC)
  - General badge display on profile
- [ ] General bonuses
  - +10% $BATTLE rewards for Generals
  - Special General-only missions
  - General leaderboard (historical)
- [ ] General UI components
  - General spotlight on Battle tab
  - "Meet your General" card
  - General achievement badges

#### 4.2 Prediction Market
- [ ] Betting system with $BATTLE tokens
  - Bet on Bulls or Bears winning the week
  - Odds calculation based on bet distribution
  - 90% payout pool, 10% house fee
- [ ] Prediction API endpoints
  - POST /api/predictions/place
  - GET /api/predictions/odds
  - POST /api/predictions/settle
- [ ] Prediction UI
  - Enable ArmySelection component betting
  - Show live odds
  - Bet confirmation modal
  - Payout display

#### 4.3 Weekly Snapshot Automation
- [ ] Cron job for Monday 12:00 UTC snapshot
- [ ] Populate `leaderboard_snapshot` table
- [ ] Historical battle records
- [ ] "This Week vs Last Week" comparison

#### 4.4 Battle Events
- [ ] Special weekend battle events
- [ ] Double reward periods
- [ ] Army vs Army challenges
- [ ] Battle royale mini-games

#### 4.5 Enhanced Battle Tab
- [ ] Real-time battle feed (trades by army members)
- [ ] Army chat/coordination
- [ ] Battle countdown with animation
- [ ] Victory celebration screen

---

## PHASE 5: Token Launch 📋 PLANNED

**Goal:** Deploy $BATTLE token via Clanker on Base

### Token Economics
```
Total Supply: 100,000,000,000 $BATTLE (100B)

Distribution:
├─ 60B (60%) - Vault (2-year linear vesting)
│   ├─ 40B → Weekly Rewards Pool (~385M/week)
│   └─ 20B → AMM LP Additions (~192M/week)
├─ 20B (20%) - Liquidity Pool (locked permanently)
├─ 5B (5%)   - Genesis Airdrop (250 max users)
├─ 10B (10%) - Team/Dev Wallet (2-year vesting)
└─ 5B (5%)   - Treasury Wallet (1-year vesting)
```

### Pre-Launch Checklist
- [ ] Create multisig wallets (Gnosis Safe on Base)
  - Genesis Airdrop wallet (5B)
  - Team/Dev wallet (10B)
  - Treasury wallet (5B)
  - Token Admin wallet
- [ ] Generate token image for IPFS
- [ ] Freeze airdrop leaderboard (Day -7)
- [ ] Generate merkle tree for claims
- [ ] Prepare Clanker CSV (3 airdrop wallets)

### Launch Day (Day 0)
- [ ] Deploy via Clanker.world
  - Pool: Project 10 ETH (5 optimized positions)
  - Vault: 60%, 7-day lockup, 730-day vesting
  - Airdrop Extension enabled
- [ ] Announce on Farcaster
- [ ] Update frontend with token address

### Post-Launch
- [ ] Day 1: Airdrop lockup ends
- [ ] Day 7: Vault lockup ends, vesting begins
- [ ] Day 7+: Genesis Airdrop claims go live
- [ ] Day 37: Claim window closes
- [ ] Community vote: Burn unclaimed vs boost pool

### Smart Contracts Needed
- [ ] GenesisAirdropClaim.sol (merkle proof verification)
- [ ] TeamVesting.sol (2-year linear, OpenZeppelin)
- [ ] TreasuryVesting.sol (1-year linear)
- [ ] WeeklyRewardsDistributor.sol (claim mechanism)

---

## PHASE 6: AMM & DeFi Integration 📋 PLANNED

**Goal:** Full token trading and liquidity features

### Phase 6A: Testnet Testing (1-2 weeks)
- [ ] Deploy TestBattleToken on Base Sepolia
- [ ] Fixed price testing (1 TEST_BATTLE = 0.0001 ETH)
- [ ] Core swap functionality
- [ ] Liquidity addition/removal
- [ ] Fee collection testing
- [ ] Target: 100+ test swaps

### Phase 6B: Volatility Testing (2-3 weeks)
- [ ] Mirror DEGEN mainnet price via oracle
- [ ] Slippage protection testing
- [ ] High volatility simulation
- [ ] Target: 500+ swaps during volatile periods

### Phase 6C: Mainnet Production
- [ ] Integrate with Clanker-deployed LP
- [ ] Weekly rewards distribution automation
- [ ] Vault withdrawal manager
- [ ] Trading fee flow (40% to Treasury)

### Weekly Rewards System (~385M/week)
```
Pool Distribution:
├─ 40% (154M) - Winning Army Bonus
├─ 30% (115.5M) - Top 10 Leaderboard
│   ├─ 1st: 20M | 2nd: 15M | 3rd: 10M
│   └─ 4th-10th: 5M each
├─ 20% (77M) - Participation Bonus (all traders)
└─ 10% (38.5M) - Army Generals (Bull #1 + Bear #1)
```

---

## PHASE 7: Governance & Advanced Features 📋 FUTURE

**Goal:** Community-driven development and premium features

### Battle Store (Token Sink)
- [ ] Paper Money Boosts
  - +$10K: 100M $BATTLE
  - +$25K: 200M $BATTLE
  - +$50K: 350M $BATTLE
  - +$100K: 600M $BATTLE
- [ ] Trading Advantages
  - Fee reduction (50% or 100%)
  - Liquidation protection
  - "Second Chance" undo
  - Max leverage +10x
- [ ] Cosmetics
  - Custom profile frames
  - Animated effects
  - Exclusive badges
  - Leaderboard highlight
- [ ] Advanced Tools
  - Advanced charts
  - AI trade suggestions
  - Performance analytics

### Token Burn Mechanics
```
Battle Store Revenue:
├─ 20% burned (deflationary)
├─ 30% to treasury (buyback pressure)
└─ 50% to liquidity pools (depth)
```

### Governance
- [ ] Strategy parameter voting
- [ ] Feature priority voting
- [ ] Treasury allocation voting
- [ ] Monthly governance proposals

### Tournament System
- [ ] Weekly tournaments (50M entry)
- [ ] Monthly championships (200M entry)
- [ ] Special event passes (100M)
- [ ] VIP trader league (500M)

### NFT Badges
- [ ] Achievement NFTs
- [ ] General badges
- [ ] Tournament trophies
- [ ] Historical rank proofs

---

## Current Status Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: Core Features | ✅ Complete | 100% |
| Phase 3: Growth & Engagement | ✅ Complete | 100% |
| Phase 4: Battle System Upgrade | 🔄 In Progress | 30% |
| Phase 5: Token Launch | 📋 Planned | 0% |
| Phase 6: AMM & DeFi | 📋 Planned | 0% |
| Phase 7: Governance | 📋 Future | 0% |

---

## Key Metrics to Track

### User Engagement
- Daily Active Users (DAU)
- Weekly Active Traders
- Average trades per user
- Retention rate (7d, 30d)

### Trading Activity
- Total trading volume
- Open positions count
- Liquidation rate
- Average leverage used

### Token Economy (Post-Launch)
- $BATTLE circulating supply
- Weekly rewards distributed
- Battle Store revenue
- LP depth

### Army Warfare
- Bulls vs Bears weekly winners
- General performance
- Prediction market volume

---

## Development Priorities

### Immediate (Next 2 Weeks)
1. Complete Generals system
2. Implement weekly snapshot automation
3. Enhance Battle tab UI

### Short-term (1 Month)
1. Finalize token launch preparation
2. Create multisig wallets
3. Generate airdrop merkle tree
4. Test smart contracts on Sepolia

### Medium-term (2-3 Months)
1. Deploy $BATTLE token
2. Launch weekly rewards
3. Implement prediction market
4. Begin AMM testing

### Long-term (6+ Months)
1. Full governance system
2. Battle Store launch
3. Tournament infrastructure
4. NFT badge system

---

## Technical Debt & Improvements

### Performance
- [ ] Redis caching for frequent queries
- [ ] WebSocket for real-time updates
- [ ] Database query optimization
- [ ] CDN for static assets

### Security
- [ ] Smart contract audits
- [ ] Rate limit tuning
- [ ] API key rotation
- [ ] Backup automation

### Testing
- [ ] Unit test coverage
- [ ] Integration tests
- [ ] Load testing
- [ ] E2E testing with Playwright

---

## Links & Resources

- **Live App:** https://btcbattlefield.com
- **Farcaster Mini App:** https://farcaster.xyz/miniapps/5kLec5hSq3bP/battlefield
- **Token Deployment:** https://clanker.world (when ready)
- **Safe Wallets:** https://app.safe.global (Base network)

---

*Last Updated: January 2026*
*Version: 1.0*
