const mongoose = require('mongoose');
const Return = require('../models/Return');
const ReturnItem = require('../models/ReturnItem');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Expense = require('../models/Expense');
const InventoryLog = require('../models/InventoryLog');
const returnController = require('../controllers/returnController');
const expenseController = require('../controllers/expenseController');

const runReturnsVerification = async () => {
  console.log('Starting offline Sales Returns and Expense validation suite...\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ PASS: [${testName}]`);
      passed++;
    } else {
      console.error(`❌ FAIL: [${testName}]`);
      failed++;
    }
  };

  try {
    // --- TEST 1: Schema Properties Assertions ---
    const returnSchema = Return.schema.paths;
    assert(returnSchema.refundMethod !== undefined, 'Return schema contains "refundMethod"');
    assert(returnSchema.createdBy !== undefined, 'Return schema contains "createdBy"');

    const expenseSchema = Expense.schema.paths;
    const expenseCategories = expenseSchema.category.options.enum.values || expenseSchema.category.options.enum;
    assert(
      expenseCategories.includes('Rent') && expenseCategories.includes('Electricity') && expenseCategories.includes('Salary'),
      'Expense categories enum supports Rent, Electricity, and Salary'
    );

    // --- TEST 2: Returns Ingestion Workflow ---
    const mockCustId = new mongoose.Types.ObjectId();
    const mockMedId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();
    const mockSaleId = new mongoose.Types.ObjectId();

    const mockMedicine = {
      _id: mockMedId,
      name: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen',
      sellingPrice: 5.00,
      status: 'Active'
    };

    const mockBatch = new Batch({
      _id: new mongoose.Types.ObjectId(),
      medicine: mockMedId,
      batchNumber: 'RET-BATCH-01',
      expiryDate: new Date(Date.now() + 100000000), // Future (Active/eligible)
      currentQuantity: 35
    });

    const mockExpiredBatch = new Batch({
      _id: new mongoose.Types.ObjectId(),
      medicine: mockMedId,
      batchNumber: 'RET-BATCH-EXPIRED',
      expiryDate: new Date(Date.now() - 100000000), // Past (Expired/ineligible)
      currentQuantity: 5
    });

    const mockSale = {
      _id: mockSaleId,
      invoiceNumber: 'INV-RET-TEST',
      customer: mockCustId,
      totalAmount: 50.00
    };

    const mockSaleItem = {
      _id: new mongoose.Types.ObjectId(),
      sale: mockSaleId,
      medicine: mockMedId,
      batchNumber: 'RET-BATCH-01',
      quantity: 10,
      unitPrice: 5.00
    };

    const mockExpiredSaleItem = {
      _id: new mongoose.Types.ObjectId(),
      sale: mockSaleId,
      medicine: mockMedId,
      batchNumber: 'RET-BATCH-EXPIRED',
      quantity: 3,
      unitPrice: 5.00
    };

    let mockSavedBatches = [mockBatch, mockExpiredBatch];
    let mockSavedReturns = [];
    let mockSavedReturnItems = [];
    let mockSavedExpenses = [];

    // Stubs
    Sale.findById = async (id) => {
      if (id.toString() === mockSaleId.toString()) return mockSale;
      return null;
    };

    Medicine.findById = async (id) => {
      if (id.toString() === mockMedId.toString()) return mockMedicine;
      return null;
    };

    SaleItem.findOne = async (query) => {
      if (query.sale.toString() === mockSaleId.toString() && query.medicine.toString() === mockMedId.toString()) {
        if (query.batchNumber === 'RET-BATCH-01') return mockSaleItem;
        if (query.batchNumber === 'RET-BATCH-EXPIRED') return mockExpiredSaleItem;
      }
      return null;
    };

    // Chainable ReturnItem.find mock with populate
    ReturnItem.find = (query) => {
      const getResult = () => mockSavedReturnItems.filter(it => it.medicine.toString() === query.medicine.toString() && it.batchNumber === query.batchNumber);
      
      const chain = {
        populate: () => {
          const result = getResult().map(it => {
            const retDoc = mockSavedReturns.find(r => r._id.toString() === it.return.toString());
            // Attach the return document header
            it.return = retDoc || it.return;
            return it;
          });
          return Promise.resolve(result);
        },
        then: (onResolve) => {
          return Promise.resolve(getResult()).then(onResolve);
        }
      };
      return chain;
    };

    Batch.findOne = async (query) => {
      return mockSavedBatches.find(b => b.medicine.toString() === query.medicine.toString() && b.batchNumber === query.batchNumber) || null;
    };

    // Prototype saves
    Return.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSavedReturns.push(this);
      return Promise.resolve(this);
    };

    ReturnItem.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSavedReturnItems.push(this);
      return Promise.resolve(this);
    };

    Batch.prototype.save = function() {
      const idx = mockSavedBatches.findIndex(b => b._id.toString() === this._id.toString());
      if (idx !== -1) mockSavedBatches[idx] = this;
      return Promise.resolve(this);
    };

    Expense.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSavedExpenses.push(this);
      return Promise.resolve(this);
    };

    InventoryLog.prototype.save = function() { return Promise.resolve(this); };

    const mockRes = () => {
      let code = 200;
      let payload = null;
      const resObj = {
        status: function(c) {
          code = c;
          return this;
        },
        json: function(p) {
          payload = p;
          return this;
        },
        getStatusCode: () => code,
        getPayload: () => payload
      };
      return resObj;
    };

    // --- TEST 2.1: Reject return of 0 units ---
    console.log('Testing return of 0 units...');
    const reqZero = {
      user: { id: mockUserId.toString() },
      body: {
        saleId: mockSaleId.toString(),
        reason: 'Zero return test',
        refundAmount: 0,
        items: [{ medicineId: mockMedId.toString(), batchNumber: 'RET-BATCH-01', quantity: 0, unitPrice: 5.00 }]
      }
    };
    const resZero = mockRes();
    await returnController.createReturn(reqZero, resZero, (err) => { throw err; });
    assert(resZero.getStatusCode() === 400, 'Return of 0 units is rejected with 400');

    // --- TEST 2.2: Reject return of 15 units (exceeding original 10) ---
    console.log('Testing return of 15 units (exceeding original 10)...');
    const reqExceed = {
      user: { id: mockUserId.toString() },
      body: {
        saleId: mockSaleId.toString(),
        reason: 'Exceed test',
        refundAmount: 75.00,
        items: [{ medicineId: mockMedId.toString(), batchNumber: 'RET-BATCH-01', quantity: 15, unitPrice: 5.00 }]
      }
    };
    const resExceed = mockRes();
    await returnController.createReturn(reqExceed, resExceed, (err) => { throw err; });
    assert(resExceed.getStatusCode() === 400, 'Return exceeding original invoice quantity is rejected with 400');

    // --- TEST 2.3: Process valid return of 4 units and verify restocking ---
    console.log('Processing valid return of 4 units...');
    const reqValid = {
      user: { id: mockUserId.toString() },
      body: {
        saleId: mockSaleId.toString(),
        reason: 'Restocking test',
        refundAmount: 20.00,
        items: [{ medicineId: mockMedId.toString(), batchNumber: 'RET-BATCH-01', quantity: 4, unitPrice: 5.00 }]
      }
    };
    const resValid = mockRes();
    await returnController.createReturn(reqValid, resValid, (err) => { throw err; });

    assert(resValid.getStatusCode() === 201, 'Valid return slip processed successfully (code 201)');
    assert(mockSavedReturns.length === 1, 'Return header is saved to database');
    assert(mockSavedReturnItems.length === 1, 'Return item is saved to database');
    assert(mockBatch.currentQuantity === 39, 'Active non-expired batch stock increases from 35 to 39 units (successfully restocked)');

    // --- TEST 2.4: Reject secondary return exceeding aggregate sold limit ---
    console.log('Testing secondary return of 8 units (total 4+8=12 > 10)...');
    const reqSecondaryExceed = {
      user: { id: mockUserId.toString() },
      body: {
        saleId: mockSaleId.toString(),
        reason: 'Secondary exceed test',
        refundAmount: 40.00,
        items: [{ medicineId: mockMedId.toString(), batchNumber: 'RET-BATCH-01', quantity: 8, unitPrice: 5.00 }]
      }
    };
    const resSecondaryExceed = mockRes();
    await returnController.createReturn(reqSecondaryExceed, resSecondaryExceed, (err) => { throw err; });
    assert(resSecondaryExceed.getStatusCode() === 400, 'Secondary return exceeding aggregate sold quantity is rejected');
    assert(mockBatch.currentQuantity === 39, 'Restocked quantity remains unchanged after rejected transaction');

    // --- TEST 2.5: Process return on Expired batch and assert NO stock restoration ---
    console.log('Processing return on expired batch...');
    const reqExpired = {
      user: { id: mockUserId.toString() },
      body: {
        saleId: mockSaleId.toString(),
        reason: 'Expired return test',
        refundAmount: 10.00,
        items: [{ medicineId: mockMedId.toString(), batchNumber: 'RET-BATCH-EXPIRED', quantity: 2, unitPrice: 5.00 }]
      }
    };
    const resExpired = mockRes();
    await returnController.createReturn(reqExpired, resExpired, (err) => { throw err; });

    assert(resExpired.getStatusCode() === 201, 'Return slip on expired batch processed successfully');
    assert(mockExpiredBatch.currentQuantity === 5, 'Expired batch stock remains unchanged (5 units) - stock not restored');

    // --- TEST 3: Expense creations checks ---
    console.log('Processing expense voucher logging...');
    const reqExpense = {
      body: {
        title: 'Electricity August Bill',
        description: 'Store power bill',
        amount: 250.00,
        category: 'Electricity',
        date: new Date()
      }
    };
    const resExpense = mockRes();
    await expenseController.createExpense(reqExpense, resExpense, (err) => { throw err; });
    assert(resExpense.getStatusCode() === 201, 'Expense voucher logged successfully (code 201)');
    assert(mockSavedExpenses.length === 1, 'Expense slip is saved to database');
    assert(mockSavedExpenses[0].category === 'Electricity', 'Expense Category maps to Electricity');

  } catch (error) {
    console.error('Unexpected error running return and expense validation tests:', error);
    failed++;
  }

  console.log('\n--- RETURNS & EXPENSES VERIFICATION SUMMARY ---');
  console.log(`Passed: ${passed} checks`);
  console.log(`Failed: ${failed} checks`);

  if (failed === 0) {
    console.log('\n🚀 ALL SALES RETURNS AND OPERATIONAL EXPENSE CHECKS PASSED! 🚀\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME RETURNS & EXPENSES VERIFICATION CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runReturnsVerification();
