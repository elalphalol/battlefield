# Achievements

View achievement statistics and player progress.

## Instructions

Display achievement data and unlock statistics.

## Achievement Overview

```bash
echo "🏆 BATTLEFIELD ACHIEVEMENTS" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  achievement_key as achievement,
  COUNT(*) as unlocked_by,
  MIN(unlocked_at) as first_unlock,
  MAX(unlocked_at) as latest_unlock
FROM achievements
GROUP BY achievement_key
ORDER BY unlocked_by DESC;
"
```

## Most Common Achievements

```bash
echo "" && echo "📊 TOP ACHIEVEMENTS:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  a.achievement_key as achievement,
  COUNT(*) as count,
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM users) * 100, 1) as pct_players
FROM achievements a
GROUP BY a.achievement_key
ORDER BY count DESC
LIMIT 10;
"
```

## Rare Achievements

```bash
echo "" && echo "💎 RARE ACHIEVEMENTS (< 5 players):" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  achievement_key as achievement,
  COUNT(*) as holders
FROM achievements
GROUP BY achievement_key
HAVING COUNT(*) < 5
ORDER BY COUNT(*) ASC;
"
```

## Recent Unlocks

```bash
echo "" && echo "🆕 RECENT ACHIEVEMENT UNLOCKS:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  TO_CHAR(a.unlocked_at, 'MM/DD HH24:MI') as time,
  COALESCE(u.username, LEFT(u.wallet_address, 8)) as player,
  a.achievement_key as achievement
FROM achievements a
JOIN users u ON a.user_id = u.id
ORDER BY a.unlocked_at DESC
LIMIT 15;
"
```

## Player Achievement Counts

```bash
echo "" && echo "🎖️ PLAYERS WITH MOST ACHIEVEMENTS:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  COALESCE(u.username, LEFT(u.wallet_address, 10)) as player,
  u.army,
  COUNT(a.id) as achievements,
  u.total_pnl as pnl
FROM users u
LEFT JOIN achievements a ON u.id = a.user_id
GROUP BY u.id, u.username, u.wallet_address, u.army, u.total_pnl
HAVING COUNT(a.id) > 0
ORDER BY COUNT(a.id) DESC
LIMIT 10;
"
```

## Achievement Distribution

```bash
echo "" && echo "📈 ACHIEVEMENT DISTRIBUTION:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  CASE
    WHEN ach_count = 0 THEN '0 achievements'
    WHEN ach_count BETWEEN 1 AND 3 THEN '1-3 achievements'
    WHEN ach_count BETWEEN 4 AND 6 THEN '4-6 achievements'
    WHEN ach_count BETWEEN 7 AND 10 THEN '7-10 achievements'
    ELSE '10+ achievements'
  END as bracket,
  COUNT(*) as players
FROM (
  SELECT u.id, COUNT(a.id) as ach_count
  FROM users u
  LEFT JOIN achievements a ON u.id = a.user_id
  GROUP BY u.id
) sub
GROUP BY
  CASE
    WHEN ach_count = 0 THEN '0 achievements'
    WHEN ach_count BETWEEN 1 AND 3 THEN '1-3 achievements'
    WHEN ach_count BETWEEN 4 AND 6 THEN '4-6 achievements'
    WHEN ach_count BETWEEN 7 AND 10 THEN '7-10 achievements'
    ELSE '10+ achievements'
  END
ORDER BY
  CASE
    WHEN bracket = '0 achievements' THEN 1
    WHEN bracket = '1-3 achievements' THEN 2
    WHEN bracket = '4-6 achievements' THEN 3
    WHEN bracket = '7-10 achievements' THEN 4
    ELSE 5
  END;
"
```
