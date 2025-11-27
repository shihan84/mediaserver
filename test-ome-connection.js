#!/usr/bin/env node

/**
 * Test OvenMediaEngine API Connection
 * Tests connectivity and API endpoints
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const OME_API_URL = process.env.OME_API_URL || 'http://localhost:8081';
const OME_API_KEY = process.env.OME_API_KEY || 'ome-api-token-2024';

console.log('Testing OvenMediaEngine API Connection');
console.log('='.repeat(60));
console.log(`API URL: ${OME_API_URL}`);
console.log(`API Key: ${OME_API_KEY ? 'Set' : 'Not Set'}`);
console.log('='.repeat(60));

// Test OME API endpoint
const testOMEEndpoint = (endpoint, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${OME_API_URL}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (OME_API_KEY) {
      options.headers['Authorization'] = `Bearer ${OME_API_KEY}`;
    }

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: json,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
            error: 'Failed to parse JSON'
          });
        }
      });
    });

    req.on('error', (err) => {
      reject({
        error: err.message,
        code: err.code
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.setTimeout(5000, () => {
      req.destroy();
      reject({ error: 'Request timeout', code: 'ETIMEDOUT' });
    });

    req.end();
  });
};

// Test 1: Check if OME is running
console.log('\n[1] Testing OME API Connectivity...');
testOMEEndpoint('/v1/stats/current')
  .then(result => {
    console.log('   [OK] OME API is accessible!');
    console.log('   Status:', result.status);
    if (result.data && typeof result.data === 'object') {
      console.log('   Response keys:', Object.keys(result.data).join(', '));
    }
  })
  .catch(err => {
    console.log('   [ERROR] OME API is not accessible');
    console.log('   Error:', err.error || err.message);
    console.log('   [INFO] Make sure OvenMediaEngine is running on port 8081');
    console.log('   [INFO] Check OME_API_URL in backend/.env');
  });

// Test 2: Test streams endpoint
console.log('\n[2] Testing Streams Endpoint...');
testOMEEndpoint('/v1/vhosts/default/apps/app/streams')
  .then(result => {
    console.log('   [OK] Streams endpoint accessible');
    console.log('   Status:', result.status);
    if (result.data && Array.isArray(result.data)) {
      console.log('   Active streams:', result.data.length);
    }
  })
  .catch(err => {
    console.log('   [ERROR] Streams endpoint failed');
    console.log('   Error:', err.error || err.message);
  });

// Test 3: Test metrics endpoint
console.log('\n[3] Testing Metrics Endpoint...');
testOMEEndpoint('/v1/vhosts/default/apps/app/metrics')
  .then(result => {
    console.log('   [OK] Metrics endpoint accessible');
    console.log('   Status:', result.status);
  })
  .catch(err => {
    console.log('   [ERROR] Metrics endpoint failed');
    console.log('   Error:', err.error || err.message);
  });

// Test 4: Check authentication
console.log('\n[4] Testing Authentication...');
if (OME_API_KEY) {
  console.log('   [OK] API Key is configured');
  console.log('   Key format:', OME_API_KEY.substring(0, 10) + '...');
} else {
  console.log('   [WARN] API Key is not set');
  console.log('   [INFO] Set OME_API_KEY in backend/.env');
}

// Summary
setTimeout(() => {
  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log('   - OME API URL:', OME_API_URL);
  console.log('   - API Key:', OME_API_KEY ? 'Configured' : 'Not Set');
  console.log('\nNext Steps:');
  console.log('   1. Ensure OvenMediaEngine is running');
  console.log('   2. Verify OME_API_URL in backend/.env');
  console.log('   3. Verify OME_API_KEY matches OME configuration');
  console.log('   4. Check OME logs if connection fails');
}, 2000);

