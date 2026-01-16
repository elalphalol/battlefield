# Vault Vesting Monitor

Monitor BATTLE token vault vesting and weekly unlocks.

## Instructions

### Vault Overview

```bash
echo "=== BATTLE VAULT STATUS ==="
echo ""
echo "📦 Vault Configuration:"
echo "   Total Allocation: 60,000,000,000 BATTLE (60%)"
echo "   Lockup Period: 7 days (from launch)"
echo "   Vesting Period: 730 days (2 years)"
echo "   Weekly Unlock: ~577,000,000 BATTLE"
echo ""
echo "💰 Distribution Plan:"
echo "   Weekly Rewards: 385M/week (66.7%)"
echo "   LP Additions:   192M/week (33.3%)"
```

### Calculate Vesting Progress

```bash
# Calculate vesting progress (replace LAUNCH_DATE with actual launch)
LAUNCH_DATE="2025-03-01"  # Update this after launch

echo "=== VESTING CALCULATOR ==="
echo ""
echo "Launch Date: $LAUNCH_DATE"

# Calculate days since launch
LAUNCH_TS=$(date -d "$LAUNCH_DATE" +%s 2>/dev/null || echo "0")
NOW_TS=$(date +%s)

if [ "$LAUNCH_TS" != "0" ] && [ "$NOW_TS" -gt "$LAUNCH_TS" ]; then
  DAYS_SINCE=$((($NOW_TS - $LAUNCH_TS) / 86400))
  WEEKS_SINCE=$(($DAYS_SINCE / 7))

  # Lockup period is 7 days
  if [ "$DAYS_SINCE" -lt 7 ]; then
    echo "Status: LOCKED (Day $DAYS_SINCE of 7)"
    echo "Unlocked: 0 BATTLE"
    echo "Remaining: 60,000,000,000 BATTLE"
  else
    VESTING_DAYS=$(($DAYS_SINCE - 7))
    if [ "$VESTING_DAYS" -gt 730 ]; then
      VESTING_DAYS=730
    fi

    # Linear vesting: 60B over 730 days
    UNLOCKED=$((60000000000 * $VESTING_DAYS / 730))
    REMAINING=$((60000000000 - $UNLOCKED))
    PERCENT=$(($VESTING_DAYS * 100 / 730))

    echo "Status: VESTING"
    echo "Days Since Launch: $DAYS_SINCE"
    echo "Vesting Days: $VESTING_DAYS / 730"
    echo "Progress: $PERCENT%"
    echo ""
    echo "Unlocked: $(printf "%'d" $UNLOCKED) BATTLE"
    echo "Remaining: $(printf "%'d" $REMAINING) BATTLE"
    echo "Weeks Complete: $WEEKS_SINCE"
  fi
else
  echo "Status: NOT LAUNCHED"
  echo "Set LAUNCH_DATE in script after token deployment"
fi
```

### Weekly Withdrawal Schedule

```bash
echo "=== WEEKLY VAULT SCHEDULE ==="
echo ""
echo "Each week after lockup ends:"
echo ""
echo "┌─────────────────────────────────────────────┐"
echo "│  Weekly Unlock: ~577,000,000 BATTLE         │"
echo "├─────────────────────────────────────────────┤"
echo "│  Distribution:                              │"
echo "│    Weekly Rewards: 385,000,000 (66.7%)     │"
echo "│    LP Additions:   192,000,000 (33.3%)     │"
echo "└─────────────────────────────────────────────┘"
echo ""
echo "Rewards Breakdown (385M/week):"
echo "  40% Winning Army:    154,000,000"
echo "  30% Top 10:          115,500,000"
echo "  20% Participation:    77,000,000"
echo "  10% Army Generals:    38,500,000"
```

### Vault Contract Interaction (Post-Launch)

```bash
echo "=== VAULT CONTRACT COMMANDS ==="
echo ""
echo "After launch, these commands will interact with the vault:"
echo ""
echo "# Check vault balance (via Basescan or cast)"
echo "cast call VAULT_ADDRESS 'balanceOf(address)' TOKEN_ADDRESS --rpc-url https://mainnet.base.org"
echo ""
echo "# Check vested amount"
echo "cast call VAULT_ADDRESS 'releasable(address)' TOKEN_ADDRESS --rpc-url https://mainnet.base.org"
echo ""
echo "# Withdraw vested tokens (requires admin)"
echo "cast send VAULT_ADDRESS 'release(address)' TOKEN_ADDRESS --rpc-url https://mainnet.base.org --private-key \$ADMIN_KEY"
```

### Vesting Timeline Visualization

```bash
echo "=== 2-YEAR VESTING TIMELINE ==="
echo ""
echo "Year 1 (Weeks 1-52):"
echo "├── Week 1-7:   LOCKUP PERIOD"
echo "├── Week 8:     First unlock (~577M)"
echo "├── Week 26:    25% vested (15B)"
echo "└── Week 52:    50% vested (30B)"
echo ""
echo "Year 2 (Weeks 53-104):"
echo "├── Week 78:    75% vested (45B)"
echo "└── Week 104:   100% vested (60B) - COMPLETE"
echo ""
echo "Cumulative by Milestone:"
echo "  3 months:  ~7.5B BATTLE"
echo "  6 months:  ~15B BATTLE"
echo "  1 year:    ~30B BATTLE"
echo "  2 years:   60B BATTLE (complete)"
```

### LP Addition Schedule

```bash
echo "=== LP ADDITION TRACKING ==="
echo ""
echo "Weekly LP Addition: 192,000,000 BATTLE"
echo ""
echo "This adds to the Uniswap LP each week,"
echo "deepening liquidity over time."
echo ""
echo "Cumulative LP Additions:"
echo "  Month 1:   ~770M"
echo "  Month 3:   ~2.3B"
echo "  Month 6:   ~4.6B"
echo "  Year 1:    ~10B"
echo "  Year 2:    ~20B (complete)"
echo ""
echo "Starting LP: 20B"
echo "Final LP:    40B (after 2 years)"
```

### Notes

- Vault is managed by Clanker's vesting contract
- Withdrawals require tokenAdmin multisig signature
- Weekly operations should be scheduled/automated
- Monitor vault address on Basescan for transparency
