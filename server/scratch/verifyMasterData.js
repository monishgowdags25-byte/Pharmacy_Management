const mongoose = require('mongoose');

// Import models to register them
const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Batch = require('../models/Batch');

const runMasterDataVerification = async () => {
  console.log('Starting offline Master Data schemas and structure validation...\n');

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
    // --- TEST 1: Category Schema Check ---
    const catSchema = Category.schema.paths;
    assert(catSchema.name !== undefined, 'Category schema contains "name"');
    assert(!!catSchema.name.options.required, 'Category "name" is required');
    assert(catSchema.name.options.unique === true, 'Category "name" is configured as unique');
    assert(catSchema.description !== undefined, 'Category schema contains "description"');

    // --- TEST 2: Medicine Schema Check ---
    const medSchema = Medicine.schema.paths;
    assert(medSchema.name !== undefined, 'Medicine schema contains "name"');
    assert(medSchema.genericName !== undefined, 'Medicine schema contains "genericName"');
    assert(medSchema.category !== undefined, 'Medicine schema contains "category"');
    assert(medSchema.category.options.ref === 'Category', 'Medicine "category" references "Category" model');
    assert(medSchema.dosageForm !== undefined, 'Medicine schema contains "dosageForm"');
    
    // Check enums
    const dosageEnums = medSchema.dosageForm.options.enum.values || medSchema.dosageForm.options.enum;
    assert(dosageEnums.includes('Tablet') && dosageEnums.includes('Syrup'), 'Medicine "dosageForm" supports Tablet and Syrup enums');
    
    // Numeric constraints
    assert(!!medSchema.purchasePrice.options.required, 'Medicine "purchasePrice" is required');
    assert(medSchema.purchasePrice.options.min[0] === 0, 'Medicine "purchasePrice" restricts negative numbers');
    assert(medSchema.sellingPrice.options.min[0] === 0, 'Medicine "sellingPrice" restricts negative numbers');
    assert(medSchema.tax.options.min[0] === 0, 'Medicine "tax" restricts negative numbers');
    assert(medSchema.barcode.options.unique === true, 'Medicine "barcode" index is unique');

    // --- TEST 3: Supplier Schema Check ---
    const supSchema = Supplier.schema.paths;
    assert(supSchema.name !== undefined, 'Supplier schema contains "name"');
    assert(supSchema.phone !== undefined, 'Supplier schema contains "phone"');
    
    // Extended Corporate details check
    assert(supSchema.companyName !== undefined, 'Supplier schema contains "companyName"');
    assert(supSchema.vatNumber !== undefined, 'Supplier schema contains "vatNumber"');
    assert(supSchema.paymentTerms !== undefined, 'Supplier schema contains "paymentTerms"');
    assert(supSchema.notes !== undefined, 'Supplier schema contains "notes"');

    // --- TEST 4: Batch Schema Checks ---
    const batchSchema = Batch.schema.paths;
    assert(batchSchema.medicine !== undefined, 'Batch schema contains "medicine"');
    assert(batchSchema.medicine.options.ref === 'Medicine', 'Batch "medicine" references "Medicine" model');
    assert(batchSchema.supplier.options.ref === 'Supplier', 'Batch "supplier" references "Supplier" model');

    // Custom date validation hook definition check
    const expiryDateValidator = batchSchema.expiryDate.options.validate;
    assert(expiryDateValidator !== undefined, 'Batch schema has custom validators on "expiryDate"');

  } catch (error) {
    console.error('Unexpected error during offline master data verification:', error);
    failed++;
  }

  console.log('\n--- MASTER DATA SCHEMAS SUMMARY ---');
  console.log(`Passed: ${passed} checks`);
  console.log(`Failed: ${failed} checks`);

  if (failed === 0) {
    console.log('\n🚀 ALL MASTER DATA SCHEMA AND RELATIONSHIP INTEGRITY CHECKS PASSED! 🚀\n');
    process.exit(0);
  } else {
    console.error('\n❌ MASTER DATA INTEGRITY CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runMasterDataVerification();
