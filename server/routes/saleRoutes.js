const express = require('express');
const saleController = require('../controllers/saleController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Allowed roles for checkout POS register actions
const checkoutStaff = ['ADMIN', 'PHARMACIST', 'CASHIER'];

router.get('/', authorize(...checkoutStaff), saleController.getSales);
router.get('/:id', authorize(...checkoutStaff), saleController.getSaleById);
router.post('/', authorize(...checkoutStaff), saleController.createSale);

module.exports = router;
