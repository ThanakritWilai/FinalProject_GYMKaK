const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateUniqueEmail, validateUniquePhone } = require('../middleware/validationMiddleware');

// @route   POST /api/auth/register
// @desc    Register new account with validation
// @access  Public
// ✅ Middleware: validateUniqueEmail, validateUniquePhone
router.post('/register', validateUniqueEmail, validateUniquePhone, authController.register);

// @route   POST /api/auth/login
// @desc    Login account
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset token
// @access  Public
router.post('/forgot-password', authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', authController.resetPassword);

// @route   GET /api/auth/accounts
// @desc    Get all accounts
// @access  Public (should be protected in production)
router.get('/accounts', authController.getAllAccounts);

module.exports = router;
