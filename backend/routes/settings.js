const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

const toBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
    if (v === 'false' || v === '0' || v === 'no' || v === 'off' || v === '') return false;
  }
  if (typeof value === 'number') return value !== 0;
  return defaultValue;
};

const parseTimeToSeconds = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2) return null;
  const [hour, minute] = parts;
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 3600 + minute * 60;
};

const isWithinScheduleWindow = (openTime, closeTime, now = new Date()) => {
  const openSeconds = parseTimeToSeconds(openTime);
  const closeSeconds = parseTimeToSeconds(closeTime);
  if (openSeconds === null || closeSeconds === null) return false;

  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  if (openSeconds <= closeSeconds) {
    // Same-day schedule: open at openTime, close at closeTime
    return currentSeconds >= openSeconds && currentSeconds < closeSeconds;
  }

  // Overnight schedule (e.g. 18:00 -> 06:00)
  return currentSeconds >= openSeconds || currentSeconds < closeSeconds;
};

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
        postRegistrationMessage: '',
        notePaymentRegistration: ''
      });
    }
    
    const autoScheduleEnabled = toBoolean(settings.autoSchedule, false);
    let isOpen = toBoolean(settings.isOpen, false);
    if (autoScheduleEnabled && settings.openTime && settings.closeTime) {
      // Automatic mode should depend ONLY on current time window.
      isOpen = isWithinScheduleWindow(settings.openTime, settings.closeTime, new Date());
    }
    
    res.json({
      isOpen,
      message: settings.message || '',
      openTime: settings.openTime || '',
      closeTime: settings.closeTime || '',
      autoSchedule: autoScheduleEnabled,
      codesActive: settings.codesActive !== undefined ? settings.codesActive : true,
      postRegistrationMessage: settings.postRegistrationMessage || '',
      notePaymentRegistration: settings.notePaymentRegistration || ''
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
      isOpen: toBoolean(req.body.isOpen, false),
      message: req.body.message || '',
      openTime: req.body.openTime || '',
      closeTime: req.body.closeTime || '',
      autoSchedule: toBoolean(req.body.autoSchedule, false),
      codesActive: req.body.codesActive !== undefined ? toBoolean(req.body.codesActive, true) : true,
      postRegistrationMessage: req.body.postRegistrationMessage || '',
      notePaymentRegistration: req.body.notePaymentRegistration || '',
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
      isOpen: toBoolean(updatedSettings.isOpen, false),
      message: updatedSettings.message || '',
      openTime: updatedSettings.openTime || '',
      closeTime: updatedSettings.closeTime || '',
      autoSchedule: toBoolean(updatedSettings.autoSchedule, false),
      codesActive: updatedSettings.codesActive !== undefined ? toBoolean(updatedSettings.codesActive, true) : true,
      postRegistrationMessage: updatedSettings.postRegistrationMessage || '',
      notePaymentRegistration: updatedSettings.notePaymentRegistration || ''
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
