# MongoDB Connection URLs

## Connection URL Formats

### 1. **Local MongoDB (No Authentication)**
```
mongodb://localhost:27017
```
- Default local connection
- No database specified (you'll select it in code)
- No authentication required

### 2. **Local MongoDB with Database Name**
```
mongodb://localhost:27017/mydatabase
```
- Connects directly to `mydatabase`
- No authentication

### 3. **Local MongoDB with Authentication**
```
mongodb://username:password@localhost:27017/mydatabase
```
- Requires username and password
- Replace `username`, `password`, and `mydatabase` with your values

### 4. **MongoDB Atlas (Cloud) - Recommended for Easy Setup**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mydatabase?retryWrites=true&w=majority
```
- **Get this URL from MongoDB Atlas:**
  1. Go to https://www.mongodb.com/cloud/atlas
  2. Sign up for free account
  3. Create a free cluster
  4. Click "Connect" → "Connect your application"
  5. Copy the connection string
  6. Replace `<password>` with your database user password
  7. Replace `mydatabase` with your database name

### 5. **MongoDB with Custom Port**
```
mongodb://localhost:27018
```
- If MongoDB is running on a different port (default is 27017)

### 6. **MongoDB with Connection Options**
```
mongodb://localhost:27017/mydatabase?authSource=admin&retryWrites=true
```
- `authSource=admin` - specifies authentication database
- `retryWrites=true` - enables retryable writes

### 7. **MongoDB Replica Set**
```
mongodb://host1:27017,host2:27017,host3:27017/mydatabase?replicaSet=myReplicaSet
```
- For connecting to a replica set

## Quick Setup Options

### Option A: Use MongoDB Atlas (Easiest - No Installation)
1. Visit: https://www.mongodb.com/cloud/atlas/register
2. Create free cluster (M0 - Free tier)
3. Create database user
4. Whitelist your IP (or use 0.0.0.0/0 for development)
5. Get connection string from "Connect" button
6. Use the `mongodb+srv://` URL format

### Option B: Install MongoDB Locally
1. Download: https://www.mongodb.com/try/download/community
2. Install MongoDB
3. Start MongoDB service
4. Use: `mongodb://localhost:27017`

## Example Usage in Code

```javascript
const { MongoClient } = require('mongodb');

// Your connection URL here
const uri = 'mongodb://localhost:27017'; // or your Atlas URL

const client = new MongoClient(uri);

async function connect() {
  try {
    await client.connect();
    const db = client.db('mydatabase'); // Database name
    const collection = db.collection('mycollection'); // Collection name
    // Your code here
  } finally {
    await client.close();
  }
}
```

## Security Notes

- **Never commit passwords to version control**
- Use environment variables for connection strings:
  ```javascript
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  ```
- For production, always use authentication
- MongoDB Atlas provides free SSL/TLS encryption
