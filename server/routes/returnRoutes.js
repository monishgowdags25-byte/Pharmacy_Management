const express = require('express');
const returnController = require('../controllers/returnController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const returnStaff = ['ADMIN', 'PHARMACIST', 'CASHIER'];

router.get('/', authorize(...returnStaff), returnController.getReturns);
router.get('/:id', authorize(...returnStaff), returnController.getReturnById);
router.post('/', authorize(...returnStaff), returnController.createReturn);

module.exports = router;
