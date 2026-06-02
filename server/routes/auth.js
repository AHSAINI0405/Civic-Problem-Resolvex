const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/resend-verification', ctrl.resendVerification);
router.get('/verify-email/:token', ctrl.verifyEmail);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password/:token', ctrl.resetPassword);
router.get('/me', protect, ctrl.getMe);
router.put('/profile', protect, ctrl.updateProfile);
router.put('/change-password', protect, ctrl.changePassword);

module.exports = router;
