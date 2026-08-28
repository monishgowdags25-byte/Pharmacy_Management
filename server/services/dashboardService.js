const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Purchase = require('../models/Purchase');
const Return = require('../models/Return');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');

const dashboardService = {
  /**
   * Aggregate dashboard statistics
   */
  getDashboardSummary: async () => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // 1. Directory Counts
    const totalMedicines = await Medicine.countDocuments({ status: 'Active' });
    const totalCustomers = await Customer.countDocuments();
    const totalSuppliers = await Supplier.countDocuments({ status: 'Active' });

    // 2. Stock / Inventory calculations
    const activeBatches = await Batch.find({ currentQuantity: { $gt: 0 } });
    const totalStock = activeBatches.reduce((acc, curr) => acc + curr.currentQuantity, 0);

    const now = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(now.getDate() + 90);

    // Group active stock by medicine ID
    const stockMap = {};
    let expiringSoon = 0;
    let expired = 0;

    const allBatches = await Batch.find();
    allBatches.forEach(b => {
      if (b.expiryDate < now) {
        if (b.currentQuantity > 0) expired++;
      } else if (b.expiryDate <= ninetyDaysFromNow) {
        if (b.currentQuantity > 0) expiringSoon++;
      }
      
      if (b.currentQuantity > 0 && b.expiryDate > now) {
        stockMap[b.medicine.toString()] = (stockMap[b.medicine.toString()] || 0) + b.currentQuantity;
      }
    });

    // Check low stock / out of stock medicines
    const allActiveMedicines = await Medicine.find({ status: 'Active' });
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

    // 3. Today's Transactions
    const todaySalesDocs = await Sale.find({
      saleDate: { $gte: startOfToday },
      status: 'Completed'
    });
    const todaySales = todaySalesDocs.reduce((acc, curr) => acc + curr.totalAmount, 0);

    const todayOrders = await Purchase.countDocuments({
      purchaseDate: { $gte: startOfToday },
      status: 'COMPLETED'
    });

    // 4. Sales Trends (last 7 days)
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const daySales = await Sale.find({
        saleDate: { $gte: start, $lte: end },
        status: 'Completed'
      });
      const dayTotal = daySales.reduce((acc, curr) => acc + curr.totalAmount, 0);

      salesTrend.push({
        date: start.toLocaleDateString(undefined, { weekday: 'short' }),
        amount: dayTotal
      });
    }

    // 5. Top Selling Medicines (aggregate from SaleItems)
    const saleItems = await SaleItem.find().populate('medicine', 'name genericName');
    const medicineSalesMap = {};
    
    saleItems.forEach(item => {
      if (item.medicine) {
        const medId = item.medicine._id.toString();
        const medName = item.medicine.name;
        if (!medicineSalesMap[medId]) {
          medicineSalesMap[medId] = { name: medName, quantity: 0 };
        }
        medicineSalesMap[medId].quantity += item.quantity;
      }
    });

    const topSellingMedicines = Object.values(medicineSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 6. Recent Activities Ledger
    const recentSales = await Sale.find()
      .populate('customer', 'name')
      .populate('user', 'name')
      .sort('-createdAt')
      .limit(5);

    const recentPurchases = await Purchase.find()
      .populate('supplier', 'companyName name')
      .sort('-createdAt')
      .limit(5);

    const recentReturns = await Return.find()
      .populate('customer', 'name')
      .sort('-createdAt')
      .limit(5);

    const recentMedicines = await Medicine.find()
      .sort('-createdAt')
      .limit(5);

    return {
      kpi: {
        totalMedicines,
        totalStock,
        lowStock,
        outOfStock,
        expiringSoon,
        expired,
        todaySales,
        todayOrders,
        totalCustomers,
        totalSuppliers
      },
      salesTrend,
      topSellingMedicines,
      recentActivities: {
        recentSales,
        recentPurchases,
        recentReturns,
        recentMedicines
      }
    };
  }
};

module.exports = dashboardService;
