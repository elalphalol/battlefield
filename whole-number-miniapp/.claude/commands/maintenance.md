# Maintenance Mode

Control BATTLEFIELD maintenance mode to block trading during updates or fixes.

## Instructions

Maintenance mode blocks all trading operations (open, close, liquidate) while allowing users to view the app. Use this during:
- Balance audit fixes
- Database migrations
- Critical bug fixes
- Scheduled maintenance

## Check Maintenance Status

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin/maintenance',
  headers: { 'X-Admin-Key': 'd7b86bc84665ec4ce2f5725036c7296e9122da2f443e0e43bb09565e0c5e030d' }
};
http.get(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('=== MAINTENANCE STATUS ===');
      if (json.enabled) {
        console.log('🚧 MAINTENANCE MODE: ENABLED');
        console.log('   Message: ' + json.message);
        if (json.enabledAt) console.log('   Started: ' + new Date(json.enabledAt).toLocaleString());
        if (json.estimatedEndTime) console.log('   Est. End: ' + new Date(json.estimatedEndTime).toLocaleString());
      } else {
        console.log('✅ MAINTENANCE MODE: DISABLED');
        console.log('   Trading is active.');
      }
    } catch (e) {
      console.log('Error: ' + e.message);
    }
  });
}).on('error', e => console.log('Error: ' + e.message));
"
```

## Enable Maintenance (1 Hour)

```bash
curl -s -X POST http://localhost:3001/api/admin/maintenance \
  -H 'Content-Type: application/json' \
  -H 'X-Admin-Key: d7b86bc84665ec4ce2f5725036c7296e9122da2f443e0e43bb09565e0c5e030d' \
  -d '{"enabled": true, "durationMinutes": 60, "message": "Trading is temporarily disabled for scheduled maintenance."}' \
| node -e "
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString());
    if (data.success && data.enabled) {
      console.log('🚧 Maintenance mode ENABLED');
      console.log('   Duration: 1 hour');
      console.log('   Est. End: ' + new Date(data.estimatedEndTime).toLocaleString());
    } else {
      console.log('❌ Failed to enable maintenance mode');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log('Error: ' + e.message);
  }
});
"
```

## Enable Maintenance (Indefinitely)

```bash
curl -s -X POST http://localhost:3001/api/admin/maintenance \
  -H 'Content-Type: application/json' \
  -H 'X-Admin-Key: d7b86bc84665ec4ce2f5725036c7296e9122da2f443e0e43bb09565e0c5e030d' \
  -d '{"enabled": true, "message": "Trading is temporarily disabled for scheduled maintenance."}' \
| node -e "
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString());
    if (data.success && data.enabled) {
      console.log('🚧 Maintenance mode ENABLED (indefinitely)');
      console.log('   Message: ' + data.message);
      console.log('   Will remain active until manually disabled.');
    } else {
      console.log('❌ Failed to enable maintenance mode');
    }
  } catch (e) {
    console.log('Error: ' + e.message);
  }
});
"
```

## Disable Maintenance

```bash
curl -s -X POST http://localhost:3001/api/admin/maintenance \
  -H 'Content-Type: application/json' \
  -H 'X-Admin-Key: d7b86bc84665ec4ce2f5725036c7296e9122da2f443e0e43bb09565e0c5e030d' \
  -d '{"enabled": false}' \
| node -e "
const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString());
    if (data.success && !data.enabled) {
      console.log('✅ Maintenance mode DISABLED');
      console.log('   Trading is now active.');
    } else {
      console.log('❌ Failed to disable maintenance mode');
    }
  } catch (e) {
    console.log('Error: ' + e.message);
  }
});
"
```

## Quick Maintenance Workflow

For common maintenance tasks:

### 1. Pre-Maintenance Checklist
```bash
echo "=== PRE-MAINTENANCE CHECKLIST ===" && \
echo "1. Check open positions:" && \
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });
(async () => {
  const r = await pool.query('SELECT COUNT(*) as count FROM trades WHERE status = \\'open\\'');
  console.log('   Open positions: ' + r.rows[0].count);
  pool.end();
})();
" && \
echo "2. Check active users (last 5 min):" && \
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });
(async () => {
  const r = await pool.query('SELECT COUNT(*) as count FROM users WHERE last_active > NOW() - INTERVAL \\'5 minutes\\'');
  console.log('   Active users: ' + r.rows[0].count);
  pool.end();
})();
"
```

### 2. Enable, Fix, Disable Pattern
```bash
echo "Standard maintenance workflow:"
echo ""
echo "Step 1: Enable maintenance"
echo "  /maintenance enable"
echo ""
echo "Step 2: Run audit fix"
echo "  /audit full"
echo "  Then use admin panel to auto-fix"
echo ""
echo "Step 3: Verify fixes"
echo "  /audit"
echo ""
echo "Step 4: Disable maintenance"
echo "  /maintenance disable"
```

## Backend Direct Control

For direct server control without API:

```bash
cd /var/www/battlefield/whole-number-miniapp/backend && node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:ucRr8g9AEEuZ9q0OsD3VfspcmxKrjd45I6q4Qmsm+0c=@localhost:5432/battlefield' });

// Check if app_settings table exists and maintenance status
(async () => {
  try {
    const result = await pool.query(\"SELECT value FROM app_settings WHERE key = 'maintenance_mode'\");
    if (result.rows.length > 0) {
      const settings = JSON.parse(result.rows[0].value);
      console.log('Maintenance Mode (DB): ' + (settings.enabled ? 'ENABLED' : 'DISABLED'));
      if (settings.enabled) {
        console.log('  Message: ' + settings.message);
        console.log('  Since: ' + settings.enabledAt);
      }
    } else {
      console.log('Maintenance mode not configured in DB');
    }
  } catch (e) {
    console.log('Note: app_settings table may not exist - maintenance uses in-memory state');
  }
  pool.end();
})();
"
```
