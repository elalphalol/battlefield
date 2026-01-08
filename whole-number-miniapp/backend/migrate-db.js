// Script to run leverage constraint migration
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres:QatWURBnrZpzqUfoiBwUdbnPyjzSdjcL@nozomi.proxy.rlwy.net:32382/railway',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Railway database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('📄 Reading migration file...');
    const migrationPath = path.join(__dirname, 'database', 'migrate-leverage.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🔨 Running migration to update leverage constraint...');
    await client.query(migration);
    
    console.log('✅ Migration completed successfully!');
    console.log('🎯 Leverage constraint now allows values from 1x to 100x');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

migrateDatabase();
