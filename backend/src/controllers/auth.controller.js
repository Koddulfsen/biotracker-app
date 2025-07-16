const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');
const emailService = require('../services/email.service');
const auth0Service = require('../services/auth0.service');

const generateTokens = (userId, email) => {
  const payload = { sub: userId, email };
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
  });

  return { accessToken, refreshToken };
};

const register = async (req, res, next) => {
  const trx = await db.transaction();

  try {
    const { email, password, type, profile, practitioner } = req.body;

    // Check if user already exists
    const existingUser = await trx('users').where({ email }).first();
    if (existingUser) {
      throw new AppError('USER_EXISTS', 'User with this email already exists', 400);
    }

    // Create Auth0 user
    const auth0User = await auth0Service.createUser({
      email,
      password,
      connection: 'Username-Password-Authentication',
      user_metadata: { type, tier: 'freemium' }
    });

    // Create user in database
    const [user] = await trx('users').insert({
      id: uuidv4(),
      auth0_id: auth0User.user_id,
      email,
      user_type: type,
      user_tier: 'freemium',
      email_verified: false
    }).returning('*');

    // Create user profile
    if (profile) {
      await trx('user_profiles').insert({
        id: uuidv4(),
        user_id: user.id,
        ...profile
      });
    }

    // Create practitioner profile if applicable
    if (type === 'practitioner' && practitioner) {
      await trx('practitioner_profiles').insert({
        id: uuidv4(),
        user_id: user.id,
        ...practitioner,
        verified: false
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Create session
    await trx('user_sessions').insert({
      id: uuidv4(),
      user_id: user.id,
      session_token: refreshToken,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    await trx.commit();

    // Send verification email
    await emailService.sendVerificationEmail(email, user.id);

    logger.info('User registered successfully', { userId: user.id, email });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        type: user.user_type,
        tier: user.user_tier
      },
      token: accessToken,
      refreshToken
    });
  } catch (error) {
    await trx.rollback();
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Auth0
    const authResult = await auth0Service.authenticate({
      username: email,
      password,
      scope: 'openid profile email'
    });

    // Get user from database
    const user = await db('users')
      .where({ email, is_active: true })
      .first();

    if (!user) {
      throw new AppError('AUTH_FAILED', 'Invalid credentials', 401);
    }

    // Get user profile
    const profile = await db('user_profiles')
      .where({ user_id: user.id })
      .first();

    // Get subscription
    const subscription = await db('subscriptions')
      .where({ user_id: user.id, status: 'active' })
      .first();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    // Update/create session
    await db('user_sessions')
      .where({ user_id: user.id, is_active: true })
      .update({ ended_at: db.fn.now(), is_active: false });

    await db('user_sessions').insert({
      id: uuidv4(),
      user_id: user.id,
      session_token: refreshToken,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Update last login
    await db('users')
      .where({ id: user.id })
      .update({ last_login_at: db.fn.now() });

    logger.info('User logged in successfully', { userId: user.id });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        type: user.user_type,
        tier: user.user_tier,
        emailVerified: user.email_verified,
        profile
      },
      subscription,
      token: accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if session is valid
    const session = await db('user_sessions')
      .where({
        user_id: decoded.sub,
        session_token: refreshToken,
        is_active: true
      })
      .first();

    if (!session) {
      throw new AppError('AUTH_INVALID', 'Invalid refresh token', 401);
    }

    // Get user
    const user = await db('users')
      .where({ id: decoded.sub, is_active: true })
      .first();

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 401);
    }

    // Generate new tokens
    const tokens = generateTokens(user.id, user.email);

    // Update session
    await db('user_sessions')
      .where({ id: session.id })
      .update({
        session_token: tokens.refreshToken,
        last_activity_at: db.fn.now()
      });

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // End all active sessions for user
    await db('user_sessions')
      .where({ user_id: req.user.id, is_active: true })
      .update({
        ended_at: db.fn.now(),
        is_active: false
      });

    logger.info('User logged out', { userId: req.user.id });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { sub: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Save token hash
    await db('users')
      .where({ id: user.id })
      .update({
        metadata: db.raw("metadata || ?::jsonb", [
          JSON.stringify({ resetToken, resetTokenExpires: Date.now() + 3600000 })
        ])
      });

    // Send reset email
    await emailService.sendPasswordResetEmail(email, resetToken);

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'password_reset') {
      throw new AppError('AUTH_INVALID', 'Invalid reset token', 400);
    }

    // Get user and check token
    const user = await db('users').where({ id: decoded.sub }).first();
    if (!user || user.metadata?.resetToken !== token) {
      throw new AppError('AUTH_INVALID', 'Invalid or expired reset token', 400);
    }

    if (user.metadata?.resetTokenExpires < Date.now()) {
      throw new AppError('AUTH_EXPIRED', 'Reset token has expired', 400);
    }

    // Update password in Auth0
    await auth0Service.updateUserPassword(user.auth0_id, password);

    // Clear reset token
    await db('users')
      .where({ id: user.id })
      .update({
        metadata: db.raw("metadata - 'resetToken' - 'resetTokenExpires'")
      });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'email_verification') {
      throw new AppError('AUTH_INVALID', 'Invalid verification token', 400);
    }

    // Update user
    await db('users')
      .where({ id: decoded.sub })
      .update({ email_verified: true });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user || user.email_verified) {
      return res.json({ message: 'Verification email sent if applicable' });
    }

    await emailService.sendVerificationEmail(email, user.id);

    res.json({ message: 'Verification email sent if applicable' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
};