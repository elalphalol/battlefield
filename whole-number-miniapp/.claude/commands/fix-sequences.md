# Fix Database Sequences

Fix PostgreSQL sequence mismatches that cause "duplicate key" errors.

## Instructions

Run the sequence fix script:

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && ./scripts/fix-sequences.sh
```

## What this fixes

When data is imported or restored, PostgreSQL sequences can get out of sync with actual table data. This causes errors like:

```
error: duplicate key value violates unique constraint "trades_pkey"
```

The fix resets each sequence to MAX(id) + 1 for the corresponding table.

## Tables checked

- `trades` - Trading positions
- `users` - User accounts
- `referrals` - Referral records
- `claims` - Paper money claims
- `missions` - Mission definitions
- `user_missions` - User mission progress
- `achievements` - User achievements

## Manual fix (if script fails)

```bash
PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
SELECT setval('trades_id_seq', COALESCE((SELECT MAX(id) FROM trades), 1));
SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval('claims_id_seq', COALESCE((SELECT MAX(id) FROM claims), 1));
"
```

## When to run

- After database restore/import
- When seeing "duplicate key" errors
- Before/after backend restarts (automatic via hooks)
- After bulk data operations
