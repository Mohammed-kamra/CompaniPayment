const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

// Get website settings - Public
router.get('/website', async (req, res) => {
  try {
    const db = getDB();
    const settings = await db.collection('settings').findOne({ type: 'website' });
    
    if (!settings) {
      // Default: website is closed
      return res.json({ 
        isOpen: false, 
        message: '',
        openTime: '',
        closeTime: '',
        autoSchedule: false,
        codesActive: true,
        postRegistrationMessage: ''
      });
    }
    
    // Check if auto-schedule is enabled and handle auto-opening/closing
    let isOpen = false; // Default: website is closed
    
    // If manually set to open, respect that (but check if we need to auto-close)
    if (settings.isOpen === true) {
      isOpen = true;
    }
    
    // If autoSchedule is enabled, check if open/close times have been reached
    // Auto-open when open time arrives (only if system was manually closed)
    // Auto-close when close time expires
    // After auto-closing, do NOT auto-open again (stay closed until manually opened)
    if (settings.autoSchedule && settings.openTime && settings.closeTime) {
      const now = new Date();
      
      // Parse times
      const [openHour, openMin] = settings.openTime.split(':').map(Number);
      const [closeHour, closeMin] = settings.closeTime.split(':').map(Number);
      const openTimeSeconds = openHour * 3600 + openMin * 60;
      const closeTimeSeconds = closeHour * 3600 + closeMin * 60;
      const currentTimeSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      let shouldBeOpen = false;
      let shouldBeClosed = false;
      
      if (openTimeSeconds <= closeTimeSeconds) {
        // Same day schedule (e.g., 6:00 to 18:00)
        // Open if current time >= open time AND current time < close time
        shouldBeOpen = currentTimeSeconds >= openTimeSeconds && currentTimeSeconds < closeTimeSeconds;
        // Close if current time >= close time
        shouldBeClosed = currentTimeSeconds >= closeTimeSeconds;
      } else {
        // Overnight schedule (e.g., 18:00 to 6:00 next day)
        // Open if current time >= open time OR current time < close time
        shouldBeOpen = currentTimeSeconds >= openTimeSeconds || currentTimeSeconds < closeTimeSeconds;
        // Close if current time >= close time AND current time < open time
        shouldBeClosed = currentTimeSeconds >= closeTimeSeconds && currentTimeSeconds < openTimeSeconds;
      }
      
      // Check if system was manually closed (not auto-closed)
      // autoClosed defaults to false if it doesn't exist (for backward compatibility)
      const autoClosed = settings.autoClosed === true;
      const isCurrentlyClosed = settings.isOpen === false;
      const wasManuallyClosed = isCurrentlyClosed && !autoClosed;
      
      // Priority 1: Auto-close if close time has been reached and system is still marked as open
      if (shouldBeClosed && settings.isOpen === true) {
        // Update database to close the system and mark as auto-closed
        await db.collection('settings').updateOne(
          { type: 'website' },
          { $set: { isOpen: false, autoClosed: true, updatedAt: new Date() } }
        );
        isOpen = false;
      }
      // Priority 2: Auto-open if open time has been reached and system was manually closed (not auto-closed)
      else if (shouldBeOpen && wasManuallyClosed) {
        // Update database to open the system
        await db.collection('settings').updateOne(
          { type: 'website' },
          { $set: { isOpen: true, autoClosed: false, updatedAt: new Date() } }
        );
        isOpen = true;
      }
      // Priority 3: Respect current state if within valid time range
      else if (shouldBeOpen && settings.isOpen === true) {
        isOpen = true;
      } else {
        // System should be closed
        isOpen = false;
      }
    } else {
      // No autoSchedule - only respect manual setting
      isOpen = settings.isOpen === true;
    }
    
    res.json({
      isOpen,
      message: settings.message || '',
      openTime: settings.openTime || '',
      closeTime: settings.closeTime || '',
      autoSchedule: settings.autoSchedule || false,
      codesActive: settings.codesActive !== undefined ? settings.codesActive : true,
      postRegistrationMessage: settings.postRegistrationMessage || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all settings - Admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const settings = await db.collection('settings').find({}).toArray();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update website settings - Admin only
router.put('/website', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    const settingsData = {
      type: 'website',
      isOpen: req.body.isOpen === true, // Only open if explicitly set to true
      message: req.body.message || '',
      openTime: req.body.openTime || '',
      closeTime: req.body.closeTime || '',
      autoSchedule: req.body.autoSchedule || false,
      codesActive: req.body.codesActive !== undefined ? req.body.codesActive : true,
      postRegistrationMessage: req.body.postRegistrationMessage || '',
      autoClosed: false, // Reset autoClosed flag when manually updating settings
      updatedAt: new Date()
    };

    const result = await db.collection('settings').updateOne(
      { type: 'website' },
      { 
        $set: settingsData,
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );

    const updatedSettings = await db.collection('settings').findOne({ type: 'website' });
    
    // Return formatted response
    res.json({
      isOpen: updatedSettings.isOpen === true, // Only open if explicitly true
      message: updatedSettings.message || '',
      openTime: updatedSettings.openTime || '',
      closeTime: updatedSettings.closeTime || '',
      autoSchedule: updatedSettings.autoSchedule || false,
      codesActive: updatedSettings.codesActive !== undefined ? updatedSettings.codesActive : true,
      postRegistrationMessage: updatedSettings.postRegistrationMessage || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import company names - Admin only
router.post('/import-companies', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    if (!req.body.companies || !Array.isArray(req.body.companies)) {
      return res.status(400).json({ error: 'Companies array is required' });
    }

    const importedCompanies = [];
    const errors = [];

    for (const company of req.body.companies) {
      if (!company.name) {
        errors.push({ company, error: 'Company name is required' });
        continue;
      }

      // Check if company name already exists
      const existing = await db.collection('companies').findOne({ name: company.name });
      if (existing) {
        errors.push({ company, error: 'Company name already exists' });
        continue;
      }

      // Create company entry (as pending)
      const companyData = {
        name: company.name,
        email: company.email || '',
        phoneNumber: company.phoneNumber || '',
        address: company.address || '',
        status: 'pending',
        imported: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('companies').insertOne(companyData);
      importedCompanies.push(result.insertedId);
    }

    res.json({
      success: true,
      imported: importedCompanies.length,
      errors: errors.length,
      importedIds: importedCompanies,
      errorDetails: errors
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
