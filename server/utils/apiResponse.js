/**
 * Send a success response.
 * @param {Object} res - Express response object
 * @param {String} message - Custom message
 * @param {Object} data - Payload data
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const sendSuccess = (res, message = 'Operation successful', data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response.
 * @param {Object} res - Express response object
 * @param {String} message - Error details or message
 * @param {Number} statusCode - HTTP status code (default: 500)
 */
const sendError = (res, message = 'Something went wrong', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message
  });
};

module.exports = {
  sendSuccess,
  sendError
};
