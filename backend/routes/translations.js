const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { getDB } = require('../config/database');
const { requireAdmin } = require('../middleware/auth');

const COLLECTION = 'translations';

function loadLocaleFile(lang) {
  try {
    const localePath = path.join(__dirname, '../../frontend/locales', `${lang}.json`);
    const data = fs.readFileSync(localePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
const DOC_ID = 'site';

// Get all translations (public - so app can load overrides)
router.get('/', async (req, res) => {
  try {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store'
    });
    const db = getDB();
    const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
    const en = (doc && doc.en) ? doc.en : {};
    const ku = (doc && doc.ku) ? doc.ku : {};
    const ar = (doc && doc.ar) ? doc.ar : {};
    res.json({ en, ku, ar });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update all translations (admin only)
router.put('/', requireAdmin, async (req, res) => {
  try {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      'Surrogate-Control': 'no-store'
    });
    const db = getDB();
    const { en, ku, ar } = req.body;
    if (en === undefined && ku === undefined && ar === undefined) {
      return res.status(400).json({ error: 'Provide at least one of en, ku, ar' });
    }
    const update = {
      updatedAt: new Date()
    };
    if (en !== undefined) update.en = en;
    if (ku !== undefined) update.ku = ku;
    if (ar !== undefined) update.ar = ar;

    await db.collection(COLLECTION).updateOne(
      { _id: DOC_ID },
      { $set: update },
      { upsert: true }
    );
    const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
    res.json({
      en: doc.en || {},
      ku: doc.ku || {},
      ar: doc.ar || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed translations from locale JSON files into database (admin only)
// Merges: existing DB values are kept, new keys from files are added
router.post('/seed', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const enFile = loadLocaleFile('en');
    const kuFile = loadLocaleFile('ku');
    const arFile = loadLocaleFile('ar');

    const doc = await db.collection(COLLECTION).findOne({ _id: DOC_ID });
    const existingEn = (doc && doc.en) ? doc.en : {};
    const existingKu = (doc && doc.ku) ? doc.ku : {};
    const existingAr = (doc && doc.ar) ? doc.ar : {};

    const mergedEn = deepMerge(enFile, existingEn);
    const mergedKu = deepMerge(kuFile, existingKu);
    const mergedAr = deepMerge(arFile, existingAr);

    await db.collection(COLLECTION).updateOne(
      { _id: DOC_ID },
      {
        $set: {
          en: mergedEn,
          ku: mergedKu,
          ar: mergedAr,
          updatedAt: new Date(),
          seededAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Translations seeded from locale files and saved to database',
      en: Object.keys(mergedEn).length,
      ku: Object.keys(mergedKu).length,
      ar: Object.keys(mergedAr).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
