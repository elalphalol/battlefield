// Run notification tokens migration
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected to Railway PostgreSQL');

    // Read migration file
    const migrationPath = path.join(__dirname, 'database', 'add-notification-tokens.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Running notification tokens migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('notification_tokens', 'notification_log')
      ORDER BY table_name
    `);

    console.log('\n📊 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Verify user columns were added
    const columnsResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('notifications_enabled', 'daily_reminder_enabled', 'achievement_notifications_enabled')
      ORDER BY column_name
    `);

    console.log('\n📊 User columns added:');
    columnsResult.rows.forEach(row => {
      console.log(`  ✓ ${row.column_name}`);
    });

    console.log('\n🎉 Notification system database migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
