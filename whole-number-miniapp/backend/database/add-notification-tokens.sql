-- Migration: Add notification tokens table for Farcaster push notifications
-- This enables daily position reminders and achievement notifications via Farcaster

-- Create notification_tokens table
CREATE TABLE IF NOT EXISTS notification_tokens (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_notification_sent TIMESTAMP,

  -- Ensure one token per FID
  UNIQUE(fid, token)
);

-- Create index for fast FID lookups
CREATE INDEX IF NOT EXISTS idx_notification_tokens_fid ON notification_tokens(fid);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_enabled ON notification_tokens(enabled);

-- Create notification_log table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  fid INTEGER NOT NULL,
  notification_id TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'daily_reminder', 'position_alert', 'achievement'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_date DATE GENERATED ALWAYS AS (DATE(sent_at)) STORED,
  success BOOLEAN DEFAULT true,

  -- Deduplication: one notification per FID per notification_id per day
  UNIQUE(fid, notification_id, sent_date)
);

-- Create index for notification history lookups
CREATE INDEX IF NOT EXISTS idx_notification_log_fid ON notification_log(fid);
CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at ON notification_log(sent_at DESC);

-- Add notification preferences to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_reminder_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS achievement_notifications_enabled BOOLEAN DEFAULT true;

COMMENT ON TABLE notification_tokens IS 'Stores Farcaster notification tokens for push notifications';
COMMENT ON TABLE notification_log IS 'Logs all sent notifications for analytics and deduplication';
COMMENT ON COLUMN users.notifications_enabled IS 'Master switch for all notifications';
COMMENT ON COLUMN users.daily_reminder_enabled IS 'Enable/disable daily position check reminders';
COMMENT ON COLUMN users.achievement_notifications_enabled IS 'Enable/disable achievement unlock notifications';
