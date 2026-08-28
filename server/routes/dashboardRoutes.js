const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Accessible to all logged-in pharmacy staff
router.get('/summary', dashboardController.getSummary);

module.exports = router;
