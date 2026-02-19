/**
 * Script to clear pre-registrations from the database
 * Usage: node scripts/clearPreRegistrations.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'sellerbuyer';

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
    
    // IMPORTANT SAFETY CHANGE:
    // Previously this script also deleted companies that were created from pre-registrations:
    //   db.collection('companies').deleteMany({ preRegistrationId: { $exists: true } })
    //
    // This caused all companies linked to pre-registrations to be removed when
    // `npm run clear:pre-registrations` was executed, which is dangerous in production.
    //
    // To prevent accidental data loss, this deletion is now DISABLED by default.
    // If you really want to clear related companies as well, you must explicitly
    // set CLEAR_COMPANIES_FROM_PRE_REG=true in your environment before running
    // this script.
    
    if (process.env.CLEAR_COMPANIES_FROM_PRE_REG === 'true') {
      console.log('🗑️  CLEARING related companies because CLEAR_COMPANIES_FROM_PRE_REG=true ...');
      const companyResult = await db.collection('companies').deleteMany({
        preRegistrationId: { $exists: true }
      });
      console.log(`✅ Deleted ${companyResult.deletedCount} related company/companies`);
    } else {
      console.log('⚠️  Skipping deletion of related companies (CLEAR_COMPANIES_FROM_PRE_REG is not set to \"true\").');
      console.log('    Companies linked to pre-registrations are SAFE and were NOT deleted.');
    }
    
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
