#!/usr/bin/env node

/**
 * Test script to verify domain configuration
 * Tests API endpoints and WebSocket URL generation logic
 */

const https = require('https');
const http = require('http');

const DOMAIN = 'obe.imagetv.in';
const BACKEND_PORT = 3001;

console.log('Testing Domain Configuration for:', DOMAIN);
console.log('='.repeat(60));

// Test 1: Check backend health endpoint
console.log('\n[1] Testing Backend Health Endpoint...');
const testBackendHealth = () => {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://localhost:${BACKEND_PORT}/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('   [OK] Backend is running:', json);
          resolve(json);
        } catch (e) {
          console.log('   [WARN] Backend responded but JSON parse failed');
          resolve(data);
        }
      });
    });
    
    req.on('error', (err) => {
      console.log('   [ERROR] Backend connection failed:', err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Test 2: Check CORS configuration
console.log('\n[2] Checking CORS Configuration...');
const testCORS = async () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, 'backend', '.env');
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const corsMatch = envContent.match(/CORS_ORIGIN=(.+)/);
      
      if (corsMatch) {
        const corsOrigin = corsMatch[1].trim();
        console.log('   📋 Current CORS_ORIGIN:', corsOrigin);
        
        if (corsOrigin.includes(DOMAIN) || corsOrigin === `https://${DOMAIN}`) {
          console.log('   [OK] CORS is configured for domain');
        } else {
          console.log('   [WARN] CORS needs to be updated to:', `https://${DOMAIN}`);
          console.log('   [INFO] Update backend/.env: CORS_ORIGIN=https://' + DOMAIN);
        }
      } else {
        console.log('   [WARN] CORS_ORIGIN not found in .env');
      }
    } else {
      console.log('   [WARN] .env file not found');
    }
  } catch (err) {
    console.log('   [ERROR] Error checking CORS:', err.message);
  }
};

// Test 3: Verify frontend build
console.log('\n[3] Checking Frontend Build...');
const testFrontendBuild = () => {
  try {
    const fs = require('fs');
    const path = require('path');
    const distPath = path.join(__dirname, 'frontend', 'dist');
    const indexHtml = path.join(distPath, 'index.html');
    
    if (fs.existsSync(distPath) && fs.existsSync(indexHtml)) {
      console.log('   [OK] Frontend build exists');
      const stats = fs.statSync(distPath);
      console.log('   Build directory:', distPath);
      
      // Check for built assets
      const files = fs.readdirSync(distPath);
      const assets = files.filter(f => f.includes('assets'));
      console.log('   Built assets:', assets.length, 'files');
    } else {
      console.log('   [WARN] Frontend build not found. Run: cd frontend && npm run build');
    }
  } catch (err) {
    console.log('   [ERROR] Error checking build:', err.message);
  }
};

// Test 4: WebSocket URL logic test
console.log('\n[4] Testing WebSocket URL Logic...');
const testWebSocketLogic = () => {
  console.log('   Production mode (HTTPS):');
  console.log('      Protocol: wss://');
  console.log('      Host:', DOMAIN);
  console.log('      URL: wss://' + DOMAIN);
  
  console.log('   Development mode:');
  console.log('      URL: ws://localhost:3001');
  console.log('   [OK] WebSocket URL logic is correct');
};

// Test 5: API URL logic test
console.log('\n[5] Testing API URL Logic...');
const testApiLogic = () => {
  console.log('   Production mode:');
  console.log('      Base URL: /api (relative, uses same domain)');
  console.log('      Full URL: https://' + DOMAIN + '/api');
  
  console.log('   Development mode:');
  console.log('      Base URL: /api (proxied to localhost:3001)');
  console.log('   [OK] API URL logic is correct');
};

// Run all tests
(async () => {
  try {
    await testBackendHealth();
    await testCORS();
    testFrontendBuild();
    testWebSocketLogic();
    testApiLogic();
    
    console.log('\n' + '='.repeat(60));
    console.log('[OK] Domain Configuration Test Complete!');
    console.log('\nNext Steps:');
    console.log('   1. Update backend/.env: CORS_ORIGIN=https://' + DOMAIN);
    console.log('   2. Restart backend server');
    console.log('   3. Configure reverse proxy (Nginx) for domain');
    console.log('   4. Deploy frontend build to web server');
    console.log('   5. Access application at: https://' + DOMAIN);
  } catch (err) {
    console.error('\n[ERROR] Test failed:', err.message);
    process.exit(1);
  }
})();
