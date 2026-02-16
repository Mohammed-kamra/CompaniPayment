# Local MongoDB Setup Guide for Windows

## Step 1: Install MongoDB

### Download MongoDB Community Server
1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - **Version**: Latest (or 7.0)
   - **Platform**: Windows
   - **Package**: MSI
3. Click "Download"

### Install MongoDB
1. Run the downloaded `.msi` installer
2. Choose "Complete" installation
3. **Important**: Check "Install MongoDB as a Service"
4. Select "Run service as Network Service user" (default)
5. Check "Install MongoDB Compass" (optional GUI tool)
6. Click "Install"

## Step 2: Verify Installation

### Check if MongoDB Service is Running
Open PowerShell (as Administrator) and run:
```powershell
Get-Service MongoDB
```

### Start MongoDB Service (if not running)
```powershell
net start MongoDB
```

Or use Services:
1. Press `Win + R`, type `services.msc`, press Enter
2. Find "MongoDB" service
3. Right-click → Start

## Step 3: Test MongoDB Connection

### Option A: Using MongoDB Shell (mongosh)
```powershell
mongosh
```
If this works, you'll see: `test>`

### Option B: Test with Your Node.js Script
```powershell
npm install
node server.js
```

## Step 4: Connection URL

Your connection URL is:
```
mongodb://localhost:27017
```

This is already set in `server.js`.

## Troubleshooting

### "mongod is not recognized"
- MongoDB is not installed or not in PATH
- Reinstall MongoDB and make sure to check "Add to PATH" during installation

### "Connection refused" or "ECONNREFUSED"
- MongoDB service is not running
- Start it: `net start MongoDB` (as Administrator)

### "Port 27017 already in use"
- Another MongoDB instance might be running
- Check: `netstat -ano | findstr :27017`
- Stop the conflicting service

### Permission Denied
- Run PowerShell/Command Prompt as Administrator
- Or check MongoDB service permissions in Services

## Quick Commands Reference

```powershell
# Start MongoDB
net start MongoDB

# Stop MongoDB
net stop MongoDB

# Check MongoDB status
Get-Service MongoDB

# Connect to MongoDB shell
mongosh

# Test connection from Node.js
node server.js
```

## Default MongoDB Paths (Windows)

- **Data Directory**: `C:\Program Files\MongoDB\Server\<version>\data\db`
- **Log Directory**: `C:\Program Files\MongoDB\Server\<version>\log`
- **Bin Directory**: `C:\Program Files\MongoDB\Server\<version>\bin`

## Next Steps

1. Install MongoDB (follow Step 1)
2. Start MongoDB service: `net start MongoDB`
3. Install npm dependencies: `npm install`
4. Run your server: `node server.js`

You should see: "Connected successfully to MongoDB!"
