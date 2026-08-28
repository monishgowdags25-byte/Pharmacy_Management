const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Purchase = require('../models/Purchase');
const Return = require('../models/Return');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const dashboardService = require('../services/dashboardService');

const runDashboardVerification = async () => {
  console.log('Starting offline Dashboard & Analytics validation suite...\n');

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
    // --- SEED MOCK DATA ---
    const mockCustId = new mongoose.Types.ObjectId();
    const mockSupId = new mongoose.Types.ObjectId();
    
    const mockMed1Id = new mongoose.Types.ObjectId(); // Normal stock
    const mockMed2Id = new mongoose.Types.ObjectId(); // Low stock
    const mockMed3Id = new mongoose.Types.ObjectId(); // Out of stock

    const mockMed1 = { _id: mockMed1Id, name: 'Paracetamol 500mg', status: 'Active', reorderLevel: 20 };
    const mockMed2 = { _id: mockMed2Id, name: 'Amoxicillin 250mg', status: 'Active', reorderLevel: 50 };
    const mockMed3 = { _id: mockMed3Id, name: 'Metformin 850mg', status: 'Active', reorderLevel: 15 };

    const now = new Date();
    const futureDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year future
    const expiringDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days future (Expiring soon)
    const expiredDate = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days expired

    const mockBatch1 = { medicine: mockMed1Id, batchNumber: 'B1', currentQuantity: 100, expiryDate: futureDate };
    const mockBatch2 = { medicine: mockMed2Id, batchNumber: 'B2', currentQuantity: 15, expiryDate: futureDate }; // Low stock (15 <= 50)
    const mockBatch3 = { medicine: mockMed3Id, batchNumber: 'B3', currentQuantity: 0, expiryDate: futureDate }; // Out of stock
    const mockBatchExpiring = { medicine: mockMed1Id, batchNumber: 'B-EXP-SOON', currentQuantity: 10, expiryDate: expiringDate }; // Expiring soon
    const mockBatchExpired = { medicine: mockMed1Id, batchNumber: 'B-EXPIRED', currentQuantity: 5, expiryDate: expiredDate }; // Expired

    const mockSale1 = { saleDate: now, totalAmount: 450.00, status: 'Completed' };
    const mockSale2 = { saleDate: now, totalAmount: 150.00, status: 'Completed' };

    const mockPurchase1 = { purchaseDate: now, grandTotal: 800.00, status: 'COMPLETED' };

    const mockSaleItem1 = { medicine: mockMed1, quantity: 20 };
    const mockSaleItem2 = { medicine: mockMed2, quantity: 5 };

    // Set up MongoDB query stubs
    Medicine.countDocuments = async () => 3; // Paracetamol, Amoxicillin, Metformin
    Customer.countDocuments = async () => 1;
    Supplier.countDocuments = async () => 1;

    Batch.find = async (query) => {
      const allBatches = [mockBatch1, mockBatch2, mockBatch3, mockBatchExpiring, mockBatchExpired];
      if (query && query.currentQuantity) {
        return allBatches.filter(b => b.currentQuantity > 0);
      }
      return allBatches;
    };

    Medicine.find = (query) => {
      const list = [mockMed1, mockMed2, mockMed3];
      if (query && query.status) {
        return Promise.resolve(list.filter(m => m.status === query.status));
      }
      return {
        sort: () => {
          return {
            limit: () => Promise.resolve(list)
          };
        }
      };
    };

    Sale.find = (query) => {
      const list = [mockSale1, mockSale2];
      if (query && query.saleDate) {
        return Promise.resolve(list);
      }
      return {
        populate: () => {
          return {
            populate: () => {
              return {
                sort: () => {
                  return {
                    limit: () => Promise.resolve(list)
                  };
                }
              };
            }
          };
        }
      };
    };

    Purchase.countDocuments = async () => 1; // 1 purchase today

    SaleItem.find = () => {
      return {
        populate: () => Promise.resolve([mockSaleItem1, mockSaleItem2])
      };
    };

    Purchase.find = () => {
      return {
        populate: () => {
          return {
            sort: () => {
              return {
                limit: () => Promise.resolve([mockPurchase1])
              };
            }
          };
        }
      };
    };

    Return.find = () => {
      return {
        populate: () => {
          return {
            sort: () => {
              return {
                limit: () => Promise.resolve([])
              };
            }
          };
        }
      };
    };

    // Execute Service
    const summary = await dashboardService.getDashboardSummary();
    console.log('Aggregated KPIs:', JSON.stringify(summary.kpi, null, 2));

    // Assertions
    assert(summary.kpi.totalMedicines === 3, 'Total active medicines is correctly aggregated');
    assert(summary.kpi.totalStock === 130, 'Total active stock count is correct (100 + 15 + 10 + 5 active currentQuantity check)');
    assert(summary.kpi.lowStock === 1, 'Low stock count matches (Amoxicillin)');
    assert(summary.kpi.outOfStock === 1, 'Out of stock count matches (Metformin)');
    assert(summary.kpi.expiringSoon === 1, 'Expiring soon batch count matches (1)');
    assert(summary.kpi.expired === 1, 'Expired batch count matches (1)');
    assert(summary.kpi.todaySales === 600.00, "Today's sales total calculated dynamically: $450 + $150 = $600");
    assert(summary.kpi.todayOrders === 1, "Today's purchase orders matches (1)");
    assert(summary.topSellingMedicines.length === 2, 'Top selling medicines calculated from items');
    assert(summary.topSellingMedicines[0].name === 'Paracetamol 500mg', 'Top selling product matches Paracetamol');

  } catch (error) {
    console.error('Unexpected error running dashboard validation tests:', error);
    failed++;
  }

  console.log('\n--- DASHBOARD & ANALYTICS VERIFICATION SUMMARY ---');
  console.log(`Passed: ${passed} checks`);
  console.log(`Failed: ${failed} checks`);

  if (failed === 0) {
    console.log('\n🚀 ALL DASHBOARD AND ANALYTICS METRICS CHECKS PASSED! 🚀\n');
    process.exit(0);
  } else {
    console.error('\n❌ SOME DASHBOARD & ANALYTICS CHECKS FAILED! ❌\n');
    process.exit(1);
  }
};

runDashboardVerification();
