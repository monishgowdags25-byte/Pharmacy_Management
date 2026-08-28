const demoDataService = require('../services/demoDataService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const demoController = {
  seedAll: async (req, res, next) => {
    try {
      const result = await demoDataService.seedAllDemoData(req.user);
      return sendSuccess(res, 'Complete demo dataset generated successfully into MongoDB.', result);
    } catch (err) {
      next(err);
    }
  },

  seedCategories: async (req, res, next) => {
    try {
      const result = await demoDataService.seedCategories();
      return sendSuccess(res, `Generated ${result.createdCount} demo categories successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedMedicines: async (req, res, next) => {
    try {
      const result = await demoDataService.seedMedicines();
      return sendSuccess(res, `Generated ${result.createdCount} demo medicines successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedInventory: async (req, res, next) => {
    try {
      const result = await demoDataService.seedInventory(req.user);
      return sendSuccess(res, `Generated ${result.createdCount} demo stock batches successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedSuppliers: async (req, res, next) => {
    try {
      const result = await demoDataService.seedSuppliers();
      return sendSuccess(res, `Generated ${result.createdCount} demo suppliers successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedPurchases: async (req, res, next) => {
    try {
      const result = await demoDataService.seedPurchases(req.user);
      return sendSuccess(res, `Generated ${result.createdCount} demo purchase orders successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedSales: async (req, res, next) => {
    try {
      const result = await demoDataService.seedSales(req.user);
      return sendSuccess(res, `Generated ${result.createdCount} demo POS sales transactions successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedCustomers: async (req, res, next) => {
    try {
      const result = await demoDataService.seedCustomers();
      return sendSuccess(res, `Generated ${result.createdCount} demo customer profiles successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedPrescriptions: async (req, res, next) => {
    try {
      const result = await demoDataService.seedPrescriptions(req.user);
      return sendSuccess(res, `Generated ${result.createdCount} demo doctor prescriptions successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedReturns: async (req, res, next) => {
    try {
      const result = await demoDataService.seedReturns(req.user);
      return sendSuccess(res, `Generated ${result.createdCount} demo sales returns successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedExpenses: async (req, res, next) => {
    try {
      const result = await demoDataService.seedExpenses();
      return sendSuccess(res, `Generated ${result.createdCount} demo operational expenses successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedNotifications: async (req, res, next) => {
    try {
      const result = await demoDataService.seedNotifications();
      return sendSuccess(res, `Generated ${result.createdCount} demo stock & expiry notifications successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedAuditLogs: async (req, res, next) => {
    try {
      const result = await demoDataService.seedAuditLogs(req.user);
      return sendSuccess(res, `Generated ${result.createdCount} demo audit trail entries successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  seedUsers: async (req, res, next) => {
    try {
      const result = await demoDataService.seedUsers();
      return sendSuccess(res, `Generated ${result.createdCount} demo staff accounts successfully.`, result);
    } catch (err) {
      next(err);
    }
  },

  clearDemo: async (req, res, next) => {
    try {
      const result = await demoDataService.clearDemoData();
      return sendSuccess(res, `Safely purged ${result.totalDeleted} demo records. Real user data untouched.`, result);
    } catch (err) {
      next(err);
    }
  },

  getStatus: async (req, res, next) => {
    try {
      const result = await demoDataService.getDemoStatus();
      return sendSuccess(res, 'Demo status retrieved successfully', result);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = demoController;
