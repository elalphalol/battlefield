# 🚀 Railway Database Upgrade: 100x → 200x Leverage

## Problem
When trying to upgrade the database to support 200x leverage on Railway, the deployment crashes because the existing CHECK constraint on the `trades` table doesn't allow values above 100x.

## Root Cause
- Database schema has: `CHECK (leverage >= 1 AND leverage <= 100)`
- Backend already validates up to 200x
- Frontend slider goes to 200x
- But database constraint blocks it, causing crashes during deployment

## ✅ Solution: Safe Migration

### Option 1: Run SQL Migration via Railway Dashboard (RECOMMENDED)

1. **Go to Railway Dashboard**
   - Open your project on Railway
   - Navigate to your PostgreSQL database service
   - Click on the "Data" tab or "Query" tab

2. **Run the Safe Migration Script**
   ```sql
   -- Copy and paste the entire contents of:
   -- backend/database/safe-upgrade-to-200x.sql
   ```
   
   Or run this quick version:
   ```sql
   -- Quick version: Drop old constraint, add new one
   ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check;
   ALTER TABLE trades ADD CONSTRAINT trades_leverage_check 
     CHECK (leverage >= 1 AND leverage <= 200);
   
   -- Verify
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conname = 'trades_leverage_check';
   ```

3. **Verify the Change**
   - You should see: `CHECK ((leverage >= 1) AND (leverage <= 200))`
   - Check that existing open positions are not affected

4. **Redeploy Backend**
   - Now you can safely redeploy your backend service
   - It will no longer crash

### Option 2: Run via psql Command Line

If you have access to psql, connect to your Railway database:

```bash
# Get connection string from Railway dashboard
psql "postgresql://postgres:password@host:port/railway"

# Run the migration
\i backend/database/safe-upgrade-to-200x.sql

# Or paste the SQL directly
```

### Option 3: Programmatic Migration (Advanced)

Add this to a migration script if needed:

```javascript
// migrate-to-200x.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function upgrade() {
  try {
    console.log('🚀 Starting upgrade to 200x leverage...');
    
    // Drop old constraint
    await pool.query('ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check');
    console.log('✅ Old constraint dropped');
    
    // Add new constraint
    await pool.query(`
      ALTER TABLE trades ADD CONSTRAINT trades_leverage_check 
      CHECK (leverage >= 1 AND leverage <= 200)
    `);
    console.log('✅ New constraint added: 1x-200x');
    
    // Verify
    const result = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conname = 'trades_leverage_check'
    `);
    console.log('✅ Verification:', result.rows[0]);
    
    console.log('🎉 Upgrade complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Upgrade failed:', error);
    process.exit(1);
  }
}

upgrade();
```

Run with:
```bash
node backend/migrate-to-200x.js
```

## 🔍 Verification Steps

After running the migration, verify everything is working:

1. **Check Constraint**
   ```sql
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conname = 'trades_leverage_check';
   ```
   Should show: `CHECK ((leverage >= 1) AND (leverage <= 200))`

2. **Check Existing Trades**
   ```sql
   SELECT 
     MIN(leverage) as min_leverage,
     MAX(leverage) as max_leverage,
     COUNT(*) as total_trades,
     COUNT(CASE WHEN status = 'open' THEN 1 END) as open_trades
   FROM trades;
   ```

3. **Test Opening a 200x Position**
   - Use the frontend to open a position with 200x leverage
   - Should work without errors

## 🛡️ Safety Features

This migration is **100% safe** because:

1. ✅ **Non-destructive**: Doesn't modify any existing data
2. ✅ **Backward compatible**: All existing trades (<= 100x) remain valid
3. ✅ **Error handling**: Checks for data anomalies before proceeding
4. ✅ **Reversible**: Can revert by running the old constraint if needed

## 🔄 Rollback (If Needed)

To rollback to 100x limit:

```sql
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check;
ALTER TABLE trades ADD CONSTRAINT trades_leverage_check 
  CHECK (leverage >= 1 AND leverage <= 100);
```

## 📝 What Changed

### Database
- ✅ Constraint updated: 100x → 200x
- ✅ All other functionality unchanged

### Backend (server.ts)
- ✅ Already supports 200x (line 386)
- ✅ No changes needed

### Frontend (TradingPanel.tsx)
- ✅ Slider already goes to 200x
- ✅ Quick buttons updated: [10x, 50x, 100x, 200x]

## 🚨 Common Issues

### Issue: Migration still crashes
**Solution**: Make sure you run the migration SQL BEFORE redeploying the backend. The constraint must be updated in the database first.

### Issue: "constraint already exists"
**Solution**: The migration handles this. Use `DROP CONSTRAINT IF EXISTS` before adding the new one.

### Issue: Open positions affected
**Solution**: They won't be. This only changes what NEW trades can have, not existing ones.

## 🎯 Deployment Order

**CRITICAL:** Follow this exact order to avoid crashes:

1. ✅ **First**: Run SQL migration on Railway database
2. ✅ **Second**: Verify constraint is updated
3. ✅ **Third**: Redeploy backend service
4. ✅ **Fourth**: Test opening a 200x position

## 📊 Expected Behavior After Upgrade

- ✅ Users can select 1x to 200x leverage
- ✅ Frontend slider shows full range
- ✅ Backend accepts and validates 200x
- ✅ Database stores 200x trades without errors
- ✅ Existing trades (100x or less) work normally
- ✅ No data loss or corruption

## 🎉 Success Indicators

You'll know the upgrade worked when:

1. ✅ Backend deploys without crashing
2. ✅ Users can open 200x positions
3. ✅ No database errors in logs
4. ✅ Leaderboard and stats still work
5. ✅ All existing positions still function

---

**Need Help?** Check the logs in Railway dashboard if anything goes wrong. The migration script provides detailed output at each step.

**Questions?** The migration is idempotent - you can run it multiple times safely.
