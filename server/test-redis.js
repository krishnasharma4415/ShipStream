const { createClient } = require('redis');
require('dotenv').config();

async function testRedis() {
  console.log('Testing Redis connection...');
  console.log('Redis URL:', process.env.REDIS_URL ? 'Set' : 'Not set');
  
  const client = createClient({
    url: process.env.REDIS_URL
  });

  client.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('✅ Redis Client Connected');
  });

  client.on('ready', () => {
    console.log('✅ Redis Client Ready');
  });

  client.on('end', () => {
    console.log('❌ Redis Client Disconnected');
  });

  try {
    await client.connect();
    console.log('✅ Connection established');
    
    // Test basic operations
    await client.set('test-key', 'test-value');
    const value = await client.get('test-key');
    console.log('✅ Test operation successful:', value);
    
    // Test queue operations
    await client.lPush('test-queue', 'test-item');
    const queueItem = await client.lPop('test-queue');
    console.log('✅ Queue operation successful:', queueItem);
    
    await client.disconnect();
    console.log('✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Redis test failed:', error);
  }
}

testRedis();