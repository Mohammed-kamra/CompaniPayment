const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { requireAdmin } = require('../middleware/auth');

// Mount user routes
router.use('/:companyId/users', require('./companyUsers'));

// Get all companies - Admin only (for management)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const companies = await db.collection('companies').find({}).sort({ createdAt: -1 }).toArray();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all companies - Public (only approved companies) or Accounting (all companies)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const userRole = req.headers['x-user-role'];
    
    // Accounting users can see all companies, public users only see approved
    const query = (userRole === 'accounting' || userRole === 'admin') 
      ? {} 
      : { status: 'approved' };
    
    const companies = await db.collection('companies')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get public queue - Only returns safe public data (name, registrantName, paid status)
router.get('/public-queue', async (req, res) => {
  try {
    const db = getDB();
    
    // Only return approved companies with limited fields
    const companies = await db.collection('companies')
      .find({ status: 'approved' })
      .sort({ createdAt: 1 }) // Sort by registration order (oldest first)
      .project({
        name: 1,
        registrantName: 1,
        paid: 1,
        createdAt: 1
      })
      .toArray();
    
    // Map to ensure consistent field names
    const publicQueue = companies.map(company => ({
      name: company.name || '',
      userName: company.registrantName || '',
      paid: company.paid || false,
      createdAt: company.createdAt
    }));
    
    res.json(publicQueue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single company by ID - Public (only if approved)
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Only return approved companies to public, admin can see all
    const isAdmin = req.headers['x-user-role'] === 'admin';
    if (!isAdmin && company.status !== 'approved') {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new company - Public registration
router.post('/', async (req, res) => {
  try {
    const db = getDB();
    
    // Validate required fields - check for empty strings too
    const missingFields = [];
    if (!req.body.name || String(req.body.name).trim() === '') {
      missingFields.push('name');
    }
    if (!req.body.phoneNumber || String(req.body.phoneNumber).trim() === '') {
      missingFields.push('phoneNumber');
    }
    if (!req.body.address || String(req.body.address).trim() === '') {
      missingFields.push('address');
    }
    
    if (missingFields.length > 0) {
      console.error('❌ Validation failed - missing fields:', missingFields);
      console.error('❌ Request body:', {
        name: req.body.name,
        phoneNumber: req.body.phoneNumber ? '***' : undefined,
        address: req.body.address ? '***' : undefined,
        nameType: typeof req.body.name,
        phoneNumberType: typeof req.body.phoneNumber,
        addressType: typeof req.body.address
      });
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}. Please fill in all required fields.`,
        missingFields: missingFields
      });
    }
    
    // Log received data for debugging
    console.log('📥 Received registration request:', {
      name: req.body.name,
      phoneNumber: req.body.phoneNumber ? '***' : undefined,
      address: req.body.address ? '***' : undefined,
      groupId: req.body.groupId,
      hasCompanyId: !!req.body.companyId,
      otherFields: Object.keys(req.body).filter(k => !['name', 'phoneNumber', 'address', 'groupId', 'companyId'].includes(k))
    });
    
    // Detailed validation logging
    console.log('📋 Validation check:', {
      hasName: !!req.body.name,
      hasPhoneNumber: !!req.body.phoneNumber,
      hasAddress: !!req.body.address,
      nameValue: req.body.name,
      phoneNumberLength: req.body.phoneNumber ? req.body.phoneNumber.length : 0,
      addressLength: req.body.address ? req.body.address.length : 0,
      groupIdValue: req.body.groupId,
      groupIdValid: req.body.groupId ? ObjectId.isValid(req.body.groupId) : false
    });

    // Check if company name + code combination already exists
    // Note: We need to get the code from companyNames collection based on company name
    let companyCode = null;
    if (req.body.name) {
      const companyNameEntry = await db.collection('companyNames').findOne({ 
        name: req.body.name.trim() 
      });
      if (companyNameEntry) {
        companyCode = companyNameEntry.code;
      }
    }
    
    // If we have a code, check for duplicate company name + code
    if (companyCode) {
      const existingCompanyByNameAndCode = await db.collection('companies').findOne({ 
        name: req.body.name,
        code: companyCode
      });
      
      // If company exists by name+code and has preRegistrationId, update it instead of creating new one
      if (existingCompanyByNameAndCode && existingCompanyByNameAndCode.preRegistrationId) {
        // Update existing company from pre-registration, preserving registrantName
        const updateData = {
          name: req.body.name,
          email: req.body.email || '',
          phoneNumber: req.body.phoneNumber,
          address: req.body.address,
          logo: req.body.logo || existingCompanyByNameAndCode.logo || '',
          description: req.body.description || existingCompanyByNameAndCode.description || '',
          businessType: req.body.businessType || existingCompanyByNameAndCode.businessType || '',
          registrationNumber: req.body.registrationNumber || existingCompanyByNameAndCode.registrationNumber || '',
          taxId: req.body.taxId || existingCompanyByNameAndCode.taxId || '',
          website: req.body.website || existingCompanyByNameAndCode.website || '',
          registrationFee: req.body.registrationFee || existingCompanyByNameAndCode.registrationFee || 0,
          updatedAt: new Date()
        };
        
        // Preserve registrantName if it exists
        if (existingCompanyByNameAndCode.registrantName) {
          updateData.registrantName = existingCompanyByNameAndCode.registrantName;
        }
        
        // Preserve groupId if it exists
        if (existingCompanyByNameAndCode.groupId) {
          updateData.groupId = existingCompanyByNameAndCode.groupId;
        }
        
        // Preserve code
        updateData.code = existingCompanyByNameAndCode.code;
        
        await db.collection('companies').updateOne(
          { _id: existingCompanyByNameAndCode._id },
          { $set: updateData }
        );
        
        const updatedCompany = await db.collection('companies').findOne({ 
          _id: existingCompanyByNameAndCode._id 
        });
        
        return res.status(200).json(updatedCompany);
      }
      
      if (existingCompanyByNameAndCode) {
        return res.status(400).json({ error: 'A company with this name and code has already been registered. Each company name + code combination can only be registered once.' });
      }
    }

    // Check if company is already in a group (if groupId is provided)
    if (req.body.groupId) {
      // Validate groupId is a valid ObjectId format
      if (!ObjectId.isValid(req.body.groupId)) {
        return res.status(400).json({ error: 'Invalid group ID format' });
      }
      
      const group = await db.collection('groups').findOne({ 
        _id: new ObjectId(req.body.groupId) 
      });
      if (!group) {
        return res.status(400).json({ error: 'Selected group not found' });
      }
      
      // Check if group is closed
      if (group.isClosed) {
        return res.status(400).json({ error: 'This group is closed and no longer accepting registrations.' });
      }
      
      // Check if group has available slots
      const registeredCount = group.registeredCount || group.companies?.length || 0;
      const maxCompanies = group.maxCompanies || 0;
      if (maxCompanies > 0 && registeredCount >= maxCompanies) {
        // Close the group if it reaches capacity
        await db.collection('groups').updateOne(
          { _id: new ObjectId(req.body.groupId) },
          { $set: { isClosed: true, updatedAt: new Date() } }
        );
        return res.status(400).json({ error: 'This group is full and no longer accepting registrations.' });
      }
      
      // Check if company with same name and code is already in this group
      if (companyCode) {
        const companyInGroup = await db.collection('companies').findOne({
          name: req.body.name,
          code: companyCode,
          groupId: req.body.groupId
        });
        if (companyInGroup) {
          return res.status(400).json({ error: 'This company name with this code is already registered in this group.' });
        }
      }
    }

    // Get company code from companyNames collection if not already retrieved
    if (!companyCode && req.body.name) {
      const companyNameEntry = await db.collection('companyNames').findOne({ 
        name: req.body.name.trim() 
      });
      if (companyNameEntry) {
        companyCode = companyNameEntry.code;
      }
    }
    
    // Check for duplicate company code BEFORE insert
    if (companyCode && companyCode.trim() !== '') {
      const existingCompanyWithCode = await db.collection('companies').findOne({
        code: companyCode.trim()
      });
      
      if (existingCompanyWithCode) {
        return res.status(400).json({ 
          error: 'This company is already registered.',
          duplicateCode: companyCode,
          existingCompany: existingCompanyWithCode.name
        });
      }
    }
    
    const companyData = {
      name: req.body.name,
      code: companyCode || '', // Store the company-specific code
      email: req.body.email || '', // Email is optional
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      logo: req.body.logo || '',
      description: req.body.description || '',
      businessType: req.body.businessType || '',
      registrationNumber: req.body.registrationNumber || '',
      taxId: req.body.taxId || '',
      website: req.body.website || '',
      groupId: req.body.groupId || '',
      status: 'approved', // Auto-approve so it shows immediately in the list
      paymentStatus: 'pending',
      registrationFee: req.body.registrationFee || 0,
      spent: false, // Track if money has been spent
      paid: false, // Track if payment has been made
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let result;
    try {
      result = await db.collection('companies').insertOne(companyData);
    } catch (error) {
      // Handle MongoDB duplicate key error (E11000)
      if (error.code === 11000) {
        // Extract the field that caused the duplicate
        const duplicateField = error.keyPattern ? Object.keys(error.keyPattern)[0] : 'code';
        return res.status(400).json({ 
          error: 'This company is already registered.',
          duplicateField: duplicateField,
          duplicateValue: companyCode || req.body.name
        });
      }
      // Re-throw other errors
      throw error;
    }
    
    // If groupId is provided, add company to group's companies array and increment count
    if (req.body.groupId) {
      const group = await db.collection('groups').findOne({ 
        _id: new ObjectId(req.body.groupId) 
      });
      
      const registeredCount = (group.registeredCount || group.companies?.length || 0) + 1;
      const maxCompanies = group.maxCompanies || 0;
      const isClosed = maxCompanies > 0 && registeredCount >= maxCompanies;
      
      await db.collection('groups').updateOne(
        { _id: new ObjectId(req.body.groupId) },
        { 
          $push: { companies: result.insertedId },
          $set: { 
            registeredCount: registeredCount,
            isClosed: isClosed,
            updatedAt: new Date() 
          }
        }
      );
    }

    const newCompany = await db.collection('companies').findOne({ 
      _id: result.insertedId 
    });
    
    res.status(201).json(newCompany);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update company - Admin only
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    delete updateData._id; // Don't allow updating _id

    const result = await db.collection('companies').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const updatedCompany = await db.collection('companies').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedCompany);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve company registration - Admin only
router.post('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('companies').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          status: 'approved',
          approvedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const updatedCompany = await db.collection('companies').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedCompany);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject company registration - Admin only
router.post('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('companies').updateOne(
      { _id: new ObjectId(req.params.id) },
      { 
        $set: { 
          status: 'rejected',
          rejectionReason: req.body.reason || '',
          rejectedAt: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const updatedCompany = await db.collection('companies').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedCompany);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update spent/paid status - Public (for companies list)
router.patch('/:id/status', async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const { spent, paid } = req.body;
    
    // Validate that at least one field is being updated
    if (spent === undefined && paid === undefined) {
      return res.status(400).json({ error: 'At least one field (spent or paid) must be provided' });
    }
    
    // Validate ObjectId format
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid company ID format' });
    }
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (spent !== undefined) {
      updateData.spent = Boolean(spent); // Ensure it's a boolean
    }
    if (paid !== undefined) {
      updateData.paid = Boolean(paid); // Ensure it's a boolean
    }

    console.log('Updating company status:', {
      id: req.params.id,
      updateData,
      spent,
      paid
    });

    const result = await db.collection('companies').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (result.modifiedCount === 0) {
      console.warn('Company found but no changes were made:', req.params.id);
    }

    const updatedCompany = await db.collection('companies').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!updatedCompany) {
      return res.status(404).json({ error: 'Company not found after update' });
    }
    
    console.log('Company status updated successfully:', {
      id: updatedCompany._id,
      spent: updatedCompany.spent,
      paid: updatedCompany.paid
    });
    
    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company status:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Delete company - Admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('companies').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
