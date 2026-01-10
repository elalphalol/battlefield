#!/bin/bash
# Run this script directly on Railway to upgrade database to 200x leverage
# This uses the internal DATABASE_URL which works within Railway's network

echo "🚀 Starting 200x leverage upgrade on Railway..."

# Run the Node.js migration using the internal DATABASE_URL (which works on Railway)
node -e "
const { Pool } = require('pg');

async function upgrade() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  });

  try {
    console.log('📊 Checking current constraint...');
    
    // Drop old constraint
    await pool.query('ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check');
    console.log('✅ Old constraint dropped');
    
    // Add new constraint
    await pool.query('ALTER TABLE trades ADD CONSTRAINT trades_leverage_check CHECK (leverage >= 1 AND leverage <= 200)');
    console.log('✅ New constraint added: 1x-200x');
    
    // Verify
    const result = await pool.query('SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = \\'trades_leverage_check\\'');
    console.log('✅ Verified:', result.rows[0].pg_get_constraintdef);
    
    console.log('🎉 UPGRADE COMPLETE! Database now supports 200x leverage!');
    process.exit(0);
  } catch (error) {
    console.error('❌ UPGRADE FAILED:', error.message);
    process.exit(1);
  }
}

upgrade();
"
