const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth + role guards to all routes in this router (ADMIN only)
router.use(authenticate);
router.use(authorize('ADMIN'));

// CRUD Routes for Admin staff management
router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
