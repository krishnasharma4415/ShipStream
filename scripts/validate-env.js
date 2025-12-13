#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Run this before deployment to ensure all required env vars are set
 */

const crypto = require('crypto');

const services = {
  'auth-service': {
    required: [
      'AUTH_SERVICE_PORT',
      'GITHUB_CLIENT_ID',
      'GITHUB_CLIENT_SECRET',
      'GITHUB_REDIRECT_URI',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'REDIS_URL',
      'FRONTEND_URL',
      'NODE_ENV'
    ],
    validators: {
      JWT_SECRET: (val) => {
        const decoded = Buffer.from(val, 'base64');
        return decoded.length === 32 ? null : 'JWT_SECRET must be 32 bytes when base64 decoded';
      },
      ENCRYPTION_KEY: (val) => {
        const decoded = Buffer.from(val, 'base64');
        return decoded.length === 32 ? null : 'ENCRYPTION_KEY must be 32 bytes when base64 decoded';
      },
      GITHUB_REDIRECT_URI: (val) => {
        return val.includes('/auth/github/callback') ? null : 'Must end with /auth/github/callback';
      },
      REDIS_URL: (val) => {
        return val.startsWith('redis://') || val.startsWith('rediss://') ? null : 'Must start with redis:// or rediss://';
      }
    }
  },
  'upload-service': {
    required: [
      'UPLOAD_SERVICE_PORT',
      'AUTH_SERVICE_URL',
      'JWT_SECRET',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_ENDPOINT',
      'R2_BUCKET_NAME',
      'REDIS_URL',
      'NODE_ENV'
    ],
    validators: {
      AUTH_SERVICE_URL: (val) => {
        return val.startsWith('http://') || val.startsWith('https://') ? null : 'Must be a valid URL';
      },
      R2_ENDPOINT: (val) => {
        return val.startsWith('https://') ? null : 'Must be a valid HTTPS URL';
      }
    }
  },
  'deploy-service': {
    required: [
      'DEPLOY_SERVICE_PORT',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_ENDPOINT',
      'R2_BUCKET_NAME',
      'REDIS_URL',
      'NODE_ENV'
    ]
  },
  'request-handler': {
    required: [
      'REQUEST_HANDLER_PORT',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_ENDPOINT',
      'R2_BUCKET_NAME',
      'NODE_ENV'
    ]
  }
};

function validateService(serviceName, config) {
  console.log(`\n🔍 Validating ${serviceName}...`);
  
  const errors = [];
  const warnings = [];
  
  // Check required variables
  for (const varName of config.required) {
    const value = process.env[varName];
    
    if (!value) {
      errors.push(`❌ Missing required variable: ${varName}`);
      continue;
    }
    
    // Run custom validators
    if (config.validators && config.validators[varName]) {
      const error = config.validators[varName](value);
      if (error) {
        errors.push(`❌ ${varName}: ${error}`);
      }
    }
    
    // Check for placeholder values
    if (value.includes('your_') || value.includes('your-') || value.includes('<') || value.includes('>')) {
      warnings.push(`⚠️  ${varName} appears to be a placeholder value`);
    }
  }
  
  // Report results
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`✅ ${serviceName} configuration is valid`);
    return true;
  }
  
  if (errors.length > 0) {
    console.log(`\n❌ ${serviceName} has errors:`);
    errors.forEach(err => console.log(`   ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${serviceName} has warnings:`);
    warnings.forEach(warn => console.log(`   ${warn}`));
  }
  
  return errors.length === 0;
}

function generateSecrets() {
  console.log('\n🔐 Generate new secrets with these commands:\n');
  console.log('JWT_SECRET:');
  console.log(`  ${crypto.randomBytes(32).toString('base64')}\n`);
  console.log('ENCRYPTION_KEY:');
  console.log(`  ${crypto.randomBytes(32).toString('base64')}\n`);
}

function main() {
  console.log('🚀 ShipStream Environment Validation\n');
  console.log('=' .repeat(50));
  
  // Load environment variables
  require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
  
  let allValid = true;
  
  // Validate each service
  for (const [serviceName, config] of Object.entries(services)) {
    const isValid = validateService(serviceName, config);
    if (!isValid) {
      allValid = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allValid) {
    console.log('\n✅ All services are properly configured!');
    console.log('\n📋 Next steps:');
    console.log('   1. Review PRODUCTION_CHECKLIST.md');
    console.log('   2. Test services locally: npm run dev');
    console.log('   3. Deploy using render.yaml or docker-compose.yml');
    process.exit(0);
  } else {
    console.log('\n❌ Configuration errors found. Please fix them before deploying.');
    generateSecrets();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateService, services };
