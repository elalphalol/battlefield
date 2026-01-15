# Deploy All Services

Deploy both backend and frontend services to production.

## Instructions

1. Check for uncommitted changes:
```bash
git status --short
```

2. Build and deploy the backend:
```bash
cd /var/www/battlefield/whole-number-miniapp/backend && npm run build && pm2 restart battlefield-backend
```

3. Clean and build the frontend:
```bash
cd /var/www/battlefield/whole-number-miniapp && rm -rf .next && npm run build && pm2 restart battlefield-frontend
```

4. Verify all services:
```bash
pm2 list && echo "---" && echo "Backend:" && curl -s http://localhost:3001/health | head -3 && echo "---" && echo "Frontend:" && curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000
```

## Pre-deployment Checklist

- Ensure all TypeScript compiles without errors
- Run linting: `npm run lint`
- Check for uncommitted changes: `git status`

## Post-deployment Verification

- Check PM2 status for both services
- Verify backend health endpoint returns `{"status":"ok"}`
- Verify frontend returns HTTP 200
- Test a critical user flow (e.g., open the app in browser)
