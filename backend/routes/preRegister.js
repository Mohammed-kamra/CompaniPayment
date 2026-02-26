const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// Create pre-registration - Public
router.post('/', async (req, res) => {
  const startTime = Date.now();
  console.log('📥 Pre-register endpoint called at:', new Date().toISOString());
  
  try {
    const db = getDB();
    if (!db) {
      console.error('❌ Database connection failed');
      return res.status(500).json({ error: 'Database connection failed' });
    }
    console.log('✅ Database connection OK');
    
    // Check if codes are active (default to true if not set)
    const settings = await db.collection('settings').findOne({ type: 'website' });
    const codesActive = settings?.codesActive !== undefined ? settings.codesActive : true;
    
    console.log('📋 Pre-register request:', {
      codesActive: codesActive,
      companyName: req.body.companyName,
      hasCode: !!req.body.code,
      codeValue: req.body.code ? '***' : undefined
    });
    
    // Validate required fields
    console.log('📋 Validating required fields:', {
      hasName: !!req.body.name,
      hasMobileNumber: !!req.body.mobileNumber,
      hasCompanyName: !!req.body.companyName,
      name: req.body.name,
      mobileNumber: req.body.mobileNumber ? '***' : undefined,
      companyName: req.body.companyName
    });
    
    if (!req.body.name || !req.body.mobileNumber || !req.body.companyName) {
      const missingFields = [];
      if (!req.body.name) missingFields.push('name');
      if (!req.body.mobileNumber) missingFields.push('mobileNumber');
      if (!req.body.companyName) missingFields.push('companyName');
      console.error('❌ Missing required fields:', missingFields);
      return res.status(400).json({ 
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields
      });
    }
    
    // Only require code if codes are explicitly enabled
    // When codes are disabled (false) or undefined, code is optional
    let code = '';
    if (codesActive === true) {
      // Codes are enabled - code is required
      if (!req.body.code || String(req.body.code).trim() === '') {
        return res.status(400).json({ error: 'Code is required when codes are enabled' });
      }
      code = String(req.body.code).trim();
    } else {
      // Codes are disabled - code is optional, use empty string if not provided
      code = req.body.code ? String(req.body.code).trim() : '';
    }

    // Validate groupId if provided
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
        return res.status(400).json({ error: 'This group is full and no longer accepting registrations.' });
      }

      // Check if company with same name and code is already in this group (only if code is provided)
      if (code) {
      const existingCompanyInGroup = await db.collection('companies').findOne({
        name: req.body.companyName,
          code: code,
        groupId: req.body.groupId
      });
      if (existingCompanyInGroup) {
        return res.status(400).json({ error: 'This company name with this code is already registered in this group.' });
        }
      }
    }

    // Check if company name + code combination already exists (only if code is provided)
    if (code) {
    const existingCompanyByNameAndCode = await db.collection('companies').findOne({
      name: req.body.companyName,
        code: code
    });
    if (existingCompanyByNameAndCode) {
      return res.status(400).json({ error: 'This company name with this code has already been registered. Each company name + code combination can only be registered once.' });
    }
    
    // Check if company name + code already exists in pre-registrations
    const existingPreRegByNameAndCode = await db.collection('preRegistrations').findOne({ 
      companyName: req.body.companyName,
        code: code
    });
    if (existingPreRegByNameAndCode) {
      // Check if this pre-registration has already been used to register a company
      const existingCompany = await db.collection('companies').findOne({
        name: req.body.companyName,
          code: code
      });
      if (existingCompany) {
        return res.status(400).json({ error: 'This company name with this code has already been registered. Each company name + code combination can only be registered once.' });
      }
      
      // Update existing pre-registration instead of blocking (allow user to continue)
      const updateData = {
        name: req.body.name,
        mobileNumber: req.body.mobileNumber,
        companyName: req.body.companyName,
        code: code,
        groupId: req.body.groupId || existingPreRegByNameAndCode.groupId || '',
        status: 'pending',
        updatedAt: new Date()
      };
      
      await db.collection('preRegistrations').updateOne(
        { _id: existingPreRegByNameAndCode._id },
        { $set: updateData }
      );
      
      const updatedPreRegistration = await db.collection('preRegistrations').findOne({ 
        _id: existingPreRegByNameAndCode._id 
      });
      
      // Also update the company entry if it exists
      // Try to find an existing company linked to this pre-registration
      const existingCompanyEntry = await db.collection('companies').findOne({
        name: req.body.companyName,
        code: code,
        // preRegistrationId is stored as a string in companies collection
        preRegistrationId: existingPreRegByNameAndCode._id.toString()
      });
      
      let companyDoc = null;
      let companyInsertResult = null;
      
      if (existingCompanyEntry) {
        // Update existing linked company (common case when not deleted)
        await db.collection('companies').updateOne(
          { _id: existingCompanyEntry._id },
          { 
            $set: {
              registrantName: req.body.name,
              phoneNumber: req.body.mobileNumber,
              code: code,
              groupId: req.body.groupId || existingCompanyEntry.groupId || '',
              updatedAt: new Date()
            }
          }
        );
        
        companyDoc = await db.collection('companies').findOne({
          _id: existingCompanyEntry._id
        });
      } else {
        // No linked company found (it might have been deleted earlier) – create a new one
        const companyDataForUpdateFlow = {
          name: req.body.companyName,
          registrantName: req.body.name,
          email: req.body.mobileNumber + '@temp.com',
          phoneNumber: req.body.mobileNumber,
          code: code || '',
          address: '',
          logo: '',
          description: '',
          businessType: '',
          registrationNumber: '',
          taxId: '',
          website: '',
          groupId: req.body.groupId || '',
          status: 'approved',
          paymentStatus: 'pending',
          registrationFee: 0,
          spent: false,
          paid: false,
          preRegistrationId: updatedPreRegistration._id.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        try {
          // Respect duplicate-code protection
          if (code && code.trim() !== '') {
            const existingCompanyWithCode = await db.collection('companies').findOne({
              code: code.trim()
            });
            
            if (existingCompanyWithCode) {
              console.warn('⚠️ Duplicate company code detected while recreating company from pre-registration:', code);
            } else {
              companyInsertResult = await db.collection('companies').insertOne(companyDataForUpdateFlow);
            }
          } else {
            // Codes disabled or empty – insert without code uniqueness
            companyInsertResult = await db.collection('companies').insertOne(companyDataForUpdateFlow);
          }
          
          // If we created a company, update the group counters as in the main flow
          if (companyInsertResult && companyInsertResult.insertedId && req.body.groupId && req.body.groupId.trim() !== '') {
            try {
              const group = await db.collection('groups').findOne({ 
                _id: new ObjectId(req.body.groupId) 
              });
              
              if (group) {
                const registeredCount = (group.registeredCount || group.companies?.length || 0) + 1;
                const maxCompanies = group.maxCompanies || 0;
                const isClosed = maxCompanies > 0 && registeredCount >= maxCompanies;
                
                await db.collection('groups').updateOne(
                  { _id: new ObjectId(req.body.groupId) },
                  { 
                    $push: { companies: companyInsertResult.insertedId },
                    $set: { 
                      registeredCount: registeredCount,
                      isClosed: isClosed,
                      updatedAt: new Date() 
                    }
                  }
                );
              }
            } catch (groupError) {
              console.error('Error updating group when recreating company from pre-registration:', groupError);
            }
          }
          
          if (companyInsertResult && companyInsertResult.insertedId) {
            companyDoc = await db.collection('companies').findOne({ 
              _id: companyInsertResult.insertedId 
            });
          }
        } catch (companyError) {
          if (companyError.code === 11000) {
            console.warn('⚠️ Duplicate company code detected while recreating company from pre-registration:', code);
          } else {
            console.error('Error creating company from updated pre-registration:', companyError);
          }
        }
      }
      
      // Return response in same format as new pre-registration, including company (if any)
      return res.json({
        preRegistrationId: updatedPreRegistration._id.toString(),
        companyId: companyDoc ? companyDoc._id.toString() : null,
        message: 'Pre-registration updated successfully',
        updated: true,
        ...updatedPreRegistration,
        company: companyDoc || null
      });
      }
    } else {
      // When codes are disabled, check for duplicate company name only (without code)
      const existingCompanyByName = await db.collection('companies').findOne({
        name: req.body.companyName
      });
      if (existingCompanyByName && !existingCompanyByName.code) {
        // Only block if the existing company also has no code
        return res.status(400).json({ error: 'A company with this name has already been registered.' });
      }
      
      // Check for duplicate pre-registration by name only (when codes disabled)
      // When codes are disabled, we check by company name only, regardless of code
      console.log('🔍 Checking for existing pre-registration (codes disabled)...');
      const existingPreRegByName = await db.collection('preRegistrations').findOne({ 
        companyName: req.body.companyName
      });
      if (existingPreRegByName) {
        console.log('✅ Found existing pre-registration, checking if company is registered...');
        // Check if this pre-registration has already been used to register a company
        const existingCompany = await db.collection('companies').findOne({
          name: req.body.companyName,
          $or: [{ code: '' }, { code: { $exists: false } }]
        });
        if (existingCompany) {
          console.log('❌ Company already registered, blocking...');
          return res.status(400).json({ error: 'A company with this name has already been registered.' });
        }
        
        console.log('✅ Pre-registration exists but company not registered, updating pre-registration...');
        // Update existing pre-registration instead of blocking (allow user to continue)
        const updateData = {
          name: req.body.name,
          mobileNumber: req.body.mobileNumber,
          companyName: req.body.companyName,
          code: code || '',
          groupId: req.body.groupId || existingPreRegByName.groupId || '',
          status: 'pending',
          updatedAt: new Date()
        };
        
        await db.collection('preRegistrations').updateOne(
          { _id: existingPreRegByName._id },
          { $set: updateData }
        );
        
        const updatedPreRegistration = await db.collection('preRegistrations').findOne({ 
          _id: existingPreRegByName._id 
        });
        
        // Also update the company entry if it exists
        // Try to find an existing company linked to this pre-registration
        const existingCompanyEntry = await db.collection('companies').findOne({
          name: req.body.companyName,
          // preRegistrationId is stored as a string in companies collection
          preRegistrationId: existingPreRegByName._id.toString()
        });
        
        let companyDoc = null;
        let companyInsertResult = null;
        
        if (existingCompanyEntry) {
          await db.collection('companies').updateOne(
            { _id: existingCompanyEntry._id },
            { 
              $set: {
                registrantName: req.body.name,
                phoneNumber: req.body.mobileNumber,
                code: code || '',
                groupId: req.body.groupId || existingCompanyEntry.groupId || '',
                updatedAt: new Date()
              }
            }
          );
          
          companyDoc = await db.collection('companies').findOne({
            _id: existingCompanyEntry._id
          });
        } else {
          // No linked company found (it might have been deleted earlier) – create a new one
          const companyDataForUpdateFlow = {
            name: req.body.companyName,
            registrantName: req.body.name,
            email: req.body.mobileNumber + '@temp.com',
            phoneNumber: req.body.mobileNumber,
            code: code || '',
            address: '',
            logo: '',
            description: '',
            businessType: '',
            registrationNumber: '',
            taxId: '',
            website: '',
            groupId: req.body.groupId || '',
            status: 'approved',
            paymentStatus: 'pending',
            registrationFee: 0,
            spent: false,
            paid: false,
            preRegistrationId: updatedPreRegistration._id.toString(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          try {
            companyInsertResult = await db.collection('companies').insertOne(companyDataForUpdateFlow);
            
            if (companyInsertResult && companyInsertResult.insertedId && req.body.groupId && req.body.groupId.trim() !== '') {
              try {
                const group = await db.collection('groups').findOne({ 
                  _id: new ObjectId(req.body.groupId) 
                });
                
                if (group) {
                  const registeredCount = (group.registeredCount || group.companies?.length || 0) + 1;
                  const maxCompanies = group.maxCompanies || 0;
                  const isClosed = maxCompanies > 0 && registeredCount >= maxCompanies;
                  
                  await db.collection('groups').updateOne(
                    { _id: new ObjectId(req.body.groupId) },
                    { 
                      $push: { companies: companyInsertResult.insertedId },
                      $set: { 
                        registeredCount: registeredCount,
                        isClosed: isClosed,
                        updatedAt: new Date() 
                      }
                    }
                  );
                }
              } catch (groupError) {
                console.error('Error updating group when recreating company from pre-registration (codes disabled):', groupError);
              }
            }
            
            if (companyInsertResult && companyInsertResult.insertedId) {
              companyDoc = await db.collection('companies').findOne({ 
                _id: companyInsertResult.insertedId 
              });
            }
          } catch (companyError) {
            if (companyError.code === 11000) {
              console.warn('⚠️ Duplicate company code detected while recreating company from pre-registration (codes disabled):', code);
            } else {
              console.error('Error creating company from updated pre-registration (codes disabled):', companyError);
            }
          }
        }
        
        // Return response in same format as new pre-registration, including company (if any)
        return res.json({
          preRegistrationId: updatedPreRegistration._id.toString(),
          companyId: companyDoc ? companyDoc._id.toString() : null,
          message: 'Pre-registration updated successfully',
          updated: true,
          ...updatedPreRegistration,
          company: companyDoc || null
        });
      }
    }

    const preRegistrationData = {
      name: req.body.name,
      mobileNumber: req.body.mobileNumber,
      companyName: req.body.companyName,
      code: code || '', // Use the code variable (empty string if codes disabled)
      groupId: req.body.groupId || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save pre-registration
    const result = await db.collection('preRegistrations').insertOne(preRegistrationData);
    const newPreRegistration = await db.collection('preRegistrations').findOne({ 
      _id: result.insertedId 
    });
    
    // Also create a company entry so it shows in the companies list
    const companyData = {
      name: req.body.companyName,
      registrantName: req.body.name, // Store the person's name who registered
      email: req.body.mobileNumber + '@temp.com', // Use mobile as temporary email
      phoneNumber: req.body.mobileNumber,
      code: code || '', // Store the registration code (empty if codes disabled)
      address: '', // Will be filled in full registration
      logo: '',
      description: '',
      businessType: '',
      registrationNumber: '',
      taxId: '',
      website: '',
      groupId: req.body.groupId || '',
      status: 'approved', // Auto-approve so it shows immediately in the list
      paymentStatus: 'pending',
      registrationFee: 0,
      spent: false, // Track if money has been spent
      paid: false, // Track if payment has been made
      preRegistrationId: result.insertedId.toString(), // Link to pre-registration
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let companyResult;
    let newCompany = null;
    
    try {
      // Check for duplicate company code BEFORE insert
      if (code && code.trim() !== '') {
        const existingCompanyWithCode = await db.collection('companies').findOne({
          code: code.trim()
        });
        
        if (existingCompanyWithCode) {
          console.warn('⚠️ Duplicate company code detected:', code);
          // Don't fail pre-registration, but log the warning
          // The company won't be created, but pre-registration will succeed
        } else {
          // Create company entry only if code is unique
          try {
            companyResult = await db.collection('companies').insertOne(companyData);
            console.log('Company created with ID:', companyResult.insertedId);
          } catch (insertError) {
            // Handle MongoDB duplicate key error (E11000)
            if (insertError.code === 11000) {
              console.warn('⚠️ Duplicate company code detected during insert:', code);
              // Continue without creating company (pre-registration still succeeds)
            } else {
              throw insertError;
            }
          }
        }
      } else {
        // No code provided, create company normally
        companyResult = await db.collection('companies').insertOne(companyData);
        console.log('Company created with ID:', companyResult.insertedId);
      }
      
      // If groupId is provided and valid, add company to group's companies array and increment count
      if (req.body.groupId && req.body.groupId.trim() !== '') {
        try {
          const group = await db.collection('groups').findOne({ 
            _id: new ObjectId(req.body.groupId) 
          });
          
          if (group) {
            const registeredCount = (group.registeredCount || group.companies?.length || 0) + 1;
            const maxCompanies = group.maxCompanies || 0;
            const isClosed = maxCompanies > 0 && registeredCount >= maxCompanies;
            
            await db.collection('groups').updateOne(
              { _id: new ObjectId(req.body.groupId) },
              { 
                $push: { companies: companyResult.insertedId },
                $set: { 
                  registeredCount: registeredCount,
                  isClosed: isClosed,
                  updatedAt: new Date() 
                }
              }
            );
            console.log('Company added to group:', req.body.groupId);
          } else {
            console.warn('Group not found:', req.body.groupId);
          }
        } catch (groupError) {
          console.error('Error updating group:', groupError);
          // Don't fail the whole request if group update fails
        }
      }

      if (companyResult && companyResult.insertedId) {
        newCompany = await db.collection('companies').findOne({ 
          _id: companyResult.insertedId 
        });
      }
    } catch (companyError) {
      // Handle MongoDB duplicate key error (E11000)
      if (companyError.code === 11000) {
        console.warn('⚠️ Duplicate company code detected:', code);
        // Pre-registration still succeeds, but company won't be created
      } else {
        console.error('Error creating company:', companyError);
        // If company creation fails, still return pre-registration success
        // but log the error
      }
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`✅ Pre-registration completed successfully in ${duration}ms`);
    
    res.status(201).json({
      preRegistrationId: result.insertedId.toString(),
      companyId: companyResult ? companyResult.insertedId.toString() : null,
      message: 'Pre-registration and company registration submitted successfully',
      data: newPreRegistration,
      company: newCompany
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(`❌ Pre-registration error after ${duration}ms:`, error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Verify pre-registration code - Public
router.post('/verify', async (req, res) => {
  try {
    const db = getDB();
    
    if (!req.body.mobileNumber || !req.body.code) {
      return res.status(400).json({ error: 'Mobile number and code are required' });
    }

    const preRegistration = await db.collection('preRegistrations').findOne({
      mobileNumber: req.body.mobileNumber,
      code: req.body.code
    });

    if (!preRegistration) {
      return res.status(404).json({ error: 'Invalid mobile number or code' });
    }

    res.json({
      valid: true,
      preRegistrationId: preRegistration._id.toString(),
      data: preRegistration
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pre-registration by ID - Public (for verification)
router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const preRegistration = await db.collection('preRegistrations').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!preRegistration) {
      return res.status(404).json({ error: 'Pre-registration not found' });
    }
    
    res.json(preRegistration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pre-registered company names - Public (for registration page)
router.get('/public/companies', async (req, res) => {
  try {
    const db = getDB();
    const preRegistrations = await db.collection('preRegistrations')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Return only company names for selection
    const companyNames = preRegistrations.map(pr => ({
      id: pr._id.toString(),
      name: pr.companyName,
      mobileNumber: pr.mobileNumber,
      contactName: pr.name
    }));
    
    res.json(companyNames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pre-registration by code - Public (for auto-fill)
// This searches both companyNames and preRegistrations collections
router.get('/by-code/:code', async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const code = (req.params.code || '').trim();
    
    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }
    
    // First, try to find in companyNames collection (this is what the dropdown uses)
    // companyNames structure: { name, code, contactName, mobileNumber }
    const companyName = await db.collection('companyNames').findOne({ 
      code: code 
    });
    
    if (companyName) {
      // Found in companyNames - return data for auto-fill
      // In companyNames: 'name' is the company name, 'contactName' is the person's name
      return res.json({
        code: companyName.code,
        name: companyName.contactName || '', // Person's name (contact name)
        mobileNumber: companyName.mobileNumber || '',
        companyName: companyName.name || '' // Company name (this matches the dropdown)
      });
    }
    
    // If not found in companyNames, try preRegistrations collection
    // preRegistrations structure: { name, code, mobileNumber, companyName }
    const preRegistration = await db.collection('preRegistrations').findOne({ 
      code: code 
    });
    
    if (!preRegistration) {
      return res.status(404).json({ error: 'Company code not found' });
    }
    
    // Return company data for auto-fill from pre-registration
    // In preRegistrations: 'name' is the person's name, 'companyName' is the company name
    res.json({
      code: preRegistration.code,
      name: preRegistration.name || '', // Person's name
      mobileNumber: preRegistration.mobileNumber || '',
      companyName: preRegistration.companyName || '' // Company name
    });
  } catch (error) {
    console.error('Error fetching pre-registration by code:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
