# Farcaster Push Notifications - Phase 2 Implementation Guide

## Overview

This guide explains how to set up and use the Farcaster push notification system for BATTLEFIELD. Users will receive:
- **Daily Position Reminders**: Notifications when they have open trades
- **Achievement Alerts**: Push notifications for major achievements (future integration)

## Architecture

### Components

1. **Farcaster Webhook** (`/api/farcaster/webhook`)
   - Receives events from Farcaster when users enable/disable notifications
   - Stores notification tokens securely in the database
   - Sends welcome notification when user enables alerts

2. **Daily Reminder Cron Job**
   - Runs daily at 12:00 PM UTC (8 AM EST / 5 AM PST)
   - Finds users with open positions and active notifications
   - Sends personalized reminders via Farcaster push API

3. **Notification Service** (`sendNotification()`)
   - Core function to send push notifications
   - Handles rate limits (1 per 30 seconds, 100 per day per token)
   - Logs all notifications for analytics and deduplication

4. **Database Tables**
   - `notification_tokens`: Stores user notification tokens from Farcaster
   - `notification_log`: Tracks sent notifications with deduplication
   - `users`: Extended with notification preference columns

## Setup Instructions

### 1. Run Database Migration

Execute the notification schema migration on your Railway PostgreSQL:

```bash
# Option 1: Using psql command line
psql "your_railway_connection_string" < backend/database/add-notification-tokens.sql

# Option 2: Using Railway SQL Console
# 1. Go to Railway dashboard → PostgreSQL service → Query tab
# 2. Copy/paste contents of backend/database/add-notification-tokens.sql
# 3. Click "Run"
```

### 2. Update Farcaster Manifest

The `farcaster.json` manifest has been updated with:
```json
{
  "frame": {
    "webhookUrl": "https://battlefield-backend.up.railway.app/api/farcaster/webhook"
  }
}
```

**Important**: Replace `battlefield-backend.up.railway.app` with your actual Railway backend URL.

### 3. Deploy Backend to Railway

```bash
# Commit changes
git add .
git commit -m "Add Phase 2: Farcaster push notifications"
git push

# Railway will auto-deploy from GitHub
# Or manually trigger deployment in Railway dashboard
```

### 4. Verify Webhook URL

After deployment, verify the webhook is accessible:
```bash
curl -X POST https://your-backend-url.railway.app/api/farcaster/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'

# Should return: {"success":true}
```

## How It Works

### User Flow

1. **User Opens BATTLEFIELD in Farcaster**
   - Mini app loads with normal functionality

2. **User Enables Notifications** (via Farcaster client)
   - Farcaster sends webhook event to `/api/farcaster/webhook`
   - Backend stores notification token in database
   - User receives welcome notification: "⚔️ BATTLEFIELD Alerts Enabled!"

3. **Daily Reminders**
   - Cron job runs at 12:00 PM UTC daily
   - Checks for users with open positions + notifications enabled
   - Sends personalized notifications: "⚔️ 3 Positions Open! Check your active trades on BATTLEFIELD"

4. **User Disables Notifications**
   - Farcaster sends webhook event
   - Backend marks tokens as disabled (doesn't delete for potential re-enable)

5. **User Removes Mini App**
   - Farcaster sends webhook event
   - Backend deletes all notification tokens for that user

### API Endpoints

#### Webhook Endpoint
```
POST /api/farcaster/webhook
Body: { "event": "notifications_enabled", "data": { "fid": 123, "notificationDetails": { "token": "...", "url": "..." } } }
```

Events handled:
- `notifications_enabled` - Store token, send welcome notification
- `notifications_disabled` - Disable token
- `miniapp_removed` - Delete tokens

#### Daily Reminder Endpoint
```
POST /api/notifications/daily-reminder
Response: { "success": true, "stats": { "total": 150, "sent": 148, "failed": 2 } }
```

#### Achievement Notification Endpoint
```
POST /api/notifications/achievement
Body: { "fid": 123, "achievementId": "first_trade", "title": "First Blood", "description": "Completed your first trade" }
```

#### User Settings
```
GET /api/notifications/settings/:walletAddress
POST /api/notifications/settings
Body: { "walletAddress": "0x...", "daily_reminder_enabled": true }
```

## Notification Limits (Farcaster/Warpcast)

- **Rate Limit**: 1 notification per 30 seconds per token
- **Daily Limit**: 100 notifications per day per token
- **Deduplication**: Using `notificationId` + FID (24-hour dedup window)

## Testing

### Test Notification Flow (Local)

1. **Start Backend**
```bash
cd backend
npm run dev
```

2. **Simulate Farcaster Webhook**
```bash
curl -X POST http://localhost:3001/api/farcaster/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "notifications_enabled",
    "data": {
      "fid": 1452351,
      "notificationDetails": {
        "token": "test_token_123",
        "url": "https://api.warpcast.com/v1/frame-notifications"
      }
    }
  }'
```

3. **Trigger Daily Reminder Manually**
```bash
curl -X POST http://localhost:3001/api/notifications/daily-reminder
```

### Test in Production

1. **Enable Notifications in Warpcast**
   - Open BATTLEFIELD mini app in Warpcast
   - Go to mini app settings → Enable notifications
   - Should receive welcome notification

2. **Check Database**
```sql
-- View stored tokens
SELECT * FROM notification_tokens WHERE fid = YOUR_FID;

-- View notification log
SELECT * FROM notification_log ORDER BY sent_at DESC LIMIT 10;
```

3. **Monitor Cron Job**
   - Check Railway logs at 12:00 PM UTC daily
   - Look for: "⏰ Running daily notification cron job..."
   - Verify sent counts

## Troubleshooting

### Notifications Not Received

1. **Check Token Storage**
```sql
SELECT * FROM notification_tokens WHERE fid = YOUR_FID AND enabled = true;
```

2. **Check Notification Log**
```sql
SELECT * FROM notification_log WHERE fid = YOUR_FID ORDER BY sent_at DESC;
```

3. **Verify Webhook URL**
   - Ensure `farcaster.json` has correct Railway backend URL
   - Test webhook endpoint is accessible from internet

4. **Check Rate Limits**
   - Each user limited to 100 notifications/day
   - 1 notification per 30 seconds

### Cron Job Not Running

1. **Check Server Logs**
   - Should see: "📅 Cron scheduler started: Daily reminders at 12:00 PM UTC"

2. **Verify Server Uptime**
   - Railway free tier may sleep after inactivity
   - Consider upgrading plan or using external cron service

3. **Manual Trigger**
```bash
curl -X POST https://your-backend-url.railway.app/api/notifications/daily-reminder
```

## Future Enhancements

### Integrate with Achievement System

Connect Phase 1 (in-app achievement modals) with Phase 2 (push notifications):

```typescript
// In useAchievementDetector.ts
if (isNowUnlocked && userData.fid && userData.achievement_notifications_enabled) {
  // Send push notification
  await fetch(getApiUrl('api/notifications/achievement'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fid: userData.fid,
      achievementId: achievement.id,
      title: achievement.name,
      description: achievement.description
    })
  });
}
```

### Position Alert Notifications

Send alerts for critical position events:
- Liquidation warning (when close to liquidation price)
- Major profit milestones (10%, 50%, 100% gains)
- Stop-loss/take-profit triggers

### Notification Settings UI

Add user-facing settings panel:
- Toggle daily reminders on/off
- Toggle achievement notifications
- Set preferred notification time
- Manage notification frequency

## Resources

- [Farcaster Mini Apps Documentation](https://miniapps.farcaster.xyz/docs/guides/notifications)
- [Farcaster Notification Specification](https://miniapps.farcaster.xyz/docs/specification)
- [node-cron Documentation](https://www.npmjs.com/package/node-cron)

## API Reference

### sendNotification() Function

```typescript
async function sendNotification(fid: number, notification: {
  notificationId: string;  // Stable ID for deduplication
  title: string;           // Max 32 characters
  body: string;            // Max 128 characters
  targetUrl: string;       // Max 1024 characters, must be on same domain
}): Promise<{ success: boolean; result?: any; error?: any }>
```

### Notification Log Schema

```sql
CREATE TABLE notification_log (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  notification_id TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT true,
  UNIQUE(fid, notification_id, DATE(sent_at))
);
```

## Support

For issues or questions:
- Check Railway logs for backend errors
- Review Farcaster webhook events in Railway dashboard
- Verify database tables exist with correct schema
