const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getDB } = require('../config/database');

// Login endpoint - Public
router.post('/login', async (req, res) => {
  try {
    const db = getDB();
    if (!db) {
      return res.status(500).json({ error: 'Database connection failed' });
    }

    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user by username, email, or name (case-insensitive)
    const user = await db.collection('users').findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${username}$`, 'i') } },
        { name: { $regex: new RegExp(`^${username}$`, 'i') } }
      ]
    });

    if (!user) {
      console.log(`❌ Login attempt failed: User not found for username: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    console.log(`✅ User found: ${user.name} (${user.role}), Status: ${user.status || 'active'}`);

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Your account is inactive. Please contact an administrator.' });
    }

    // Check if user has a password (if not, it's a legacy user without hashed password)
    if (!user.password) {
      // For legacy users, you might want to handle this differently
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`❌ Login attempt failed: Invalid password for user: ${user.name}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    console.log(`✅ Login successful: ${user.name} (${user.role})`);

    // Don't send password in response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: {
        id: userWithoutPassword._id,
        username: userWithoutPassword.username || userWithoutPassword.name,
        name: userWithoutPassword.name,
        email: userWithoutPassword.email,
        role: userWithoutPassword.role || 'user',
        isAuthenticated: true
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
