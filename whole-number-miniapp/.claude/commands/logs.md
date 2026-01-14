# View Application Logs

View PM2 logs for BATTLEFIELD services.

## Instructions

View logs for the requested service. Default is to show both.

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

## Real-time Monitoring

For real-time log streaming, use:
```bash
pm2 logs battlefield-backend --raw
```

## Error Filtering

To see only errors:
```bash
pm2 logs battlefield-backend --err --lines 50
```
