# Airdrop Leaderboard Snapshot

Freeze airdrop rankings and generate merkle tree data.

## Instructions

### Pre-Snapshot Status

```bash
echo "=== PRE-SNAPSHOT CHECK ==="
echo ""
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "
SELECT 'Total Users: ' || COUNT(*) FROM users;
SELECT 'With Wallet: ' || COUNT(*) FROM users WHERE wallet_address IS NOT NULL AND wallet_address != '';
SELECT 'Eligible (5+ trades): ' || COUNT(*) FROM users WHERE total_trades >= 5;
SELECT 'Missing Wallet (eligible): ' || COUNT(*) FROM users WHERE total_trades >= 5 AND (wallet_address IS NULL OR wallet_address = '');
" 2>/dev/null | grep -v "^$"
echo ""
echo "Users missing wallet cannot receive airdrop!"
```

### Take Official Snapshot

This creates a permanent record of the airdrop rankings.

```bash
echo "=== TAKING AIRDROP SNAPSHOT ==="
echo ""
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SNAPSHOT_DIR="/var/www/battlefield/backups/snapshots"
mkdir -p "$SNAPSHOT_DIR"

# Create snapshot table in database
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
-- Create snapshot table if not exists
CREATE TABLE IF NOT EXISTS airdrop_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_id VARCHAR(50) NOT NULL,
  user_id INTEGER NOT NULL,
  username VARCHAR(255),
  wallet_address VARCHAR(255),
  total_trades INTEGER,
  tier VARCHAR(20),
  tier_rank INTEGER,
  token_amount BIGINT,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert snapshot data
INSERT INTO airdrop_snapshots (snapshot_id, user_id, username, wallet_address, total_trades, tier, tier_rank, token_amount, status)
WITH ranked AS (
  SELECT
    id,
    username,
    wallet_address,
    total_trades,
    CASE
      WHEN total_trades >= 100 THEN 'OG'
      WHEN total_trades >= 25 THEN 'Veteran'
      WHEN total_trades >= 5 THEN 'Recruit'
    END as tier,
    CASE
      WHEN total_trades >= 100 THEN 50000000
      WHEN total_trades >= 25 THEN 25000000
      WHEN total_trades >= 5 THEN 10000000
    END as token_amount,
    ROW_NUMBER() OVER (
      PARTITION BY
        CASE
          WHEN total_trades >= 100 THEN 1
          WHEN total_trades >= 25 THEN 2
          ELSE 3
        END
      ORDER BY total_trades DESC, created_at ASC
    ) as tier_rank
  FROM users
  WHERE total_trades >= 5
    AND wallet_address IS NOT NULL
    AND wallet_address != ''
)
SELECT
  'SNAPSHOT_$TIMESTAMP',
  id,
  username,
  wallet_address,
  total_trades,
  tier,
  tier_rank,
  token_amount,
  CASE
    WHEN tier = 'OG' AND tier_rank <= 30 THEN 'QUALIFIED'
    WHEN tier = 'Veteran' AND tier_rank <= 70 THEN 'QUALIFIED'
    WHEN tier = 'Recruit' AND tier_rank <= 150 THEN 'QUALIFIED'
    ELSE 'OVERFLOW'
  END
FROM ranked;
"

echo "Snapshot ID: SNAPSHOT_$TIMESTAMP"
echo "Snapshot saved to database"
```

### Export Snapshot to CSV

```bash
SNAPSHOT_ID="SNAPSHOT_LATEST"  # Replace with actual snapshot ID
SNAPSHOT_DIR="/var/www/battlefield/backups/snapshots"

echo "=== EXPORTING SNAPSHOT ==="

# Full snapshot export
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -A -F',' -c "
SELECT
  wallet_address,
  token_amount,
  tier,
  tier_rank,
  status
FROM airdrop_snapshots
WHERE snapshot_id = '$SNAPSHOT_ID'
  AND status = 'QUALIFIED'
ORDER BY token_amount DESC, tier_rank ASC;
" > "$SNAPSHOT_DIR/airdrop_qualified_$(date +%Y%m%d).csv"

echo "Exported qualified users to: $SNAPSHOT_DIR/airdrop_qualified_$(date +%Y%m%d).csv"

# Merkle tree format (address,amount only)
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -A -F',' -c "
SELECT wallet_address, token_amount
FROM airdrop_snapshots
WHERE snapshot_id = '$SNAPSHOT_ID'
  AND status = 'QUALIFIED'
ORDER BY token_amount DESC, tier_rank ASC;
" > "$SNAPSHOT_DIR/merkle_input_$(date +%Y%m%d).csv"

echo "Merkle tree input saved to: $SNAPSHOT_DIR/merkle_input_$(date +%Y%m%d).csv"
```

### View Snapshot Summary

```bash
echo "=== SNAPSHOT SUMMARY ==="
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  tier,
  COUNT(*) as users,
  COUNT(*) FILTER (WHERE status = 'QUALIFIED') as qualified,
  COUNT(*) FILTER (WHERE status = 'OVERFLOW') as overflow,
  TO_CHAR(SUM(CASE WHEN status = 'QUALIFIED' THEN token_amount ELSE 0 END), 'FM999,999,999,999') as total_tokens
FROM airdrop_snapshots
WHERE snapshot_id = (SELECT MAX(snapshot_id) FROM airdrop_snapshots)
GROUP BY tier
ORDER BY
  CASE tier WHEN 'OG' THEN 1 WHEN 'Veteran' THEN 2 ELSE 3 END;
"
```

### List All Snapshots

```bash
echo "=== ALL SNAPSHOTS ==="
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  snapshot_id,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE status = 'QUALIFIED') as qualified,
  TO_CHAR(SUM(CASE WHEN status = 'QUALIFIED' THEN token_amount ELSE 0 END), 'FM999,999,999,999') as total_tokens,
  MIN(created_at) as created
FROM airdrop_snapshots
GROUP BY snapshot_id
ORDER BY MIN(created_at) DESC;
"
```

### Generate Merkle Tree

After exporting the snapshot, generate merkle tree for smart contract:

```bash
echo "=== MERKLE TREE GENERATION ==="
echo ""
echo "Use a merkle tree generator with the exported CSV:"
echo ""
echo "Option 1: OpenZeppelin Merkle Tree (JS)"
echo "  npm install @openzeppelin/merkle-tree"
echo ""
echo "Option 2: Foundry (cast)"
echo "  forge script GenerateMerkle.s.sol"
echo ""
echo "The merkle root will be used in the Genesis Claim Contract"
echo "Each user gets a merkle proof for claiming their allocation"
```

### Snapshot Lock Status

```bash
echo "=== SNAPSHOT STATUS ==="
echo ""

# Check if snapshot exists
SNAPSHOT_COUNT=$(PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "SELECT COUNT(DISTINCT snapshot_id) FROM airdrop_snapshots;" 2>/dev/null | tr -d ' ')

if [ "$SNAPSHOT_COUNT" -gt 0 ]; then
  echo "Status: SNAPSHOTS TAKEN"
  echo "Total Snapshots: $SNAPSHOT_COUNT"
  echo ""
  echo "Latest Snapshot:"
  PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "
  SELECT snapshot_id || ' (' || COUNT(*) || ' users)'
  FROM airdrop_snapshots
  WHERE snapshot_id = (SELECT MAX(snapshot_id) FROM airdrop_snapshots)
  GROUP BY snapshot_id;
  " 2>/dev/null
else
  echo "Status: NO SNAPSHOTS YET"
  echo "Run 'Take Official Snapshot' when ready to freeze rankings"
fi
```

### Verify Snapshot Integrity

```bash
echo "=== VERIFY SNAPSHOT ==="
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
WITH snapshot_stats AS (
  SELECT
    snapshot_id,
    COUNT(*) FILTER (WHERE tier = 'OG' AND status = 'QUALIFIED') as og_count,
    COUNT(*) FILTER (WHERE tier = 'Veteran' AND status = 'QUALIFIED') as vet_count,
    COUNT(*) FILTER (WHERE tier = 'Recruit' AND status = 'QUALIFIED') as rec_count,
    SUM(CASE WHEN status = 'QUALIFIED' THEN token_amount ELSE 0 END) as total_tokens
  FROM airdrop_snapshots
  WHERE snapshot_id = (SELECT MAX(snapshot_id) FROM airdrop_snapshots)
  GROUP BY snapshot_id
)
SELECT
  'OG Tier: ' || og_count || '/30 (' ||
    CASE WHEN og_count <= 30 THEN 'OK' ELSE 'OVER!' END || ')' as og_status,
  'Veteran Tier: ' || vet_count || '/70 (' ||
    CASE WHEN vet_count <= 70 THEN 'OK' ELSE 'OVER!' END || ')' as vet_status,
  'Recruit Tier: ' || rec_count || '/150 (' ||
    CASE WHEN rec_count <= 150 THEN 'OK' ELSE 'OVER!' END || ')' as rec_status,
  'Total Qualified: ' || (og_count + vet_count + rec_count) || '/250' as total_status,
  'Total Tokens: ' || TO_CHAR(total_tokens, 'FM999,999,999,999') || ' (max 5B)' as token_status
FROM snapshot_stats;
"
```

### Important Notes

- **SNAPSHOT IS FINAL**: Once taken, rankings are frozen for airdrop
- **Take snapshot Day -7**: One week before token launch
- **Verify wallet addresses**: Users without wallets cannot claim
- **Keep backups**: Export CSV files to multiple locations
- **Merkle tree**: Generate before deploying claim contract
