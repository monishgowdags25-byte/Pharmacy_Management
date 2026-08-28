const mongoose = require('mongoose');
const Batch = require('../models/Batch');
const InventoryLog = require('../models/InventoryLog');
const inventoryService = require('../services/inventoryService');

const runInventoryVerification = async () => {
  console.log('Starting offline Inventory FEFO and business rules validation suite...\n');

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

  // Setup Mock Data
  const medId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();
  const today = new Date();
  
  const earlyExpiryDate = new Date();
  earlyExpiryDate.setDate(today.getDate() + 30); // 30 days expiry

  const laterExpiryDate = new Date();
  laterExpiryDate.setDate(today.getDate() + 180); // 180 days expiry

  const expiredDate = new Date();
  expiredDate.setDate(today.getDate() - 5); // Already expired 5 days ago

  // Create Batch A & B mock documents
  const batchA = new Batch({
    _id: new mongoose.Types.ObjectId(),
    medicine: medId,
    batchNumber: 'BATCH-A',
    manufacturingDate: today,
    expiryDate: earlyExpiryDate,
    currentQuantity: 50,
    quantityPurchased: 50
  });

  const batchB = new Batch({
    _id: new mongoose.Types.ObjectId(),
    medicine: medId,
    batchNumber: 'BATCH-B',
    manufacturingDate: today,
    expiryDate: laterExpiryDate,
    currentQuantity: 100,
    quantityPurchased: 100
  });

  const expiredBatch = new Batch({
    _id: new mongoose.Types.ObjectId(),
    medicine: medId,
    batchNumber: 'BATCH-EXPIRED',
    manufacturingDate: today,
    expiryDate: expiredDate,
    currentQuantity: 30,
    quantityPurchased: 30
  });

  // Local storage for stubbing
  let mockBatches = [batchA, batchB, expiredBatch];

  // Stub Mongoose Query Actions
  const originalFind = Batch.find;
  Batch.find = (query) => {
    return {
      sort: (sortCriteria) => {
        let result = [...mockBatches];

        // Filter: only non-expired active stock if required
        if (query.expiryDate && query.expiryDate.$gt) {
          const dateLimit = query.expiryDate.$gt;
          result = result.filter(b => b.expiryDate > dateLimit);
        }
        if (query.currentQuantity && query.currentQuantity.$gt) {
          result = result.filter(b => b.currentQuantity > 0);
        }

        // Sort: Sort by expiry date ascending
        if (sortCriteria && sortCriteria.expiryDate) {
          result.sort((a, b) => a.expiryDate - b.expiryDate);
        }
        
        return Promise.resolve(result);
      }
    };
  };

  // Stub Mongoose prototype Save
  Batch.prototype.save = function() {
    const idx = mockBatches.findIndex(b => b._id.toString() === this._id.toString());
    if (idx !== -1) {
      mockBatches[idx] = this;
    }
    return Promise.resolve(this);
  };

  // Stub InventoryLog Save
  InventoryLog.prototype.save = function() {
    return Promise.resolve(this);
  };

  try {
    // --- TEST 1: Initial State Check ---
    assert(batchA.currentQuantity === 50, 'Batch A initial quantity is 50');
    assert(batchB.currentQuantity === 100, 'Batch B initial quantity is 100');

    // --- TEST 2: Sell 20 units (Expected: Batch A = 30, Batch B = 100) ---
    console.log('\n[Scenario 1] Deducting 20 units via FEFO...');
    await inventoryService.deductStockFEFO(medId, 20, userId, 'SALE');
    
    assert(batchA.currentQuantity === 30, 'FEFO Deduct 20: Batch A quantity becomes 30 (earlier expiry)');
    assert(batchB.currentQuantity === 100, 'FEFO Deduct 20: Batch B quantity remains 100 (later expiry)');

    // --- TEST 3: Sell 40 units (Expected: Batch A = 0, Batch B = 90) ---
    console.log('\n[Scenario 2] Deducting another 40 units via FEFO...');
    await inventoryService.deductStockFEFO(medId, 40, userId, 'SALE');
    
    assert(batchA.currentQuantity === 0, 'FEFO Deduct 40: Batch A quantity is drained to 0');
    assert(batchB.currentQuantity === 90, 'FEFO Deduct 40: Batch B quantity is reduced to 90');

    // --- TEST 4: Expired batch is skipped/rejected ---
    assert(expiredBatch.currentQuantity === 30, 'Expired Batch has initial stock of 30');
    
    console.log('\n[Scenario 3] Verification that Expired batch is never deducted...');
    // We try to deduct 100 units. Total available non-expired stock is now 90 (Batch B).
    // If expired batch was included, total would be 90 + 30 = 120, and deduction of 100 would succeed.
    // But since expired batch is ignored, the total is 90, so deducting 100 must throw an error.
    let thrown = false;
    try {
      await inventoryService.deductStockFEFO(medId, 100, userId, 'SALE');
    } catch (e) {
      thrown = true;
    }
    assert(thrown === true, 'Deduction exceeding active non-expired stock (ignoring expired) throws error');
    assert(expiredBatch.currentQuantity === 30, 'Expired batch quantity remains unchanged');

    // --- TEST 5: Insufficient stock rejection ---
    console.log('\n[Scenario 4] Verification that insufficient stock request is rejected...');
    let thrownInsufficient = false;
    try {
      await inventoryService.deductStockFEFO(medId, 200, userId, 'SALE');
    } catch (e) {
      thrownInsufficient = true;
    }
    assert(thrownInsufficient === true, 'Request exceeding total available stock is rejected');
    assert(batchB.currentQuantity === 90, 'Batch B stock remains unchanged after rejected transaction');

    // --- TEST 6: Reject negative and zero quantities ---
    let thrownNegative = false;
    try {
      await inventoryService.deductStockFEFO(medId, -10, userId, 'SALE');
    } catch (e) {
      thrownNegative = true;
    }
    assert(thrownNegative === true, 'Negative deduction quantity is rejected');

    let thrownZero = false;
    try {
      await inventoryService.deductStockFEFO(medId, 0, userId, 'SALE');
    } catch (e) {
      thrownZero = true;
    }
    assert(thrownZero === true, 'Zero deduction quantity is rejected');

  } catch (error) {
    console.error('Unexpected error running inventory validations:', error);
    failed++;
  }

  // Restore stubs
  Batch.find = originalFind;

  console.log('\n--- INVENTORY VERIFICATION SUMMARY ---');
  console.log(`Passed: ${passed} checks`);
  console.log(`Failed: ${failed} checks`);

  if (failed === 0) {
    console.log('\n🚀 ALL INVENTORY AND FEFO BUSINESS CHECKS PASSED! 🚀\n');
    process.exit(0);
  } else {
    console.error('\n❌ INVENTORY BUSINESS CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runInventoryVerification();
