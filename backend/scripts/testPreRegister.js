/**
 * Test script for pre-registration endpoint
 * Usage: node scripts/testPreRegister.js
 * 
 * Note: Requires Node.js 18+ (built-in fetch) or install node-fetch
 */

// Use built-in fetch (Node.js 18+) or require node-fetch
let fetch;
try {
  // Try built-in fetch first (Node.js 18+)
  fetch = globalThis.fetch || require('node-fetch');
} catch (e) {
  console.error('❌ fetch is not available. Please use Node.js 18+ or install node-fetch: npm install node-fetch');
  process.exit(1);
}

const API_URL = 'http://localhost:5000/api/pre-register';

// Test data
const testData = {
  name: 'John Doe',
  mobileNumber: '1234567890',
  companyName: 'Test Company',
  groupId: '', // Add a valid groupId if you have one
  code: '' // Add code if codes are enabled
};

async function testPreRegister() {
  try {
    console.log('🧪 Testing pre-registration endpoint...');
    console.log('📤 Sending POST request to:', API_URL);
    console.log('📋 Data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('\n📥 Response Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📋 Response Body:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Pre-registration successful!');
    } else {
      console.log('\n❌ Pre-registration failed!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('💡 Make sure the backend server is running on port 5000');
  }
}

testPreRegister();
