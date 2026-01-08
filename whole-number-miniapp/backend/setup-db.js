// Quick script to setup database schema
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const client = new Client({
    connectionString: 'postgresql://postgres:QatWURBnrZpzqUfoiBwUdbnPyjzSdjcL@nozomi.proxy.rlwy.net:32382/railway',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Railway database...');
    await client.connect();
    console.log('✅ Connected!');

    console.log('📄 Reading schema file...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔨 Running schema...');
    await client.query(schema);
    
    console.log('✅ Database schema created successfully!');
    console.log('🎯 Tables created: users, trades, claims, leaderboard_snapshot, rewards_history, achievements, army_stats, system_config');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

setupDatabase();
