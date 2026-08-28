const Notification = require('../models/Notification');
const { generateInventoryNotifications } = require('../services/notificationService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const notificationController = {
  /**
   * GET /api/notifications
   * List all notifications (most recent first) with optional unread filter.
   */
  getNotifications: async (req, res, next) => {
    try {
      const { unreadOnly, type, page = 1, limit = 20 } = req.query;
      const query = {};
      if (unreadOnly === 'true') query.read = false;
      if (type) query.type = type;

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      const notifications = await Notification.find(query)
        .sort('-createdAt')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      const totalCount = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({ read: false });

      return sendSuccess(res, 'Notifications fetched successfully', {
        notifications,
        unreadCount,
        pagination: { totalCount, page: pageNum, limit: limitNum, totalPages: Math.ceil(totalCount / limitNum) }
      });
    } catch (error) { next(error); }
  },

  /**
   * PATCH /api/notifications/:id/read — mark one as read
   */
  markRead: async (req, res, next) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { read: true },
        { new: true }
      );
      if (!notification) return sendError(res, 'Notification not found', 404);
      return sendSuccess(res, 'Notification marked as read', notification);
    } catch (error) { next(error); }
  },

  /**
   * PATCH /api/notifications/read-all — mark all as read
   */
  markAllRead: async (req, res, next) => {
    try {
      await Notification.updateMany({ read: false }, { read: true });
      return sendSuccess(res, 'All notifications marked as read');
    } catch (error) { next(error); }
  },

  /**
   * POST /api/notifications/generate — trigger inventory scan
   */
  generateNotifications: async (req, res, next) => {
    try {
      const { expiryThresholdDays = 90 } = req.body;
      await generateInventoryNotifications(Number(expiryThresholdDays));
      return sendSuccess(res, 'Inventory scan complete. Notifications generated.');
    } catch (error) { next(error); }
  }
};

module.exports = notificationController;
