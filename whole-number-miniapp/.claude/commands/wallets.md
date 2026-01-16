# Multisig Wallet Management

Manage BATTLE token multisig wallets (Gnosis Safe).

## Instructions

### Wallet Overview

```bash
echo "=== BATTLE TOKEN WALLETS ==="
echo ""
echo "Required Multisig Wallets (Gnosis Safe on Base):"
echo ""
echo "┌─────────────────────────────────────────────────────────┐"
echo "│  1. Genesis Airdrop Wallet                              │"
echo "│     Purpose: Hold 5B for user airdrop claim             │"
echo "│     Amount: 5,000,000,000 BATTLE                        │"
echo "│     Address: [NOT SET]                                  │"
echo "├─────────────────────────────────────────────────────────┤"
echo "│  2. Team/Dev Wallet                                     │"
echo "│     Purpose: Team allocation (2-year vesting)           │"
echo "│     Amount: 10,000,000,000 BATTLE                       │"
echo "│     Address: [NOT SET]                                  │"
echo "├─────────────────────────────────────────────────────────┤"
echo "│  3. Treasury Wallet                                     │"
echo "│     Purpose: Operations & development (1-year vesting)  │"
echo "│     Amount: 5,000,000,000 BATTLE                        │"
echo "│     Address: [NOT SET]                                  │"
echo "├─────────────────────────────────────────────────────────┤"
echo "│  4. Token Admin Wallet                                  │"
echo "│     Purpose: Clanker tokenAdmin (controls vault)        │"
echo "│     Amount: 0 (admin only)                              │"
echo "│     Address: [NOT SET]                                  │"
echo "└─────────────────────────────────────────────────────────┘"
```

### Create Gnosis Safe Wallets

```bash
echo "=== GNOSIS SAFE SETUP GUIDE ==="
echo ""
echo "1. Go to: https://app.safe.global/"
echo "2. Connect wallet"
echo "3. Select 'Base' network"
echo "4. Click 'Create Safe'"
echo ""
echo "Recommended Settings:"
echo "  - 2/3 multisig (2 signatures required, 3 owners)"
echo "  - Add trusted team member addresses as owners"
echo "  - Enable spending limits for operations"
echo ""
echo "Security Tips:"
echo "  - Use hardware wallets for owner accounts"
echo "  - Distribute keys across team members"
echo "  - Test with small transactions first"
```

### Wallet Configuration Checklist

```bash
echo "=== WALLET SETUP CHECKLIST ==="
echo ""
echo "For each wallet, complete these steps:"
echo ""
echo "Genesis Airdrop Wallet:"
echo "  [ ] Create 2/3 Gnosis Safe on Base"
echo "  [ ] Record address"
echo "  [ ] Test receive/send with small ETH"
echo "  [ ] Add to Clanker CSV"
echo ""
echo "Team/Dev Wallet:"
echo "  [ ] Create 2/3 Gnosis Safe on Base"
echo "  [ ] Record address"
echo "  [ ] Deploy vesting contract (Day 1)"
echo "  [ ] Transfer 10B to vesting contract"
echo ""
echo "Treasury Wallet:"
echo "  [ ] Create 2/3 Gnosis Safe on Base"
echo "  [ ] Record address"
echo "  [ ] Deploy vesting contract (Day 1)"
echo "  [ ] Transfer 5B to vesting contract"
echo ""
echo "Token Admin Wallet:"
echo "  [ ] Create 2/3 Gnosis Safe on Base"
echo "  [ ] Record address"
echo "  [ ] Use as Clanker tokenAdmin"
echo "  [ ] Test vault withdrawal capability"
```

### Update Wallet Addresses

After creating wallets, update the configuration:

```bash
# Edit this file to store your wallet addresses
cat << 'EOF'
# BATTLE Token Wallet Addresses
# Update these after creating Gnosis Safes

GENESIS_WALLET=""
TEAM_WALLET=""
TREASURY_WALLET=""
ADMIN_WALLET=""

# Export for scripts
export GENESIS_WALLET TEAM_WALLET TREASURY_WALLET ADMIN_WALLET
EOF
```

### Generate Clanker CSV

```bash
echo "=== GENERATE CLANKER CSV ==="
echo ""
echo "Once wallets are created, generate the airdrop CSV:"
echo ""

# Placeholder - replace with actual addresses
GENESIS_WALLET="0x_GENESIS_ADDRESS"
TEAM_WALLET="0x_TEAM_ADDRESS"
TREASURY_WALLET="0x_TREASURY_ADDRESS"

echo "address,amount"
echo "$GENESIS_WALLET,5000000000"
echo "$TEAM_WALLET,10000000000"
echo "$TREASURY_WALLET,5000000000"
echo ""
echo "Save this as 'battle_airdrop.csv' for Clanker"
```

### Verify Wallet Balances (Post-Launch)

```bash
echo "=== CHECK WALLET BALANCES ==="
echo ""
echo "After Clanker deployment + 1 day lockup, verify balances:"
echo ""
echo "# Using cast (foundry)"
echo "TOKEN_ADDRESS='0x_BATTLE_TOKEN'"
echo ""
echo "# Genesis Wallet"
echo "cast call \$TOKEN_ADDRESS 'balanceOf(address)' GENESIS_WALLET --rpc-url https://mainnet.base.org"
echo ""
echo "# Team Wallet"
echo "cast call \$TOKEN_ADDRESS 'balanceOf(address)' TEAM_WALLET --rpc-url https://mainnet.base.org"
echo ""
echo "# Treasury Wallet"
echo "cast call \$TOKEN_ADDRESS 'balanceOf(address)' TREASURY_WALLET --rpc-url https://mainnet.base.org"
echo ""
echo "Or check on Basescan: https://basescan.org/token/TOKEN_ADDRESS#balances"
```

### Wallet Security Best Practices

```bash
echo "=== SECURITY BEST PRACTICES ==="
echo ""
echo "1. Hardware Wallets"
echo "   - Use Ledger/Trezor for all owner accounts"
echo "   - Never expose private keys"
echo ""
echo "2. Multisig Configuration"
echo "   - 2/3 threshold minimum"
echo "   - Distribute owners geographically"
echo "   - Have backup access plan"
echo ""
echo "3. Transaction Verification"
echo "   - Always verify recipient addresses"
echo "   - Double-check amounts before signing"
echo "   - Use address book for known addresses"
echo ""
echo "4. Monitoring"
echo "   - Set up Basescan notifications"
echo "   - Monitor for unexpected transactions"
echo "   - Regular security audits"
echo ""
echo "5. Recovery"
echo "   - Document recovery procedures"
echo "   - Test recovery process"
echo "   - Secure backup of Safe setup"
```

### Useful Links

```bash
echo "=== USEFUL LINKS ==="
echo ""
echo "Gnosis Safe:"
echo "  App: https://app.safe.global/"
echo "  Docs: https://help.safe.global/"
echo ""
echo "Base Network:"
echo "  Basescan: https://basescan.org"
echo "  RPC: https://mainnet.base.org"
echo "  Chain ID: 8453"
echo ""
echo "Foundry (cast):"
echo "  Install: curl -L https://foundry.paradigm.xyz | bash"
echo "  Docs: https://book.getfoundry.sh/"
```
