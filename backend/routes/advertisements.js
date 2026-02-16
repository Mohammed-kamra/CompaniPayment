const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { requireAdmin } = require('../middleware/auth');

// Get all advertisements - Public (for carousel)
router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const ads = await db.collection('advertisements').find({ active: true }).sort({ order: 1, createdAt: -1 }).toArray();
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all advertisements - Admin only (including inactive)
router.get('/admin', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const ads = await db.collection('advertisements').find({}).sort({ order: 1, createdAt: -1 }).toArray();
    res.json(ads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single advertisement by ID - Admin only
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const ad = await db.collection('advertisements').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!ad) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }
    
    res.json(ad);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new advertisement - Admin only
router.post('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    console.log('Creating advertisement - Request received');
    console.log('Title:', req.body.title);
    console.log('Image length:', req.body.image ? req.body.image.length : 0);
    console.log('Image type:', req.body.image ? (req.body.image.startsWith('data:') ? 'base64' : 'url') : 'none');
    
    // Validate required fields
    if (!req.body.title || req.body.title.trim() === '') {
      console.log('Validation failed: Title is missing or empty');
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!req.body.image || req.body.image.trim() === '') {
      console.log('Validation failed: Image is missing or empty');
      return res.status(400).json({ error: 'Image is required' });
    }

    // Check image size (base64 images can be large, MongoDB has 16MB limit)
    const imageSize = Buffer.byteLength(req.body.image, 'utf8');
    const maxSize = 15 * 1024 * 1024; // 15MB (leaving 1MB buffer)
    if (imageSize > maxSize) {
      console.log('Validation failed: Image too large', imageSize, 'bytes');
      return res.status(400).json({ error: `Image is too large (${Math.round(imageSize / 1024 / 1024)}MB). Maximum size is 15MB. Please use a smaller image or compress it.` });
    }

    // Get the highest order number
    const lastAd = await db.collection('advertisements').findOne({}, { sort: { order: -1 } });
    const nextOrder = lastAd ? (lastAd.order || 0) + 1 : 1;

    const adData = {
      title: req.body.title.trim(),
      description: (req.body.description || '').trim(),
      image: req.body.image,
      link: (req.body.link || '').trim(),
      order: req.body.order !== undefined ? parseInt(req.body.order) : nextOrder,
      active: req.body.active !== undefined ? Boolean(req.body.active) : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Inserting advertisement to database...');
    const result = await db.collection('advertisements').insertOne(adData);
    console.log('Advertisement inserted with ID:', result.insertedId);
    
    const newAd = await db.collection('advertisements').findOne({ 
      _id: result.insertedId 
    });
    
    console.log('Advertisement created successfully');
    res.status(201).json(newAd);
  } catch (error) {
    console.error('Error creating advertisement:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Failed to create advertisement',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update advertisement - Admin only
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    delete updateData._id; // Don't allow updating _id

    const result = await db.collection('advertisements').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    const updatedAd = await db.collection('advertisements').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedAd);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete advertisement - Admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('advertisements').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Advertisement not found' });
    }

    res.json({ message: 'Advertisement deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
