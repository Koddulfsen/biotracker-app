const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('AUTH_REQUIRED', 'Authentication required', 401);
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await db('users')
      .where({ id: decoded.sub, is_active: true })
      .first();

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found or inactive', 401);
    }

    // Add user to request
    req.user = {
      id: user.id,
      email: user.email,
      type: user.user_type,
      tier: user.user_tier,
      organizationId: user.organization_id
    };

    // Set user context for RLS
    await db.raw('SET LOCAL app.current_user_auth0_id = ?', [user.auth0_id]);

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('AUTH_INVALID', 'Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('AUTH_EXPIRED', 'Token expired', 401));
    } else {
      next(error);
    }
  }
};

const authorize = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('AUTH_REQUIRED', 'Authentication required', 401));
    }

    if (!allowedTypes.includes(req.user.type)) {
      return next(new AppError('PERMISSION_DENIED', 'Insufficient permissions', 403));
    }

    next();
  };
};

const checkTier = (...allowedTiers) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('AUTH_REQUIRED', 'Authentication required', 401));
    }

    // Define tier hierarchy
    const tierHierarchy = ['freemium', 'premium', 'professional', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(req.user.tier);
    const minRequiredIndex = Math.min(...allowedTiers.map(tier => tierHierarchy.indexOf(tier)));

    if (userTierIndex < minRequiredIndex) {
      return next(new AppError('SUBSCRIPTION_REQUIRED', 'Upgrade required to access this feature', 403));
    }

    next();
  };
};

const checkFeatureLimit = (feature) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const tier = req.user.tier;

      // Check if feature has limits for this tier
      const limits = {
        barcode_scan: { free: 5, premium: -1, professional: -1, enterprise: -1 },
        meal_export: { free: 0, premium: -1, professional: -1, enterprise: -1 },
        patient_slots: { free: 0, premium: 0, professional: 10, enterprise: -1 }
      };

      const limit = limits[feature]?.[tier];
      if (limit === undefined || limit === -1) {
        return next(); // No limit or unlimited
      }

      if (limit === 0) {
        return next(new AppError('FEATURE_NOT_AVAILABLE', 'This feature is not available on your plan', 403));
      }

      // Check current usage
      const today = new Date().toISOString().split('T')[0];
      const usage = await db('usage_tracking')
        .where({ user_id: userId, feature })
        .whereRaw('DATE(tracked_at) = ?', [today])
        .count('* as count')
        .first();

      if (usage.count >= limit) {
        return next(new AppError('LIMIT_REACHED', `Daily limit reached (${usage.count}/${limit})`, 403));
      }

      // Track usage (will be saved after successful request)
      req.trackUsage = { feature, userId };
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  authorize,
  checkTier,
  checkFeatureLimit
};