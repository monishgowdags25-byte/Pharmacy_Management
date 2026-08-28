const express = require('express');
const inventoryController = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Standard inventory/batch management roles
const inventoryStaff = ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'];

router.get('/batches', authorize(...inventoryStaff), inventoryController.getBatches);
router.get('/alerts', authorize(...inventoryStaff), inventoryController.getInventoryAlerts);
router.get('/history', authorize(...inventoryStaff), inventoryController.getStockHistory);
router.post('/adjust', authorize(...inventoryStaff), inventoryController.adjustStock);

module.exports = router;
