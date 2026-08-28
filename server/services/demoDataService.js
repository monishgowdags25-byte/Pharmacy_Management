const mongoose = require('mongoose');
const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Prescription = require('../models/Prescription');
const PrescriptionItem = require('../models/PrescriptionItem');
const Return = require('../models/Return');
const ReturnItem = require('../models/ReturnItem');
const Expense = require('../models/Expense');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const InventoryLog = require('../models/InventoryLog');

const {
  DEMO_CATEGORIES,
  DEMO_MEDICINES,
  DEMO_SUPPLIERS,
  DEMO_CUSTOMERS,
  DEMO_EXPENSES,
  DEMO_DOCTORS
} = require('../utils/demoDataGenerator');

class DemoDataService {
  /**
   * Helper: Retrieve or fallback to an Admin user ID for audit signatures
   */
  async getSystemUserId(user) {
    if (user && user._id) return user._id;
    const admin = await User.findOne({ role: 'ADMIN' });
    if (admin) return admin._id;
    return new mongoose.Types.ObjectId();
  }

  /**
   * 1. Seed Therapeutic Categories
   */
  async seedCategories() {
    let createdCount = 0;
    const categories = [];

    for (const catData of DEMO_CATEGORIES) {
      let existing = await Category.findOne({ name: catData.name });
      if (!existing) {
        existing = await Category.create({
          name: catData.name,
          description: catData.description,
          isDemo: true
        });
        createdCount++;
      }
      categories.push(existing);
    }

    return { createdCount, total: categories.length, categories };
  }

  /**
   * 2. Seed Suppliers
   */
  async seedSuppliers() {
    let createdCount = 0;
    const suppliers = [];

    for (const supData of DEMO_SUPPLIERS) {
      let existing = await Supplier.findOne({ companyName: supData.companyName });
      if (!existing) {
        existing = await Supplier.create({
          ...supData,
          isDemo: true
        });
        createdCount++;
      }
      suppliers.push(existing);
    }

    return { createdCount, total: suppliers.length, suppliers };
  }

  /**
   * 3. Seed Medicines (requires categories)
   */
  async seedMedicines() {
    const { categories } = await this.seedCategories();
    const catMap = new Map(categories.map(c => [c.name, c._id]));

    let createdCount = 0;
    const medicines = [];

    for (const medData of DEMO_MEDICINES) {
      let existing = await Medicine.findOne({ barcode: medData.barcode });
      if (!existing) {
        const catId = catMap.get(medData.categoryName) || categories[0]._id;
        const { categoryName, ...rest } = medData;
        existing = await Medicine.create({
          ...rest,
          category: catId,
          isDemo: true
        });
        createdCount++;
      }
      medicines.push(existing);
    }

    return { createdCount, total: medicines.length, medicines };
  }

  /**
   * 4. Seed Inventory & Stock Batches (In-Stock, Low Stock, Expiring Soon, Expired)
   */
  async seedInventory(user) {
    const { medicines } = await this.seedMedicines();
    const { suppliers } = await this.seedSuppliers();
    const userId = await this.getSystemUserId(user);

    let createdBatchesCount = 0;
    const now = new Date();

    for (let i = 0; i < medicines.length; i++) {
      const med = medicines[i];
      const supplier = suppliers[i % suppliers.length];

      // Check if batches already exist for this medicine
      const batchCount = await Batch.countDocuments({ medicine: med._id });
      if (batchCount > 0) continue;

      // Create primary healthy active batch (12-18 months expiry)
      const mfg1 = new Date(now.getTime() - 45 * 86400000);
      const exp1 = new Date(now.getTime() + 450 * 86400000);
      const qty1 = i === 2 ? 8 : (i === 6 ? 0 : 80 + (i * 10)); // Make Amoxicillin low stock (8) & Cetirizine 0

      const b1 = await Batch.create({
        medicine: med._id,
        supplier: supplier._id,
        batchNumber: `DEMO-BAT-${1000 + i}`,
        manufacturingDate: mfg1,
        expiryDate: exp1,
        quantityPurchased: 100,
        currentQuantity: qty1,
        purchasePrice: med.purchasePrice,
        sellingPrice: med.sellingPrice,
        isDemo: true
      });
      createdBatchesCount++;

      // Log to inventory ledger
      if (qty1 > 0) {
        await InventoryLog.create({
          medicine: med._id,
          batch: b1._id,
          type: 'PURCHASE',
          quantity: qty1,
          previousQuantity: 0,
          newQuantity: qty1,
          user: userId,
          isDemo: true
        });
      }

      // Add special batches for first few medicines: Expiring soon batch (20 days)
      if (i === 0 || i === 4) {
        const expSoon = new Date(now.getTime() + 18 * 86400000);
        await Batch.create({
          medicine: med._id,
          supplier: supplier._id,
          batchNumber: `DEMO-EXP-SOON-${1000 + i}`,
          manufacturingDate: new Date(now.getTime() - 300 * 86400000),
          expiryDate: expSoon,
          quantityPurchased: 50,
          currentQuantity: 15,
          purchasePrice: med.purchasePrice,
          sellingPrice: med.sellingPrice,
          isDemo: true
        });
        createdBatchesCount++;
      }

      // Add expired batch for demonstration (expired 25 days ago)
      if (i === 1 || i === 3) {
        const expPast = new Date(now.getTime() - 25 * 86400000);
        await Batch.create({
          medicine: med._id,
          supplier: supplier._id,
          batchNumber: `DEMO-EXPIRED-${1000 + i}`,
          manufacturingDate: new Date(now.getTime() - 500 * 86400000),
          expiryDate: expPast,
          quantityPurchased: 40,
          currentQuantity: 12,
          purchasePrice: med.purchasePrice,
          sellingPrice: med.sellingPrice,
          isDemo: true
        });
        createdBatchesCount++;
      }
    }

    return { createdCount: createdBatchesCount };
  }

  /**
   * 5. Seed Customers
   */
  async seedCustomers() {
    let createdCount = 0;
    const customers = [];

    for (const custData of DEMO_CUSTOMERS) {
      let existing = await Customer.findOne({ phone: custData.phone });
      if (!existing) {
        existing = await Customer.create({
          ...custData,
          isDemo: true
        });
        createdCount++;
      }
      customers.push(existing);
    }

    return { createdCount, total: customers.length, customers };
  }

  /**
   * 6. Seed Purchases
   */
  async seedPurchases(user) {
    const { suppliers } = await this.seedSuppliers();
    const { medicines } = await this.seedMedicines();
    const userId = await this.getSystemUserId(user);

    let createdCount = 0;
    const now = new Date();

    // Check if purchases already exist
    const existingPurchases = await Purchase.countDocuments({ isDemo: true });
    if (existingPurchases >= 5) {
      return { createdCount: 0, message: 'Demo purchases already populated' };
    }

    for (let i = 0; i < suppliers.length; i++) {
      const supplier = suppliers[i];
      const pDate = new Date(now.getTime() - (i * 4 + 2) * 86400000);
      const invoiceNumber = `DEMO-SUP-INV-${8800 + i}`;

      const med1 = medicines[(i * 2) % medicines.length];
      const med2 = medicines[(i * 2 + 1) % medicines.length];

      const qty1 = 50;
      const qty2 = 40;
      const subtotal = (qty1 * med1.purchasePrice) + (qty2 * med2.purchasePrice);
      const taxAmount = subtotal * 0.05;
      const discountAmount = i % 2 === 0 ? 50 : 0;
      const grandTotal = subtotal + taxAmount - discountAmount;

      const purchase = await Purchase.create({
        purchaseNumber: `DEMO-PO-${202600 + i}`,
        supplier: supplier._id,
        invoiceNumber,
        purchaseDate: pDate,
        subtotal,
        taxAmount,
        discountAmount,
        grandTotal,
        paymentStatus: 'Paid',
        status: 'COMPLETED',
        notes: `Demo stock intake order from ${supplier.companyName}`,
        createdBy: userId,
        isDemo: true
      });

      // Line items
      await PurchaseItem.create([
        {
          purchase: purchase._id,
          medicine: med1._id,
          batchNumber: `DEMO-P-BAT-${100 + i}A`,
          expiryDate: new Date(now.getTime() + 365 * 86400000),
          quantity: qty1,
          purchasePrice: med1.purchasePrice,
          tax: qty1 * med1.purchasePrice * 0.05,
          totalCost: qty1 * med1.purchasePrice * 1.05,
          isDemo: true
        },
        {
          purchase: purchase._id,
          medicine: med2._id,
          batchNumber: `DEMO-P-BAT-${100 + i}B`,
          expiryDate: new Date(now.getTime() + 400 * 86400000),
          quantity: qty2,
          purchasePrice: med2.purchasePrice,
          tax: qty2 * med2.purchasePrice * 0.05,
          totalCost: qty2 * med2.purchasePrice * 1.05,
          isDemo: true
        }
      ]);

      createdCount++;
    }

    return { createdCount };
  }

  /**
   * 7. Seed Prescriptions
   */
  async seedPrescriptions(user) {
    const { customers } = await this.seedCustomers();
    const { medicines } = await this.seedMedicines();
    const userId = await this.getSystemUserId(user);

    let createdCount = 0;
    const now = new Date();

    const existingRx = await Prescription.countDocuments({ isDemo: true });
    if (existingRx >= 5) {
      return { createdCount: 0, message: 'Demo prescriptions already populated' };
    }

    const rxStatuses = ['VERIFIED', 'DISPENSED', 'PENDING', 'VERIFIED', 'REJECTED'];
    const rxMedicines = medicines.filter(m => m.prescriptionRequired);

    for (let i = 0; i < 5; i++) {
      const customer = customers[i % customers.length];
      const doctor = DEMO_DOCTORS[i % DEMO_DOCTORS.length];
      const status = rxStatuses[i];
      const med = rxMedicines[i % rxMedicines.length] || medicines[0];

      const rx = await Prescription.create({
        prescriptionNumber: `DEMO-RX-${202600 + i}`,
        customer: customer._id,
        doctorName: doctor.name,
        doctorRegistrationNumber: doctor.reg,
        status,
        verifiedBy: (status === 'VERIFIED' || status === 'DISPENSED') ? userId : undefined,
        verifiedAt: (status === 'VERIFIED' || status === 'DISPENSED') ? new Date(now.getTime() - i * 86400000) : undefined,
        rejectionReason: status === 'REJECTED' ? 'Dosage exceeds daily safe clinical limit' : undefined,
        isDemo: true
      });

      await PrescriptionItem.create({
        prescription: rx._id,
        medicine: med._id,
        medicineName: med.name,
        dosage: '500mg, 1 tablet twice daily after meals',
        frequency: 'Every 12 hours',
        duration: '5 days',
        instructions: 'Complete full antibiotic course with water',
        quantity: 10,
        isDemo: true
      });

      createdCount++;
    }

    return { createdCount };
  }

  /**
   * 8. Seed Sales (Across Today, Yesterday, Last 7 Days, Last 30 Days)
   */
  async seedSales(user) {
    await this.seedInventory(user);
    const { customers } = await this.seedCustomers();
    const { medicines } = await this.seedMedicines();
    const userId = await this.getSystemUserId(user);

    let createdCount = 0;
    const now = new Date();

    const existingSales = await Sale.countDocuments({ isDemo: true });
    if (existingSales >= 10) {
      return { createdCount: 0, message: 'Demo sales already populated' };
    }

    // Days offset distribution: [0, 0, 1, 1, 2, 3, 4, 5, 7, 10, 15, 20, 25]
    const dayOffsets = [0, 0, 1, 1, 2, 3, 4, 5, 7, 10, 14, 21, 28];
    const paymentMethods = ['CASH', 'UPI', 'CARD', 'UPI', 'CASH'];

    for (let i = 0; i < dayOffsets.length; i++) {
      const daysAgo = dayOffsets[i];
      const saleDate = new Date(now.getTime() - (daysAgo * 86400000) - (i * 3600000));
      const customer = customers[i % customers.length];
      const pMethod = paymentMethods[i % paymentMethods.length];

      // Select top selling medicine (Paracetamol, Ibuprofen, ORS, Vitamin C)
      const med1 = medicines[i % 4];
      const med2 = medicines[(i + 4) % medicines.length];

      // Find available batch
      const batch1 = await Batch.findOne({ medicine: med1._id, currentQuantity: { $gt: 5 } });
      const batch2 = await Batch.findOne({ medicine: med2._id, currentQuantity: { $gt: 5 } });

      const qty1 = (i % 3 === 0) ? 3 : 2;
      const qty2 = 1;

      const line1Sub = qty1 * med1.sellingPrice;
      const line2Sub = qty2 * med2.sellingPrice;
      const subtotal = line1Sub + line2Sub;
      const taxAmount = (line1Sub * (med1.tax / 100)) + (line2Sub * (med2.tax / 100));
      const discountAmount = i % 4 === 0 ? 10.00 : 0.00;
      const totalAmount = subtotal + taxAmount - discountAmount;

      const sale = await Sale.create({
        invoiceNumber: `DEMO-INV-${202600 + i}`,
        customer: customer._id,
        user: userId,
        saleDate,
        subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        paymentMethod: pMethod,
        status: 'Completed',
        isDemo: true
      });

      // Create SaleItems
      await SaleItem.create([
        {
          sale: sale._id,
          medicine: med1._id,
          batchNumber: batch1 ? batch1.batchNumber : 'DEMO-BAT-1000',
          quantity: qty1,
          unitPrice: med1.sellingPrice,
          taxAmount: line1Sub * (med1.tax / 100),
          subtotal: line1Sub,
          isDemo: true
        },
        {
          sale: sale._id,
          medicine: med2._id,
          batchNumber: batch2 ? batch2.batchNumber : 'DEMO-BAT-1001',
          quantity: qty2,
          unitPrice: med2.sellingPrice,
          taxAmount: line2Sub * (med2.tax / 100),
          subtotal: line2Sub,
          isDemo: true
        }
      ]);

      // Deduct stock safely
      if (batch1 && batch1.currentQuantity >= qty1) {
        batch1.currentQuantity -= qty1;
        await batch1.save();
      }
      if (batch2 && batch2.currentQuantity >= qty2) {
        batch2.currentQuantity -= qty2;
        await batch2.save();
      }

      createdCount++;
    }

    return { createdCount };
  }

  /**
   * 9. Seed Returns (Referencing actual demo sales)
   */
  async seedReturns(user) {
    await this.seedSales(user);
    const userId = await this.getSystemUserId(user);

    let createdCount = 0;
    const existingReturns = await Return.countDocuments({ isDemo: true });
    if (existingReturns >= 3) {
      return { createdCount: 0, message: 'Demo returns already populated' };
    }

    const demoSales = await Sale.find({ isDemo: true }).limit(3);

    for (let i = 0; i < demoSales.length; i++) {
      const sale = demoSales[i];
      const saleItems = await SaleItem.find({ sale: sale._id });
      if (!saleItems || saleItems.length === 0) continue;

      const itemToReturn = saleItems[0];
      const returnQty = 1;
      const refundAmount = itemToReturn.unitPrice * returnQty;

      const ret = await Return.create({
        returnNumber: `DEMO-RET-${202600 + i}`,
        sale: sale._id,
        customer: sale.customer,
        reason: i === 0 ? 'Customer experienced mild allergy symptoms' : 'Damaged packaging foil on purchase',
        refundMethod: 'CASH',
        refundAmount,
        status: 'Completed',
        createdBy: userId,
        isDemo: true
      });

      await ReturnItem.create({
        return: ret._id,
        medicine: itemToReturn.medicine,
        batchNumber: itemToReturn.batchNumber,
        quantity: returnQty,
        unitPrice: itemToReturn.unitPrice,
        subtotal: refundAmount,
        isDemo: true
      });

      // Restore stock into batch
      const batch = await Batch.findOne({ medicine: itemToReturn.medicine, batchNumber: itemToReturn.batchNumber });
      if (batch) {
        batch.currentQuantity += returnQty;
        await batch.save();
      }

      createdCount++;
    }

    return { createdCount };
  }

  /**
   * 10. Seed Operational Expenses
   */
  async seedExpenses() {
    let createdCount = 0;
    const now = new Date();

    const existingExp = await Expense.countDocuments({ isDemo: true });
    if (existingExp >= 5) {
      return { createdCount: 0, message: 'Demo expenses already populated' };
    }

    for (let i = 0; i < DEMO_EXPENSES.length; i++) {
      const exp = DEMO_EXPENSES[i];
      const expDate = new Date(now.getTime() - (i * 3 + 1) * 86400000);

      await Expense.create({
        expenseNumber: `DEMO-EXP-${202600 + i}`,
        title: exp.title,
        category: exp.category,
        amount: exp.amount,
        description: exp.description,
        date: expDate,
        isDemo: true
      });

      createdCount++;
    }

    return { createdCount };
  }

  /**
   * 11. Seed System Notifications
   */
  async seedNotifications() {
    let createdCount = 0;

    const demoNotes = [
      {
        title: 'Low Stock Alert: Amoxicillin Trihydrate 500mg',
        message: 'Current inventory is 8 units, below the reorder safety threshold of 30 units.',
        type: 'LOW_STOCK',
        read: false,
        dedupeKey: 'demo-low-stock-amoxil',
        isDemo: true
      },
      {
        title: 'Stock Out Alert: Cetirizine 10mg',
        message: 'Current inventory is 0 units. Immediate supplier reorder recommended.',
        type: 'OUT_OF_STOCK',
        read: false,
        dedupeKey: 'demo-out-of-stock-cetirizine',
        isDemo: true
      },
      {
        title: 'Near-Expiry Warning: Paracetamol Extra 500mg',
        message: 'Batch DEMO-EXP-SOON-1000 expires in 18 days. Place in primary FEFO dispensing rack.',
        type: 'EXPIRING_SOON',
        read: false,
        dedupeKey: 'demo-expiring-paracetamol',
        isDemo: true
      },
      {
        title: 'Expired Stock Quarantine: Ibuprofen Rapid 400mg',
        message: 'Batch DEMO-EXPIRED-1001 passed expiration date. Automatically quarantined from POS billing.',
        type: 'EXPIRED',
        read: true,
        dedupeKey: 'demo-expired-ibuprofen',
        isDemo: true
      }
    ];

    for (const note of demoNotes) {
      const existing = await Notification.findOne({ dedupeKey: note.dedupeKey });
      if (!existing) {
        await Notification.create(note);
        createdCount++;
      }
    }

    return { createdCount };
  }

  /**
   * 12. Seed Audit Trail Logs
   */
  async seedAuditLogs(user) {
    const userId = await this.getSystemUserId(user);
    let createdCount = 0;
    const now = new Date();

    const auditActions = [
      { action: 'LOGIN', entity: 'User', desc: 'Admin System authenticated via credentials', offsetMin: 120 },
      { action: 'CREATE_MEDICINE', entity: 'Medicine', desc: 'Registered Amoxicillin Trihydrate 500mg in master catalogue', offsetMin: 110 },
      { action: 'CREATE_PURCHASE', entity: 'Purchase', desc: 'Received Stock Purchase PO-2026-0001 from MediSource Distributors', offsetMin: 90 },
      { action: 'VERIFY_PRESCRIPTION', entity: 'Prescription', desc: 'Pharmacist approved Doctor Prescription RX-2026-0042', offsetMin: 60 },
      { action: 'CREATE_SALE', entity: 'Sale', desc: 'Cashier completed POS checkout Invoice INV-202608-0001 for amount ₹252.50', offsetMin: 45 },
      { action: 'CREATE_RETURN', entity: 'Return', desc: 'Processed Return slip RET-202608-001 for customer refund', offsetMin: 30 },
      { action: 'ADJUST_STOCK', entity: 'Batch', desc: 'Stock audit count updated for shelf parity', offsetMin: 15 }
    ];

    for (let i = 0; i < auditActions.length; i++) {
      const a = auditActions[i];
      await AuditLog.create({
        user: userId,
        action: a.action,
        entity: a.entity,
        entityId: new mongoose.Types.ObjectId(),
        description: a.desc,
        ipAddress: '127.0.0.1',
        timestamp: new Date(now.getTime() - a.offsetMin * 60000),
        isDemo: true
      });
      createdCount++;
    }

    return { createdCount };
  }

  /**
   * 13. Seed Demo Users
   */
  async seedUsers() {
    const demoStaff = [
      { name: 'Dr. Suresh Nair (Demo Pharmacist)', email: 'demo.pharmacist@pharmacare.local', role: 'PHARMACIST', password: 'Password@123' },
      { name: 'Ramesh Kumar (Demo Inventory Lead)', email: 'demo.inventory@pharmacare.local', role: 'INVENTORY_MANAGER', password: 'Password@123' },
      { name: 'Kavita Sundaram (Demo Cashier Desk)', email: 'demo.cashier@pharmacare.local', role: 'CASHIER', password: 'Password@123' }
    ];

    let createdCount = 0;
    for (const staff of demoStaff) {
      let existing = await User.findOne({ email: staff.email });
      if (!existing) {
        await User.create({
          ...staff,
          isDemo: true
        });
        createdCount++;
      }
    }

    return { createdCount };
  }

  /**
   * 14. Seed All Demo Data in Clean Interconnected Hierarchy
   */
  async seedAllDemoData(user) {
    const categoriesResult = await this.seedCategories();
    const suppliersResult = await this.seedSuppliers();
    const medicinesResult = await this.seedMedicines();
    const inventoryResult = await this.seedInventory(user);
    const customersResult = await this.seedCustomers();
    const purchasesResult = await this.seedPurchases(user);
    const prescriptionsResult = await this.seedPrescriptions(user);
    const salesResult = await this.seedSales(user);
    const returnsResult = await this.seedReturns(user);
    const expensesResult = await this.seedExpenses();
    const notificationsResult = await this.seedNotifications();
    const auditLogsResult = await this.seedAuditLogs(user);

    return {
      success: true,
      summary: {
        categories: categoriesResult.createdCount,
        suppliers: suppliersResult.createdCount,
        medicines: medicinesResult.createdCount,
        batches: inventoryResult.createdCount,
        customers: customersResult.createdCount,
        purchases: purchasesResult.createdCount,
        prescriptions: prescriptionsResult.createdCount,
        sales: salesResult.createdCount,
        returns: returnsResult.createdCount,
        expenses: expensesResult.createdCount,
        notifications: notificationsResult.createdCount,
        auditLogs: auditLogsResult.createdCount
      }
    };
  }

  /**
   * 14. Clear Only Demo Data (Safely leaves all user-created records untouched)
   */
  async clearDemoData() {
    const filter = { isDemo: true };

    const delCats = await Category.deleteMany(filter);
    const delMeds = await Medicine.deleteMany(filter);
    const delBatches = await Batch.deleteMany(filter);
    const delSupps = await Supplier.deleteMany(filter);
    const delCusts = await Customer.deleteMany(filter);
    const delPurchases = await Purchase.deleteMany(filter);
    const delPurchaseItems = await PurchaseItem.deleteMany(filter);
    const delSales = await Sale.deleteMany(filter);
    const delSaleItems = await SaleItem.deleteMany(filter);
    const delPrescriptions = await Prescription.deleteMany(filter);
    const delRxItems = await PrescriptionItem.deleteMany(filter);
    const delReturns = await Return.deleteMany(filter);
    const delReturnItems = await ReturnItem.deleteMany(filter);
    const delExpenses = await Expense.deleteMany(filter);
    const delNotifications = await Notification.deleteMany(filter);
    const delAuditLogs = await AuditLog.deleteMany(filter);
    const delInvLogs = await InventoryLog.deleteMany(filter);

    const totalDeleted = (
      delCats.deletedCount +
      delMeds.deletedCount +
      delBatches.deletedCount +
      delSupps.deletedCount +
      delCusts.deletedCount +
      delPurchases.deletedCount +
      delPurchaseItems.deletedCount +
      delSales.deletedCount +
      delSaleItems.deletedCount +
      delPrescriptions.deletedCount +
      delRxItems.deletedCount +
      delReturns.deletedCount +
      delReturnItems.deletedCount +
      delExpenses.deletedCount +
      delNotifications.deletedCount +
      delAuditLogs.deletedCount +
      delInvLogs.deletedCount
    );

    return {
      success: true,
      totalDeleted,
      details: {
        categories: delCats.deletedCount,
        medicines: delMeds.deletedCount,
        batches: delBatches.deletedCount,
        suppliers: delSupps.deletedCount,
        customers: delCusts.deletedCount,
        purchases: delPurchases.deletedCount,
        sales: delSales.deletedCount,
        prescriptions: delPrescriptions.deletedCount,
        returns: delReturns.deletedCount,
        expenses: delExpenses.deletedCount,
        notifications: delNotifications.deletedCount,
        auditLogs: delAuditLogs.deletedCount
      }
    };
  }

  /**
   * 15. Get Live Demo Status (Count of demo items in DB)
   */
  async getDemoStatus() {
    const filter = { isDemo: true };
    const [
      categories,
      medicines,
      batches,
      suppliers,
      customers,
      purchases,
      sales,
      prescriptions,
      returns,
      expenses,
      notifications,
      auditLogs
    ] = await Promise.all([
      Category.countDocuments(filter),
      Medicine.countDocuments(filter),
      Batch.countDocuments(filter),
      Supplier.countDocuments(filter),
      Customer.countDocuments(filter),
      Purchase.countDocuments(filter),
      Sale.countDocuments(filter),
      Prescription.countDocuments(filter),
      Return.countDocuments(filter),
      Expense.countDocuments(filter),
      Notification.countDocuments(filter),
      AuditLog.countDocuments(filter)
    ]);

    const totalDemoRecords = (
      categories + medicines + batches + suppliers + customers +
      purchases + sales + prescriptions + returns + expenses +
      notifications + auditLogs
    );

    return {
      totalDemoRecords,
      counts: {
        categories,
        medicines,
        batches,
        suppliers,
        customers,
        purchases,
        sales,
        prescriptions,
        returns,
        expenses,
        notifications,
        auditLogs
      }
    };
  }
}

module.exports = new DemoDataService();
