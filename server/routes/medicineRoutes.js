const express = require('express');
const medicineController = require('../controllers/medicineController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// List/Read medicines
router.get('/', authorize('ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'), medicineController.getMedicines);
router.get('/:id', authorize('ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'), medicineController.getMedicineById);

// Manage medicines catalog
const medicineStaff = ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'];

router.post('/', authorize(...medicineStaff), medicineController.createMedicine);
router.put('/:id', authorize(...medicineStaff), medicineController.updateMedicine);
router.delete('/:id', authorize(...medicineStaff), medicineController.deleteMedicine);

module.exports = router;
