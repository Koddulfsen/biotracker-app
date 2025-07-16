const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate: authMiddleware } = require('../middleware/auth');
const ExperienceService = require('../services/experience.service');

// Get user profile
router.get('/profile/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure user can only access their own profile or is admin
    if (req.user.id !== parseInt(userId) && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT 
        id, 
        email, 
        username,
        avatar_url,
        bio,
        total_xp,
        created_at
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const stats = await ExperienceService.getUserStats(userId);

    res.json({
      profile: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        memberSince: user.created_at
      },
      stats: {
        totalXp: stats.totalXp,
        currentLevel: stats.currentLevel,
        xpToNextLevel: stats.xpToNextLevel,
        levelProgress: stats.levelProgress,
        mealsLogged: stats.mealsLogged,
        daysTracked: stats.daysTracked
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/profile/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { username, avatarUrl, bio } = req.body;

    // Ensure user can only update their own profile
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate bio length
    if (bio && bio.length > 140) {
      return res.status(400).json({ error: 'Bio must be 140 characters or less' });
    }

    // Validate avatar URL
    if (avatarUrl && !isValidUrl(avatarUrl)) {
      return res.status(400).json({ error: 'Invalid avatar URL' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username !== undefined) {
      updates.push(`username = $${paramCount}`);
      values.push(username);
      paramCount++;
    }

    if (avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramCount}`);
      values.push(avatarUrl);
      paramCount++;
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount}`);
      values.push(bio);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, avatar_url, bio
    `;

    const result = await pool.query(updateQuery, values);

    res.json({
      success: true,
      profile: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        avatarUrl: result.rows[0].avatar_url,
        bio: result.rows[0].bio
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user stats
router.get('/stats/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const stats = await ExperienceService.getUserStats(userId);
    res.json(stats);

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = router;