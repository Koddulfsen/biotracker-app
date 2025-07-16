const { logger } = require('../utils/logger');

class AppError extends Error {
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError('RESOURCE_NOT_FOUND', message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError('DUPLICATE_VALUE', message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError('VALIDATION_ERROR', message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('AUTH_INVALID', 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('AUTH_EXPIRED', 'Token expired', 401);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    error: {
      code: error.code || 'SERVER_ERROR',
      message: error.message || 'Internal server error',
      details: error.details || null,
      requestId: req.id,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = { 
  AppError, 
  errorHandler 
};