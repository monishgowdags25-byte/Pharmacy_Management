const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const AuditLog = require('../models/AuditLog');
const InventoryLog = require('../models/InventoryLog');
const saleController = require('../controllers/saleController');

const runSalesVerification = async () => {
  console.log('Starting offline POS Billing and FEFO validation suite...\n');

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
    const saleSchema = Sale.schema.paths;
    assert(saleSchema.invoiceNumber !== undefined, 'Sale schema contains "invoiceNumber"');
    assert(saleSchema.paymentMethod !== undefined, 'Sale schema contains "paymentMethod"');
    
    const validPaymentEnums = saleSchema.paymentMethod.enumValues || [];
    assert(validPaymentEnums.includes('CASH') && validPaymentEnums.includes('CARD') && validPaymentEnums.includes('UPI'), 'Sale paymentMethod enum supports CASH, CARD, and UPI');

    // --- TEST 2: Controller API Mock Checks (The 15-unit Split Scenario) ---
    const mockMedId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();
    const today = new Date();

    const earlyExpiryDate = new Date();
    earlyExpiryDate.setDate(today.getDate() + 30); // 30 days

    const laterExpiryDate = new Date();
    laterExpiryDate.setDate(today.getDate() + 180); // 180 days

    // Mock documents
    const mockMedicine = {
      _id: mockMedId,
      name: 'Amoxicillin 250mg',
      genericName: 'Amoxicillin',
      sellingPrice: 8.00,
      purchasePrice: 5.00,
      tax: 5,
      status: 'Active'
    };

    const batchA = new Batch({
      _id: new mongoose.Types.ObjectId(),
      medicine: mockMedId,
      batchNumber: 'BATCH-A',
      manufacturingDate: today,
      expiryDate: earlyExpiryDate,
      currentQuantity: 10,
      quantityPurchased: 10
    });

    const batchB = new Batch({
      _id: new mongoose.Types.ObjectId(),
      medicine: mockMedId,
      batchNumber: 'BATCH-B',
      manufacturingDate: today,
      expiryDate: laterExpiryDate,
      currentQuantity: 100,
      quantityPurchased: 100
    });

    let mockSavedBatches = [batchA, batchB];
    let mockSavedSales = [];
    let mockSavedSaleItems = [];
    let mockSavedAudits = [];

    // Stub Mongoose findById
    const originalMedFindById = Medicine.findById;
    Medicine.findById = async (id) => {
      if (id.toString() === mockMedId.toString()) return mockMedicine;
      return null;
    };

    // Stub Batch.find
    const originalBatchFind = Batch.find;
    Batch.find = (query) => {
      const getResult = () => {
        let result = [...mockSavedBatches];
        if (query.expiryDate && query.expiryDate.$gt) {
          const dateLimit = query.expiryDate.$gt;
          result = result.filter(b => b.expiryDate > dateLimit);
        }
        if (query.currentQuantity && query.currentQuantity.$gt) {
          result = result.filter(b => b.currentQuantity > 0);
        }
        return result;
      };

      const chain = {
        sort: (sortCriteria) => {
          let res = getResult();
          if (sortCriteria && sortCriteria.expiryDate) {
            res.sort((a, b) => a.expiryDate - b.expiryDate);
          }
          return Promise.resolve(res);
        },
        then: (onResolve) => {
          return Promise.resolve(getResult()).then(onResolve);
        }
      };
      return chain;
    };

    // Stub Save prototypes
    Batch.prototype.save = function() {
      const idx = mockSavedBatches.findIndex(b => b._id.toString() === this._id.toString());
      if (idx !== -1) mockSavedBatches[idx] = this;
      return Promise.resolve(this);
    };

    Sale.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSavedSales.push(this);
      return Promise.resolve(this);
    };

    SaleItem.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSavedSaleItems.push(this);
      return Promise.resolve(this);
    };

    AuditLog.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSavedAudits.push(this);
      return Promise.resolve(this);
    };

    InventoryLog.prototype.save = function() {
      return Promise.resolve(this);
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

    // --- TEST 2.1: Execute 15-Unit POS checkout transaction split ---
    console.log('Executing 15-unit POS checkout transaction split...');
    const reqSale = {
      ip: '127.0.0.1',
      user: { id: mockUserId.toString() },
      body: {
        paymentMethod: 'UPI',
        discountAmount: 10,
        taxAmount: 5,
        items: [
          {
            medicineId: mockMedId.toString(),
            quantity: 15,
            unitPrice: 8.00,
            taxAmount: 5
          }
        ]
      }
    };
    
    const resSale = mockRes();
    await saleController.createSale(reqSale, resSale, (err) => { throw err; });

    assert(resSale.getStatusCode() === 201, 'POS Sale completed successfully returning code 201');
    assert(mockSavedSales.length === 1, 'Sale header is saved to database');
    assert(mockSavedSales[0].paymentMethod === 'UPI', 'Payment method is registered as UPI');
    
    // Check FEFO Batch mutations
    assert(batchA.currentQuantity === 0, 'Batch A is fully consumed (drained to 0)');
    assert(batchB.currentQuantity === 95, 'Batch B quantity is reduced by remaining 5 units (becomes 95)');

    // Check SaleItem listings
    assert(mockSavedSaleItems.length === 2, 'Two separate SaleItem lines are created to log batch splitting');
    assert(
      mockSavedSaleItems[0].batchNumber === 'BATCH-A' && mockSavedSaleItems[0].quantity === 10,
      'SaleItem 1 records Batch-A consumption (10 units)'
    );
    assert(
      mockSavedSaleItems[1].batchNumber === 'BATCH-B' && mockSavedSaleItems[1].quantity === 5,
      'SaleItem 2 records Batch-B consumption (5 units)'
    );

    // Check Audit logging
    assert(mockSavedAudits.length === 1, 'Security audit log is generated');
    assert(mockSavedAudits[0].action === 'CREATE_SALE', 'Audit action type is "CREATE_SALE"');

    // --- TEST 2.2: Insufficient Stock check (Verify Transaction safety) ---
    console.log('\nExecuting 200-unit insufficient stock checkout...');
    const reqInsufficient = {
      user: { id: mockUserId.toString() },
      body: {
        paymentMethod: 'CASH',
        items: [
          {
            medicineId: mockMedId.toString(),
            quantity: 200,
            unitPrice: 8.00
          }
        ]
      }
    };
    const resInsufficient = mockRes();
    await saleController.createSale(reqInsufficient, resInsufficient, (err) => { throw err; });

    assert(resInsufficient.getStatusCode() === 400, 'Sale is rejected with code 400 due to insufficient stock');
    assert(batchB.currentQuantity === 95, 'Remaining Batch B stock remains unchanged (95) after rejected POS checkout');

    // Restore original stubs
    Medicine.findById = originalMedFindById;
    Batch.find = originalBatchFind;

  } catch (error) {
    console.error('Unexpected error running sales validation tests:', error);
    failed++;
  }

  console.log('\n--- SALES VERIFICATION SUMMARY ---');
  console.log(`Passed: ${passed} checks`);
  console.log(`Failed: ${failed} checks`);

  if (failed === 0) {
    console.log('\n🚀 ALL POS BILLING AND FEFO BUSINESS CHECKS PASSED! 🚀\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME POS BILLING VERIFICATION CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runSalesVerification();
