const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Restricted to Admin and Inventory Manager roles managing finances
const managerRoles = ['ADMIN', 'INVENTORY_MANAGER'];

router.get('/sales', authorize(...managerRoles), reportController.getSalesReport);
router.get('/purchases', authorize(...managerRoles), reportController.getPurchaseReport);
router.get('/inventory', authorize(...managerRoles), reportController.getInventoryReport);
router.get('/profit', authorize(...managerRoles), reportController.getProfitReport);
router.get('/medicines', authorize(...managerRoles), reportController.getMedicinePerformance);
router.get('/suppliers', authorize(...managerRoles), reportController.getSupplierReport);

module.exports = router;
