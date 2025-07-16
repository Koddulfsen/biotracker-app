const express = require('express');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Search foods
router.post('/search', authenticate, async (req, res) => {
  res.json({ message: 'Search foods endpoint - to be implemented' });
});

module.exports = router;