# Referral Stats

Monitor BATTLEFIELD referral system performance.

## Instructions

View referral statistics, top referrers, and recent activity.

## Referral Overview

```bash
echo "=== REFERRAL STATS ===" && PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -t -c "
SELECT '📊 Total Referrals: ' || COUNT(*) FROM referrals;
SELECT '⏳ Pending: ' || COUNT(*) FROM referrals WHERE status = 'pending';
SELECT '✅ Completed: ' || COUNT(*) FROM referrals WHERE status = 'completed';
SELECT '💰 Rewards Distributed: $' || TO_CHAR(SUM(referrer_reward + referred_reward)/100, 'FM999,999,999') FROM referrals WHERE status = 'completed';
" 2>/dev/null | grep -v "^$"
```

## Top Referrers

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  ROW_NUMBER() OVER (ORDER BY u.referral_count DESC) as rank,
  u.username,
  u.referral_code,
  u.referral_count as referrals,
  TO_CHAR(u.referral_earnings/100, 'FM$999,999') as earnings
FROM users u
WHERE u.referral_count > 0
ORDER BY u.referral_count DESC
LIMIT 15;
"
```

## Recent Referral Activity

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  referrer.username as referrer,
  referred.username as referred_user,
  r.status,
  r.created_at::date as signup_date,
  r.completed_at::date as completed_date
FROM referrals r
JOIN users referrer ON r.referrer_id = referrer.id
JOIN users referred ON r.referred_user_id = referred.id
ORDER BY r.created_at DESC
LIMIT 15;
"
```

## Pending Referrals (Waiting for First Trade)

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  referrer.username as referrer,
  referred.username as referred_user,
  referred.total_trades as trades,
  r.created_at::date as signup_date,
  NOW()::date - r.created_at::date as days_pending
FROM referrals r
JOIN users referrer ON r.referrer_id = referrer.id
JOIN users referred ON r.referred_user_id = referred.id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC;
"
```

## Referral Conversion Rate

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT
  COUNT(*) as total_referrals,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'completed') / NULLIF(COUNT(*), 0), 1) || '%' as conversion_rate
FROM referrals;
"
```

## User Referral Details

```bash
# Check specific user's referral info (replace USERNAME)
# PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
# SELECT
#   u.username,
#   u.referral_code,
#   u.referral_count,
#   TO_CHAR(u.referral_earnings/100, 'FM\$999,999') as earnings,
#   (SELECT username FROM users WHERE id = u.referred_by) as referred_by
# FROM users u
# WHERE LOWER(u.username) LIKE LOWER('%USERNAME%');
# "
```
