const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { requireAdmin } = require('../middleware/auth');

// Get all users - Admin only
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const users = await db.collection('users').find({}).sort({ createdAt: -1 }).toArray();
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user by ID - Admin only
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user - Admin only
router.post('/', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Password is required when creating a new user
    if (!req.body.password || req.body.password.trim() === '') {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Check if user with same email already exists (only if email is provided)
    if (req.body.email) {
      const existingUser = await db.collection('users').findOne({ 
        email: req.body.email 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
    }

    // Check if user with same name already exists
    const existingUserByName = await db.collection('users').findOne({ 
      name: req.body.name 
    });
    if (existingUserByName) {
      return res.status(400).json({ error: 'User with this name already exists' });
    }

    // Hash password (required, so always hash it)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

    const userData = {
      name: req.body.name,
      email: req.body.email || '',
      phone: req.body.phone || '',
      role: req.body.role || 'user',
      password: hashedPassword,
      status: 'active', // Always set new users to active
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('users').insertOne(userData);
    const newUser = await db.collection('users').findOne({ 
      _id: result.insertedId 
    });
    
    // Don't send password in response
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user - Admin only
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    
    // Get current user to preserve existing email if not provided
    const currentUser = await db.collection('users').findOne({ 
      _id: new ObjectId(req.params.id) 
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it conflicts with another user
    if (req.body.email && req.body.email !== currentUser.email) {
      const existingUser = await db.collection('users').findOne({ 
        email: req.body.email,
        _id: { $ne: new ObjectId(req.params.id) }
      });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
    }

    // Preserve email if not provided in request
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    
    // If email is not provided, preserve the existing one
    if (!updateData.hasOwnProperty('email') && currentUser.email) {
      updateData.email = currentUser.email;
    }
    
    // Hash password if provided
    if (updateData.password && updateData.password.trim() !== '') {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    } else {
      // If password is not provided or empty, don't update it
      delete updateData.password;
    }
    
    delete updateData._id; // Don't allow updating _id

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedUser = await db.collection('users').findOne({
      _id: new ObjectId(req.params.id)
    });

    // Don't send password in response
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user - Admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection('users').deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
