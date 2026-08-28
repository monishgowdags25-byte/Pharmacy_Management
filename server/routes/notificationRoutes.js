const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const allStaff = ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER', 'CASHIER'];

router.get('/',                notificationController.getNotifications);
router.patch('/read-all',      authorize('ADMIN', ...allStaff), notificationController.markAllRead);
router.patch('/:id/read',      notificationController.markRead);
router.post('/generate',       authorize('ADMIN', 'INVENTORY_MANAGER'), notificationController.generateNotifications);

module.exports = router;
