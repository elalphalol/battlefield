# Mission Management

Monitor and manage BATTLEFIELD missions system.

## Instructions

View mission stats, progress, and manage mission data.

## Mission Overview

```bash
echo "=== MISSIONS OVERVIEW ===" && PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  m.mission_type as type,
  m.title,
  m.icon,
  TO_CHAR(m.reward_amount, 'FM$999,999') as reward,
  COUNT(um.id) FILTER (WHERE um.is_completed) as completions,
  COUNT(um.id) FILTER (WHERE um.is_claimed) as claims
FROM missions m
LEFT JOIN user_missions um ON um.mission_id = m.id
WHERE m.is_active = true
GROUP BY m.id, m.mission_type, m.title, m.icon, m.reward_amount, m.display_order
ORDER BY m.mission_type, m.display_order;
"
```

## Today's Mission Activity

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  m.title,
  u.username,
  um.progress || '/' || m.objective_value as progress,
  CASE WHEN um.is_completed THEN '✅' ELSE '⏳' END as completed,
  CASE WHEN um.is_claimed THEN '💰' ELSE '-' END as claimed,
  um.completed_at::timestamp(0) as completed_at
FROM user_missions um
JOIN missions m ON um.mission_id = m.id
JOIN users u ON um.user_id = u.id
WHERE um.period_start <= NOW() AND um.period_end > NOW()
ORDER BY um.completed_at DESC NULLS LAST
LIMIT 20;
"
```

## Mission Completion Stats

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  'Total Completions' as metric, COUNT(*)::text as value FROM user_missions WHERE is_completed = true
UNION ALL
SELECT 'Total Claims', COUNT(*)::text FROM user_missions WHERE is_claimed = true
UNION ALL
SELECT 'Rewards Distributed', TO_CHAR(SUM(um.reward_paid), 'FM\$999,999,999')
  FROM user_missions um WHERE um.is_claimed = true
UNION ALL
SELECT 'Active Daily Missions', COUNT(*)::text FROM user_missions WHERE period_end > NOW() AND period_start > NOW() - INTERVAL '1 day'
UNION ALL
SELECT 'Active Weekly Missions', COUNT(*)::text FROM user_missions WHERE period_end > NOW() AND period_start > NOW() - INTERVAL '7 days';
"
```

## Top Mission Earners

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  u.username,
  COUNT(um.id) as missions_claimed,
  TO_CHAR(SUM(um.reward_paid), 'FM$999,999') as total_earned
FROM users u
JOIN user_missions um ON um.user_id = u.id
WHERE um.is_claimed = true
GROUP BY u.id, u.username
ORDER BY SUM(um.reward_paid) DESC NULLS LAST
LIMIT 10;
"
```

## Reset User Missions (Admin)

Use with caution - resets specific user's mission progress:

```bash
# Reset all missions for a user (replace USER_ID)
# PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
# DELETE FROM user_missions WHERE user_id = USER_ID;
# "
```

## Add Mission Reward (Manual)

```bash
# Manually award mission reward (replace values)
# PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
# UPDATE users SET paper_balance = paper_balance + 500000 WHERE id = USER_ID;
# "
```
