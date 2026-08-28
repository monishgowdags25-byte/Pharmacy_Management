const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { recordAuditLog } = require('./auditLogController');

const userController = {
  /**
   * Get all users
   * GET /api/users
   */
  getUsers: async (req, res, next) => {
    try {
      const users = await User.find({}).sort({ createdAt: -1 });
      return sendSuccess(res, 'Users fetched successfully', { users });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new user
   * POST /api/users
   */
  createUser: async (req, res, next) => {
    try {
      const { name, email, password, role, status } = req.body;

      if (!name || !email || !password) {
        return sendError(res, 'Name, email, and password are required fields', 400);
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return sendError(res, 'A user with this email address already exists', 400);
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        role,
        status
      });

      await user.save();

      await recordAuditLog({
        userId: req.user?._id,
        action: 'CREATE_USER',
        entity: 'User',
        entityId: user._id,
        description: `New user "${user.name}" (${user.role}) created`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'User created successfully', { user }, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user details
   * PUT /api/users/:id
   */
  updateUser: async (req, res, next) => {
    try {
      const { name, email, role, status, password } = req.body;
      const userId = req.params.id;

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      // If email is changing, make sure it is not already taken
      if (email && email !== user.email) {
        const emailTaken = await User.findOne({ email });
        if (emailTaken) {
          return sendError(res, 'Email address is already in use by another account', 400);
        }
        user.email = email;
      }

      const previousRole = user.role;

      // Update fields if provided
      if (name) user.name = name;
      if (role) user.role = role;
      if (status) user.status = status;
      
      // Update password if provided
      if (password) user.password = password; // pre-save hook will hash it

      await user.save();

      if (role && role !== previousRole) {
        await recordAuditLog({
          userId: req.user?._id,
          action: 'CHANGE_ROLE',
          entity: 'User',
          entityId: user._id,
          description: `User "${user.name}" role changed from ${previousRole} to ${role}`,
          ipAddress: req.ip
        });
      }

      return sendSuccess(res, 'User updated successfully', { user });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  deleteUser: async (req, res, next) => {
    try {
      const userId = req.params.id;

      // Restrict deleting own account
      if (userId === req.user._id.toString()) {
        return sendError(res, 'Decline deletion. You cannot delete your own active administrator account.', 400);
      }

      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      return sendSuccess(res, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
