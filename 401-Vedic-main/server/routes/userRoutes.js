const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/signup', userController.signup);
router.post('/verify-email-otp', userController.verifyEmailOtp);
router.post('/resend-email-otp', userController.resendEmailOtp);
router.post('/login', userController.login);

module.exports = router;
