const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { recordAuditLog } = require('./auditLogController');

// Helper: Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, 
    process.env.JWT_SECRET || 'your_jwt_secret_key_here', 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const authController = {
  /**
   * Log in user
   * POST /api/auth/login
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendError(res, 'Please provide both email and password', 400);
      }

      // Find user and explicitly select password to compare
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return sendError(res, 'Invalid credentials provided', 401);
      }

      // Check password matching
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return sendError(res, 'Invalid credentials provided', 401);
      }

      // Check status
      if (user.status === 'Inactive') {
        return sendError(res, 'This user account has been deactivated.', 403);
      }

      // Generate token and respond
      const token = generateToken(user._id);
      
      // Clean password manually before sending (since we explicitly selected it)
      const userJSON = user.toJSON();
      
      // Record audit log
      await recordAuditLog({
        userId: user._id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user._id,
        description: `${user.name} (${user.role}) logged in`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'Logged in successfully', {
        user: userJSON,
        token
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch current user profile
   * GET /api/auth/me
   */
  getMe: async (req, res, next) => {
    try {
      return sendSuccess(res, 'Profile fetched successfully', {
        user: req.user
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change user password
   * POST /api/auth/change-password
   */
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return sendError(res, 'Please enter current and new passwords', 400);
      }

      // Fetch user with password
      const user = await User.findById(req.user._id).select('+password');
      
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return sendError(res, 'Current password is incorrect', 400);
      }

      // Set new password (pre-save hook hashes it)
      user.password = newPassword;
      await user.save();

      return sendSuccess(res, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
