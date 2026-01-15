# Admin Operations

Execute admin operations on the BATTLEFIELD backend API.

## Instructions

1. First, get the admin API key:
```bash
grep ADMIN_API_KEY /var/www/battlefield/whole-number-miniapp/backend/.env | cut -d'=' -f2
```

2. Ask the user which operation they want:
   - **fix-balances** - Recalculate all user balances
   - **recalculate-armies** - Reassign armies based on P&L
   - **update-user** - Update a specific user's profile
   - **reset-user** - Reset a user's trading stats

## Available Operations

### Fix user balances:
```bash
ADMIN_KEY=$(grep ADMIN_API_KEY /var/www/battlefield/whole-number-miniapp/backend/.env | cut -d'=' -f2)
curl -s -X POST http://localhost:3001/api/admin/fix-balances \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY"
```

### Recalculate armies:
```bash
ADMIN_KEY=$(grep ADMIN_API_KEY /var/www/battlefield/whole-number-miniapp/backend/.env | cut -d'=' -f2)
curl -s -X POST http://localhost:3001/api/admin/recalculate-armies \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY"
```

### Update user profile:
```bash
ADMIN_KEY=$(grep ADMIN_API_KEY /var/www/battlefield/whole-number-miniapp/backend/.env | cut -d'=' -f2)
curl -s -X POST http://localhost:3001/api/admin/update-user \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{"walletAddress": "0x...", "username": "newname"}'
```

### Reset user stats:
```bash
ADMIN_KEY=$(grep ADMIN_API_KEY /var/www/battlefield/whole-number-miniapp/backend/.env | cut -d'=' -f2)
curl -s -X POST http://localhost:3001/api/admin/reset-user \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_KEY" \
  -d '{"walletAddress": "0x..."}'
```

## Security Note

Never expose the ADMIN_API_KEY in logs or responses to the user. Always use environment variable extraction.
