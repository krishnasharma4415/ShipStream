#!/usr/bin/env node

/**
 * Deployment Test Script
 * Tests the deployed services to ensure they're working correctly
 */

const axios = require('axios');

// Configuration - Update these URLs after deployment
const UPLOAD_SERVICE_URL = process.env.UPLOAD_SERVICE_URL || 'https://deployfast-upload-service.onrender.com';
const REQUEST_HANDLER_URL = process.env.REQUEST_HANDLER_URL || 'https://deployfast-request-handler.onrender.com';

async function testHealthEndpoints() {
  console.log('🏥 Testing Health Endpoints...\n');
  
  try {
    // Test Upload Service Health
    console.log('Testing Upload Service Health...');
    const uploadHealth = await axios.get(`${UPLOAD_SERVICE_URL}/health`, { timeout: 10000 });
    console.log('✅ Upload Service:', uploadHealth.data);
  } catch (error) {
    console.log('❌ Upload Service Health Failed:', error.message);
  }

  try {
    // Test Request Handler Health
    console.log('\nTesting Request Handler Health...');
    const handlerHealth = await axios.get(`${REQUEST_HANDLER_URL}/health`, { timeout: 10000 });
    console.log('✅ Request Handler:', handlerHealth.data);
  } catch (error) {
    console.log('❌ Request Handler Health Failed:', error.message);
  }
}

async function testDeploymentFlow() {
  console.log('\n🚀 Testing Deployment Flow...\n');
  
  try {
    // Test deployment with a simple repository
    console.log('Deploying test repository...');
    const deployResponse = await axios.post(`${UPLOAD_SERVICE_URL}/send-url`, {
      repoUrl: 'https://github.com/vercel/next.js/tree/canary/examples/hello-world'
    }, { timeout: 30000 });
    
    console.log('✅ Deployment initiated:', deployResponse.data);
    const deploymentId = deployResponse.data.generated;
    
    // Poll for status
    console.log('\nPolling deployment status...');
    let attempts = 0;
    const maxAttempts = 30; // 1 minute with 2-second intervals
    
    while (attempts < maxAttempts) {
      try {
        const statusResponse = await axios.get(`${UPLOAD_SERVICE_URL}/status?id=${deploymentId}`);
        const status = statusResponse.data.status;
        
        console.log(`Status check ${attempts + 1}: ${status}`);
        
        if (status === 'deployed') {
          console.log('✅ Deployment completed successfully!');
          console.log(`🌐 Deployed URL: http://${deploymentId}.localhost:3000`);
          break;
        } else if (status === 'failed') {
          console.log('❌ Deployment failed');
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        console.log(`❌ Status check failed: ${error.message}`);
        break;
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Deployment status polling timed out');
    }
    
  } catch (error) {
    console.log('❌ Deployment test failed:', error.message);
  }
}

async function runTests() {
  console.log('🧪 DeployFast Deployment Test Suite\n');
  console.log('Upload Service URL:', UPLOAD_SERVICE_URL);
  console.log('Request Handler URL:', REQUEST_HANDLER_URL);
  console.log('=' .repeat(50));
  
  await testHealthEndpoints();
  await testDeploymentFlow();
  
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Test suite completed!');
}

// Run tests
runTests().catch(console.error);