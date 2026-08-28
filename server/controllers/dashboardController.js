const dashboardService = require('../services/dashboardService');
const { sendSuccess } = require('../utils/apiResponse');

const dashboardController = {
  /**
   * Fetch aggregated dashboard statistics summary
   * GET /api/dashboard/summary
   */
  getSummary: async (req, res, next) => {
    try {
      const summary = await dashboardService.getDashboardSummary();
      return sendSuccess(res, 'Dashboard statistics aggregated successfully', summary);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = dashboardController;
