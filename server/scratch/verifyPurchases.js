const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const PurchaseItem = require('../models/PurchaseItem');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const InventoryLog = require('../models/InventoryLog');
const purchaseController = require('../controllers/purchaseController');

const runPurchaseVerification = async () => {
  console.log('Starting offline Purchase workflow validation suite...\n');

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
    // Check schemas attributes
    const purchaseSchema = Purchase.schema.paths;
    assert(purchaseSchema.invoiceNumber !== undefined, 'Purchase schema contains "invoiceNumber"');
    assert(purchaseSchema.grandTotal !== undefined, 'Purchase schema contains "grandTotal"');
    assert(purchaseSchema.createdBy !== undefined, 'Purchase schema contains "createdBy"');
    
    // Check enum statuses
    const purchaseEnums = purchaseSchema.status.enumValues || [];
    assert(purchaseEnums.includes('DRAFT') && purchaseEnums.includes('COMPLETED') && purchaseEnums.includes('CANCELLED'), 'Purchase status enum supports DRAFT, COMPLETED, and CANCELLED');

    // --- TEST 2: Controller API Mock Checks ---
    const mockMedId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();
    const mockSupplierId = new mongoose.Types.ObjectId();

    // Mock Medicine.findById
    const originalMedFindById = Medicine.findById;
    Medicine.findById = async (id) => {
      if (id.toString() === mockMedId.toString()) {
        return {
          _id: mockMedId,
          name: 'Acetaminophen 500mg',
          sellingPrice: 15.00,
          purchasePrice: 10.00
        };
      }
      return null;
    };

    // Stubs arrays
    let mockSavedPurchases = [];
    let mockSavedItems = [];
    let mockSavedBatches = [];
    let mockSavedLogs = [];

    // Stub Save prototypes
    Purchase.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      const idx = mockSavedPurchases.findIndex(p => p._id.toString() === this._id.toString());
      if (idx !== -1) mockSavedPurchases[idx] = this;
      else mockSavedPurchases.push(this);
      return Promise.resolve(this);
    };

    PurchaseItem.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSavedItems.push(this);
      return Promise.resolve(this);
    };

    Batch.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      const idx = mockSavedBatches.findIndex(b => b._id.toString() === this._id.toString());
      if (idx !== -1) mockSavedBatches[idx] = this;
      else mockSavedBatches.push(this);
      return Promise.resolve(this);
    };

    InventoryLog.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSavedLogs.push(this);
      return Promise.resolve(this);
    };

    // Stub Batch.findOne
    const originalBatchFindOne = Batch.findOne;
    Batch.findOne = async (query) => {
      return mockSavedBatches.find(b => b.medicine.toString() === query.medicine.toString() && b.batchNumber === query.batchNumber) || null;
    };

    // Stub Purchase.findById
    const originalPurchaseFindById = Purchase.findById;
    Purchase.findById = async (id) => {
      return mockSavedPurchases.find(p => p._id.toString() === id.toString()) || null;
    };

    // Stub PurchaseItem.find
    const originalPurchaseItemFind = PurchaseItem.find;
    PurchaseItem.find = async (query) => {
      return mockSavedItems.filter(item => item.purchase.toString() === query.purchase.toString());
    };

    // Mock response helpers
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

    // --- TEST 2.1: Create Draft Purchase successfully ---
    const reqCreate = {
      user: { id: mockUserId.toString() },
      body: {
        invoiceNumber: 'INV-TEST-120',
        supplierId: mockSupplierId.toString(),
        subtotal: 100,
        grandTotal: 100,
        items: [
          {
            medicineId: mockMedId.toString(),
            batchNumber: 'B-TEST-001',
            expiryDate: new Date(Date.now() + 100000000), // Future
            quantity: 10,
            purchasePrice: 10.00,
            tax: 0
          }
        ]
      }
    };
    
    const resCreate = mockRes();
    await purchaseController.createPurchase(reqCreate, resCreate, (err) => { throw err; });
    
    assert(resCreate.getStatusCode() === 201, 'Successfully creates draft purchase with code 201');
    assert(mockSavedPurchases.length === 1, 'Purchase header is saved to database');
    assert(mockSavedPurchases[0].status === 'DRAFT', 'Purchase is initially in DRAFT state');
    assert(mockSavedItems.length === 1, 'Purchase line items are saved to database');

    // --- TEST 2.2: Complete Draft Purchase (Ingest inventory) ---
    const targetPo = mockSavedPurchases[0];
    const reqComplete = {
      user: { id: mockUserId.toString() },
      params: { id: targetPo._id.toString() }
    };
    const resComplete = mockRes();
    
    await purchaseController.completePurchase(reqComplete, resComplete, (err) => { throw err; });
    
    assert(resComplete.getStatusCode() === 200, 'Successfully completes draft purchase order');
    assert(targetPo.status === 'COMPLETED', 'Purchase status updates to COMPLETED');
    assert(mockSavedBatches.length === 1, 'A new inventory Batch has been created for the medicine');
    assert(mockSavedBatches[0].currentQuantity === 10, 'Batch stock quantity corresponds to purchase quantity (10)');
    assert(mockSavedLogs.length === 1, 'An InventoryLog is recorded in the transaction ledger');
    assert(mockSavedLogs[0].type === 'PURCHASE', 'InventoryLog type matches "PURCHASE"');

    // --- TEST 2.3: Reject Cancelling Completed Purchase ---
    const reqCancel = {
      user: { id: mockUserId.toString() },
      params: { id: targetPo._id.toString() }
    };
    const resCancel = mockRes();
    
    await purchaseController.cancelPurchase(reqCancel, resCancel, (err) => { throw err; });
    assert(resCancel.getStatusCode() === 400, 'Attempts to cancel completed purchase are rejected with status 400');
    assert(targetPo.status === 'COMPLETED', 'Completed status remains unchanged after rejected cancellation');

    // Restore original stubs
    Medicine.findById = originalMedFindById;
    Batch.findOne = originalBatchFindOne;
    Purchase.findById = originalPurchaseFindById;
    PurchaseItem.find = originalPurchaseItemFind;

  } catch (error) {
    console.error('Unexpected error running purchases verification tests:', error);
    failed++;
  }

  console.log('\n--- PURCHASES VERIFICATION SUMMARY ---');
  console.log(`Passed: ${passed} checks`);
  console.log(`Failed: ${failed} checks`);

  if (failed === 0) {
    console.log('\n🚀 ALL PURCHASES AND RESTOCK INVENTORY CHECKS PASSED! 🚀\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME PURCHASES VERIFICATION CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runPurchaseVerification();
