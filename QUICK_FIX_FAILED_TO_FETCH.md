# Quick Fix: "Failed to fetch" Error

## What This Error Means

"Failed to fetch" means your **frontend cannot connect to the backend server**. This is a network connectivity issue.

## Most Common Causes

### 1. Backend Server Not Running ⚠️ (Most Likely)

**Check:**
- Is the backend server running?
- Do you see `🚀 Server is running on http://localhost:5000` in the backend console?

**Fix:**
```bash
cd backend
npm start
```

You should see:
```
✅ Connected to MongoDB
🚀 Server is running on http://localhost:5000
```

### 2. Wrong Port or URL

**Check:**
- Frontend is trying to connect to: `http://localhost:5000/api`
- Backend should be running on port: `5000`

**Verify backend is accessible:**
```bash
# In browser or terminal
curl http://localhost:5000/api/health
```

Should return: `{"status":"OK","message":"Server is running"}`

### 3. CORS Issues (Less Likely - Already Configured)

If you see CORS errors in browser console:
- Check `backend/server.js` - CORS is configured for ports 3000 and 5173
- Make sure your frontend is running on one of these ports

### 4. MongoDB Not Running

**Check:**
- Is MongoDB running?
- Backend needs MongoDB to start

**Fix:**
- Start MongoDB service
- Then restart backend: `cd backend && npm start`

## Step-by-Step Troubleshooting

### Step 1: Verify Backend is Running

```bash
# Terminal 1 - Start backend
cd backend
npm start
```

**Expected output:**
```
✅ Connected to MongoDB
🚀 Server is running on http://localhost:5000
📊 API endpoints available at http://localhost:5000/api
```

### Step 2: Test Backend Health

**Option A - Browser:**
Open: `http://localhost:5000/api/health`

**Option B - Terminal:**
```bash
curl http://localhost:5000/api/health
```

**Expected:** `{"status":"OK","message":"Server is running"}`

### Step 3: Check Frontend Port

- Vite default: `5173`
- React default: `3000`

Make sure CORS in `backend/server.js` includes your frontend port:
```javascript
origin: ['http://localhost:3000', 'http://localhost:5173']
```

### Step 4: Check Browser Console

Open browser DevTools (F12) and look for:
- Network tab: See if request is being made
- Console tab: See exact error message

## Quick Test Script

Create `test-backend.js` in backend folder:

```javascript
const fetch = require('node-fetch');

fetch('http://localhost:5000/api/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend is running:', data))
  .catch(err => console.error('❌ Backend is NOT running:', err.message));
```

Run: `node test-backend.js`

## Still Not Working?

1. **Check firewall/antivirus** - May be blocking localhost connections
2. **Try different browser** - Rule out browser issues
3. **Check if port 5000 is in use:**
   ```bash
   # Windows
   netstat -ano | findstr :5000
   
   # Mac/Linux
   lsof -i :5000
   ```
4. **Restart both frontend and backend**
5. **Check backend console for errors** when you submit the form

## Expected Behavior

When working correctly:
1. Backend console shows: `📥 Pre-register endpoint called`
2. Frontend receives response (success or error)
3. No "Failed to fetch" error

## Need More Help?

Check backend console logs - they show exactly what's happening:
- `📥 Pre-register endpoint called` = Request received ✅
- No logs = Backend not receiving request ❌
