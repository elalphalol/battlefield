# Deploy Backend

Deploy the Express.js backend service to production.

## Instructions

1. Build the TypeScript code:
```bash
cd /var/www/battlefield/whole-number-miniapp/backend && npm run build
```

2. Restart the PM2 process:
```bash
pm2 restart battlefield-backend
```

3. Verify the deployment:
```bash
pm2 status battlefield-backend && curl -s http://localhost:3001/health | head -20
```

## Rollback

If issues occur, check logs with:
```bash
pm2 logs battlefield-backend --lines 50
```
