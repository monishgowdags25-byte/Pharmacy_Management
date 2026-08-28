const express = require('express');
const { auditLogController } = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('ADMIN'), auditLogController.getAuditLogs);

module.exports = router;
