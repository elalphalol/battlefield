# Deploy Frontend

Deploy the Next.js frontend to production.

## Instructions

1. First check for any uncommitted changes:
```bash
git status --short
```

2. Clean the Next.js cache if needed (recommended for major changes):
```bash
cd /var/www/battlefield/whole-number-miniapp && rm -rf .next
```

3. Build the Next.js application:
```bash
cd /var/www/battlefield/whole-number-miniapp && npm run build
```

4. Restart the PM2 process:
```bash
pm2 restart battlefield-frontend
```

5. Verify the deployment:
```bash
pm2 status battlefield-frontend && sleep 2 && curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000
```

## Rollback

If issues occur, check logs with:
```bash
pm2 logs battlefield-frontend --lines 50
```

## Common Issues

- **InvariantError / client reference manifest**: Clean build with `rm -rf .next && npm run build`
- **TypeScript errors**: Check build output for `error TS`
- **Module not found**: Run `npm install` then rebuild
