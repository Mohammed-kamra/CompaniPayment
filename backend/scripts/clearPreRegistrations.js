/**
 * Script to clear pre-registrations from the database
 * Usage: node scripts/clearPreRegistrations.js
 */

const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'sellerbuyer';

async function clearPreRegistrations() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    
    console.log('🗑️  Clearing pre-registrations...');
    const result = await db.collection('preRegistrations').deleteMany({});
    
    console.log(`✅ Deleted ${result.deletedCount} pre-registration(s)`);
    
    // Optionally, also clear related companies created from pre-registrations
    console.log('🗑️  Clearing related companies...');
    const companyResult = await db.collection('companies').deleteMany({
      preRegistrationId: { $exists: true }
    });
    
    console.log(`✅ Deleted ${companyResult.deletedCount} related company/companies`);
    
    console.log('✨ Database cleanup completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

clearPreRegistrations();
