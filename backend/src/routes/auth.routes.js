const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: errors.array()
      }
    });
  }
  next();
};

// Register new user
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/),
    body('type').isIn(['personal', 'practitioner']),
    body('profile.age').optional().isInt({ min: 1, max: 150 }),
    body('profile.sex').optional().isIn(['male', 'female', 'other']),
    body('profile.height').optional().isFloat({ min: 50, max: 300 }),
    body('profile.weight').optional().isFloat({ min: 20, max: 500 })
  ],
  handleValidation,
  authController.register
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  handleValidation,
  authController.login
);

// Refresh token
router.post('/refresh',
  [
    body('refreshToken').notEmpty()
  ],
  handleValidation,
  authController.refreshToken
);

// Logout
router.post('/logout',
  authenticate,
  authController.logout
);

// Forgot password
router.post('/forgot-password',
  [
    body('email').isEmail().normalizeEmail()
  ],
  handleValidation,
  authController.forgotPassword
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/),
  ],
  handleValidation,
  authController.resetPassword
);

// Verify email
router.post('/verify-email',
  [
    body('token').notEmpty()
  ],
  handleValidation,
  authController.verifyEmail
);

// Resend verification email
router.post('/resend-verification',
  [
    body('email').isEmail().normalizeEmail()
  ],
  handleValidation,
  authController.resendVerification
);

module.exports = router;