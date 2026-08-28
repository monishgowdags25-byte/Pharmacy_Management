const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Medicine = require('../models/Medicine');
const { recordAuditLog } = require('./auditLogController');
const Prescription = require('../models/Prescription');
const PrescriptionItem = require('../models/PrescriptionItem');
const inventoryService = require('../services/inventoryService');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const saleController = {
  /**
   * Fetch paginated list of sales
   * GET /api/sales
   */
  getSales: async (req, res, next) => {
    try {
      const { search, status, paymentMethod, customerId, sort = '-createdAt', page = 1, limit = 10 } = req.query;

      const query = {};

      if (status) query.status = status;
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (customerId) query.customer = customerId;

      if (search) {
        query.invoiceNumber = { $regex: search, $options: 'i' };
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const sales = await Sale.find(query)
        .populate('customer', 'name phone')
        .populate('user', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      const totalCount = await Sale.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);

      return sendSuccess(res, 'Sales fetched successfully', {
        sales,
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
   * Fetch single sale details with line items
   * GET /api/sales/:id
   */
  getSaleById: async (req, res, next) => {
    try {
      const sale = await Sale.findById(req.params.id)
        .populate('customer', 'name phone email address dateOfBirth notes')
        .populate('prescription', 'prescriptionNumber doctorName doctorRegistrationNumber status')
        .populate('user', 'name');

      if (!sale) {
        return sendError(res, 'Sale record not found', 404);
      }

      const items = await SaleItem.find({ sale: sale._id })
        .populate('medicine', 'name genericName unit barcode strength');

      return sendSuccess(res, 'Sale details fetched successfully', { sale, items });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create POS sale transaction (FEFO multi-batch splitting + prescription validations)
   * POST /api/sales
   */
  createSale: async (req, res, next) => {
    try {
      const { 
        customerId, discountAmount = 0, taxAmount = 0, 
        paymentMethod = 'CASH', items, prescriptionId 
      } = req.body;

      // 1. Validations
      if (!items || items.length === 0) {
        return sendError(res, 'POS cart is empty', 400);
      }

      const cashierId = req.user.id;
      const validPaymentMethods = ['CASH', 'CARD', 'UPI', 'OTHER'];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return sendError(res, 'Invalid payment method', 400);
      }

      // Pre-validation of medicine stock and negative values
      let requiresPrescription = false;
      const prescriptionNeededNames = [];
      
      for (const item of items) {
        if (!item.medicineId) return sendError(res, 'Invalid product selection', 400);
        if (item.quantity <= 0) return sendError(res, 'Quantity must be positive', 400);
        if (item.unitPrice < 0) return sendError(res, 'Prices cannot be negative', 400);

        const med = await Medicine.findById(item.medicineId);
        if (med) {
          if (med.prescriptionRequired) {
            requiresPrescription = true;
            prescriptionNeededNames.push(med.name);
          }
        }

        // Pre-assert non-expired active stock availability
        const isAvailable = await inventoryService.checkStockAvailability(item.medicineId, item.quantity);
        if (!isAvailable) {
          return sendError(res, `Insufficient stock for medicine "${med ? med.name : 'Unknown'}".`, 400);
        }
      }

      // 1.1 Restricted Drug prescription checks
      if (requiresPrescription) {
        if (!prescriptionId) {
          return sendError(res, `Prescription required for restricted drugs: ${prescriptionNeededNames.join(', ')}`, 400);
        }

        const rx = await Prescription.findById(prescriptionId);
        if (!rx) {
          return sendError(res, 'Prescription record not found', 400);
        }

        if (rx.status !== 'VERIFIED') {
          return sendError(res, `Prescription is in status "${rx.status}". Only VERIFIED prescriptions can be dispensed.`, 400);
        }

        // Verify matches customer account
        if (!customerId || rx.customer.toString() !== customerId.toString()) {
          return sendError(res, 'Prescription customer name does not match checkout customer account', 400);
        }

        // Verify the prescription authorizes the drugs in the cart
        const rxItems = await PrescriptionItem.find({ prescription: rx._id });
        for (const name of prescriptionNeededNames) {
          const matchingRxItem = rxItems.find(rit => {
            const isNameMatch = rit.medicineName.toLowerCase() === name.toLowerCase();
            const isIdMatch = rit.medicine && items.some(it => it.medicineId.toString() === rit.medicine.toString());
            return isNameMatch || isIdMatch;
          });
          if (!matchingRxItem) {
            return sendError(res, `Prescription does not authorize medicine "${name}".`, 400);
          }
        }

        // Dispense the prescription
        rx.status = 'DISPENSED';
        await rx.save();
      }

      // Generate Invoice number INV-YYYYMMDD-XXXX
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const invoiceNumber = `INV-${todayStr}-${randomSuffix}`;

      // Calculate Total amounts
      const itemsSubtotal = items.reduce((acc, curr) => acc + (Number(curr.quantity) * Number(curr.unitPrice)), 0);
      const grandTotal = Math.max(0, itemsSubtotal + Number(taxAmount) - Number(discountAmount));

      // 2. Instantiate Sale Header
      const sale = new Sale({
        invoiceNumber,
        customer: customerId || null,
        prescription: prescriptionId || null,
        user: cashierId,
        saleDate: new Date(),
        totalAmount: grandTotal,
        discountAmount: Number(discountAmount),
        taxAmount: Number(taxAmount),
        paymentMethod,
        status: 'Completed'
      });
      await sale.save();

      // 3. Process FEFO Stock Subtraction and Save Sale Items
      const savedItems = [];
      for (const item of items) {
        const deductions = await inventoryService.deductStockFEFO(
          item.medicineId,
          Number(item.quantity),
          cashierId,
          'SALE'
        );

        for (const dec of deductions) {
          const proRatedTax = (Number(item.taxAmount || 0) / Number(item.quantity)) * dec.quantityDeducted;
          const subtotalCost = Number(item.unitPrice) * dec.quantityDeducted;

          const saleItem = new SaleItem({
            sale: sale._id,
            medicine: item.medicineId,
            batchNumber: dec.batchNumber,
            quantity: dec.quantityDeducted,
            unitPrice: Number(item.unitPrice),
            taxAmount: proRatedTax,
            subtotal: subtotalCost
          });

          await saleItem.save();
          savedItems.push(saleItem);
        }
      }

      // 4. Generate Security Audit Trail Log
      await recordAuditLog({
        userId: cashierId,
        action: 'CREATE_SALE',
        entity: 'Sale',
        entityId: sale._id,
        description: `Created sale invoice ${invoiceNumber} totaling $${grandTotal.toFixed(2)}`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'POS Sale completed successfully', { sale, items: savedItems }, 201);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = saleController;
