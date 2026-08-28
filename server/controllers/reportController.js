const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Expense = require('../models/Expense');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const reportController = {
  /**
   * Sales Report
   * GET /api/reports/sales
   */
  getSalesReport: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const dateQuery = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) dateQuery.$lte = new Date(endDate);

      const query = { status: 'Completed' };
      if (startDate || endDate) query.saleDate = dateQuery;

      const sales = await Sale.find(query);

      let totalSales = 0; // gross subtotal sum before discounts/taxes
      let tax = 0;
      let discount = 0;
      let netSales = 0; // grand total sum

      sales.forEach(s => {
        netSales += s.totalAmount || 0;
        tax += s.taxAmount || 0;
        discount += s.discountAmount || 0;
        totalSales += (s.totalAmount + s.discountAmount - s.taxAmount) || 0;
      });

      return sendSuccess(res, 'Sales report generated successfully', {
        summary: {
          totalSales,
          transactions: sales.length,
          tax,
          discount,
          netSales
        },
        sales: sales.map(s => ({
          invoiceNumber: s.invoiceNumber,
          date: s.saleDate,
          paymentMethod: s.paymentMethod,
          totalAmount: s.totalAmount
        }))
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Purchase Report
   * GET /api/reports/purchases
   */
  getPurchaseReport: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const dateQuery = {};
      if (startDate) dateQuery.$gte = new Date(startDate);
      if (endDate) dateQuery.$lte = new Date(endDate);

      const query = { status: 'COMPLETED' };
      if (startDate || endDate) query.purchaseDate = dateQuery;

      const purchases = await Purchase.find(query).populate('supplier', 'companyName name');

      let totalPurchases = 0;
      const supplierStatsMap = {};

      purchases.forEach(p => {
        totalPurchases += p.grandTotal || 0;
        if (p.supplier) {
          const supId = p.supplier._id.toString();
          const name = p.supplier.companyName || p.supplier.name;
          if (!supplierStatsMap[supId]) {
            supplierStatsMap[supId] = { supplierName: name, count: 0, amount: 0 };
          }
          supplierStatsMap[supId].count++;
          supplierStatsMap[supId].amount += p.grandTotal;
        }
      });

      return sendSuccess(res, 'Purchase report generated successfully', {
        summary: {
          totalPurchases,
          numberOfPurchases: purchases.length
        },
        supplierWise: Object.values(supplierStatsMap),
        purchases: purchases.map(p => ({
          purchaseNumber: p.purchaseNumber,
          invoiceNumber: p.invoiceNumber,
          date: p.purchaseDate,
          supplierName: p.supplier ? (p.supplier.companyName || p.supplier.name) : 'Unknown',
          grandTotal: p.grandTotal
        }))
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Inventory Report
   * GET /api/reports/inventory
   */
  getInventoryReport: async (req, res, next) => {
    try {
      const allActiveMedicines = await Medicine.find({ status: 'Active' });
      const activeBatches = await Batch.find({ currentQuantity: { $gt: 0 } });
      const totalStock = activeBatches.reduce((acc, curr) => acc + curr.currentQuantity, 0);

      const now = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(now.getDate() + 90);

      const stockMap = {};
      let expiring = 0;
      let expired = 0;

      const allBatches = await Batch.find();
      allBatches.forEach(b => {
        if (b.expiryDate < now) {
          if (b.currentQuantity > 0) expired++;
        } else if (b.expiryDate <= ninetyDaysFromNow) {
          if (b.currentQuantity > 0) expiring++;
        }

        if (b.currentQuantity > 0 && b.expiryDate > now) {
          stockMap[b.medicine.toString()] = (stockMap[b.medicine.toString()] || 0) + b.currentQuantity;
        }
      });

      let lowStock = 0;
      let outOfStock = 0;

      allActiveMedicines.forEach(m => {
        const stock = stockMap[m._id.toString()] || 0;
        if (stock === 0) {
          outOfStock++;
        } else if (stock <= m.reorderLevel) {
          lowStock++;
        }
      });

      return sendSuccess(res, 'Inventory report generated successfully', {
        summary: {
          currentStock: totalStock,
          lowStock,
          outOfStock,
          expiring,
          expired
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Profit Report
   * GET /api/reports/profit
   */
  getProfitReport: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      const salesDateQuery = {};
      if (startDate) salesDateQuery.$gte = new Date(startDate);
      if (endDate) salesDateQuery.$lte = new Date(endDate);

      const salesQuery = { status: 'Completed' };
      if (startDate || endDate) salesQuery.saleDate = salesDateQuery;

      // 1. Fetch Revenue
      const sales = await Sale.find(salesQuery);
      const revenue = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);

      // 2. Fetch Cost of Goods Sold (COGS)
      const saleIds = sales.map(s => s._id);
      const saleItems = await SaleItem.find({ sale: { $in: saleIds } });

      let cogs = 0;
      for (const item of saleItems) {
        // Find matching Batch to extract purchasePrice
        const batch = await Batch.findOne({
          medicine: item.medicine,
          batchNumber: item.batchNumber
        });

        const purchasePrice = batch ? batch.purchasePrice : 0;
        cogs += Number(item.quantity) * Number(purchasePrice);
      }

      // 3. Fetch Expenses
      const expenseDateQuery = {};
      if (startDate) expenseDateQuery.$gte = new Date(startDate);
      if (endDate) expenseDateQuery.$lte = new Date(endDate);

      const expenseQuery = {};
      if (startDate || endDate) expenseQuery.date = expenseDateQuery;

      const expensesDocs = await Expense.find(expenseQuery);
      const expenses = expensesDocs.reduce((acc, curr) => acc + curr.amount, 0);

      const estimatedNetProfit = revenue - cogs - expenses;

      return sendSuccess(res, 'Profit report generated successfully', {
        summary: {
          revenue,
          cogs,
          expenses,
          estimatedNetProfit
        },
        formula: 'Estimated Net Profit = Net Revenue (sales totals) - Cost of Goods Sold (cogs: sum of sold quantities * batch procurement costs) - Operating Expenses'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Medicine Performance Report
   * GET /api/reports/medicines
   */
  getMedicinePerformance: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const salesDateQuery = {};
      if (startDate) salesDateQuery.$gte = new Date(startDate);
      if (endDate) salesDateQuery.$lte = new Date(endDate);

      const salesQuery = { status: 'Completed' };
      if (startDate || endDate) salesQuery.saleDate = salesDateQuery;

      const sales = await Sale.find(salesQuery);
      const saleIds = sales.map(s => s._id);

      const saleItems = await SaleItem.find({ sale: { $in: saleIds } }).populate('medicine', 'name genericName');

      const performanceMap = {};
      saleItems.forEach(item => {
        if (item.medicine) {
          const medId = item.medicine._id.toString();
          const name = item.medicine.name;
          if (!performanceMap[medId]) {
            performanceMap[medId] = { medicineName: name, quantitySold: 0, revenue: 0 };
          }
          performanceMap[medId].quantitySold += item.quantity;
          performanceMap[medId].revenue += item.subtotal;
        }
      });

      const performanceList = Object.values(performanceMap);
      
      const topSelling = [...performanceList].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);
      const lowestSelling = [...performanceList].filter(a => a.quantitySold > 0).sort((a, b) => a.quantitySold - b.quantitySold).slice(0, 5);

      return sendSuccess(res, 'Medicine performance report generated successfully', {
        performanceList,
        topSelling,
        lowestSelling
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Supplier Report
   * GET /api/reports/suppliers
   */
  getSupplierReport: async (req, res, next) => {
    try {
      const suppliers = await Supplier.find({ status: 'Active' });
      const statsList = [];

      for (const supplier of suppliers) {
        const pos = await Purchase.find({ supplier: supplier._id, status: 'COMPLETED' });
        const spend = pos.reduce((acc, curr) => acc + curr.grandTotal, 0);
        statsList.push({
          supplierName: supplier.companyName || supplier.name,
          purchaseCount: pos.length,
          purchaseAmount: spend
        });
      }

      return sendSuccess(res, 'Supplier report generated successfully', statsList);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reportController;
