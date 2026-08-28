const Return = require('../models/Return');
const ReturnItem = require('../models/ReturnItem');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const InventoryLog = require('../models/InventoryLog');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { recordAuditLog } = require('./auditLogController');

const returnController = {
  /**
   * Fetch all returns paginated
   * GET /api/returns
   */
  getReturns: async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10 } = req.query;

      const query = {};

      if (search) {
        query.returnNumber = { $regex: search, $options: 'i' };
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const returns = await Return.find(query)
        .populate('sale', 'invoiceNumber')
        .populate('customer', 'name phone')
        .populate('createdBy', 'name')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);

      const totalCount = await Return.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);

      return sendSuccess(res, 'Returns fetched successfully', {
        returns,
        pagination: {
          totalCount,
          totalPages,
          page: pageNum,
          limit: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch single return details with line items
   * GET /api/returns/:id
   */
  getReturnById: async (req, res, next) => {
    try {
      const returnSlip = await Return.findById(req.params.id)
        .populate('sale', 'invoiceNumber saleDate totalAmount')
        .populate('customer', 'name phone address')
        .populate('createdBy', 'name');

      if (!returnSlip) {
        return sendError(res, 'Return slip record not found', 404);
      }

      const items = await ReturnItem.find({ return: returnSlip._id })
        .populate('medicine', 'name genericName unit strength barcode');

      return sendSuccess(res, 'Return details fetched successfully', { return: returnSlip, items });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Process return slip and restore inventory stock if eligible
   * POST /api/returns
   */
  createReturn: async (req, res, next) => {
    try {
      const { saleId, reason, refundMethod = 'CASH', refundAmount, items } = req.body;

      // 1. Validations
      if (!saleId) return sendError(res, 'Sale invoice reference is required', 400);
      if (!reason) return sendError(res, 'Reason for return is required', 400);
      if (!items || items.length === 0) return sendError(res, 'Return must contain at least one line item', 400);

      const sale = await Sale.findById(saleId);
      if (!sale) return sendError(res, 'Sale invoice not found', 404);

      const cashierId = req.user.id;

      // Verify return item-level limits
      for (const item of items) {
        if (!item.medicineId || !item.batchNumber) {
          return sendError(res, 'Invalid item properties', 400);
        }
        if (item.quantity <= 0) {
          return sendError(res, 'Return quantities must be greater than zero', 400);
        }

        // Fetch originally sold quantity
        const soldItem = await SaleItem.findOne({
          sale: saleId,
          medicine: item.medicineId,
          batchNumber: item.batchNumber
        });

        if (!soldItem) {
          const med = await Medicine.findById(item.medicineId);
          return sendError(res, `Medicine "${med ? med.name : 'Unknown'}" [Batch ${item.batchNumber}] was not originally sold on this invoice.`, 400);
        }

        // Fetch aggregate previous returns for this sale
        const previousReturns = await ReturnItem.find({
          medicine: item.medicineId,
          batchNumber: item.batchNumber
        }).populate('return');

        const alreadyReturnedQty = previousReturns.reduce((acc, curr) => {
          if (curr.return && curr.return.sale.toString() === saleId.toString()) {
            return acc + curr.quantity;
          }
          return acc;
        }, 0);

        if (item.quantity + alreadyReturnedQty > soldItem.quantity) {
          return sendError(res, `Return quantity exceeds original invoice purchase limit. Originally purchased: ${soldItem.quantity}, Already returned: ${alreadyReturnedQty}, Requested return: ${item.quantity}`, 400);
        }
      }

      // Generate unique returnNumber
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const returnNumber = `RET-${todayStr}-${randomSuffix}`;

      // 2. Save Return Header
      const returnSlip = new Return({
        returnNumber,
        sale: saleId,
        customer: sale.customer || null,
        reason,
        refundMethod,
        refundAmount: Number(refundAmount),
        status: 'Completed',
        createdBy: cashierId,
        returnDate: new Date()
      });
      await returnSlip.save();

      // 3. Process items restocking and save Return Items
      const savedItems = [];
      for (const item of items) {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice);
        const returnItem = new ReturnItem({
          return: returnSlip._id,
          medicine: item.medicineId,
          batchNumber: item.batchNumber,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          subtotal: itemTotal
        });
        await returnItem.save();
        savedItems.push(returnItem);

        // Inventory Stock Restoration Eligibility Check
        const batch = await Batch.findOne({
          medicine: item.medicineId,
          batchNumber: item.batchNumber
        });

        const med = await Medicine.findById(item.medicineId);
        
        // Stock restoration eligibility logic: batch not expired and medicine status Active
        const isEligible = batch && batch.expiryDate > new Date() && med && med.status === 'Active';

        if (isEligible) {
          const previousQty = batch.currentQuantity;
          batch.currentQuantity += Number(item.quantity);
          await batch.save();

          // Create ledger log
          const log = new InventoryLog({
            medicine: item.medicineId,
            batch: batch._id,
            type: 'RETURN',
            quantity: Number(item.quantity),
            previousQuantity: previousQty,
            newQuantity: batch.currentQuantity,
            user: cashierId
          });
          await log.save();
        }
      }

      await recordAuditLog({
        userId: cashierId,
        action: 'CREATE_RETURN',
        entity: 'Return',
        entityId: returnSlip._id,
        description: `Return ${returnSlip.returnNumber} processed for sale ${sale.invoiceNumber}`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'Return processed successfully', { return: returnSlip, items: savedItems }, 201);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = returnController;
