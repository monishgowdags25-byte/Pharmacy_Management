const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { sendError } = require('../utils/apiResponse');

/**
 * Database Readiness Check Middleware
 * Connects / ensures connection before processing queries (especially in serverless environments like Vercel)
 */
const requireDB = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    return sendError(
      res, 
      `Database connection failed: ${error.message}. Please check Vercel Environment Variables (MONGO_URI) and MongoDB Atlas IP access list.`, 
      503
    );
  }
};

module.exports = requireDB;
