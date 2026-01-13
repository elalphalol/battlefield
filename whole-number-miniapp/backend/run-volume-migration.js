// Run volume tracking migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting volume tracking migration...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'database', 'add-volume-tracking.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the migration
    await client.query(sql);
    
    console.log('✅ Volume tracking migration completed successfully!');
    
    // Show stats
    const stats = await client.query(`
      SELECT 
        COALESCE(SUM(total_volume), 0) as global_volume,
        COUNT(*) as total_users,
        COUNT(CASE WHEN total_trades > 0 THEN 1 END) as active_traders
      FROM users
    `);
    
    console.log('\n📊 Volume Statistics:');
    console.log(`Global Trading Volume: $${Number(stats.rows[0].global_volume).toLocaleString()}`);
    console.log(`Total Users: ${stats.rows[0].total_users}`);
    console.log(`Active Traders: ${stats.rows[0].active_traders}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✅ Migration complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
  });
