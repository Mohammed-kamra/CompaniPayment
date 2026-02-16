const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { requireAdmin } = require('../middleware/auth');

// Get all groups - Public (for registration) - Only show groups with available slots
router.get('/public', async (req, res) => {
  try {
    const db = getDB();
    const allGroups = await db.collection('groups')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Filter groups that have available slots
    const availableGroups = allGroups.filter(group => {
      if (group.isClosed) return false;
      const registeredCount = group.registeredCount || group.companies?.length || 0;
      const maxCompanies = group.maxCompanies || 0;
      // If maxCompanies is 0 or not set, allow unlimited (for backward compatibility)
      if (maxCompanies === 0) return true;
      return registeredCount < maxCompanies;
    });
    
    res.json(availableGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all groups - Public (for display purposes - includes closed groups)
router.get('/public/all', async (req, res) => {
  try {
    const db = getDB();
    const allGroups = await db.collection('groups')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json(allGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all groups - Admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const groups = await db.collection('groups').find({}).sort({ createdAt: -1 }).toArray();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single group by ID - Admin only
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const group = await db.collection('groups').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new group - Admin only
router.post('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    console.log('Creating group with data:', req.body);
    
    // Validate required fields
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Check if group name already exists
    const existingGroup = await db.collection('groups').findOne({ 
      name: req.body.name.trim() 
    });
    if (existingGroup) {
      return res.status(400).json({ error: 'A group with this name already exists' });
    }

    // Validate required fields
    if (!req.body.timeFrom || !req.body.timeTo) {
      return res.status(400).json({ error: 'Time range (timeFrom and timeTo) is required' });
    }
    
    if (!req.body.date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const groupData = {
      name: req.body.name.trim(),
      companies: req.body.companies || [],
      timeFrom: req.body.timeFrom,
      timeTo: req.body.timeTo,
      date: req.body.date,
      day: req.body.day || '',
      maxCompanies: parseInt(req.body.maxCompanies) || 0,
      registeredCount: 0,
      isClosed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Group data to insert:', groupData);

    const result = await db.collection('groups').insertOne(groupData);
    const newGroup = await db.collection('groups').findOne({ 
      _id: result.insertedId 
    });
    
    console.log('Group created successfully:', newGroup._id);
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update group - Admin only
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    // Get current group to check registeredCount
    const currentGroup = await db.collection('groups').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // Convert maxCompanies to number if provided
    if (updateData.maxCompanies !== undefined) {
      updateData.maxCompanies = parseInt(updateData.maxCompanies) || 0;
    }
    
    // Recalculate isClosed based on current registeredCount and maxCompanies
    if (currentGroup) {
      const registeredCount = currentGroup.registeredCount || currentGroup.companies?.length || 0;
      const maxCompanies = updateData.maxCompanies !== undefined ? updateData.maxCompanies : (currentGroup.maxCompanies || 0);
      updateData.isClosed = maxCompanies > 0 && registeredCount >= maxCompanies;
    }
    
    delete updateData._id; // Don't allow updating _id

    const result = await db.collection('groups').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const updatedGroup = await db.collection('groups').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json(updatedGroup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete group - Admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('groups').deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
