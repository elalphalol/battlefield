const { Client } = require('pg');

// Get DATABASE_URL from command line or environment
const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: No DATABASE_URL provided');
  console.error('Usage: node run-migration.js "your_database_url_here"');
  process.exit(1);
}

async function runMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!');

    // Step 1: Make FID nullable
    console.log('\n📝 Making FID column nullable...');
    await client.query('ALTER TABLE users ALTER COLUMN fid DROP NOT NULL;');
    console.log('✅ FID is now nullable');

    // Step 2: Verify column is nullable
    console.log('\n🔍 Verifying column...');
    const columnCheck = await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'fid';
    `);
    console.log('Column info:', columnCheck.rows[0]);

    // Step 3: Update the specific user
    console.log('\n📝 Updating user 0xe3bc63e57bb5890a5fa39c731a7afb8fd0f6bf2b...');
    const updateResult = await client.query(
      'UPDATE users SET fid = NULL WHERE wallet_address = $1 RETURNING wallet_address, fid, username',
      ['0xe3bc63e57bb5890a5fa39c731a7afb8fd0f6bf2b']
    );
    
    if (updateResult.rowCount > 0) {
      console.log('✅ User updated:', updateResult.rows[0]);
    } else {
      console.log('⚠️ No user found with that wallet address');
    }

    // Step 4: Show all users with null FID
    console.log('\n👥 Users with null FID:');
    const nullUsers = await client.query(
      'SELECT wallet_address, fid, username FROM users WHERE fid IS NULL LIMIT 10'
    );
    console.table(nullUsers.rows);

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
