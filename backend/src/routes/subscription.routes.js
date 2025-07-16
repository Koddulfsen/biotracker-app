const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get subscription
router.get('/', authenticate, async (req, res) => {
  res.json({ message: 'Get subscription endpoint - to be implemented' });
});

// Upgrade subscription
router.post('/upgrade', authenticate, async (req, res) => {
  res.json({ message: 'Upgrade subscription endpoint - to be implemented' });
});

module.exports = router;