# Fix Database Sequences

Fix PostgreSQL sequence mismatches that cause "duplicate key" errors when opening trades.

## Instructions

Run the following command to fix all database sequences:

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
