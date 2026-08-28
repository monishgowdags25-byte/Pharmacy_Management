const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');

// Import all models
const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Batch = require('../models/Batch');
const Customer = require('../models/Customer');
const Prescription = require('../models/Prescription');
const PrescriptionItem = require('../models/PrescriptionItem');
const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Return = require('../models/Return');
const ReturnItem = require('../models/ReturnItem');
const Expense = require('../models/Expense');
const InventoryLog = require('../models/InventoryLog');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const clearAllDummyData = async () => {
  try {
    console.log('Connecting to database...');
    await connectDB();

    console.log('🧹 Purging all sample and dummy business records from database...');

    await Category.deleteMany({});
    console.log('  ✔ Cleared Categories');

    await Medicine.deleteMany({});
    console.log('  ✔ Cleared Medicines');

    await Supplier.deleteMany({});
    console.log('  ✔ Cleared Suppliers');

    await Batch.deleteMany({});
    console.log('  ✔ Cleared Batches');

    await Customer.deleteMany({});
    console.log('  ✔ Cleared Customers');

    await Prescription.deleteMany({});
    await PrescriptionItem.deleteMany({});
    console.log('  ✔ Cleared Prescriptions');

    await Purchase.deleteMany({});
    await PurchaseItem.deleteMany({});
    console.log('  ✔ Cleared Purchases');

    await Sale.deleteMany({});
    await SaleItem.deleteMany({});
    console.log('  ✔ Cleared Sales & Invoices');

    await Return.deleteMany({});
    await ReturnItem.deleteMany({});
    console.log('  ✔ Cleared Returns');

    await Expense.deleteMany({});
    console.log('  ✔ Cleared Expenses');

    await InventoryLog.deleteMany({});
    console.log('  ✔ Cleared Inventory Ledger Logs');

    await Notification.deleteMany({});
    console.log('  ✔ Cleared Notifications');

    await AuditLog.deleteMany({});
    console.log('  ✔ Cleared Audit Logs');

    console.log('\n✨ Database successfully reset to a clean slate!');
    console.log('   All dummy transactions, catalogues, and inventory have been removed.');
    console.log('   Staff user accounts preserved for login.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

clearAllDummyData();
