# Cleanup

Clean up temporary files, caches, and optimize BATTLEFIELD.

## Instructions

Run cleanup tasks to free disk space and optimize performance.

## Quick Cleanup

```bash
echo "🧹 BATTLEFIELD CLEANUP" && echo ""

# Next.js cache size
echo "📁 Cache Sizes:"
NEXT_SIZE=$(du -sh /var/www/battlefield/whole-number-miniapp/.next 2>/dev/null | cut -f1)
echo "   .next folder: ${NEXT_SIZE:-N/A}"

NODE_MODULES=$(du -sh /var/www/battlefield/whole-number-miniapp/node_modules 2>/dev/null | cut -f1)
echo "   node_modules: ${NODE_MODULES:-N/A}"

# PM2 logs size
PM2_LOGS=$(du -sh ~/.pm2/logs 2>/dev/null | cut -f1)
echo "   PM2 logs: ${PM2_LOGS:-N/A}"

# Temp files
TMP_SIZE=$(du -sh /tmp 2>/dev/null | cut -f1)
echo "   /tmp: ${TMP_SIZE:-N/A}"

echo ""
echo "💾 Disk Usage:"
df -h / | grep -v Filesystem
```

## Clean PM2 Logs

```bash
echo "" && echo "🗑️ Cleaning PM2 logs..."
pm2 flush 2>/dev/null && echo "✅ PM2 logs cleared" || echo "❌ Failed to clear PM2 logs"
```

## Clean Next.js Cache

```bash
echo "" && echo "🗑️ Cleaning Next.js cache..."
rm -rf /var/www/battlefield/whole-number-miniapp/.next/cache 2>/dev/null && echo "✅ Next.js cache cleared" || echo "❌ Failed to clear cache"
```

## Clean Temp Share Cards

```bash
echo "" && echo "🗑️ Cleaning temp share card images..."
CLEANED=$(find /tmp -name "sharecard*.png" -mtime +1 -delete 2>/dev/null && echo "done")
echo "✅ Old share card images cleaned"
```

## Database Cleanup (Old Data)

```bash
echo "" && echo "📊 Database cleanup candidates:" && echo ""

PGPASSWORD=battlefield psql -U battlefield -h localhost -d battlefield -c "
-- Show old claims that could be archived
SELECT 'Old claims (>30 days)' as type, COUNT(*) as count
FROM claims WHERE claimed_at < NOW() - INTERVAL '30 days'
UNION ALL
-- Show old closed trades
SELECT 'Old closed trades (>90 days)', COUNT(*)
FROM trades WHERE status != 'open' AND closed_at < NOW() - INTERVAL '90 days'
UNION ALL
-- Inactive users
SELECT 'Inactive users (no trades, >30 days)', COUNT(*)
FROM users WHERE total_trades = 0 AND created_at < NOW() - INTERVAL '30 days';
"

echo ""
echo "⚠️ To clean old data, run specific DELETE commands manually"
```

## Full Cleanup Summary

```bash
echo "" && echo "📋 CLEANUP COMPLETE" && echo ""
echo "Freed space from:"
echo "  - PM2 logs"
echo "  - Next.js cache"
echo "  - Temp files"
echo ""
echo "Current disk usage:"
df -h / | grep -v Filesystem
```
