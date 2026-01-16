# BATTLE Token Launch

Manage the BATTLE token launch via Clanker on Base.

## Instructions

### Launch Configuration Summary

```bash
echo "=== BATTLE TOKEN LAUNCH CONFIG ==="
echo ""
echo "📊 Token Distribution:"
echo "   LP (Locked):      20B (20%)"
echo "   Vault (2yr vest): 60B (60%)"
echo "   Genesis Airdrop:  5B  (5%)"
echo "   Team/Dev:         10B (10%)"
echo "   Treasury:         5B  (5%)"
echo ""
echo "🏊 Pool Configuration:"
echo "   Type: Project 10 ETH"
echo "   Starting Cap: ~\$33K (10 ETH)"
echo "   Positions: 5 optimized"
echo "   Fees: 1% Dynamic (40% creator)"
echo ""
echo "⏰ Clanker Settings:"
echo "   Vault Lockup: 7 days"
echo "   Vault Vesting: 730 days (2 years)"
echo "   Airdrop Lockup: 1 day"
echo "   Airdrop Vesting: Instant"
```

### Pre-Launch Checklist

```bash
echo "=== PRE-LAUNCH CHECKLIST ===" && echo ""

# Check user count for airdrop
USERS=$(PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "SELECT COUNT(*) FROM users WHERE total_trades >= 5;" 2>/dev/null | tr -d ' ')
echo "[ ] Eligible users for airdrop: $USERS (need 50+ for healthy launch)"

# Check if wallets are configured (placeholder check)
echo "[ ] Multisig wallets created (Gnosis Safe):"
echo "    - Genesis Airdrop Wallet"
echo "    - Team/Dev Wallet"
echo "    - Treasury Wallet"
echo "    - Token Admin Wallet"
echo ""
echo "[ ] Token image uploaded to IPFS"
echo "[ ] Airdrop leaderboard snapshot taken"
echo "[ ] Merkle tree generated"
echo "[ ] Clanker CSV prepared"
echo ""
echo "📋 Clanker CSV Format:"
echo "address,amount"
echo "0x_GENESIS_WALLET,5000000000"
echo "0x_TEAM_WALLET,10000000000"
echo "0x_TREASURY_WALLET,5000000000"
```

### Launch Day Steps

```bash
echo "=== LAUNCH DAY CHECKLIST ==="
echo ""
echo "1. [ ] Go to https://clanker.world/create"
echo "2. [ ] Configure token:"
echo "       Name: BATTLE"
echo "       Symbol: BATTLE"
echo "       Image: ipfs://YOUR_CID"
echo ""
echo "3. [ ] Set Pool: Project 10 ETH"
echo ""
echo "4. [ ] Set Vault:"
echo "       Percentage: 60%"
echo "       Lockup: 7 days"
echo "       Vesting: 730 days"
echo ""
echo "5. [ ] Enable Airdrop Extension:"
echo "       Upload CSV (3 wallets)"
echo "       Lockup: 1 day"
echo "       Vesting: Instant"
echo ""
echo "6. [ ] Review and Deploy"
echo "7. [ ] Copy token address"
echo "8. [ ] Verify on Basescan"
echo "9. [ ] Announce launch!"
```

### Post-Launch Verification

```bash
echo "=== POST-LAUNCH VERIFICATION ==="
echo ""
echo "After deployment, verify on Basescan:"
echo ""
echo "1. Token Contract:"
echo "   - Total Supply: 100,000,000,000"
echo "   - Symbol: BATTLE"
echo "   - Decimals: 18"
echo ""
echo "2. LP Verification:"
echo "   - 20B tokens in Uniswap LP"
echo "   - LP locked permanently in Clanker LP Locker"
echo ""
echo "3. Vault Verification:"
echo "   - 60B tokens in vault"
echo "   - 7-day lockup active"
echo "   - 730-day linear vesting"
echo ""
echo "4. Airdrop Wallets (after 1-day lockup):"
echo "   - Genesis: 5B"
echo "   - Team/Dev: 10B"
echo "   - Treasury: 5B"
```

### Token Address Tracking

Once deployed, update this section with actual addresses:

```bash
echo "=== TOKEN ADDRESSES ==="
echo ""
echo "Token Contract: [NOT DEPLOYED YET]"
echo "LP Pool: [NOT DEPLOYED YET]"
echo "Vault Contract: [NOT DEPLOYED YET]"
echo ""
echo "Airdrop Wallets:"
echo "  Genesis: [NOT SET]"
echo "  Team/Dev: [NOT SET]"
echo "  Treasury: [NOT SET]"
echo "  Admin: [NOT SET]"
```

### Useful Links

```bash
echo "=== USEFUL LINKS ==="
echo ""
echo "Clanker:"
echo "  Create: https://clanker.world/create"
echo "  LP Simulator: https://clanker.world/lp-simulator"
echo "  Docs: https://clanker.gitbook.io/clanker-documentation"
echo ""
echo "Base:"
echo "  Basescan: https://basescan.org"
echo "  Bridge: https://bridge.base.org"
echo ""
echo "Project:"
echo "  App: https://btcbattlefield.com"
echo "  Channel: https://warpcast.com/~/channel/battlefield"
```

### Timeline Reference

```
PRE-LAUNCH
Day -14: Prepare multisig wallets, IPFS image
Day -7:  Freeze airdrop leaderboard (/snapshot)
Day -3:  Generate merkle tree, prepare CSV

LAUNCH
Day 0:   Deploy via Clanker
Day 1:   Airdrop lockup ends - receive tokens
Day 1-7: Deploy vesting contracts
Day 7:   Vault lockup ends, vesting begins
Day 7+:  Genesis Airdrop claim goes live
Day 37:  Claim window closes, community vote

ONGOING
Week 2+: Weekly rewards begin
Week 104: Vault fully unlocked
```
