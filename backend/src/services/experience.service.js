const pool = require('../config/database');

class ExperienceService {
  // XP rewards for different actions
  static XP_REWARDS = {
    MEAL_LOGGED: 10,
    BARCODE_SCANNED: 5, // For future use
    DAILY_LOGIN: 5,     // For future use
    STREAK_BONUS: 20   // For future use
  };

  // Calculate user level from total XP
  static calculateLevel(totalXp) {
    return Math.floor(totalXp / 100) + 1;
  }

  // Calculate XP needed for next level
  static calculateXpToNextLevel(totalXp) {
    const currentLevel = this.calculateLevel(totalXp);
    const xpForNextLevel = currentLevel * 100;
    return xpForNextLevel - totalXp;
  }

  // Get level progress percentage
  static getLevelProgress(totalXp) {
    const currentLevelXp = (this.calculateLevel(totalXp) - 1) * 100;
    const progressInCurrentLevel = totalXp - currentLevelXp;
    return (progressInCurrentLevel / 100) * 100;
  }

  // Add experience points to a user
  static async addExperience(userId, xpAmount, reason = 'MANUAL') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get current XP
      const userResult = await client.query(
        'SELECT total_xp FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const currentXp = userResult.rows[0].total_xp || 0;
      const newXp = currentXp + xpAmount;

      // Check for level up
      const oldLevel = this.calculateLevel(currentXp);
      const newLevel = this.calculateLevel(newXp);
      const leveledUp = newLevel > oldLevel;

      // Update user's XP
      await client.query(
        'UPDATE users SET total_xp = $1 WHERE id = $2',
        [newXp, userId]
      );

      // Log XP transaction (for future analytics)
      await client.query(
        `INSERT INTO xp_transactions (user_id, amount, reason, created_at) 
         VALUES ($1, $2, $3, NOW())`,
        [userId, xpAmount, reason]
      );

      await client.query('COMMIT');

      return {
        success: true,
        previousXp: currentXp,
        newXp,
        xpGained: xpAmount,
        currentLevel: newLevel,
        leveledUp,
        xpToNextLevel: this.calculateXpToNextLevel(newXp),
        levelProgress: this.getLevelProgress(newXp)
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get user stats including XP and level
  static async getUserStats(userId) {
    const result = await pool.query(
      `SELECT 
        u.total_xp,
        u.created_at,
        COUNT(DISTINCT m.id) as meals_logged,
        COUNT(DISTINCT DATE(m.logged_at)) as days_tracked
      FROM users u
      LEFT JOIN meals m ON u.id = m.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.total_xp, u.created_at`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const stats = result.rows[0];
    const totalXp = stats.total_xp || 0;

    return {
      totalXp,
      currentLevel: this.calculateLevel(totalXp),
      xpToNextLevel: this.calculateXpToNextLevel(totalXp),
      levelProgress: this.getLevelProgress(totalXp),
      mealsLogged: parseInt(stats.meals_logged),
      daysTracked: parseInt(stats.days_tracked),
      memberSince: stats.created_at
    };
  }

  // Create XP transactions table if it doesn't exist
  static async createXpTransactionsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS xp_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        reason VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_id 
      ON xp_transactions(user_id);
    `;

    await pool.query(query);
  }
}

module.exports = ExperienceService;