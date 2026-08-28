const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

/**
 * Database Readiness Check Middleware
 * Prevents requests from hanging when database is not connected or authenticating
 */
const requireDB = (req, res, next) => {
  // 1 = connected, 2 = connecting
  if (mongoose.connection.readyState !== 1) {
    return sendError(
      res, 
      'Database is currently disconnected. Please verify your MongoDB connection string and password in the .env file.', 
      503
    );
  }
  next();
};

module.exports = requireDB;
