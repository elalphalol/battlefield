# Genesis Airdrop Management

Manage the BATTLE token Genesis Airdrop for early testers.

## Instructions

### Current Airdrop Status

Check user qualification and tier distribution:

```bash
echo "=== GENESIS AIRDROP STATUS ===" && echo "" && PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "
-- Tier counts
SELECT '🔥 OG Tier (100+ trades): ' || COUNT(*) || '/30 spots' FROM users WHERE total_trades >= 100;
SELECT '⚔️ Veteran Tier (25-99 trades): ' || COUNT(*) || '/70 spots' FROM users WHERE total_trades >= 25 AND total_trades < 100;
SELECT '🛡️ Recruit Tier (5-24 trades): ' || COUNT(*) || '/150 spots' FROM users WHERE total_trades >= 5 AND total_trades < 25;
SELECT '❌ Not Qualified (<5 trades): ' || COUNT(*) FROM users WHERE total_trades < 5;
SELECT '';
SELECT '📊 Total Eligible: ' || COUNT(*) || '/250 max' FROM users WHERE total_trades >= 5;
" 2>/dev/null | grep -v "^$"
```

### Airdrop Leaderboard (Top 250)

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
WITH ranked_users AS (
  SELECT
    username,
    wallet_address,
    total_trades,
    army,
    CASE
      WHEN total_trades >= 100 THEN 'OG'
      WHEN total_trades >= 25 THEN 'Veteran'
      WHEN total_trades >= 5 THEN 'Recruit'
      ELSE 'Not Qualified'
    END as tier,
    CASE
      WHEN total_trades >= 100 THEN 50000000
      WHEN total_trades >= 25 THEN 25000000
      WHEN total_trades >= 5 THEN 10000000
      ELSE 0
    END as token_allocation,
    ROW_NUMBER() OVER (
      PARTITION BY
        CASE
          WHEN total_trades >= 100 THEN 1
          WHEN total_trades >= 25 THEN 2
          WHEN total_trades >= 5 THEN 3
          ELSE 4
        END
      ORDER BY total_trades DESC
    ) as tier_rank
  FROM users
  WHERE total_trades >= 5
)
SELECT
  tier,
  username,
  total_trades as trades,
  army,
  tier_rank as rank,
  CASE
    WHEN tier = 'OG' AND tier_rank <= 30 THEN 'SECURED'
    WHEN tier = 'Veteran' AND tier_rank <= 70 THEN 'SECURED'
    WHEN tier = 'Recruit' AND tier_rank <= 150 THEN 'SECURED'
    ELSE 'AT RISK'
  END as status,
  TO_CHAR(token_allocation, 'FM999,999,999') || ' BATTLE' as allocation
FROM ranked_users
WHERE (tier = 'OG' AND tier_rank <= 35)
   OR (tier = 'Veteran' AND tier_rank <= 80)
   OR (tier = 'Recruit' AND tier_rank <= 160)
ORDER BY
  CASE tier WHEN 'OG' THEN 1 WHEN 'Veteran' THEN 2 ELSE 3 END,
  tier_rank
LIMIT 50;
"
```

### Check Specific User Airdrop Status

```bash
# Replace USERNAME with actual username
USERNAME="example_user"
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
WITH user_stats AS (
  SELECT
    username,
    wallet_address,
    total_trades,
    CASE
      WHEN total_trades >= 100 THEN 'OG'
      WHEN total_trades >= 25 THEN 'Veteran'
      WHEN total_trades >= 5 THEN 'Recruit'
      ELSE 'Not Qualified'
    END as tier
  FROM users
  WHERE username = '$USERNAME'
),
tier_rank AS (
  SELECT
    COUNT(*) + 1 as rank_in_tier
  FROM users u, user_stats us
  WHERE
    CASE
      WHEN us.tier = 'OG' THEN u.total_trades >= 100 AND u.total_trades > us.total_trades
      WHEN us.tier = 'Veteran' THEN u.total_trades >= 25 AND u.total_trades < 100 AND u.total_trades > us.total_trades
      WHEN us.tier = 'Recruit' THEN u.total_trades >= 5 AND u.total_trades < 25 AND u.total_trades > us.total_trades
      ELSE false
    END
)
SELECT
  us.username,
  us.wallet_address,
  us.total_trades as trades,
  us.tier,
  tr.rank_in_tier as \"rank in tier\",
  CASE us.tier
    WHEN 'OG' THEN '50,000,000 BATTLE'
    WHEN 'Veteran' THEN '25,000,000 BATTLE'
    WHEN 'Recruit' THEN '10,000,000 BATTLE'
    ELSE '0'
  END as allocation,
  CASE
    WHEN us.tier = 'OG' AND tr.rank_in_tier <= 30 THEN 'SECURED'
    WHEN us.tier = 'Veteran' AND tr.rank_in_tier <= 70 THEN 'SECURED'
    WHEN us.tier = 'Recruit' AND tr.rank_in_tier <= 150 THEN 'SECURED'
    WHEN us.tier = 'Not Qualified' THEN 'NOT ELIGIBLE'
    ELSE 'AT RISK'
  END as status
FROM user_stats us, tier_rank tr;
"
```

### Generate Airdrop CSV (For Snapshot)

```bash
# Export qualified users for merkle tree generation
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -A -F',' -c "
WITH ranked AS (
  SELECT
    wallet_address,
    total_trades,
    CASE
      WHEN total_trades >= 100 THEN 50000000
      WHEN total_trades >= 25 THEN 25000000
      WHEN total_trades >= 5 THEN 10000000
    END as amount,
    ROW_NUMBER() OVER (
      PARTITION BY
        CASE
          WHEN total_trades >= 100 THEN 1
          WHEN total_trades >= 25 THEN 2
          ELSE 3
        END
      ORDER BY total_trades DESC
    ) as tier_rank,
    CASE
      WHEN total_trades >= 100 THEN 30
      WHEN total_trades >= 25 THEN 70
      ELSE 150
    END as tier_cap
  FROM users
  WHERE total_trades >= 5
    AND wallet_address IS NOT NULL
    AND wallet_address != ''
)
SELECT wallet_address, amount
FROM ranked
WHERE tier_rank <= tier_cap
ORDER BY amount DESC, total_trades DESC;
" > /var/www/battlefield/backups/airdrop_snapshot_$(date +%Y%m%d).csv && echo "Exported to /var/www/battlefield/backups/airdrop_snapshot_$(date +%Y%m%d).csv"
```

### Tier Thresholds

| Tier | Trades Required | Max Users | Tokens Per User | Total Pool |
|------|-----------------|-----------|-----------------|------------|
| OG | 100+ | 30 | 50,000,000 | 1,500,000,000 |
| Veteran | 25-99 | 70 | 25,000,000 | 1,750,000,000 |
| Recruit | 5-24 | 150 | 10,000,000 | 1,500,000,000 |
| Reserve | - | - | - | 250,000,000 |
| **TOTAL** | | **250** | | **5,000,000,000** |

### Notes

- Users are ranked within their tier by trade count
- If more users qualify than slots available, lowest trade count users in tier are "AT RISK"
- Snapshot will be taken on launch day to freeze rankings
- 30-day vesting period applies after claim
