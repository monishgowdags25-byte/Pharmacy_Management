const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { loginRateLimiter } = require('../middleware/security');

const router = express.Router();

// Public Routes with Brute-Force Rate Limiter
router.post('/login', loginRateLimiter({ windowMs: 15 * 60 * 1000, max: 25 }), authController.login);

// Protected Routes
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;
