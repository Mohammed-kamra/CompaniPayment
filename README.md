# Project Structure

**Developed by Mohammed Kamaran**

This project is organized into separate frontend and backend directories.

## 📁 Directory Structure

```
c:\src\
├── frontend\          # React frontend application
│   ├── components\    # React components
│   ├── pages\         # Page components
│   ├── locales\       # i18n translation files
│   ├── App.jsx
│   ├── main.jsx
│   ├── i18n.js
│   └── package.json
│
└── backend\           # Node.js backend with MongoDB
    ├── server.js
    ├── test-connection.js
    └── package.json
```

## 🚀 Getting Started

### Frontend Setup

1. Navigate to frontend directory:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start development server:
   ```powershell
   npm run dev
   ```
   Frontend will run on http://localhost:3000

### Backend Setup

1. Navigate to backend directory:
   ```powershell
   cd backend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Make sure MongoDB is running (see `LOCAL_MONGODB_SETUP.md`)

4. Test MongoDB connection:
   ```powershell
   npm run test-connection
   ```

5. Start backend server:
   ```powershell
   npm start
   ```

## 🔗 MongoDB Connection

The backend is configured to connect to local MongoDB:
```
mongodb://localhost:27017
```

See `backend/LOCAL_MONGODB_SETUP.md` for installation and setup instructions.

## 📝 Notes

- Frontend uses Vite + React
- Backend uses Node.js + MongoDB
- Each directory has its own `package.json` for independent dependency management

---

**Developer:** Mohammed Kamaran
