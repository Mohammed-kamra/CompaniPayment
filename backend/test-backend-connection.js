/**
 * Quick test to verify backend server is accessible
 * Usage: node test-backend-connection.js
 */

// Use built-in fetch (Node.js 18+) or require node-fetch
let fetch;
try {
  fetch = globalThis.fetch || require('node-fetch');
} catch (e) {
  console.log('Using built-in fetch (Node.js 18+)');
}

async function testBackend() {
  console.log('🧪 Testing backend connection...\n');
  
  try {
    console.log('📡 Testing: http://localhost:5000/api/health');
    const response = await fetch('http://localhost:5000/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is RUNNING!');
      console.log('📋 Response:', JSON.stringify(data, null, 2));
      console.log('\n✅ Your backend server is accessible and working correctly!');
      return true;
    } else {
      console.log('❌ Backend responded but with error status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is NOT accessible!');
    console.log('❌ Error:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure backend server is running: cd backend && npm start');
    console.log('   2. Check if port 5000 is available');
    console.log('   3. Verify MongoDB is running');
    console.log('   4. Check backend console for errors');
    return false;
  }
}

testBackend();
