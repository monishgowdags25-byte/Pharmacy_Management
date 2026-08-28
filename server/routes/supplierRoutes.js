const express = require('express');
const supplierController = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Allowed roles for Supplier directory
const supplierStaff = ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'];

router.get('/', authorize(...supplierStaff), supplierController.getSuppliers);
router.get('/:id', authorize(...supplierStaff), supplierController.getSupplierById);

router.post('/', authorize(...supplierStaff), supplierController.createSupplier);
router.put('/:id', authorize(...supplierStaff), supplierController.updateSupplier);
router.delete('/:id', authorize(...supplierStaff), supplierController.deleteSupplier);

module.exports = router;
