# Quick MongoDB Installation Guide

## MongoDB is NOT installed on your system

You need to install MongoDB before you can use `mongodb://localhost:27017`

## Option 1: Install MongoDB Community Server (Local)

### Step 1: Download
1. Go to: **https://www.mongodb.com/try/download/community**
2. Select:
   - **Version**: 7.0 (or latest)
   - **Platform**: Windows
   - **Package**: MSI
3. Click **"Download"**

### Step 2: Install
1. Run the downloaded `.msi` file
2. Choose **"Complete"** installation
3. ✅ **IMPORTANT**: Check **"Install MongoDB as a Service"**
4. Select **"Run service as Network Service user"** (default)
5. ✅ Check **"Install MongoDB Compass"** (optional GUI tool)
6. Click **"Install"**

### Step 3: Start MongoDB
After installation, MongoDB service should start automatically.

**If not, run (as Administrator):**
```powershell
net start MongoDB
```

### Step 4: Verify
```powershell
# Test connection
cd backend
npm run test-connection
```

---

## Option 2: Use MongoDB Atlas (Cloud - No Installation Needed) ⚡

**Easiest option - no installation required!**

1. Go to: **https://www.mongodb.com/cloud/atlas/register**
2. Create a **free account**
3. Create a **free cluster** (M0 - Free tier)
4. Click **"Connect"** → **"Connect your application"**
5. Copy the connection string
6. Update `backend/server.js`:
   ```javascript
   const uri = 'mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mydatabase?retryWrites=true&w=majority';
   ```
   Replace `<password>` with your database user password

**No installation needed - works immediately!**

---

## After Installation

Once MongoDB is installed and running:

```powershell
# From root directory
npm start

# Or test connection
cd backend
npm run test-connection
```

You should see: **"✅ SUCCESS! Connected to MongoDB!"**
