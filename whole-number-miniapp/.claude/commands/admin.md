# Admin Operations

Execute admin operations on the BATTLEFIELD backend API.

## Available Operations

### Fix user balances:
```bash
curl -s -X POST http://localhost:3001/api/admin/fix-balances \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_API_KEY"
```

### Recalculate armies:
```bash
curl -s -X POST http://localhost:3001/api/admin/recalculate-armies \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_API_KEY"
```

### Update user profile:
```bash
curl -s -X POST http://localhost:3001/api/admin/update-user \
  -H "Content-Type: application/json" \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -d '{"walletAddress": "0x...", "username": "newname"}'
```

## Environment

The ADMIN_API_KEY is stored in `/var/www/battlefield/whole-number-miniapp/backend/.env`

## Instructions

1. Ask the user which admin operation they want to perform
2. Load the ADMIN_API_KEY from the backend .env file
3. Execute the appropriate curl command
4. Display the results

To get the admin key:
```bash
grep ADMIN_API_KEY /var/www/battlefield/whole-number-miniapp/backend/.env | cut -d'=' -f2
```
