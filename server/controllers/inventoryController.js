const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const InventoryLog = require('../models/InventoryLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { recordAuditLog } = require('./auditLogController');

const inventoryController = {
  /**
   * Fetch all batches with dynamic calculations
   * GET /api/inventory/batches
   */
  getBatches: async (req, res, next) => {
    try {
      const { search, status, medicineId } = req.query;

      const query = {};
      if (medicineId) {
        query.medicine = medicineId;
      }

      // Populate medicine and supplier details
      let batches = await Batch.find(query)
        .populate('medicine', 'name genericName reorderLevel unit')
        .populate('supplier', 'name companyName')
        .sort({ expiryDate: 1 });

      const today = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      // Map dynamic status tags to batch records
      let calculatedBatches = batches.map(batch => {
        const batchJSON = batch.toJSON();
        const expiry = new Date(batch.expiryDate);
        
        let batchStatus = 'IN_STOCK';
        if (expiry <= today) {
          batchStatus = 'EXPIRED';
        } else if (expiry <= ninetyDaysFromNow) {
          batchStatus = 'EXPIRING_SOON';
        } else if (batch.currentQuantity === 0) {
          batchStatus = 'OUT_OF_STOCK';
        } else if (batch.currentQuantity <= (batch.medicine?.reorderLevel || 10)) {
          batchStatus = 'LOW_STOCK';
        }

        batchJSON.status = batchStatus;
        return batchJSON;
      });

      // Filter by dynamic status if requested
      if (status) {
        calculatedBatches = calculatedBatches.filter(b => b.status === status);
      }

      // Search by batchNumber or Medicine Name
      if (search) {
        const lowerSearch = search.toLowerCase();
        calculatedBatches = calculatedBatches.filter(b => 
          b.batchNumber.toLowerCase().includes(lowerSearch) || 
          b.medicine?.name.toLowerCase().includes(lowerSearch) ||
          b.medicine?.genericName.toLowerCase().includes(lowerSearch)
        );
      }

      return sendSuccess(res, 'Batches fetched successfully', { batches: calculatedBatches });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch inventory alerts (Expired, Expiring in 90 days, Low Stock items)
   * GET /api/inventory/alerts
   */
  getInventoryAlerts: async (req, res, next) => {
    try {
      const today = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      // 1. Expired Stock
      const expired = await Batch.find({
        currentQuantity: { $gt: 0 },
        expiryDate: { $lte: today }
      }).populate('medicine', 'name genericName unit');

      // 2. Expiring soon (90 days)
      const expiringSoon = await Batch.find({
        currentQuantity: { $gt: 0 },
        expiryDate: { $gt: today, $lte: ninetyDaysFromNow }
      }).populate('medicine', 'name genericName unit');

      // 3. Low stock medicines (Group active stock by medicine to find aggregate quantities)
      const stockGroups = await Batch.aggregate([
        { $match: { expiryDate: { $gt: today } } },
        { $group: { _id: '$medicine', totalStock: { $sum: '$currentQuantity' } } }
      ]);

      const stockMap = {};
      stockGroups.forEach(g => {
        stockMap[g._id.toString()] = g.totalStock;
      });

      const allActiveMeds = await Medicine.find({ status: 'Active' }).populate('category', 'name');
      const lowStock = allActiveMeds.filter(med => {
        const currentStock = stockMap[med._id.toString()] || 0;
        return currentStock <= (med.reorderLevel || 10);
      }).map(med => {
        const medJSON = med.toJSON();
        medJSON.totalStock = stockMap[med._id.toString()] || 0;
        return medJSON;
      });

      return sendSuccess(res, 'Inventory alerts loaded successfully', {
        alerts: {
          expiredCount: expired.length,
          expiringCount: expiringSoon.length,
          lowStockCount: lowStock.length,
          expiredList: expired,
          expiringList: expiringSoon,
          lowStockList: lowStock
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Record manual stock adjustment (Increase/Decrease)
   * POST /api/inventory/adjust
   */
  adjustStock: async (req, res, next) => {
    try {
      const { batchId, quantity, type, reason } = req.body;

      if (!batchId || !quantity || !type || !reason) {
        return sendError(res, 'Please provide batchId, adjustment quantity, type, and reason', 400);
      }

      if (quantity <= 0) {
        return sendError(res, 'Adjustment quantity must be a positive number', 400);
      }

      const batch = await Batch.findById(batchId).populate('medicine');
      if (!batch) {
        return sendError(res, 'Inventory batch record not found', 404);
      }

      const previousQty = batch.currentQuantity;
      let newQty = previousQty;

      if (type === 'INCREASE') {
        newQty += Number(quantity);
      } else if (type === 'DECREASE') {
        if (previousQty < quantity) {
          return sendError(res, `Insufficient stock to perform decrease. Available: ${previousQty}, Request: ${quantity}`, 400);
        }
        newQty -= Number(quantity);
      } else {
        return sendError(res, 'Invalid adjustment direction type. Must be INCREASE or DECREASE', 400);
      }

      // Save updated batch quantity
      batch.currentQuantity = newQty;
      await batch.save();

      // Log the adjustment to the ledger
      const logType = type === 'INCREASE' ? 'ADJUSTMENT_INCREASE' : 'ADJUSTMENT_DECREASE';
      const log = new InventoryLog({
        medicine: batch.medicine._id,
        batch: batch._id,
        type: logType,
        quantity: Number(quantity),
        previousQuantity: previousQty,
        newQuantity: newQty,
        reason: reason,
        user: req.user.id
      });
      await log.save();

      await recordAuditLog({
        userId: req.user?._id,
        action: 'ADJUST_STOCK',
        entity: 'Batch',
        entityId: batch._id,
        description: `Stock ${type === 'INCREASE' ? 'increased' : 'decreased'} by ${quantity} for batch ${batch.batchNumber}. Reason: ${reason || 'N/A'}`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'Stock adjustment completed successfully', {
        batch: {
          _id: batch._id,
          batchNumber: batch.batchNumber,
          currentQuantity: batch.currentQuantity
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch all inventory log timeline history
   * GET /api/inventory/history
   */
  getStockHistory: async (req, res, next) => {
    try {
      const { medicineId, batchId, type } = req.query;

      const query = {};
      if (medicineId) query.medicine = medicineId;
      if (batchId) query.batch = batchId;
      if (type) query.type = type;

      const logs = await InventoryLog.find(query)
        .populate('medicine', 'name genericName unit')
        .populate('batch', 'batchNumber')
        .populate('user', 'name role')
        .sort({ createdAt: -1 })
        .limit(100); // Caps at 100 historical timeline elements

      return sendSuccess(res, 'Inventory log history fetched successfully', { logs });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = inventoryController;
