require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');
const mealRoutes = require('./routes/meal.routes');
const foodRoutes = require('./routes/food.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const practitionerRoutes = require('./routes/practitioner.routes');
const organizationRoutes = require('./routes/organization.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Rate limiting
const createRateLimiter = (max) => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max,
  message: 'Too many requests from this IP, please try again later.'
});

// Apply different rate limits based on routes
app.use('/api/v1/auth', createRateLimiter(20)); // Stricter for auth
app.use('/api/v1/', createRateLimiter(100)); // Default rate limit

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users', profileRoutes);
app.use('/api/v1/meals', mealRoutes);
app.use('/api/v1/foods', foodRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/practitioner', practitionerRoutes);
app.use('/api/v1/organization', organizationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: 'The requested resource was not found'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Bio-Tracker API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    db.destroy().then(() => {
      logger.info('Database connections closed');
      process.exit(0);
    });
  });
});

module.exports = app;