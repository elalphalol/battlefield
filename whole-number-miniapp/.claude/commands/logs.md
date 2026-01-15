# View Application Logs

View PM2 logs for BATTLEFIELD services.

## Instructions

Ask the user which logs they want to see:
1. **Backend** - Express.js API logs
2. **Frontend** - Next.js logs
3. **All** - Both services
4. **Errors only** - Filter for errors

### Backend logs:
```bash
pm2 logs battlefield-backend --lines 100
```

### Frontend logs:
```bash
pm2 logs battlefield-frontend --lines 100
```

### All logs:
```bash
pm2 logs --lines 50
```

### Backend errors only:
```bash
pm2 logs battlefield-backend --err --lines 50
```

### Frontend errors only:
```bash
pm2 logs battlefield-frontend --err --lines 50
```

## Real-time Monitoring

For real-time log streaming (useful for debugging):
```bash
pm2 logs battlefield-backend --raw
```

## Log Analysis

### Find specific errors:
```bash
pm2 logs battlefield-backend --lines 200 | grep -i "error\|failed\|exception"
```

### Check for sequence issues:
```bash
pm2 logs battlefield-backend --lines 200 | grep -i "duplicate key\|sequence"
```

### Check for trade issues:
```bash
pm2 logs battlefield-backend --lines 200 | grep -i "trade\|position\|liquidat"
```
