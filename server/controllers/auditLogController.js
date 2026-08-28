const AuditLog = require('../models/AuditLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Utility helper — called from other controllers to record audit events.
 */
const recordAuditLog = async ({ userId, action, entity, entityId, description, ipAddress }) => {
  try {
    const log = new AuditLog({ user: userId, action, entity, entityId, description, ipAddress });
    await log.save();
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
};

const auditLogController = {
  /**
   * GET /api/audit-logs
   */
  getAuditLogs: async (req, res, next) => {
    try {
      const { search, action, startDate, endDate, page = 1, limit = 20 } = req.query;

      const query = {};

      if (action) query.action = action;

      if (search) {
        query.$or = [
          { description: { $regex: search, $options: 'i' } },
          { entity: { $regex: search, $options: 'i' } },
          { action: { $regex: search, $options: 'i' } }
        ];
      }

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const pageNum  = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      const logs = await AuditLog.find(query)
        .populate('user', 'name email role')
        .sort('-timestamp')
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

      const totalCount = await AuditLog.countDocuments(query);

      return sendSuccess(res, 'Audit logs fetched successfully', {
        logs,
        pagination: { totalCount, page: pageNum, limit: limitNum, totalPages: Math.ceil(totalCount / limitNum) }
      });
    } catch (error) { next(error); }
  }
};

module.exports = { auditLogController, recordAuditLog };
