const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { requireAdmin } = require('../middleware/auth');

// Mount user routes
router.use('/:marketId/users', require('./marketUsers'));

// Get all markets - Admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const markets = await db.collection('markets').find({}).toArray();
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single market by ID - Admin only
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const market = await db.collection('markets').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    res.json(market);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new market - Admin only
router.post('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    // Validate required fields
    if (!req.body.name || !req.body.phoneNumber) {
      return res.status(400).json({ error: 'Name and phone number are required' });
    }

    const marketData = {
      name: req.body.name,
      logo: req.body.logo || '',
      phoneNumber: req.body.phoneNumber,
      location: req.body.location || '',
      marketType: req.body.marketType || 'small market',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('markets').insertOne(marketData);
    const newMarket = await db.collection('markets').findOne({ 
      _id: result.insertedId 
    });
    
    res.status(201).json(newMarket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update market - Admin only
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    delete updateData._id; // Don't allow updating _id

    const result = await db.collection('markets').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Market not found' });
    }

    const updatedMarket = await db.collection('markets').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedMarket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete market - Admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('markets').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Market not found' });
    }

    res.json({ message: 'Market deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
