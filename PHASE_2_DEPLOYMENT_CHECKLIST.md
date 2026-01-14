# Phase 2: Farcaster Push Notifications - Deployment Checklist

## ✅ Completed Steps

### 1. Database Migration ✅
- [x] Created migration file: `backend/database/add-notification-tokens.sql`
- [x] Fixed schema to use generated column for deduplication
- [x] Ran migration on Railway PostgreSQL database
- [x] Verified tables created:
  - `notification_tokens`
  - `notification_log`
- [x] Verified user columns added:
  - `notifications_enabled`
  - `daily_reminder_enabled`
  - `achievement_notifications_enabled`

**Migration Output:**
```
✅ Connected to Railway PostgreSQL
✅ Migration completed successfully!

📊 Tables created:
  ✓ notification_log
  ✓ notification_tokens

📊 User columns added:
  ✓ achievement_notifications_enabled
  ✓ daily_reminder_enabled
  ✓ notifications_enabled
```

### 2. Backend Code Updates ✅
- [x] Added Farcaster webhook endpoint (`/api/farcaster/webhook`)
- [x] Created sendNotification() function
- [x] Added daily reminder endpoint
- [x] Added achievement notification endpoint
- [x] Added user settings endpoints
- [x] Installed node-cron for scheduling
- [x] Added daily cron job (12:00 PM UTC)
- [x] Fixed TypeScript compilation
- [x] Committed and pushed to GitHub

### 3. Configuration Updates ✅
- [x] Updated `farcaster.json` with webhookUrl
- [x] Webhook URL: `https://battlefield-backend.up.railway.app/api/farcaster/webhook`

### 4. Code Deployment ✅
- [x] Pushed to GitHub main branch
- [x] Commits:
  - `59163f6` - Phase 1: Achievement notifications
  - `e5aaef8` - Phase 2: Farcaster push notifications
  - `99b56a8` - Fix: notification_log schema

## 🚧 Remaining Manual Steps

### Step 1: Verify Railway Backend Deployment

Railway should auto-deploy from GitHub. Verify deployment:

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Find BATTLEFIELD backend project**
3. **Check deployment status:**
   - Should show: "Deployed from main branch"
   - Latest commit: `99b56a8` (Fix: notification_log schema)
4. **View deployment logs** for any errors
5. **Copy the Railway backend URL** (should be like: `battlefield-backend.up.railway.app`)

### Step 2: Update Webhook URL (if needed)

If your Railway backend URL is different from `battlefield-backend.up.railway.app`:

1. **Edit file:** `whole-number-miniapp/public/.well-known/farcaster.json`
2. **Update line 15:**
   ```json
   "webhookUrl": "https://YOUR-ACTUAL-RAILWAY-URL.railway.app/api/farcaster/webhook"
   ```
3. **Commit and push:**
   ```bash
   cd whole-number-miniapp
   git add public/.well-known/farcaster.json
   git commit -m "Update webhookUrl with correct Railway backend URL"
   git push
   ```

### Step 3: Test Webhook Endpoint

Test that the webhook is accessible:

```bash
# Test health endpoint
curl https://YOUR-RAILWAY-URL.railway.app/health

# Should return: {"status":"ok","timestamp":"..."}

# Test webhook endpoint
curl -X POST https://YOUR-RAILWAY-URL.railway.app/api/farcaster/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{}}'

# Should return: {"success":true}
```

### Step 4: Verify Cron Scheduler

Check Railway logs to confirm cron job is running:

1. **Go to Railway Dashboard** → Your backend project → **Deployments** → **View Logs**
2. **Look for on server startup:**
   ```
   📅 Cron scheduler started: Daily reminders at 12:00 PM UTC
   ```
3. **At 12:00 PM UTC daily, you should see:**
   ```
   ⏰ Running daily notification cron job...
   ✅ Daily reminders sent: { total: X, sent: Y, failed: Z }
   ```

### Step 5: Test in Warpcast

**Enable Notifications:**
1. Open BATTLEFIELD mini app in Warpcast mobile app
2. Go to mini app settings (3 dots menu)
3. Enable "Notifications"
4. You should receive: **"⚔️ BATTLEFIELD Alerts Enabled!"**

**If you don't receive the welcome notification:**
- Check Railway logs for webhook event
- Verify notification_tokens table has your FID:
  ```sql
  SELECT * FROM notification_tokens WHERE fid = YOUR_FID;
  ```

### Step 6: Test Daily Reminders

**Option 1: Wait for scheduled time (12:00 PM UTC)**
- Cron will automatically run
- Check Railway logs for execution

**Option 2: Trigger manually for immediate testing**
```bash
curl -X POST https://YOUR-RAILWAY-URL.railway.app/api/notifications/daily-reminder

# Response should show:
# {
#   "success": true,
#   "stats": {
#     "total": X,
#     "sent": Y,
#     "failed": Z
#   }
# }
```

**To receive a daily reminder:**
1. Must have at least 1 open position in BATTLEFIELD
2. Must have notifications enabled in Warpcast
3. Will receive: **"⚔️ 3 Positions Open! Check your active trades on BATTLEFIELD"**

## 📊 Verification Queries

Run these SQL queries on Railway PostgreSQL to verify setup:

```sql
-- Check notification tokens are being stored
SELECT * FROM notification_tokens ORDER BY created_at DESC LIMIT 5;

-- Check notifications are being logged
SELECT * FROM notification_log ORDER BY sent_at DESC LIMIT 10;

-- Check users with notifications enabled
SELECT
  fid,
  username,
  notifications_enabled,
  daily_reminder_enabled,
  achievement_notifications_enabled
FROM users
WHERE fid IS NOT NULL
LIMIT 10;

-- Check users with open positions (will receive daily reminders)
SELECT
  u.fid,
  u.username,
  COUNT(t.id) as open_positions
FROM users u
JOIN trades t ON t.user_id = u.id
WHERE t.status = 'open'
  AND u.fid IS NOT NULL
  AND u.notifications_enabled = true
  AND u.daily_reminder_enabled = true
GROUP BY u.fid, u.username;
```

## 🎯 Success Criteria

Phase 2 is fully deployed when:

- ✅ Database migration completed
- ✅ Backend code deployed to Railway
- ✅ Webhook endpoint accessible from internet
- ✅ Cron scheduler running (check logs at 12 PM UTC)
- ✅ Welcome notification received when enabling in Warpcast
- ✅ Daily reminders received for users with open positions
- ✅ Notification tokens stored in database
- ✅ Notification log tracking all sent notifications

## 🐛 Troubleshooting

### Issue: Railway shows "Application not found" (404)

**Solution:**
1. Check Railway project is deployed
2. Verify correct Railway URL
3. Check Railway build logs for errors
4. Ensure `railway.json` is in backend folder
5. Verify Railway is connected to correct GitHub repo/branch

### Issue: Webhook events not received

**Solution:**
1. Verify webhookUrl in farcaster.json matches Railway URL
2. Check Railway logs for incoming POST requests
3. Test webhook with curl (see Step 3 above)
4. Ensure Railway backend is not sleeping (upgrade plan or use external ping)

### Issue: Cron job not running

**Solution:**
1. Check Railway logs for "Cron scheduler started" message
2. Verify server is running continuously (not sleeping)
3. Check timezone is set to UTC
4. Manually trigger: `POST /api/notifications/daily-reminder`

### Issue: Notifications not received in Warpcast

**Solution:**
1. Ensure user enabled notifications in Warpcast settings
2. Check notification_tokens table has user's FID
3. Verify user has notifications_enabled = true in users table
4. Check notification_log for sent status
5. Respect rate limits: 1 per 30s, 100 per day per token

## 📚 Reference Documentation

- **Implementation Guide:** `backend/FARCASTER_NOTIFICATIONS_GUIDE.md`
- **Database Migration:** `backend/database/add-notification-tokens.sql`
- **Migration Script:** `backend/run-notification-migration.js`
- **Test Script:** `backend/test-webhook.js`
- **Backend Server:** `backend/server.ts` (lines 1592-1844)

## 🎉 Next Steps

Once Phase 2 is verified working:

1. **Monitor usage:**
   - Track notification_log for sent/failed counts
   - Monitor Railway logs for errors
   - Check user engagement with notifications

2. **Integrate with Phase 1:**
   - Connect achievement unlocks to push notifications
   - Send push notification when user unlocks achievement
   - See: `FARCASTER_NOTIFICATIONS_GUIDE.md` section "Integrate with Achievement System"

3. **Add notification settings UI:**
   - Create settings panel in user profile
   - Allow users to toggle daily reminders on/off
   - Add preferred notification time selector

4. **Expand notification types:**
   - Liquidation warnings
   - Major profit milestones
   - Leaderboard rank changes
   - Army battle updates

---

**Status:** Database migration complete ✅ | Backend code deployed ✅ | Awaiting Railway verification 🚧
