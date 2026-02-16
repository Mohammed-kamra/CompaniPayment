const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://k7:Aa123456@cluster0.yvrxc0h.mongodb.net/?appName=Cluster0';
const dbName = 'sellerbuyer';

let client = null;
let db = null;

async function connectDB() {
  try {
    if (!client) {
      client = new MongoClient(uri);
      await client.connect();
      db = client.db(dbName);
      console.log('✅ Connected to MongoDB');
    }
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

async function closeDB() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed');
  }
}

module.exports = { connectDB, getDB, closeDB };
