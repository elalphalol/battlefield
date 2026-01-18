# New Mission Ideas for BATTLEFIELD

## Current Missions Summary
- **1 One-time**: Follow mission ($5,000)
- **4 Daily**: Open trade, Win trade, Cast result, Two Faces ($200-$500)
- **5 Weekly**: Trading streak, Win 5, Claim streak, Army Loyalty, The Betrayer ($1,500-$10,000)

---

## DAILY MISSIONS (New Ideas)

| Mission | Icon | Description | Reward | Difficulty |
|---------|------|-------------|--------|------------|
| **High Roller** | 🎰 | Open a trade with 50x+ leverage | $300 | Easy |
| **The Survivor** | 🛡️ | Close a 10x+ trade without liquidation | $350 | Medium |
| **Quick Flip** | ⚡ | Open and close a trade within 5 minutes | $250 | Easy |
| **Diamond Hands** | 💎 | Hold a position for 1+ hour | $300 | Easy |
| **Profit Hunter** | 🎯 | Close a trade with 10%+ profit | $500 | Hard |
| **Big Bet** | 💰 | Trade with 50%+ of your balance | $400 | Medium |
| **Comeback Kid** | 🔄 | Win after getting liquidated today | $600 | Hard |

---

## WEEKLY MISSIONS (New Ideas)

| Mission | Icon | Description | Reward | Difficulty |
|---------|------|-------------|--------|------------|
| **Volume King** | 👑 | Open 20 trades in a week | $3,000 | Medium |
| **Winning Streak** | 🔥 | Win 3 trades in a row | $2,500 | Hard |
| **Moon Mission** | 🚀 | Earn $500+ total P&L | $3,500 | Hard |
| **Whale Watcher** | 🐋 | Reach $50,000+ balance | $5,000 | Hard |
| **Consistency is Key** | 📆 | Trade all 7 days | $5,000 | Medium |
| **Share the Love** | ❤️ | Cast 3 trade results | $2,500 | Easy |
| **Phoenix Rising** | 🔥 | Get liquidated but end week profitable | $4,000 | Hard |
| **The Contrarian** | 🔮 | Win betting against majority army | $2,000 | Medium |
| **Iron Will** | 🏋️ | Hold through 50%+ drawdown, close profit | $3,000 | Hard |
| **Lucky Number** | 🍀 | Close with exactly $777 profit | $1,000 | Fun/RNG |

---

## Top Recommendations to Add First

### Daily:
1. **High Roller** (🎰) - Simple to track, encourages leverage exploration
2. **Diamond Hands** (💎) - Time-based, rewards patience
3. **The Survivor** (🛡️) - Teaches risk management

### Weekly:
1. **Volume King** (👑) - Drives engagement (20 trades)
2. **Moon Mission** (🚀) - Profit milestone ($500 P&L)
3. **Consistency is Key** (📆) - Ultimate 7-day streak

---

## Implementation Notes

All missions use the existing `objective_type` system. New types needed:
- `high_leverage` - Check leverage >= threshold on trade open
- `survived` - Track close without liquidation at high leverage
- `hold_duration` - Check time between open and close
- `weekly_pnl` - Sum P&L for the week
- `volume` - Count total trades
- `daily_streak_7` - Enhanced streak check

Database changes: Just INSERT new missions with appropriate objective_type values.

---

## Reward Values (in cents for database)

| Mission | Reward ($) | Reward (cents) |
|---------|------------|----------------|
| High Roller | $300 | 30000 |
| The Survivor | $350 | 35000 |
| Quick Flip | $250 | 25000 |
| Diamond Hands | $300 | 30000 |
| Profit Hunter | $500 | 50000 |
| Big Bet | $400 | 40000 |
| Comeback Kid | $600 | 60000 |
| Volume King | $3,000 | 300000 |
| Winning Streak | $2,500 | 250000 |
| Moon Mission | $3,500 | 350000 |
| Whale Watcher | $5,000 | 500000 |
| Consistency is Key | $5,000 | 500000 |
| Share the Love | $2,500 | 250000 |
| Phoenix Rising | $4,000 | 400000 |
| The Contrarian | $2,000 | 200000 |
| Iron Will | $3,000 | 300000 |
| Lucky Number | $1,000 | 100000 |
