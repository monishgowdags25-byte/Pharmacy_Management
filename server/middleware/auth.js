const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Middleware to authenticate requests via JWT
 */
const authenticate = async (req, res, next) => {
  let token;

  // Check for Authorization Header starting with Bearer
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 'Access denied. No authentication token provided.', 401);
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    
    // Find user and attach to request
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'Authentication failed. User no longer exists.', 401);
    }

    if (user.status === 'Inactive') {
      return sendError(res, 'Authentication failed. This user account is deactivated.', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return sendError(res, 'Authentication failed. Invalid or expired token.', 401);
  }
};

/**
 * Middleware to restrict route access to specific roles
 * @param {...String} allowedRoles - Array of roles permitted to access
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required to check authorization.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, `Forbidden. Role '${req.user.role}' is not authorized to access this resource.`, 403);
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
