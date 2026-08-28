const { sendError } = require('../utils/apiResponse');

/**
 * Express Global Error Handling Middleware
 * Sanitizes and securely structures backend error responses
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // 1. Mongoose Bad ObjectId / CastError
  if (err.name === 'CastError') {
    message = `Resource not found with invalid identifier format: ${err.value}`;
    statusCode = 400;
  }

  // 2. Mongoose Duplicate Key Error (Code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. A record with this value already exists.`;
    statusCode = 409;
  }

  // 3. Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map(val => val.message);
    message = messages.join('. ');
    statusCode = 400;
  }

  // 4. JWT Verification Errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token signature.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Authentication token has expired. Please log in again.';
    statusCode = 401;
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error('Unhandled Server Error:', err.stack || err);
  }

  return sendError(res, message, statusCode);
};

module.exports = errorHandler;
