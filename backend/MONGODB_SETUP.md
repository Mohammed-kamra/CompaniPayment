# MongoDB Setup Guide

## The Error: "localhost refused to connect"

This error means MongoDB is not running on your machine. Here's how to fix it:

## Option 1: Install and Run MongoDB Locally

### Step 1: Install MongoDB
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer and follow the setup wizard
3. During installation, choose "Install MongoDB as a Service" (recommended for Windows)

### Step 2: Start MongoDB
**If installed as a Windows Service:**
- MongoDB should start automatically
- Or manually start it: Open Services (services.msc) and start "MongoDB" service
- Or use PowerShell (as Administrator): `net start MongoDB`

**If installed manually:**
- Open Command Prompt or PowerShell
- Navigate to MongoDB bin directory (usually `C:\Program Files\MongoDB\Server\<version>\bin`)
- Run: `mongod.exe`

### Step 3: Verify MongoDB is Running
- MongoDB should be running on `localhost:27017`
- You can test by running: `mongosh` (MongoDB Shell)

## Option 2: Use MongoDB Atlas (Cloud - No Installation Needed)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster
4. Get your connection string
5. Update `server.js` with your Atlas connection string:
   ```javascript
   const uri = 'mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority';
   ```

## Running the Server

1. Install dependencies:
   ```bash
   npm install
   ```

2. Update the database and collection names in `server.js`:
   - Replace `'testdb'` with your database name
   - Replace `'testcollection'` with your collection name

3. Run the server:
   ```bash
   npm start
   ```

## Troubleshooting

- **"mongod is not recognized"**: MongoDB is not installed or not in PATH
- **"Connection refused"**: MongoDB service is not running
- **Port 27017 in use**: Another MongoDB instance might be running, or another service is using that port
