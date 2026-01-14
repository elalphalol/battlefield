# Deploy Frontend

Deploy the Next.js frontend to production.

## Instructions

1. Build the Next.js application:
```bash
cd /var/www/battlefield/whole-number-miniapp && npm run build
```

2. Restart the PM2 process:
```bash
pm2 restart battlefield-frontend
```

3. Verify the deployment:
```bash
pm2 status battlefield-frontend && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

## Rollback

If issues occur, check logs with:
```bash
pm2 logs battlefield-frontend --lines 50
```
