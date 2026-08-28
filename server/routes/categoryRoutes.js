const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// List/Read categories
router.get('/', authorize('ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'), categoryController.getCategories);

// Manage categories
const categoryStaff = ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'];

router.post('/', authorize(...categoryStaff), categoryController.createCategory);
router.put('/:id', authorize(...categoryStaff), categoryController.updateCategory);
router.delete('/:id', authorize(...categoryStaff), categoryController.deleteCategory);

module.exports = router;
