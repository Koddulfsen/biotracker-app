const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const ExperienceService = require('../services/experience.service');

// Create meal
router.post('/', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { name, foods, totalCalories, totalProtein, totalCarbs, totalFat } = req.body;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Insert meal
    const mealResult = await client.query(
      `INSERT INTO meals (user_id, name, total_calories, total_protein, total_carbs, total_fat, logged_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, total_calories, total_protein, total_carbs, total_fat, logged_at`,
      [userId, name, totalCalories || 0, totalProtein || 0, totalCarbs || 0, totalFat || 0]
    );

    const meal = mealResult.rows[0];

    // Insert meal foods if provided
    if (foods && foods.length > 0) {
      for (const food of foods) {
        await client.query(
          `INSERT INTO meal_foods (meal_id, food_id, quantity, unit)
           VALUES ($1, $2, $3, $4)`,
          [meal.id, food.foodId, food.quantity, food.unit || 'g']
        );
      }
    }

    // Award XP for logging meal
    const xpResult = await ExperienceService.addExperience(
      userId, 
      ExperienceService.XP_REWARDS.MEAL_LOGGED,
      'MEAL_LOGGED'
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      meal,
      xpGained: xpResult.xpGained,
      totalXp: xpResult.newXp,
      currentLevel: xpResult.currentLevel,
      leveledUp: xpResult.leveledUp,
      xpToNextLevel: xpResult.xpToNextLevel
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating meal:', error);
    res.status(500).json({ error: 'Failed to create meal' });
  } finally {
    client.release();
  }
});

// Get user meals
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT 
        m.id,
        m.name,
        m.total_calories,
        m.total_protein,
        m.total_carbs,
        m.total_fat,
        m.logged_at,
        json_agg(
          json_build_object(
            'foodId', mf.food_id,
            'quantity', mf.quantity,
            'unit', mf.unit,
            'foodName', f.name
          )
        ) FILTER (WHERE mf.food_id IS NOT NULL) as foods
      FROM meals m
      LEFT JOIN meal_foods mf ON m.id = mf.meal_id
      LEFT JOIN foods f ON mf.food_id = f.id
      WHERE m.user_id = $1
    `;

    const values = [userId];
    let paramCount = 2;

    if (date) {
      query += ` AND DATE(m.logged_at) = $${paramCount}`;
      values.push(date);
      paramCount++;
    }

    query += `
      GROUP BY m.id
      ORDER BY m.logged_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json({
      meals: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.rowCount
      }
    });

  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// Get meal by ID
router.get('/:mealId', authenticate, async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT 
        m.*,
        json_agg(
          json_build_object(
            'foodId', mf.food_id,
            'quantity', mf.quantity,
            'unit', mf.unit,
            'foodName', f.name,
            'calories', f.calories,
            'protein', f.protein,
            'carbs', f.carbs,
            'fat', f.fat
          )
        ) FILTER (WHERE mf.food_id IS NOT NULL) as foods
      FROM meals m
      LEFT JOIN meal_foods mf ON m.id = mf.meal_id
      LEFT JOIN foods f ON mf.food_id = f.id
      WHERE m.id = $1 AND m.user_id = $2
      GROUP BY m.id`,
      [mealId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error fetching meal:', error);
    res.status(500).json({ error: 'Failed to fetch meal' });
  }
});

// Delete meal
router.delete('/:mealId', authenticate, async (req, res) => {
  try {
    const { mealId } = req.params;
    const userId = req.user.id;

    const result = await pool.query(
      'DELETE FROM meals WHERE id = $1 AND user_id = $2 RETURNING id',
      [mealId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    res.json({ success: true, deletedMealId: result.rows[0].id });

  } catch (error) {
    console.error('Error deleting meal:', error);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

module.exports = router;