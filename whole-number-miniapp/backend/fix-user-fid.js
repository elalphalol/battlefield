const { Client } = require('pg');

const DATABASE_URL = process.argv[2] || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: No DATABASE_URL provided');
  process.exit(1);
}

async function fixUserFID() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Find users with that wallet address (case-insensitive)
    console.log('🔍 Searching for user with wallet 0xe3Bc63E57bb5890A5FA39C731a7AFB8fD0f6BF2B...\n');
    
    const searchResult = await client.query(`
      SELECT wallet_address, fid, username, pfp_url 
      FROM users 
      WHERE LOWER(wallet_address) = LOWER($1)
    `, ['0xe3Bc63E57bb5890A5FA39C731a7AFB8fD0f6BF2B']);

    if (searchResult.rows.length === 0) {
      console.log('⚠️ User not found. Let me show ALL users:');
      const allUsers = await client.query(
        'SELECT wallet_address, fid, username FROM users ORDER BY created_at DESC LIMIT 20'
      );
      console.table(allUsers.rows);
      return;
    }

    console.log('✅ Found user:');
    console.table(searchResult.rows);

    // Update FID to null
    const updateResult = await client.query(`
      UPDATE users 
      SET fid = NULL 
      WHERE LOWER(wallet_address) = LOWER($1)
      RETURNING wallet_address, fid, username
    `, ['0xe3Bc63E57bb5890A5FA39C731a7AFB8fD0f6BF2B']);

    console.log('\n✅ Updated user:');
    console.table(updateResult.rows);

    console.log('\n🎉 Done! FID is now NULL for this user.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

fixUserFID().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
