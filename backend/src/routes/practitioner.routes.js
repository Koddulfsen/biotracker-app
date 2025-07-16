const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get patients
router.get('/patients', authenticate, authorize('practitioner'), async (req, res) => {
  res.json({ message: 'Get patients endpoint - to be implemented' });
});

// Add patient
router.post('/patients', authenticate, authorize('practitioner'), async (req, res) => {
  res.json({ message: 'Add patient endpoint - to be implemented' });
});

module.exports = router;