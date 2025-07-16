const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  res.json({ message: 'User profile endpoint - to be implemented' });
});

// Update user profile
router.put('/me/profile', authenticate, async (req, res) => {
  res.json({ message: 'Update profile endpoint - to be implemented' });
});

module.exports = router;