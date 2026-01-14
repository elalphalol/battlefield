// Test webhook endpoint locally and on Railway
const TEST_FID = 1452351; // Your FID

async function testWebhook(baseUrl) {
  console.log(`\n🧪 Testing webhook at: ${baseUrl}`);

  try {
    // Test 1: Simulate notifications_enabled event
    console.log('\n1️⃣ Testing notifications_enabled event...');
    const enableResponse = await fetch(`${baseUrl}/api/farcaster/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'notifications_enabled',
        data: {
          fid: TEST_FID,
          notificationDetails: {
            token: `test_token_${Date.now()}`,
            url: 'https://api.warpcast.com/v1/frame-notifications'
          }
        }
      })
    });

    const enableResult = await enableResponse.json();
    console.log(`   ${enableResponse.ok ? '✅' : '❌'} Status: ${enableResponse.status}`);
    console.log(`   Response:`, enableResult);

    // Test 2: Simulate notifications_disabled event
    console.log('\n2️⃣ Testing notifications_disabled event...');
    const disableResponse = await fetch(`${baseUrl}/api/farcaster/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'notifications_disabled',
        data: { fid: TEST_FID }
      })
    });

    const disableResult = await disableResponse.json();
    console.log(`   ${disableResponse.ok ? '✅' : '❌'} Status: ${disableResponse.status}`);
    console.log(`   Response:`, disableResult);

    // Test 3: Check health endpoint
    console.log('\n3️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthResult = await healthResponse.json();
    console.log(`   ${healthResponse.ok ? '✅' : '❌'} Status: ${healthResponse.status}`);
    console.log(`   Response:`, healthResult);

    console.log(`\n${enableResponse.ok && disableResponse.ok && healthResponse.ok ? '✅ All tests passed!' : '❌ Some tests failed'}`);

  } catch (error) {
    console.error(`\n❌ Test failed:`, error.message);
  }
}

// Test both local and production
(async () => {
  console.log('🎯 BATTLEFIELD Notification Webhook Tests\n');
  console.log('=' .repeat(50));

  // Test local server (if running)
  await testWebhook('http://localhost:3001');

  // Test Railway production
  await testWebhook('https://battlefield-backend.up.railway.app');

  console.log('\n' + '='.repeat(50));
  console.log('✅ Testing complete!');
})();
