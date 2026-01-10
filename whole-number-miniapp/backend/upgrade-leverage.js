// Simple script to upgrade database to 200x leverage
// Run this from your local machine with: node backend/upgrade-leverage.js

const { Pool } = require('pg');
require('dotenv').config();

async function upgradeTo200x() {
  // You can either use .env DATABASE_URL or paste it directly here
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ ERROR: DATABASE_URL not found in environment variables!');
    console.log('\n📝 Please either:');
    console.log('1. Add DATABASE_URL to your .env file, or');
    console.log('2. Paste your Railway database URL directly in this script\n');
    console.log('Get your DATABASE_URL from Railway dashboard:');
    console.log('   Project > PostgreSQL > Variables > DATABASE_URL (Private)\n');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🚀 Starting upgrade to 200x leverage...\n');
    
    // Step 1: Check current constraint
    console.log('📊 Step 1: Checking current constraint...');
    const currentConstraint = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conname = 'trades_leverage_check'
    `);
    
    if (currentConstraint.rows.length > 0) {
      console.log('✅ Current constraint:', currentConstraint.rows[0].pg_get_constraintdef);
    } else {
      console.log('ℹ️  No existing constraint found');
    }

    // Step 2: Check existing trades
    console.log('\n📊 Step 2: Checking existing trades...');
    const tradesCheck = await pool.query(`
      SELECT 
        MIN(leverage) as min_leverage,
        MAX(leverage) as max_leverage,
        COUNT(*) as total_trades,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_trades
      FROM trades
    `);
    
    const stats = tradesCheck.rows[0];
    console.log(`   Total trades: ${stats.total_trades}`);
    console.log(`   Open trades: ${stats.open_trades}`);
    console.log(`   Max leverage used: ${stats.max_leverage || 0}x`);
    
    if (stats.max_leverage > 100) {
      throw new Error(`Found trades with leverage > 100x! Max: ${stats.max_leverage}x`);
    }

    // Step 3: Drop old constraint
    console.log('\n🔧 Step 3: Dropping old constraint...');
    await pool.query('ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check');
    console.log('✅ Old constraint dropped');

    // Step 4: Add new constraint
    console.log('\n🔧 Step 4: Adding new constraint (1x-200x)...');
    await pool.query(`
      ALTER TABLE trades ADD CONSTRAINT trades_leverage_check 
      CHECK (leverage >= 1 AND leverage <= 200)
    `);
    console.log('✅ New constraint added!');

    // Step 5: Verify
    console.log('\n🔍 Step 5: Verifying upgrade...');
    const newConstraint = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conname = 'trades_leverage_check'
    `);
    console.log('✅ New constraint:', newConstraint.rows[0].pg_get_constraintdef);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 UPGRADE COMPLETE!');
    console.log('Leverage limit increased from 100x to 200x');
    console.log('='.repeat(50));
    console.log('\n✅ You can now redeploy your backend without crashes!');
    console.log('✅ Users can now trade with up to 200x leverage!\n');

  } catch (error) {
    console.error('\n❌ UPGRADE FAILED:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the upgrade
upgradeTo200x();
