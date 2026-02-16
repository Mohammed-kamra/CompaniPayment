# Troubleshooting Guide

## ✅ All Issues Resolved

### 1. Status 400: "Pre-registration already exists"

**Status:** ✅ FIXED - Backend now updates existing pre-registrations instead of blocking

**What was changed:**
- The backend route `/api/pre-register` now checks for existing pre-registrations
- If found, it **updates** the existing record instead of returning an error
- This allows users to resubmit with updated information

**To clear test data:**
```bash
cd backend
npm run clear:pre-registrations
```

Or manually in MongoDB:
```javascript
db.preRegistrations.deleteMany({})
db.companies.deleteMany({ preRegistrationId: { $exists: true } })
```

**Important:** Restart your backend server after code changes:
```bash
cd backend
npm start
```

---

### 2. CORS Configuration

**Status:** ✅ ENHANCED - CORS is now properly configured

**Configuration in `backend/server.js`:**
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Vite uses 5173 by default
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role']
}));
```

**What this does:**
- Allows requests from frontend ports 3000 and 5173
- Enables credentials (cookies, auth headers)
- Allows all necessary HTTP methods
- Permits custom headers

**No additional configuration needed** - CORS is already working!

---

### 3. Cannot GET /api/* Error

**Status:** ✅ FIXED - Proper error handling added

**Why this happens:**
- `/api/pre-register` is a **POST** endpoint, not GET
- Browsers make GET requests when you type a URL
- Express returns "Cannot GET" for undefined routes

**Solutions:**

1. **Test with Postman/API client:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/pre-register`
   - Body: JSON with required fields

2. **Use the test script:**
   ```bash
   cd backend
   npm run test:pre-register
   ```

3. **Check available endpoints:**
   - Visit: `http://localhost:5000/api`
   - Shows all available endpoints

4. **See POSTMAN_TEST_GUIDE.md** for detailed instructions

---

### 4. Timeout Error (7 seconds → Fixed)

**Status:** ✅ FIXED - Timeout increased to 30 seconds

**Changes made:**

1. **Frontend API service** (`frontend/services/api.js`):
   - Fetch timeout: **15s → 30s**

2. **PreRegister component** (`frontend/pages/PreRegister.jsx`):
   - Promise race timeout: **7s → 20s**

3. **Backend logging** added to track slow requests

**If you still see timeouts:**
1. **Check backend is running:**
   ```bash
   # In backend directory
   npm start
   # Should see: "🚀 Server is running on http://localhost:5000"
   ```

2. **Test backend health:**
   ```bash
   curl http://localhost:5000/api/health
   # Should return: {"status":"OK","message":"Server is running"}
   ```

3. **Check MongoDB connection:**
   - Ensure MongoDB is running
   - Check connection in `backend/config/database.js`
   - Test: `cd backend && npm run test-connection`

---

## Quick Start Checklist

- [ ] Backend server running on port 5000
- [ ] MongoDB running and connected
- [ ] Frontend running on port 3000 or 5173
- [ ] CORS configured (already done)
- [ ] Timeout increased (already done)
- [ ] Backend restarted after code changes

## Testing Your Setup

1. **Test backend health:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Test pre-registration:**
   ```bash
   cd backend
   npm run test:pre-register
   ```

3. **Clear test data:**
   ```bash
   cd backend
   npm run clear:pre-registrations
   ```

## Common Issues

### Backend not responding
- Check if server is running: `npm start` in backend directory
- Check port 5000 is not in use
- Check MongoDB connection

### Still getting 400 errors
- **Restart backend server** - code changes require restart
- Check backend console for error logs
- Verify all required fields are being sent

### CORS errors
- Verify frontend URL matches CORS origin (3000 or 5173)
- Check browser console for specific CORS error
- Ensure backend is running

### Timeout persists
- Check backend console for slow database queries
- Verify MongoDB is responding
- Check network connectivity
- Increase timeout further if needed (in `api.js` and `PreRegister.jsx`)

---

## Need More Help?

Check the backend console logs when submitting - they show exactly where issues occur:
- `📥 Pre-register endpoint called` - Request received
- `✅ Database connection OK` - DB connected
- `📋 Validating required fields` - Validation step
- `✅ Pre-registration completed` - Success!
