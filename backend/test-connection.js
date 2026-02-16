// Quick MongoDB Connection Test Script
const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log('📍 Connection URL: mongodb://localhost:27017\n');
    
    await client.connect();
    console.log('✅ SUCCESS! Connected to MongoDB!\n');
    
    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    
    console.log('📊 Available databases:');
    databases.databases.forEach(db => {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    console.log('\n✨ MongoDB is ready to use!');
    console.log('💡 You can now run: node server.js');
    
  } catch (error) {
    console.error('❌ Connection FAILED!\n');
    console.error('Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Is MongoDB installed?');
    console.log('2. Is MongoDB service running?');
    console.log('   → Run: net start MongoDB (as Administrator)');
    console.log('3. Check Services: Press Win+R, type "services.msc"');
    console.log('   → Find "MongoDB" and make sure it\'s running');
    console.log('\n📖 See LOCAL_MONGODB_SETUP.md for installation guide');
  } finally {
    await client.close();
  }
}

testConnection().catch(console.error);
