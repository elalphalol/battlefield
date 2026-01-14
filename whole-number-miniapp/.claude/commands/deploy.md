# Deploy All Services

Deploy both backend and frontend services to production.

## Instructions

1. Build and deploy the backend:
```bash
cd /var/www/battlefield/whole-number-miniapp/backend && npm run build && pm2 restart battlefield-backend
```

2. Build and deploy the frontend:
```bash
cd /var/www/battlefield/whole-number-miniapp && npm run build && pm2 restart battlefield-frontend
```

3. Verify all services:
```bash
pm2 list && echo "Backend health:" && curl -s http://localhost:3001/health | head -5
```

## Pre-deployment Checklist

- Ensure all TypeScript compiles without errors
- Run linting: `npm run lint`
- Check for uncommitted changes: `git status`
