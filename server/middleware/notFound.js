const { sendError } = require('../utils/apiResponse');

/**
 * Catch-all middleware for non-matching API routes (404)
 */
const notFound = (req, res, next) => {
  const message = `Not Found - Path: ${req.originalUrl}`;
  return sendError(res, message, 404);
};

module.exports = notFound;
