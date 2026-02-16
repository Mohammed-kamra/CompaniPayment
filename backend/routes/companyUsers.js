const express = require('express');
const router = express.Router({ mergeParams: true });
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { requireAdmin } = require('../middleware/auth');

// Get all users for a company - Admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const companyId = req.params.companyId;
    
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(companyId) 
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const users = company.users || [];
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user by ID - Admin only
router.get('/:userId', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const companyId = req.params.companyId;
    const userId = req.params.userId;
    
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(companyId) 
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const users = company.users || [];
    const user = users.find(u => u._id === userId || u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user for a company - Admin only
router.post('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const companyId = req.params.companyId;
    
    // Validate required fields
    if (!req.body.email || !req.body.name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(companyId) 
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const users = company.users || [];
    
    // Check if user with same email already exists
    if (users.some(u => u.email === req.body.email)) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    const newUser = {
      _id: new Date().getTime().toString(), // Simple ID generation
      email: req.body.email,
      name: req.body.name,
      phone: req.body.phone || '',
      role: req.body.role || 'employee',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    users.push(newUser);
    
    await db.collection('companies').updateOne(
      { _id: new ObjectId(companyId) },
      { 
        $set: { 
          users: users,
          updatedAt: new Date()
        } 
      }
    );
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user - Admin only
router.put('/:userId', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const companyId = req.params.companyId;
    const userId = req.params.userId;
    
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(companyId) 
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const users = company.users || [];
    const userIndex = users.findIndex(u => u._id === userId || u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is being changed and if it conflicts with another user
    if (req.body.email && req.body.email !== users[userIndex].email) {
      if (users.some((u, i) => i !== userIndex && u.email === req.body.email)) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
    }
    
    users[userIndex] = {
      ...users[userIndex],
      ...req.body,
      _id: users[userIndex]._id || users[userIndex].id,
      updatedAt: new Date()
    };
    
    await db.collection('companies').updateOne(
      { _id: new ObjectId(companyId) },
      { 
        $set: { 
          users: users,
          updatedAt: new Date()
        } 
      }
    );
    
    res.json(users[userIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user - Admin only
router.delete('/:userId', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const companyId = req.params.companyId;
    const userId = req.params.userId;
    
    const company = await db.collection('companies').findOne({ 
      _id: new ObjectId(companyId) 
    });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const users = company.users || [];
    const filteredUsers = users.filter(u => u._id !== userId && u.id !== userId);
    
    if (filteredUsers.length === users.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await db.collection('companies').updateOne(
      { _id: new ObjectId(companyId) },
      { 
        $set: { 
          users: filteredUsers,
          updatedAt: new Date()
        } 
      }
    );
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
