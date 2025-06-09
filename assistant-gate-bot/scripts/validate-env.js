#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating environment configuration...\n');

// Required environment variables
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'OPENAI_API_KEY',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
];

// Recommended environment variables
const recommendedVars = [
  'NODE_ENV',
  'TELEGRAM_WEBHOOK_SECRET',
  'OPENAI_ASSISTANT_ID',
  'REQUIRED_CHANNELS',
];

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('📋 Required variables:');
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: MISSING`);
    hasErrors = true;
  } else {
    // Check specific requirements
    if (varName === 'JWT_SECRET' && value.length < 32) {
      console.log(
        `⚠️  ${varName}: Too short (${value.length} chars, need 32+)`,
      );
      hasWarnings = true;
    } else {
      console.log(`✅ ${varName}: OK`);
    }
  }
});

console.log('\n📝 Recommended variables:');
recommendedVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    console.log(`⚠️  ${varName}: Not set`);
    hasWarnings = true;
  } else {
    console.log(`✅ ${varName}: OK`);
  }
});

// Check for admin panel build
console.log('\n🏗️  Build artifacts:');
const adminPath = path.join(__dirname, '..', 'public', 'admin', 'index.html');
if (fs.existsSync(adminPath)) {
  console.log('✅ Admin panel: Built');
} else {
  console.log('⚠️  Admin panel: Not built');
  hasWarnings = true;
}

const distPath = path.join(__dirname, '..', 'dist', 'main.js');
if (fs.existsSync(distPath)) {
  console.log('✅ Backend: Built');
} else {
  console.log('❌ Backend: Not built');
  hasErrors = true;
}

// Summary
console.log('\n📊 Summary:');
if (hasErrors) {
  console.log('❌ Validation failed! Please fix the errors above.');
  process.exit(1);
} else if (hasWarnings) {
  console.log(
    '⚠️  Validation completed with warnings. Application may not work properly.',
  );
  process.exit(0);
} else {
  console.log('✅ All validations passed! Ready to start.');
  process.exit(0);
}
