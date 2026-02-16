const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { requireAdmin } = require('../middleware/auth');

// Get all company names (public) - for registration form
router.get('/public', async (req, res) => {
  try {
    const db = getDB();
    const companyNames = await db.collection('companyNames').find({}).sort({ name: 1 }).toArray();
    res.json(companyNames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get company name by code (public) - for auto-fill in registration
router.get('/code/:code', async (req, res) => {
  try {
    const db = getDB();
    const code = req.params.code.trim();
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    const companyName = await db.collection('companyNames').findOne({ code: code });
    
    if (!companyName) {
      return res.status(404).json({ error: 'Company not found with this code' });
    }
    
    res.json(companyName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate unique 4-digit code
async function generateUniqueCode(db) {
  let code;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loop

  while (!isUnique && attempts < maxAttempts) {
    // Generate random 4-digit code (1000-9999)
    code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Check if code already exists
    const existing = await db.collection('companyNames').findOne({ code: code });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Unable to generate unique code. Please try again.');
  }

  return code;
}

// Get all company names - Admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const companyNames = await db.collection('companyNames').find({}).sort({ createdAt: -1 }).toArray();
    res.json(companyNames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unregistered companies - Admin only
// Companies in companyNames that haven't registered yet (no entry in companies or preRegistrations)
router.get('/unregistered', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    // Get all company names
    const allCompanyNames = await db.collection('companyNames').find({}).sort({ name: 1 }).toArray();
    
    // Get all registered companies (by code or name)
    const registeredCompanies = await db.collection('companies').find({}).toArray();
    const registeredCodes = new Set(registeredCompanies.map(c => c.code).filter(Boolean));
    const registeredNames = new Set(registeredCompanies.map(c => c.name?.toLowerCase().trim()).filter(Boolean));
    
    // Get all pre-registrations (by code or companyName)
    const preRegistrations = await db.collection('preRegistrations').find({}).toArray();
    const preRegCodes = new Set(preRegistrations.map(pr => pr.code).filter(Boolean));
    const preRegNames = new Set(preRegistrations.map(pr => pr.companyName?.toLowerCase().trim()).filter(Boolean));
    
    // Find unregistered companies
    const unregisteredCompanies = allCompanyNames.filter(company => {
      const companyCode = company.code?.trim();
      const companyName = company.name?.toLowerCase().trim();
      
      // Check if company is registered by code
      if (companyCode && registeredCodes.has(companyCode)) {
        return false;
      }
      
      // Check if company is registered by name
      if (companyName && registeredNames.has(companyName)) {
        return false;
      }
      
      // Check if company has pre-registration by code
      if (companyCode && preRegCodes.has(companyCode)) {
        return false;
      }
      
      // Check if company has pre-registration by name
      if (companyName && preRegNames.has(companyName)) {
        return false;
      }
      
      // Company is unregistered
      return true;
    });
    
    // Add registration status info
    const unregisteredWithStatus = unregisteredCompanies.map(company => ({
      ...company,
      isRegistered: false,
      hasPreRegistration: false
    }));
    
    res.json(unregisteredWithStatus);
  } catch (error) {
    console.error('Error fetching unregistered companies:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single company name by ID - Admin only
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const companyName = await db.collection('companyNames').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!companyName) {
      return res.status(404).json({ error: 'Company name not found' });
    }
    
    res.json(companyName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new company name - Admin only
router.post('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    // Check if company name already exists
    const existingName = await db.collection('companyNames').findOne({ 
      name: req.body.name.trim() 
    });
    if (existingName) {
      return res.status(400).json({ error: 'Company name already exists' });
    }

    // Generate unique 4-digit code
    const code = await generateUniqueCode(db);
    
    // Double-check code doesn't exist (extra safety)
    const existingCode = await db.collection('companyNames').findOne({ code: code });
    if (existingCode) {
      // Regenerate if somehow duplicate (shouldn't happen, but safety check)
      const newCode = await generateUniqueCode(db);
      code = newCode;
    }

    const companyNameData = {
      name: req.body.name.trim(),
      contactName: req.body.contactName ? req.body.contactName.trim() : '',
      mobileNumber: req.body.mobileNumber ? req.body.mobileNumber.trim() : '',
      code: code,
      notes: req.body.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let result;
    try {
      result = await db.collection('companyNames').insertOne(companyNameData);
    } catch (error) {
      // Handle MongoDB duplicate key error (E11000)
      if (error.code === 11000) {
        const duplicateField = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'code';
        if (duplicateField === 'code') {
          return res.status(400).json({ 
            error: 'This company code is already in use. Please try again.',
            duplicateCode: code
          });
        } else if (duplicateField === 'name') {
          return res.status(400).json({ 
            error: 'Company name already exists'
          });
        }
        return res.status(400).json({ 
          error: 'Duplicate entry detected. This company may already exist.',
          duplicateField: duplicateField
        });
      }
      // Re-throw other errors
      throw error;
    }
    
    const newCompanyName = await db.collection('companyNames').findOne({ 
      _id: result.insertedId 
    });
    
    res.status(201).json(newCompanyName);
  } catch (error) {
    // Handle MongoDB duplicate key error (E11000) - Database level duplicate prevention
    if (error.code === 11000) {
      const duplicateField = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'code';
      if (duplicateField === 'code') {
        return res.status(400).json({ 
          error: 'This company code is already in use. Please try again.',
          duplicateCode: code
        });
      } else if (duplicateField === 'name') {
        return res.status(400).json({ 
          error: 'Company name already exists'
        });
      }
      return res.status(400).json({ 
        error: 'Duplicate entry detected. This company may already exist.',
        duplicateField: duplicateField
      });
    }
    // Handle other errors
    console.error('Error creating company name:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import company names from array - Admin only
router.post('/import', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    // Support both old format (names array) and new format (companies array)
    let companies = [];
    if (req.body.companies && Array.isArray(req.body.companies)) {
      companies = req.body.companies;
    } else if (req.body.names && Array.isArray(req.body.names)) {
      // Legacy format: convert string array to company objects
      companies = req.body.names.map(name => ({
        name: typeof name === 'string' ? name : String(name),
        contactName: '',
        mobileNumber: ''
      }));
    } else {
      return res.status(400).json({ error: 'Companies array is required' });
    }

    const imported = [];
    const errors = [];
    const skipped = [];

    for (const company of companies) {
      // Handle both object format and string format (backward compatibility)
      const companyData = typeof company === 'string' 
        ? { name: company, contactName: '', mobileNumber: '' }
        : company;

      const trimmedName = companyData.name ? String(companyData.name).trim() : '';
      
      if (!trimmedName) {
        errors.push({ company: companyData, error: 'Empty name' });
        continue;
      }

      // Check if company name already exists
      const existing = await db.collection('companyNames').findOne({ 
        name: trimmedName 
      });
      if (existing) {
        skipped.push({ name: trimmedName, reason: 'Already exists' });
        continue;
      }

      // Handle code: use provided code from Column 4, or generate one if empty
      let code = '';
      if (companyData.code && String(companyData.code).trim()) {
        const providedCode = String(companyData.code).trim();
        // Validate code format (should be 4 digits)
        if (/^\d{4}$/.test(providedCode)) {
          // Check if code already exists
          const codeExists = await db.collection('companyNames').findOne({ code: providedCode });
          if (!codeExists) {
            code = providedCode;
          } else {
            // Code exists, generate a new one
            code = await generateUniqueCode(db);
          }
        } else {
          // Invalid code format, generate a new one
          code = await generateUniqueCode(db);
        }
      } else {
        // No code provided, generate one automatically
        code = await generateUniqueCode(db);
      }

      // Preserve empty values - don't convert empty strings to defaults
      const companyNameData = {
        name: trimmedName,
        contactName: companyData.contactName ? String(companyData.contactName).trim() : '',
        mobileNumber: companyData.mobileNumber ? String(companyData.mobileNumber).trim() : '',
        code: code,
        notes: companyData.notes ? String(companyData.notes).trim() : '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('companyNames').insertOne(companyNameData);
      imported.push(result.insertedId);
    }

    res.json({
      success: true,
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      importedIds: imported,
      skippedDetails: skipped,
      errorDetails: errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update company name - Admin only
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    // Check if name is being changed and if it conflicts with another company name
    if (req.body.name) {
      const existingName = await db.collection('companyNames').findOne({ 
        name: req.body.name.trim(),
        _id: { $ne: new ObjectId(req.params.id) }
      });
      if (existingName) {
        return res.status(400).json({ error: 'Company name already exists' });
      }
    }

    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }
    
    if (updateData.contactName !== undefined) {
      updateData.contactName = updateData.contactName ? updateData.contactName.trim() : '';
    }
    
    if (updateData.mobileNumber !== undefined) {
      updateData.mobileNumber = updateData.mobileNumber ? updateData.mobileNumber.trim() : '';
    }
    
    // Allow updating code, but validate it
    if (updateData.code !== undefined) {
      const code = String(updateData.code).trim();
      if (code) {
        // Validate code format (should be 4 digits)
        if (!/^\d{4}$/.test(code)) {
          return res.status(400).json({ error: 'Code must be exactly 4 digits' });
        }
        
        // Check if code already exists for another company
        const existingCode = await db.collection('companyNames').findOne({ 
          code: code,
          _id: { $ne: new ObjectId(req.params.id) }
        });
        if (existingCode) {
          return res.status(400).json({ error: 'Code already exists for another company' });
        }
        
        updateData.code = code;
      } else {
        // Empty code - generate a new one
        updateData.code = await generateUniqueCode(db);
      }
    }
    
    delete updateData._id; // Don't allow updating _id

    const result = await db.collection('companyNames').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Company name not found' });
    }

    const updatedCompanyName = await db.collection('companyNames').findOne({
      _id: new ObjectId(req.params.id)
    });

    res.json(updatedCompanyName);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all company names - Admin only
router.delete('/all', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('companyNames').deleteMany({});
    
    res.json({ 
      message: 'All company names deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete company name - Admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('companyNames').deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Company name not found' });
    }

    res.json({ message: 'Company name deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
