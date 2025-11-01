const { createClient } = require('redis');
require('dotenv').config();

async function addToQueue() {
  const client = createClient({
    url: process.env.REDIS_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis');
    
    // Add dccee to queue
    await client.lPush('build-queue', 'dccee');
    console.log('📤 Added dccee to build queue');
    
    // Check queue
    const queueItems = await client.lRange('build-queue', 0, -1);
    console.log('📋 Queue items:', queueItems);
    
    await client.disconnect();
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

addToQueue();