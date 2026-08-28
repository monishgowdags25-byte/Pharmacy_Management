const express = require('express');
const expenseController = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Restricted to Admin and Inventory Manager roles managing accounts
const financeStaff = ['ADMIN', 'INVENTORY_MANAGER'];

router.get('/', authorize(...financeStaff), expenseController.getExpenses);
router.post('/', authorize(...financeStaff), expenseController.createExpense);
router.put('/:id', authorize(...financeStaff), expenseController.updateExpense);
router.delete('/:id', authorize(...financeStaff), expenseController.deleteExpense);

module.exports = router;
