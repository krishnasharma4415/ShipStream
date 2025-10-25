// Comprehensive setup verification script
require('dotenv').config();
const { createClient } = require('redis');
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

async function verifySetup() {
  console.log('🔍 Verifying Vercel-like Deployment Service Setup...\n');
  
  let allTestsPassed = true;

  // 1. Environment Variables Check
  console.log('1️⃣ Checking Environment Variables...');
  const requiredEnvVars = [
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY', 
    'R2_ENDPOINT',
    'R2_BUCKET_NAME',
    'REDIS_URL'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: Set`);
    } else {
      console.log(`   ❌ ${envVar}: Missing`);
      allTestsPassed = false;
    }
  }

  // 2. Cloudflare R2 Test
  console.log('\n2️⃣ Testing Cloudflare R2 Connection...');
  try {
    const r2Client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    // Test bucket access
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.R2_BUCKET_NAME,
      MaxKeys: 1
    });
    
    await r2Client.send(listCommand);
    console.log('   ✅ R2 bucket access successful');
    
    // Test upload
    const testKey = `test-${Date.now()}.txt`;
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
      Body: 'Test upload from verification script',
    });
    
    await r2Client.send(putCommand);
    console.log('   ✅ R2 upload test successful');
    
    // Test download
    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
    });
    
    await r2Client.send(getCommand);
    console.log('   ✅ R2 download test successful');
    
  } catch (error) {
    console.log('   ❌ R2 test failed:', error.message);
    allTestsPassed = false;
  }

  // 3. Upstash Redis Test
  console.log('\n3️⃣ Testing Upstash Redis Connection...');
  try {
    const client = createClient({
      url: process.env.REDIS_URL
    });

    await client.connect();
    console.log('   ✅ Redis connection successful');
    
    // Test basic operations
    await client.set('test-key', 'test-value');
    const value = await client.get('test-key');
    
    if (value === 'test-value') {
      console.log('   ✅ Redis read/write test successful');
    } else {
      console.log('   ❌ Redis read/write test failed');
      allTestsPassed = false;
    }
    
    // Test queue operations (used by the deployment service)
    await client.lPush('test-queue', 'test-job');
    const job = await client.rPop('test-queue');
    
    if (job === 'test-job') {
      console.log('   ✅ Redis queue operations successful');
    } else {
      console.log('   ❌ Redis queue operations failed');
      allTestsPassed = false;
    }
    
    // Test hash operations (used for status tracking)
    await client.hSet('test-status', 'test-id', 'deployed');
    const status = await client.hGet('test-status', 'test-id');
    
    if (status === 'deployed') {
      console.log('   ✅ Redis hash operations successful');
    } else {
      console.log('   ❌ Redis hash operations failed');
      allTestsPassed = false;
    }
    
    // Cleanup
    await client.del('test-key', 'test-status');
    await client.disconnect();
    
  } catch (error) {
    console.log('   ❌ Redis test failed:', error.message);
    allTestsPassed = false;
  }

  // 4. Service Build Check
  console.log('\n4️⃣ Checking Service Builds...');
  const fs = require('fs');
  const services = ['upload-service', 'deploy-service', 'request-handler'];
  
  for (const service of services) {
    const distPath = `${service}/dist`;
    if (fs.existsSync(distPath)) {
      console.log(`   ✅ ${service}: Built successfully`);
    } else {
      console.log(`   ❌ ${service}: Not built (run npm run build)`);
      allTestsPassed = false;
    }
  }

  // Final Result
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 ALL TESTS PASSED! Your setup is ready for deployment.');
    console.log('\nNext steps:');
    console.log('1. Start services locally: npm run dev in each service directory');
    console.log('2. Deploy to Render.com using the provided render.yaml');
    console.log('3. Test deployment with a sample repository');
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.');
  }
  console.log('='.repeat(50));
}

verifySetup().catch(console.error);