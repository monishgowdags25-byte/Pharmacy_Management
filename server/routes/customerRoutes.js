const express = require('express');
const customerController = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Allowed roles for customer profiles access
const customerStaff = ['ADMIN', 'PHARMACIST', 'CASHIER'];

router.get('/', authorize(...customerStaff), customerController.getCustomers);
router.get('/:id', authorize(...customerStaff), customerController.getCustomerById);
router.post('/', authorize(...customerStaff), customerController.createCustomer);
router.put('/:id', authorize(...customerStaff), customerController.updateCustomer);

module.exports = router;
