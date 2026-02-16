# Table Synchronization Guide

## Overview

This guide explains how the three tables (Company Name Management, Registered Companies, and Unregistered Companies) are synchronized across your application.

## Architecture

### Current Tech Stack
- **Backend**: Node.js/Express
- **Database**: MongoDB
- **Frontend**: React

### Database Structure

All three tables read from the same MongoDB collections:

1. **`companyNames` Collection**: 
   - Used by "Company Name Management" table
   - Used by "Unregistered Companies" table (filters for unregistered ones)

2. **`companies` Collection**:
   - Used by "Registered Companies" table
   - Contains companies that have completed registration

### How Synchronization Works

#### 1. React Context Provider (`CompaniesDataContext`)

A centralized context manages all company data:

```javascript
// Location: frontend/contexts/CompaniesDataContext.jsx
```

**Features:**
- Single source of truth for all company data
- Automatic refresh of all tables after any mutation (create/update/delete)
- Shared loading and error states
- Optimized with React `useCallback` to prevent unnecessary re-renders

#### 2. Automatic Synchronization

When you perform an action in any table:

1. **Company Name Management** (Add/Edit/Delete):
   - Calls `createCompanyName()`, `updateCompanyName()`, or `deleteCompanyName()`
   - Context automatically calls `refreshAll()` which:
     - Refreshes `companyNames` collection
     - Refreshes `companies` collection  
     - Refreshes `unregisteredCompanies` (calculated from companyNames)

2. **Registered Companies** (Delete):
   - Calls `deleteCompany()`
   - Context automatically refreshes all three tables

3. **Unregistered Companies** (Delete):
   - Calls `deleteCompanyName()`
   - Context automatically refreshes all three tables

#### 3. Component Integration

All three components use the same context:

```javascript
// In each component
const { 
  companies,           // Registered companies
  companyNames,        // All company names
  unregisteredCompanies, // Unregistered companies
  createCompanyName,   // Auto-refreshes all tables
  updateCompanyName,   // Auto-refreshes all tables
  deleteCompanyName,   // Auto-refreshes all tables
  deleteCompany,       // Auto-refreshes all tables
  refreshAll           // Manual refresh if needed
} = useCompaniesData()
```

## Backend API Structure

### MongoDB Collections

#### `companyNames` Collection
```javascript
{
  _id: ObjectId,
  name: String,
  code: String,
  contactName: String,
  mobileNumber: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### `companies` Collection
```javascript
{
  _id: ObjectId,
  name: String,
  code: String,
  registrantName: String,
  phoneNumber: String,
  address: String,
  status: String, // 'approved', 'pending', etc.
  paid: Boolean,
  spent: Boolean,
  groupId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

All endpoints are in `backend/routes/`:

1. **Company Names** (`companyNames.js`):
   - `GET /api/company-names` - Get all (admin)
   - `GET /api/company-names/unregistered` - Get unregistered
   - `POST /api/company-names` - Create
   - `PUT /api/company-names/:id` - Update
   - `DELETE /api/company-names/:id` - Delete

2. **Companies** (`companies.js`):
   - `GET /api/companies` - Get all (accounting/admin)
   - `POST /api/companies` - Create
   - `PUT /api/companies/:id` - Update
   - `DELETE /api/companies/:id` - Delete

## How It Works in Practice

### Example: Adding a Company Name

1. User adds company in "Company Name Management"
2. Component calls `createCompanyName(data)`
3. Context:
   - Calls `companyNamesAPI.create(data)`
   - After success, calls `refreshAll()`
   - `refreshAll()` fetches:
     - All company names → Updates "Company Name Management" table
     - All companies → Updates "Registered Companies" table
     - Unregistered companies → Updates "Unregistered Companies" table
4. All three tables update automatically without manual refresh

### Example: Deleting a Company

1. User deletes company in "Registered Companies"
2. Component calls `deleteCompany(id)`
3. Context:
   - Calls `companiesAPI.delete(id)`
   - After success, calls `refreshAll()`
   - All three tables refresh automatically

## Benefits

✅ **No Manual Refresh**: Tables update automatically after any action
✅ **Consistent Data**: All tables always show the latest data
✅ **Single Source of Truth**: Context manages all data centrally
✅ **Optimized Performance**: Uses React `useCallback` to prevent unnecessary re-renders
✅ **Error Handling**: Centralized error state management

## Migration Notes (If Using PHP/MySQL)

If you're planning to migrate to PHP/MySQL, here's the equivalent structure:

### MySQL Database Structure

```sql
-- Company Names Table
CREATE TABLE company_names (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE,
    contact_name VARCHAR(255),
    mobile_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Companies Table (Registered)
CREATE TABLE companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10),
    registrant_name VARCHAR(255),
    phone_number VARCHAR(20),
    address TEXT,
    status ENUM('approved', 'pending', 'rejected') DEFAULT 'pending',
    paid BOOLEAN DEFAULT FALSE,
    spent BOOLEAN DEFAULT FALSE,
    group_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(id)
);
```

### PHP Backend Example

```php
<?php
// api/company-names.php

header('Content-Type: application/json');

// Database connection
$conn = new mysqli($host, $user, $password, $database);

// Create Company Name
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'];
    $code = $_POST['code'];
    $contactName = $_POST['contactName'];
    $mobileNumber = $_POST['mobileNumber'];
    
    $stmt = $conn->prepare("INSERT INTO company_names (name, code, contact_name, mobile_number) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $code, $contactName, $mobileNumber);
    
    if ($stmt->execute()) {
        // Return success - frontend will refresh all tables
        echo json_encode(['success' => true, 'id' => $conn->insert_id]);
    } else {
        echo json_encode(['error' => 'Failed to create company name']);
    }
}

// Update Company Name
if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    parse_str(file_get_contents("php://input"), $data);
    $id = $data['id'];
    $name = $data['name'];
    // ... other fields
    
    $stmt = $conn->prepare("UPDATE company_names SET name = ?, code = ? WHERE id = ?");
    $stmt->bind_param("ssi", $name, $code, $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Failed to update company name']);
    }
}

// Delete Company Name
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $id = $_GET['id'];
    
    $stmt = $conn->prepare("DELETE FROM company_names WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Failed to delete company name']);
    }
}
?>
```

## Testing Synchronization

To test that synchronization works:

1. Open "Company Name Management" in one tab
2. Open "Registered Companies" in another tab
3. Open "Unregistered Companies" in a third tab
4. Add/Edit/Delete a company in any tab
5. All three tables should update automatically

## Troubleshooting

### Tables Not Updating

1. Check browser console for errors
2. Verify `CompaniesDataProvider` wraps your App component
3. Ensure components use `useCompaniesData()` hook
4. Check network tab to see if API calls are successful

### Performance Issues

- The context uses `useCallback` to optimize re-renders
- Only components using the context will re-render when data changes
- If you have many components, consider using React.memo() for optimization

## Future Enhancements

- **WebSocket Support**: For real-time updates across multiple browser sessions
- **Optimistic Updates**: Update UI immediately before API confirmation
- **Caching**: Add caching layer to reduce API calls
- **Pagination**: For large datasets
