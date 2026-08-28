const express = require('express');
const demoController = require('../controllers/demoController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Require authentication for all demo endpoints
router.use(authenticate);

// All pharmacy staff roles (Admin, Pharmacist, Inventory Manager) can generate demo data for testing & demonstrations
const allowedDemoStaff = ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'];

router.get('/status', authorize(...allowedDemoStaff), demoController.getStatus);
router.post('/all', authorize(...allowedDemoStaff), demoController.seedAll);
router.post('/categories', authorize(...allowedDemoStaff), demoController.seedCategories);
router.post('/medicines', authorize(...allowedDemoStaff), demoController.seedMedicines);
router.post('/inventory', authorize(...allowedDemoStaff), demoController.seedInventory);
router.post('/suppliers', authorize(...allowedDemoStaff), demoController.seedSuppliers);
router.post('/purchases', authorize(...allowedDemoStaff), demoController.seedPurchases);
router.post('/sales', authorize(...allowedDemoStaff), demoController.seedSales);
router.post('/customers', authorize(...allowedDemoStaff), demoController.seedCustomers);
router.post('/prescriptions', authorize(...allowedDemoStaff), demoController.seedPrescriptions);
router.post('/returns', authorize(...allowedDemoStaff), demoController.seedReturns);
router.post('/expenses', authorize(...allowedDemoStaff), demoController.seedExpenses);
router.post('/notifications', authorize(...allowedDemoStaff), demoController.seedNotifications);
router.post('/audit-logs', authorize(...allowedDemoStaff), demoController.seedAuditLogs);
router.post('/users', authorize(...allowedDemoStaff), demoController.seedUsers);

// Clear only demo data
router.post('/clear', authorize('ADMIN', 'INVENTORY_MANAGER'), demoController.clearDemo);

module.exports = router;
