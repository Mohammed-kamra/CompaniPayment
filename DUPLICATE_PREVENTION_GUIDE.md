# Duplicate Company Code Prevention Guide

## Overview

This guide explains how duplicate company registrations are prevented using MongoDB unique indexes and Node.js validation logic.

## Implementation

### 1. MongoDB Unique Index Creation

#### Run the Index Creation Script

```bash
# From project root
node backend/scripts/createIndexes.js
```

This script creates:
- **Unique index on `companies.code`**: Prevents duplicate company codes in the companies collection
- **Compound unique index on `companies (name, code)`**: Additional validation layer
- **Unique index on `companyNames.code`**: Prevents duplicate codes in company names
- **Unique index on `companyNames.name`**: Prevents duplicate company names

#### Index Details

```javascript
// Companies Collection
db.companies.createIndex(
  { code: 1 },
  { 
    unique: true,
    name: 'code_unique_index',
    partialFilterExpression: { code: { $exists: true, $ne: '' } },
    background: true
  }
);

// Company Names Collection
db.companyNames.createIndex(
  { code: 1 },
  { 
    unique: true,
    name: 'code_unique_index',
    partialFilterExpression: { code: { $exists: true, $ne: '' } },
    background: true
  }
);
```

**Key Features:**
- `partialFilterExpression`: Only enforces uniqueness for non-empty codes
- `background: true`: Creates index without blocking other operations
- Allows multiple empty/null codes (since they're not in the filter)

### 2. Node.js Backend Validation

#### Pre-Insert Check

Before inserting a company, the backend checks for duplicates:

```javascript
// In backend/routes/companies.js

// Check for duplicate company code BEFORE insert
if (companyCode && companyCode.trim() !== '') {
  const existingCompanyWithCode = await db.collection('companies').findOne({
    code: companyCode.trim()
  });
  
  if (existingCompanyWithCode) {
    return res.status(400).json({ 
      error: 'This company is already registered.',
      duplicateCode: companyCode
    });
  }
}
```

#### MongoDB Error Handling

If a duplicate somehow gets past the pre-check, MongoDB will catch it:

```javascript
try {
  result = await db.collection('companies').insertOne(companyData);
} catch (error) {
  // Handle MongoDB duplicate key error (E11000)
  if (error.code === 11000) {
    return res.status(400).json({ 
      error: 'This company is already registered.',
      duplicateCode: companyCode
    });
  }
  throw error;
}
```

### 3. Error Messages

When a duplicate is detected, the API returns:

```json
{
  "error": "This company is already registered.",
  "duplicateCode": "1234",
  "existingCompany": "Company Name"
}
```

### 4. Frontend Synchronization

The React Context (`CompaniesDataContext`) automatically refreshes all tables after any mutation:

```javascript
// When a company is created/updated/deleted
const createCompany = useCallback(async (data) => {
  try {
    const result = await companiesAPI.create(data)
    // Automatically refreshes all three tables
    await refreshAll()
    return result
  } catch (err) {
    // Error handling - duplicate errors are caught here
    setError(err.message || 'Failed to create company')
    throw err
  }
}, [refreshAll])
```

## How It Works

### Flow Diagram

```
User Action (Create Company)
    ↓
Frontend: companiesAPI.create(data)
    ↓
Backend: Check for duplicate code (Pre-validation)
    ↓
    ├─→ Duplicate Found? → Return Error: "This company is already registered."
    └─→ No Duplicate? → Continue
        ↓
    MongoDB: insertOne(companyData)
        ↓
        ├─→ Duplicate Key Error (E11000)? → Return Error: "This company is already registered."
        └─→ Success? → Return Company Data
            ↓
    Frontend Context: refreshAll()
        ↓
    All Three Tables Update Automatically
```

### Two-Layer Protection

1. **Application Layer** (Node.js):
   - Pre-insert check using `findOne()`
   - Returns user-friendly error message
   - Prevents unnecessary database operations

2. **Database Layer** (MongoDB):
   - Unique index enforces constraint at database level
   - Catches any duplicates that bypass application check
   - Guarantees data integrity

## Testing

### Test Duplicate Prevention

1. **Create a company** with code "1234"
2. **Try to create another company** with the same code "1234"
3. **Expected Result**: Error message "This company is already registered."

### Test Table Synchronization

1. Open all three tables in different tabs
2. Create a company in "Company Name Management"
3. All three tables should update automatically
4. Try to create a duplicate
5. Error should appear, and tables should remain unchanged

## Manual Index Creation (Alternative)

If you prefer to create indexes manually in MongoDB shell:

```javascript
// Connect to MongoDB
use sellerbuyer

// Create unique index on companies.code
db.companies.createIndex(
  { code: 1 },
  { 
    unique: true,
    partialFilterExpression: { code: { $exists: true, $ne: '' } }
  }
)

// Create compound unique index
db.companies.createIndex(
  { name: 1, code: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      code: { $exists: true, $ne: '' },
      name: { $exists: true, $ne: '' }
    }
  }
)

// Create unique index on companyNames.code
db.companyNames.createIndex(
  { code: 1 },
  { 
    unique: true,
    partialFilterExpression: { code: { $exists: true, $ne: '' } }
  }
)

// Create unique index on companyNames.name
db.companyNames.createIndex(
  { name: 1 },
  { unique: true }
)
```

## Troubleshooting

### Index Already Exists Error

If you get "Index already exists" error:
- The index was already created
- You can drop and recreate it using the script
- Or use `dropIndex()` then `createIndex()`

### Duplicate Still Getting Through

1. Check if index was created: `db.companies.getIndexes()`
2. Verify index is unique: Look for `unique: true` in index definition
3. Check if code field is empty (empty codes are allowed by partial filter)

### Error Not Showing in Frontend

1. Check browser console for API errors
2. Verify error handling in `CompaniesDataContext`
3. Check network tab to see actual API response

## Benefits

✅ **Database-Level Protection**: MongoDB enforces uniqueness even if application logic fails
✅ **Application-Level Validation**: User-friendly error messages before database operation
✅ **Automatic Sync**: All tables update automatically after successful creation
✅ **Performance**: Indexes make duplicate checks fast
✅ **Data Integrity**: Guaranteed no duplicate company codes in database
