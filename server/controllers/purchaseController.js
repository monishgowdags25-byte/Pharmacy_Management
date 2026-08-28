const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Medicine = require('../models/Medicine');
const inventoryService = require('../services/inventoryService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { recordAuditLog } = require('./auditLogController');


const purchaseController = {
  /**
   * Fetch all purchases paginated
   * GET /api/purchases
   */
  getPurchases: async (req, res, next) => {
    try {
      const { search, status, paymentStatus, supplierId, sort = '-createdAt', page = 1, limit = 10 } = req.query;

      const query = {};

      if (status) query.status = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (supplierId) query.supplier = supplierId;

      if (search) {
        query.$or = [
          { purchaseNumber: { $regex: search, $options: 'i' } },
          { invoiceNumber: { $regex: search, $options: 'i' } }
        ];
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const purchases = await Purchase.find(query)
        .populate('supplier', 'name companyName')
        .populate('createdBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      const totalCount = await Purchase.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);

      return sendSuccess(res, 'Purchases fetched successfully', {
        purchases,
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
   * Fetch single purchase order details with line items
   * GET /api/purchases/:id
   */
  getPurchaseById: async (req, res, next) => {
    try {
      const purchase = await Purchase.findById(req.params.id)
        .populate('supplier', 'name companyName phone email address vatNumber')
        .populate('createdBy', 'name');

      if (!purchase) {
        return sendError(res, 'Purchase order not found', 404);
      }

      const items = await PurchaseItem.find({ purchase: purchase._id })
        .populate('medicine', 'name genericName unit barcode strength');

      return sendSuccess(res, 'Purchase details fetched successfully', { purchase, items });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new purchase order (DRAFT status by default)
   * POST /api/purchases
   */
  createPurchase: async (req, res, next) => {
    try {
      const { 
        invoiceNumber, supplierId, purchaseDate, 
        subtotal, tax, discount, grandTotal, 
        paymentStatus, notes, items 
      } = req.body;

      // 1. Validation Rules
      if (!invoiceNumber) return sendError(res, 'Invoice number is required', 400);
      if (!supplierId) return sendError(res, 'Supplier reference is required', 400);
      if (!items || items.length === 0) return sendError(res, 'Purchase must contain at least one line item', 400);

      // Validate items integrity
      for (const item of items) {
        if (!item.medicineId) return sendError(res, 'Invalid medicine catalog item', 400);
        if (!item.batchNumber) return sendError(res, 'Batch number is required for all products', 400);
        if (!item.expiryDate || new Date(item.expiryDate) <= new Date()) {
          return sendError(res, 'Valid expiry date (in the future) is required', 400);
        }
        if (item.quantity <= 0) return sendError(res, 'Quantities must be greater than zero', 400);
        if (item.purchasePrice < 0) return sendError(res, 'Purchase prices cannot be negative values', 400);
      }

      // Generate a unique purchase Number: PO + Date String + 3 random digits
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const purchaseNumber = `PO-${todayStr}-${randomSuffix}`;

      // 2. Save Purchase Header
      const purchase = new Purchase({
        purchaseNumber,
        invoiceNumber,
        supplier: supplierId,
        purchaseDate: purchaseDate || new Date(),
        subtotal: Number(subtotal),
        tax: Number(tax || 0),
        discount: Number(discount || 0),
        grandTotal: Number(grandTotal),
        paymentStatus: paymentStatus || 'Unpaid',
        status: 'DRAFT',
        notes,
        createdBy: req.user.id
      });
      await purchase.save();

      // 3. Save Purchase Line Items
      const purchaseItems = [];
      for (const item of items) {
        const itemTotal = Number(item.quantity) * Number(item.purchasePrice) + Number(item.tax || 0);
        const purchaseItem = new PurchaseItem({
          purchase: purchase._id,
          medicine: item.medicineId,
          batchNumber: item.batchNumber,
          expiryDate: new Date(item.expiryDate),
          quantity: Number(item.quantity),
          purchasePrice: Number(item.purchasePrice),
          tax: Number(item.tax || 0),
          totalCost: itemTotal
        });
        await purchaseItem.save();
        purchaseItems.push(purchaseItem);
      }

      return sendSuccess(res, 'Purchase order drafted successfully', { purchase, items: purchaseItems }, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update draft purchase order details
   * PUT /api/purchases/:id
   */
  updatePurchase: async (req, res, next) => {
    try {
      const purchaseId = req.params.id;
      const { 
        invoiceNumber, supplierId, purchaseDate, 
        subtotal, tax, discount, grandTotal, 
        paymentStatus, notes, items 
      } = req.body;

      const purchase = await Purchase.findById(purchaseId);
      if (!purchase) return sendError(res, 'Purchase order not found', 404);

      if (purchase.status !== 'DRAFT') {
        return sendError(res, 'Only draft purchase orders can be modified', 400);
      }

      // Validations
      if (!invoiceNumber) return sendError(res, 'Invoice number is required', 400);
      if (!supplierId) return sendError(res, 'Supplier reference is required', 400);
      if (!items || items.length === 0) return sendError(res, 'Purchase must contain at least one line item', 400);

      // Save headers updates
      purchase.invoiceNumber = invoiceNumber;
      purchase.supplier = supplierId;
      if (purchaseDate) purchase.purchaseDate = purchaseDate;
      purchase.subtotal = Number(subtotal);
      purchase.tax = Number(tax || 0);
      purchase.discount = Number(discount || 0);
      purchase.grandTotal = Number(grandTotal);
      if (paymentStatus) purchase.paymentStatus = paymentStatus;
      purchase.notes = notes;
      await purchase.save();

      // Delete old line items
      await PurchaseItem.deleteMany({ purchase: purchase._id });

      // Create new line items
      const purchaseItems = [];
      for (const item of items) {
        const itemTotal = Number(item.quantity) * Number(item.purchasePrice) + Number(item.tax || 0);
        const purchaseItem = new PurchaseItem({
          purchase: purchase._id,
          medicine: item.medicineId,
          batchNumber: item.batchNumber,
          expiryDate: new Date(item.expiryDate),
          quantity: Number(item.quantity),
          purchasePrice: Number(item.purchasePrice),
          tax: Number(item.tax || 0),
          totalCost: itemTotal
        });
        await purchaseItem.save();
        purchaseItems.push(purchaseItem);
      }

      return sendSuccess(res, 'Purchase order updated successfully', { purchase, items: purchaseItems });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Commit draft purchase order to active stock inventory
   * PUT /api/purchases/:id/complete
   */
  completePurchase: async (req, res, next) => {
    try {
      const purchaseId = req.params.id;
      const purchase = await Purchase.findById(purchaseId);
      if (!purchase) return sendError(res, 'Purchase order not found', 404);

      if (purchase.status !== 'DRAFT') {
        return sendError(res, 'Only draft purchases can be transitioned to COMPLETED', 400);
      }

      // Fetch line items
      const items = await PurchaseItem.find({ purchase: purchase._id });
      if (items.length === 0) {
        return sendError(res, 'Cannot complete an empty purchase order', 400);
      }

      // 1. Centralized update: loop items and insert stock into active inventory batches
      for (const item of items) {
        // Fetch selling price from catalog
        const medDoc = await Medicine.findById(item.medicine);
        const sellingPrice = medDoc ? medDoc.sellingPrice : (item.purchasePrice * 1.3);

        // Add stock and log transaction via central inventory service
        await inventoryService.addStock(
          item.medicine,
          item.batchNumber,
          item.quantity,
          purchase.supplier,
          item.expiryDate,
          new Date(), // Manufacturing date (defaults to today)
          item.purchasePrice,
          sellingPrice,
          req.user.id
        );
      }

      // 2. Set Status COMPLETED
      purchase.status = 'COMPLETED';
      await purchase.save();

      await recordAuditLog({
        userId: req.user?._id,
        action: 'COMPLETE_PURCHASE',
        entity: 'Purchase',
        entityId: purchase._id,
        description: `Purchase ${purchase.purchaseNumber} completed`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'Purchase completed successfully and active inventory has been restocked', { purchase });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Cancel draft purchase order
   * PUT /api/purchases/:id/cancel
   */
  cancelPurchase: async (req, res, next) => {
    try {
      const purchaseId = req.params.id;
      const purchase = await Purchase.findById(purchaseId);
      if (!purchase) return sendError(res, 'Purchase order not found', 404);

      if (purchase.status === 'COMPLETED') {
        return sendError(res, 'Completed purchase orders cannot be cancelled retroactively', 400);
      }

      if (purchase.status === 'CANCELLED') {
        return sendError(res, 'Purchase order is already cancelled', 400);
      }

      // Set Status CANCELLED
      purchase.status = 'CANCELLED';
      await purchase.save();

      await recordAuditLog({
        userId: req.user?._id,
        action: 'CANCEL_PURCHASE',
        entity: 'Purchase',
        entityId: purchase._id,
        description: `Purchase ${purchase.purchaseNumber} cancelled`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'Purchase order cancelled successfully', { purchase });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = purchaseController;
