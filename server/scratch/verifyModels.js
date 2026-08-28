const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Batch = require('../models/Batch');
const Customer = require('../models/Customer');

const runVerification = async () => {
  console.log('Starting offline Mongoose validation checks (No DB connection needed)...');
  
  let passedCount = 0;
  let failedCount = 0;

  const assertValidationFails = async (modelInstance, testName) => {
    try {
      await modelInstance.validate();
      console.error(`❌ FAIL: [${testName}] validation should have failed, but passed.`);
      failedCount++;
    } catch (err) {
      console.log(`✅ PASS: [${testName}] validation failed as expected. Error:`, err.message);
      passedCount++;
    }
  };

  const assertValidationPasses = async (modelInstance, testName) => {
    try {
      await modelInstance.validate();
      console.log(`✅ PASS: [${testName}] validation passed successfully.`);
      passedCount++;
    } catch (err) {
      console.error(`❌ FAIL: [${testName}] validation failed. Error:`, err.message);
      failedCount++;
    }
  };

  // --- TEST 1: Medicine Negative Price Bounds ---
  const badMed = new Medicine({
    name: 'Negative Price Med',
    genericName: 'NegativeGeneric',
    brand: 'BrandA',
    category: new mongoose.Types.ObjectId(),
    dosageForm: 'Tablet',
    strength: '10mg',
    unit: 'Strip',
    purchasePrice: -10, // Invalid
    sellingPrice: 15
  });
  await assertValidationFails(badMed, 'Medicine Negative Purchase Price');

  // --- TEST 2: Medicine Valid Constraints ---
  const goodMed = new Medicine({
    name: 'Valid Med',
    genericName: 'ValidGeneric',
    brand: 'BrandA',
    category: new mongoose.Types.ObjectId(),
    dosageForm: 'Tablet',
    strength: '10mg',
    unit: 'Strip',
    purchasePrice: 10,
    sellingPrice: 15
  });
  await assertValidationPasses(goodMed, 'Medicine Valid Parameters');

  // --- TEST 3: Batch Expiry Date Bounds ---
  const badBatch = new Batch({
    batchNumber: 'BATCH-EXPIRED',
    medicine: new mongoose.Types.ObjectId(),
    supplier: new mongoose.Types.ObjectId(),
    manufacturingDate: new Date('2026-08-20'),
    expiryDate: new Date('2026-08-10'), // Expiry before Manufacturing (Invalid)
    purchasePrice: 20,
    sellingPrice: 30,
    quantityPurchased: 100,
    currentQuantity: 100
  });
  await assertValidationFails(badBatch, 'Batch Expiry Before Manufacturing Date');

  // --- TEST 4: Customer Negative Loyalty Points ---
  const badCustomer = new Customer({
    name: 'Negative Points Customer',
    phone: '9876543210',
    points: -5 // Invalid
  });
  await assertValidationFails(badCustomer, 'Customer Negative Loyalty Points');

  // --- TEST 5: User Validation check ---
  const badUser = new User({
    name: 'Bad Email User',
    email: 'not-an-email', // Invalid email format
    password: 'password123',
    role: 'InvalidRole' // Invalid role enum
  });
  await assertValidationFails(badUser, 'User Email Format and Role Enum');

  // --- TEST 6: Batch Composite Index Verification ---
  console.log('\nVerifying database indexes definitions...');
  const batchIndexes = Batch.schema.indexes();
  const compositeIndex = batchIndexes.find(idx => {
    const fields = idx[0];
    return fields.medicine === 1 && fields.batchNumber === 1 && idx[1]?.unique === true;
  });

  if (compositeIndex) {
    console.log('✅ PASS: Batch model has a unique composite index on { medicine: 1, batchNumber: 1 }.');
    passedCount++;
  } else {
    console.error('❌ FAIL: Batch model is missing unique composite index on { medicine: 1, batchNumber: 1 }.');
    failedCount++;
  }

  console.log('\n--- VERIFICATION SUMMARY ---');
  console.log(`Passed: ${passedCount} checks`);
  console.log(`Failed: ${failedCount} checks`);
  
  if (failedCount === 0) {
    console.log('\n🚀 ALL OFFLINE SCHEMA VALIDATIONS PASSED SUCCESSFULLY! 🚀\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME SCHEMA VALIDATIONS FAILED! ❌\n');
    process.exit(1);
  }
};

runVerification();
