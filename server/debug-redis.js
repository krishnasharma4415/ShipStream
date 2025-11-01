const { createClient } = require('redis');
require('dotenv').config();

async function debugRedis() {
  console.log('🔍 Debugging Redis queue...');
  
  const client = createClient({
    url: process.env.REDIS_URL
  });

  try {
    await client.connect();
    console.log('✅ Connected to Redis');
    
    // Check queue length
    const queueLength = await client.lLen('build-queue');
    console.log(`📊 Queue length: ${queueLength}`);
    
    // Check all items in queue (without removing them)
    const queueItems = await client.lRange('build-queue', 0, -1);
    console.log('📋 Queue items:', queueItems);
    
    // Check status hash
    const allStatuses = await client.hGetAll('status');
    console.log('📈 All deployment statuses:', allStatuses);
    
    // Clear the queue
    console.log('🧹 Clearing build queue...');
    await client.del('build-queue');
    
    // Clear old statuses (keep only recent ones)
    const statusKeys = Object.keys(allStatuses);
    const oldKeys = statusKeys.filter(key => key.length < 4); // Remove single character IDs
    
    if (oldKeys.length > 0) {
      console.log('🗑️ Removing old status entries:', oldKeys);
      await client.hDel('status', ...oldKeys);
    }
    
    // Add the latest deployment to queue
    const latestDeployments = statusKeys.filter(key => key.length >= 4);
    if (latestDeployments.length > 0) {
      const latest = latestDeployments[latestDeployments.length - 1];
      console.log(`📤 Adding latest deployment to queue: ${latest}`);
      await client.lPush('build-queue', latest);
    }
    
    console.log('✅ Redis cleanup completed');
    
    await client.disconnect();
  } catch (error) {
    console.error('❌ Redis debug failed:', error);
  }
}

debugRedis();