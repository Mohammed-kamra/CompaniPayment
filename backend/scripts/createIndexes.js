/**
 * MongoDB Index Creation Script
 * Creates unique indexes to prevent duplicate company registrations
 * 
 * Run this script once to set up database indexes:
 * node backend/scripts/createIndexes.js
 */

const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const dbName = 'sellerbuyer';

async function createIndexes() {
  let client = null;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    
    console.log('✅ Connected to MongoDB');
    
    // ============================================
    // Companies Collection - Unique Index on Code
    // ============================================
    console.log('\n📋 Creating indexes for "companies" collection...');
    
    // Create unique index on 'code' field (only for non-empty codes)
    // Note: MongoDB unique indexes allow multiple null/empty values
    // We'll use a partial index to only enforce uniqueness for non-empty codes
    try {
      await db.collection('companies').createIndex(
        { code: 1 },
        { 
          unique: true,
          name: 'code_unique_index',
          partialFilterExpression: { code: { $exists: true, $ne: '' } },
          background: true
        }
      );
      console.log('✅ Created unique index on companies.code (for non-empty codes)');
    } catch (error) {
      if (error.code === 85) {
        // Index already exists with different options
        console.log('⚠️  Index on companies.code already exists, dropping and recreating...');
        await db.collection('companies').dropIndex('code_unique_index');
        await db.collection('companies').createIndex(
          { code: 1 },
          { 
            unique: true,
            name: 'code_unique_index',
            partialFilterExpression: { code: { $exists: true, $ne: '' } },
            background: true
          }
        );
        console.log('✅ Recreated unique index on companies.code');
      } else if (error.code === 86) {
        // Index already exists
        console.log('✅ Index on companies.code already exists');
      } else {
        throw error;
      }
    }
    
    // Create compound unique index on name + code (for additional validation)
    try {
      await db.collection('companies').createIndex(
        { name: 1, code: 1 },
        { 
          unique: true,
          name: 'name_code_unique_index',
          partialFilterExpression: { 
            code: { $exists: true, $ne: '' },
            name: { $exists: true, $ne: '' }
          },
          background: true
        }
      );
      console.log('✅ Created compound unique index on companies (name, code)');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Compound index already exists, dropping and recreating...');
        await db.collection('companies').dropIndex('name_code_unique_index');
        await db.collection('companies').createIndex(
          { name: 1, code: 1 },
          { 
            unique: true,
            name: 'name_code_unique_index',
            partialFilterExpression: { 
              code: { $exists: true, $ne: '' },
              name: { $exists: true, $ne: '' }
            },
            background: true
          }
        );
        console.log('✅ Recreated compound unique index on companies (name, code)');
      } else if (error.code === 86) {
        console.log('✅ Compound index on companies (name, code) already exists');
      } else {
        throw error;
      }
    }
    
    // ============================================
    // Company Names Collection - Unique Index on Code
    // ============================================
    console.log('\n📋 Creating indexes for "companyNames" collection...');
    
    // Create unique index on 'code' field in companyNames
    try {
      await db.collection('companyNames').createIndex(
        { code: 1 },
        { 
          unique: true,
          name: 'code_unique_index',
          partialFilterExpression: { code: { $exists: true, $ne: '' } },
          background: true
        }
      );
      console.log('✅ Created unique index on companyNames.code (for non-empty codes)');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Index on companyNames.code already exists, dropping and recreating...');
        await db.collection('companyNames').dropIndex('code_unique_index');
        await db.collection('companyNames').createIndex(
          { code: 1 },
          { 
            unique: true,
            name: 'code_unique_index',
            partialFilterExpression: { code: { $exists: true, $ne: '' } },
            background: true
          }
        );
        console.log('✅ Recreated unique index on companyNames.code');
      } else if (error.code === 86) {
        console.log('✅ Index on companyNames.code already exists');
      } else {
        throw error;
      }
    }
    
    // Create unique index on 'name' field in companyNames
    try {
      await db.collection('companyNames').createIndex(
        { name: 1 },
        { 
          unique: true,
          name: 'name_unique_index',
          background: true
        }
      );
      console.log('✅ Created unique index on companyNames.name');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('✅ Index on companyNames.name already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n✅ All indexes created successfully!');
    console.log('\n📊 Index Summary:');
    console.log('   - companies.code: Unique (non-empty codes only)');
    console.log('   - companies (name, code): Compound unique (non-empty values)');
    console.log('   - companyNames.code: Unique (non-empty codes only)');
    console.log('   - companyNames.name: Unique');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 MongoDB connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  createIndexes()
    .then(() => {
      console.log('\n✨ Index creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Index creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createIndexes };
