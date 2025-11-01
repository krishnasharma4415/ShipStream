const { createClient } = require('redis');
require('dotenv').config();

async function testBrPop() {
  const client = createClient({
    url: process.env.REDIS_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis');
    
    // Check current queue
    const queueItems = await client.lRange('build-queue', 0, -1);
    console.log('📋 Current queue items:', queueItems);
    
    // Test brPop
    console.log('🔍 Testing brPop...');
    const response = await client.brPop(
      "build-queue",
      1 // 1 second timeout
    );
    
    if (response) {
      console.log('✅ brPop response:', response);
      console.log('📦 Key:', response.key);
      console.log('🆔 Element:', response.element);
    } else {
      console.log('❌ brPop returned null (timeout or empty queue)');
    }
    
    // Check queue after brPop
    const queueAfter = await client.lRange('build-queue', 0, -1);
    console.log('📋 Queue after brPop:', queueAfter);
    
    await client.disconnect();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBrPop();