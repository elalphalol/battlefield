# Deploy Backend

Deploy the Express.js backend service to production.

## Instructions

1. First check for any uncommitted changes:
```bash
git status --short
```

2. Build the TypeScript code:
```bash
cd /var/www/battlefield/whole-number-miniapp/backend && npm run build
```

3. Restart the PM2 process:
```bash
pm2 restart battlefield-backend
```

4. Verify the deployment:
```bash
pm2 status battlefield-backend && sleep 2 && curl -s http://localhost:3001/health
```

## Rollback

If issues occur, check logs with:
```bash
pm2 logs battlefield-backend --lines 50
```

## Common Issues

- **Sequence errors**: Run `/fix-sequences`
- **TypeScript errors**: Check build output for `error TS`
- **Connection refused**: Ensure PostgreSQL is running with `systemctl status postgresql`
