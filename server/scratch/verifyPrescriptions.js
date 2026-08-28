const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Prescription = require('../models/Prescription');
const PrescriptionItem = require('../models/PrescriptionItem');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const AuditLog = require('../models/AuditLog');
const InventoryLog = require('../models/InventoryLog');
const saleController = require('../controllers/saleController');
const prescriptionController = require('../controllers/prescriptionController');

const runPrescriptionVerification = async () => {
  console.log('Starting offline Customer & Prescription validation suite...\n');

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
    const customerSchema = Customer.schema.paths;
    assert(customerSchema.address !== undefined, 'Customer schema contains "address"');
    assert(customerSchema.dateOfBirth !== undefined, 'Customer schema contains "dateOfBirth"');

    const rxSchema = Prescription.schema.paths;
    assert(rxSchema.doctorRegistrationNumber !== undefined, 'Prescription schema contains "doctorRegistrationNumber"');
    
    const rxEnums = rxSchema.status.enumValues || [];
    assert(
      rxEnums.includes('PENDING') && rxEnums.includes('VERIFIED') && rxEnums.includes('DISPENSED') && rxEnums.includes('REJECTED'),
      'Prescription status enum supports PENDING, VERIFIED, DISPENSED, and REJECTED'
    );

    // --- TEST 2: Workflow checkouts stubs ---
    const mockCustId = new mongoose.Types.ObjectId();
    const mockMedId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();

    const mockCustomer = {
      _id: mockCustId,
      name: 'Robert Vance',
      phone: '555-9012'
    };

    const mockRestrictedMedicine = {
      _id: mockMedId,
      name: 'Codeine phosphate 30mg',
      sellingPrice: 12.00,
      purchasePrice: 7.00,
      tax: 0,
      prescriptionRequired: true
    };

    const mockBatch = new Batch({
      _id: new mongoose.Types.ObjectId(),
      medicine: mockMedId,
      batchNumber: 'RX-BATCH-A',
      expiryDate: new Date(Date.now() + 100000000), // Future
      currentQuantity: 50,
      quantityPurchased: 50
    });

    let mockSavedCustomers = [mockCustomer];
    let mockSavedMedicines = [mockRestrictedMedicine];
    let mockSavedBatches = [mockBatch];
    let mockSavedPrescriptions = [];
    let mockSavedPrescriptionItems = [];
    let mockSavedSales = [];
    let mockSavedSaleItems = [];

    // Mongoose stubs
    Medicine.findById = async (id) => {
      if (id.toString() === mockMedId.toString()) return mockRestrictedMedicine;
      return null;
    };

    Customer.findById = async (id) => {
      if (id.toString() === mockCustId.toString()) return mockCustomer;
      return null;
    };

    Batch.find = (query) => {
      const getResult = () => mockSavedBatches.filter(b => b.currentQuantity > 0);
      return {
        sort: () => Promise.resolve(getResult()),
        then: (onResolve) => Promise.resolve(getResult()).then(onResolve)
      };
    };

    Prescription.findById = async (id) => {
      return mockSavedPrescriptions.find(r => r._id.toString() === id.toString()) || null;
    };

    PrescriptionItem.find = async (query) => {
      return mockSavedPrescriptionItems.filter(item => item.prescription.toString() === query.prescription.toString());
    };

    // Save stubs
    Prescription.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      const idx = mockSavedPrescriptions.findIndex(r => r._id.toString() === this._id.toString());
      if (idx !== -1) mockSavedPrescriptions[idx] = this;
      else mockSavedPrescriptions.push(this);
      return Promise.resolve(this);
    };

    PrescriptionItem.prototype.save = function() {
      if (!this._id) this._id = new mongoose.Types.ObjectId();
      mockSavedPrescriptionItems.push(this);
      return Promise.resolve(this);
    };

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

    AuditLog.prototype.save = function() { return Promise.resolve(this); };
    InventoryLog.prototype.save = function() { return Promise.resolve(this); };

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

    // --- TEST 2.1: Upload new doctor prescription (Status PENDING) ---
    console.log('Uploading doctor prescription...');
    const reqRxUpload = {
      body: {
        customerId: mockCustId.toString(),
        doctorName: 'Dr. John Watson',
        doctorRegistrationNumber: 'MD-RX-991',
        items: [
          {
            medicineName: 'Codeine phosphate 30mg',
            medicineId: mockMedId.toString(),
            dosage: '1-0-1',
            frequency: 'Daily',
            duration: '5 days',
            instructions: 'Post dinner',
            quantity: 10
          }
        ]
      }
    };
    const resRxUpload = mockRes();
    await prescriptionController.createPrescription(reqRxUpload, resRxUpload, (err) => { throw err; });

    assert(resRxUpload.getStatusCode() === 201, 'Prescription uploaded successfully (code 201)');
    const createdRx = mockSavedPrescriptions[0];
    assert(createdRx.status === 'PENDING', 'Prescription is created in PENDING validation state');

    // --- TEST 2.2: Reject POS sale checkout for restricted drug without prescription ID ---
    console.log('Attempting POS sale checkout without prescription...');
    const reqNoRx = {
      user: { id: mockUserId.toString() },
      body: {
        customerId: mockCustId.toString(),
        paymentMethod: 'CASH',
        items: [{ medicineId: mockMedId.toString(), quantity: 5, unitPrice: 12.00 }]
      }
    };
    const resNoRx = mockRes();
    await saleController.createSale(reqNoRx, resNoRx, (err) => { throw err; });
    assert(resNoRx.getStatusCode() === 400, 'Checkout fails (400) because restricted medicine is sold without prescription');

    // --- TEST 2.3: Reject POS sale checkout with PENDING prescription ID ---
    console.log('Attempting POS sale checkout with PENDING prescription...');
    const reqPendingRx = {
      user: { id: mockUserId.toString() },
      body: {
        customerId: mockCustId.toString(),
        paymentMethod: 'CASH',
        prescriptionId: createdRx._id.toString(),
        items: [{ medicineId: mockMedId.toString(), quantity: 5, unitPrice: 12.00 }]
      }
    };
    const resPendingRx = mockRes();
    await saleController.createSale(reqPendingRx, resPendingRx, (err) => { throw err; });
    assert(resPendingRx.getStatusCode() === 400, 'Checkout fails (400) because prescription status is PENDING (not VERIFIED)');

    // --- TEST 2.4: Pharmacist approves/verifies prescription ---
    console.log('Pharmacist verifying prescription...');
    const reqVerify = {
      params: { id: createdRx._id.toString() },
      body: { status: 'VERIFIED' }
    };
    const resVerify = mockRes();
    await prescriptionController.updatePrescriptionStatus(reqVerify, resVerify, (err) => { throw err; });
    assert(resVerify.getStatusCode() === 200, 'Pharmacist verifies prescription successfully');
    assert(createdRx.status === 'VERIFIED', 'Prescription status updates to VERIFIED');

    // --- TEST 2.5: POS checkout with VERIFIED prescription succeeds ---
    console.log('Completing POS sale checkout with VERIFIED prescription...');
    const reqSuccessRx = {
      ip: '127.0.0.1',
      user: { id: mockUserId.toString() },
      body: {
        customerId: mockCustId.toString(),
        paymentMethod: 'CASH',
        prescriptionId: createdRx._id.toString(),
        items: [{ medicineId: mockMedId.toString(), quantity: 5, unitPrice: 12.00 }]
      }
    };
    const resSuccessRx = mockRes();
    await saleController.createSale(reqSuccessRx, resSuccessRx, (err) => { throw err; });

    assert(resSuccessRx.getStatusCode() === 201, 'POS Checkout with verified prescription succeeds (code 201)');
    assert(createdRx.status === 'DISPENSED', 'Prescription status transitions automatically to DISPENSED');
    
    // Verify database relationships
    const savedSale = mockSavedSales[0];
    assert(savedSale.customer.toString() === mockCustId.toString(), 'Sale relates to the correct Customer');
    assert(savedSale.prescription.toString() === createdRx._id.toString(), 'Sale relates to the correct Prescription');
    
    // Ingest stock deduction assert
    assert(mockBatch.currentQuantity === 45, 'Batch stock quantity decreases from 50 to 45 units');

  } catch (error) {
    console.error('Unexpected error running customer & prescription validation tests:', error);
    failed++;
  }

  console.log('\n--- PRESCRIPTIONS VERIFICATION SUMMARY ---');
  console.log(`Passed: ${passed} checks`);
  console.log(`Failed: ${failed} checks`);

  if (failed === 0) {
    console.log('\n🚀 ALL CUSTOMERS, PRESCRIPTIONS, AND POS LOCK CHECKS PASSED! 🚀\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME PRESCRIPTIONS VERIFICATION CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runPrescriptionVerification();
