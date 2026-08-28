const express = require('express');
const purchaseController = require('../controllers/purchaseController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Allowed roles for Purchases
const purchaseStaff = ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'];

router.get('/', authorize(...purchaseStaff), purchaseController.getPurchases);
router.get('/:id', authorize(...purchaseStaff), purchaseController.getPurchaseById);
router.post('/', authorize(...purchaseStaff), purchaseController.createPurchase);
router.put('/:id', authorize(...purchaseStaff), purchaseController.updatePurchase);
router.put('/:id/complete', authorize(...purchaseStaff), purchaseController.completePurchase);
router.put('/:id/cancel', authorize(...purchaseStaff), purchaseController.cancelPurchase);

module.exports = router;
