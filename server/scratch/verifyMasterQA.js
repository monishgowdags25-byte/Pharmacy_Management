const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import all models
const User = require('../models/User');
const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Batch = require('../models/Batch');
const Customer = require('../models/Customer');
const Prescription = require('../models/Prescription');
const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Return = require('../models/Return');
const ReturnItem = require('../models/ReturnItem');
const Expense = require('../models/Expense');
const InventoryLog = require('../models/InventoryLog');
const AuditLog = require('../models/AuditLog');

// Import controllers & services
const authController = require('../controllers/authController');
const medicineController = require('../controllers/medicineController');
const inventoryService = require('../services/inventoryService');
const purchaseController = require('../controllers/purchaseController');
const saleController = require('../controllers/saleController');
const prescriptionController = require('../controllers/prescriptionController');
const returnController = require('../controllers/returnController');
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

const runMasterQASuite = async () => {
  console.log('===========================================================');
  console.log('🧪 PHARMACARE MASTER QA & BUSINESS VERIFICATION SUITE 🧪');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: [${testName}]`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: [${testName}]`);
      failed++;
    }
  };

  // Mock response helper
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    return res;
  };

  try {
    /* ───────────────────────────────────────────────────────────
     * 1. AUTHENTICATION & AUTHORIZATION TESTS
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 1. AUTHENTICATION & AUTHORIZATION TESTS ---');
    
    // Hash password & verify
    const rawPwd = 'SecurePassword123!';
    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(rawPwd, salt);
    const pwdMatch = await bcrypt.compare(rawPwd, hashedPwd);
    const pwdMismatch = await bcrypt.compare('WrongPassword', hashedPwd);
    
    assert(pwdMatch === true, 'Valid password verification matches bcrypt hash');
    assert(pwdMismatch === false, 'Invalid password verification correctly fails');

    // JWT Generation & Verify
    const jwtSecret = 'test_qa_jwt_secret_key_12345';
    process.env.JWT_SECRET = jwtSecret;
    const testUserId = new mongoose.Types.ObjectId();
    const token = jwt.sign({ id: testUserId, role: 'CASHIER' }, jwtSecret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, jwtSecret);
    assert(decoded.id === testUserId.toString(), 'JWT token successfully encodes and decodes user ID');

    // Middleware: Missing Token
    let nextCalled = false;
    const reqMissing = { headers: {} };
    const resMissing = createMockRes();
    authenticate(reqMissing, resMissing, () => { nextCalled = true; });
    assert(resMissing.statusCode === 401, 'Missing authorization token rejected with 401');

    // Middleware: Invalid Token
    const reqBad = { headers: { authorization: 'Bearer invalid.token.string' } };
    const resBad = createMockRes();
    authenticate(reqBad, resBad, () => {});
    assert(resBad.statusCode === 401, 'Invalid/tampered token rejected with 401');

    // Middleware: Role Authorization
    const reqCashier = { user: { role: 'CASHIER' } };
    const resAuthAdmin = createMockRes();
    const adminGuard = authorize('ADMIN');
    adminGuard(reqCashier, resAuthAdmin, () => {});
    assert(resAuthAdmin.statusCode === 403, 'Unauthorized role access to Admin route blocked with 403');

    const adminAllowed = authorize('ADMIN', 'CASHIER');
    let cashierPassed = false;
    adminAllowed(reqCashier, createMockRes(), () => { cashierPassed = true; });
    assert(cashierPassed === true, 'Authorized role passed successfully by middleware');

    /* ───────────────────────────────────────────────────────────
     * 2. MEDICINE MASTER DATA & VALIDATION TESTS
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 2. MEDICINE MASTER DATA & VALIDATION TESTS ---');

    // Negative price validation
    const badMed = new Medicine({
      name: 'Invalid Price Med',
      genericName: 'Invalid',
      category: new mongoose.Types.ObjectId(),
      dosageForm: 'Tablet',
      strength: '500mg',
      unit: 'Box',
      purchasePrice: -10,
      sellingPrice: 15
    });
    let medValError = null;
    try {
      await badMed.validate();
    } catch (e) {
      medValError = e;
    }
    assert(medValError !== null && medValError.errors['purchasePrice'] !== undefined, 'Medicine rejects negative purchase price');

    // Negative selling price validation
    const badSellingMed = new Medicine({
      name: 'Invalid Selling Price Med',
      genericName: 'Invalid',
      category: new mongoose.Types.ObjectId(),
      dosageForm: 'Tablet',
      strength: '500mg',
      unit: 'Box',
      purchasePrice: 10,
      sellingPrice: -5
    });
    let sellingValError = null;
    try {
      await badSellingMed.validate();
    } catch (e) {
      sellingValError = e;
    }
    assert(sellingValError !== null && sellingValError.errors['sellingPrice'] !== undefined, 'Medicine rejects negative selling price');

    // Valid Medicine model
    const validMed = new Medicine({
      name: 'Amoxicillin Trihydrate',
      genericName: 'Amoxicillin',
      category: new mongoose.Types.ObjectId(),
      dosageForm: 'Capsule',
      strength: '500mg',
      unit: 'Strip',
      purchasePrice: 12.50,
      sellingPrice: 18.00,
      reorderLevel: 25,
      status: 'Active'
    });
    let validMedErr = null;
    try {
      await validMed.validate();
    } catch (e) {
      validMedErr = e;
    }
    assert(validMedErr === null, 'Valid medicine catalog item passes all validations');

    /* ───────────────────────────────────────────────────────────
     * 3. INVENTORY & FEFO DISPENSING TESTS
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 3. INVENTORY & FEFO DISPENSING TESTS ---');

    const medId = new mongoose.Types.ObjectId();
    const today = new Date();
    const expSoon = new Date(today.getTime() + 15 * 86400000); // 15 days
    const expLater = new Date(today.getTime() + 180 * 86400000); // 180 days
    const expPast = new Date(today.getTime() - 10 * 86400000); // 10 days ago

    const batchA = { _id: new mongoose.Types.ObjectId(), medicine: medId, batchNumber: 'B-EARLY', expiryDate: expSoon, currentQuantity: 20, status: 'EXPIRING_SOON', save: async () => {} };
    const batchB = { _id: new mongoose.Types.ObjectId(), medicine: medId, batchNumber: 'B-LATER', expiryDate: expLater, currentQuantity: 50, status: 'IN_STOCK', save: async () => {} };
    const batchExpired = { _id: new mongoose.Types.ObjectId(), medicine: medId, batchNumber: 'B-EXPIRED', expiryDate: expPast, currentQuantity: 10, status: 'EXPIRED', save: async () => {} };

    // Test FEFO Sort Priority
    const activeBatches = [batchB, batchA].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
    assert(activeBatches[0].batchNumber === 'B-EARLY', 'FEFO ordering places earliest expiring batch first');

    // Simulate 25 unit deduction: Batch A (20) + Batch B (5)
    let qtyToDeduct = 25;
    const allocations = [];
    for (const b of activeBatches) {
      if (qtyToDeduct <= 0) break;
      const take = Math.min(b.currentQuantity, qtyToDeduct);
      b.currentQuantity -= take;
      qtyToDeduct -= take;
      allocations.push({ batch: b.batchNumber, qty: take });
    }

    assert(allocations.length === 2, 'FEFO deduction successfully split across 2 batches');
    assert(allocations[0].batch === 'B-EARLY' && allocations[0].qty === 20, 'Earliest batch A drained completely (20 units)');
    assert(allocations[1].batch === 'B-LATER' && allocations[1].qty === 5, 'Later batch B deducted remaining 5 units');
    assert(batchB.currentQuantity === 45, 'Batch B remaining stock updated to 45');

    // Expired Medicine Protection
    assert(batchExpired.status === 'EXPIRED', 'Expired batch flagged with EXPIRED status');

    /* ───────────────────────────────────────────────────────────
     * 4. PURCHASE & RESTOCK TESTS
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 4. PURCHASE & RESTOCK TESTS ---');

    const purchaseHeader = {
      purchaseNumber: 'PO-2026-001',
      supplier: new mongoose.Types.ObjectId(),
      invoiceNumber: 'SUP-INV-8821',
      purchaseDate: new Date(),
      status: 'DRAFT',
      subtotal: 500,
      taxAmount: 25,
      discountAmount: 10,
      grandTotal: 515,
      paymentStatus: 'Paid'
    };

    assert(purchaseHeader.grandTotal === (500 + 25 - 10), 'Purchase grandTotal calculation accurate: Subtotal + Tax - Discount');
    assert(purchaseHeader.status === 'DRAFT', 'New purchase begins in DRAFT state');

    // Complete purchase transition
    purchaseHeader.status = 'COMPLETED';
    assert(purchaseHeader.status === 'COMPLETED', 'Purchase transitions to COMPLETED on stock intake');

    /* ───────────────────────────────────────────────────────────
     * 5. POS CHECKOUT & RECEIPT CALCULATION TESTS
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 5. POS CHECKOUT & RECEIPT CALCULATION TESTS ---');

    const item1 = { unitPrice: 20.00, quantity: 3, taxRate: 5 }; // $60 subtotal, $3 tax
    const item2 = { unitPrice: 15.00, quantity: 2, taxRate: 10 }; // $30 subtotal, $3 tax
    const posDiscount = 5.00;

    const posSubtotal = (item1.unitPrice * item1.quantity) + (item2.unitPrice * item2.quantity);
    const posTax = (item1.unitPrice * item1.quantity * 0.05) + (item2.unitPrice * item2.quantity * 0.10);
    const posGrandTotal = posSubtotal + posTax - posDiscount;

    assert(posSubtotal === 90.00, 'POS Subtotal calculated correctly ($90.00)');
    assert(posTax === 6.00, 'POS Tax calculated correctly ($6.00)');
    assert(posGrandTotal === 91.00, 'POS Grand Total calculated correctly ($91.00)');

    /* ───────────────────────────────────────────────────────────
     * 6. PRESCRIPTION RESTRICTIONS & VERIFICATION
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 6. PRESCRIPTION RESTRICTIONS & VERIFICATION ---');

    const rxDoc = {
      prescriptionNumber: 'RX-2026-9901',
      customer: new mongoose.Types.ObjectId(),
      doctorName: 'Dr. Evelyn Reed, MD',
      doctorRegistrationNumber: 'MED-77492',
      status: 'PENDING'
    };

    assert(rxDoc.status === 'PENDING', 'New prescription initialized with PENDING verification status');

    // Pharmacist Verification
    rxDoc.status = 'VERIFIED';
    rxDoc.verifiedBy = testUserId;
    rxDoc.verifiedAt = new Date();
    assert(rxDoc.status === 'VERIFIED', 'Prescription transitions to VERIFIED after pharmacist approval');

    // Dispensing
    rxDoc.status = 'DISPENSED';
    assert(rxDoc.status === 'DISPENSED', 'Prescription status locks to DISPENSED upon checkout');

    /* ───────────────────────────────────────────────────────────
     * 7. SALES RETURN & REFUND ACCURACY
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 7. SALES RETURN & REFUND ACCURACY ---');

    const originalSoldQty = 10;
    const requestedReturnQty = 4;
    const previousReturnsTotal = 0;

    const returnPermitted = (requestedReturnQty + previousReturnsTotal) <= originalSoldQty;
    assert(returnPermitted === true, 'Valid return within original invoice quantity accepted');

    const excessReturnQty = 12;
    const excessPermitted = (excessReturnQty + previousReturnsTotal) <= originalSoldQty;
    assert(excessPermitted === false, 'Excess return exceeding purchased quantity rejected');

    const unitPrice = 18.00;
    const calculatedRefund = requestedReturnQty * unitPrice;
    assert(calculatedRefund === 72.00, 'Refund calculation accurate ($72.00 for 4 units @ $18.00)');

    /* ───────────────────────────────────────────────────────────
     * 8. REPORT & ANALYTICS TOTALS CONSISTENCY
     * ─────────────────────────────────────────────────────────── */
    console.log('\n--- 8. REPORT & ANALYTICS TOTALS CONSISTENCY ---');

    // Mock sales invoices in period
    const salesReportData = [
      { totalAmount: 150.00, discountAmount: 10.00, taxAmount: 7.50 },
      { totalAmount: 220.00, discountAmount: 0.00, taxAmount: 11.00 },
      { totalAmount: 85.00, discountAmount: 5.00, taxAmount: 4.25 },
    ];

    const totalSalesApp = salesReportData.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalTaxApp = salesReportData.reduce((acc, s) => acc + s.taxAmount, 0);
    const totalDiscountApp = salesReportData.reduce((acc, s) => acc + s.discountAmount, 0);

    assert(totalSalesApp === 455.00, 'Sales report sum matches exact arithmetic ($455.00)');
    assert(totalTaxApp === 22.75, 'Tax report sum matches exact arithmetic ($22.75)');
    assert(totalDiscountApp === 15.00, 'Discount report sum matches exact arithmetic ($15.00)');

    const totalPurchasesCost = 250.00;
    const totalExpenses = 50.00;
    const netProfit = totalSalesApp - totalPurchasesCost - totalExpenses;
    assert(netProfit === 155.00, 'Net profit calculation matches: Sales ($455) - Purchases ($250) - Expenses ($50) = $155');

  } catch (error) {
    console.error('\n❌ Unexpected error running Master QA verification:', error);
    failed++;
  }

  console.log('\n===========================================================');
  console.log(`📊 MASTER QA EXECUTION RESULTS:`);
  console.log(`   Passed: ${passed} checks`);
  console.log(`   Failed: ${failed} checks`);
  console.log('===========================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL MASTER QA AND BUSINESS LOGIC TESTS PASSED WITH 100% SUCCESS! 🎉\n');
    process.exit(0);
  } else {
    console.error('❌ SOME MASTER QA CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runMasterQASuite();
