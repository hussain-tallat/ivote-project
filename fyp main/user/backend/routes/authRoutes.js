const express = require('express');
const {
  register,
  verifyOTP,
  resendOTP,
  login,
  getAdminRegistrationStatus,
  registerSingleAdmin,
  loginAdmin,
  verifyAdminOtp,
  verifyAdminRegistrationOtp,
  resendAdminRegistrationOtp,
  setSecurityQuestions,
  getSecurityQuestions,
  generateBiometricRegistration,
  verifyBiometricRegistration,
  generateBiometricAuthentication,
  verifyBiometricAuthentication,
  generateReregisterOptions,
  updateBiometrics,
  captureFaceData,
  verifyFaceData,
  captureFingerprintData,
  verifyFingerprintData,
  sendRecoveryOtp,
  verifyRecoveryLogin,
  forgotPassword,
  resetPassword,
  forgotPasswordAdmin,
  resetPasswordAdmin,
  verifyBiometricLogin,
  getRegistrationStatus,
  getMe,
  requestHalqaAssignment,
  deleteAccount,
  getUserActivity
} = require('../controllers/authController');
const { protect, requireMfa } = require('../middleware/auth');
const { otpLimiter, authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/resend-otp', otpLimiter, resendOTP);
router.post('/login', authLimiter, login);
router.post('/login/verify', authLimiter, verifyBiometricLogin);
router.get('/admin/status', getAdminRegistrationStatus);
router.post('/admin/register', authLimiter, registerSingleAdmin);
router.post('/admin/login', authLimiter, loginAdmin);
router.post('/admin/verify-otp', authLimiter, verifyAdminRegistrationOtp);
router.post('/admin/verify-login-otp', authLimiter, verifyAdminOtp);
router.post('/admin/resend-otp', authLimiter, resendAdminRegistrationOtp);

router.get('/security-questions/list', getSecurityQuestions);
router.post('/security-questions', protect, setSecurityQuestions);

router.post('/biometric/register-options', protect, generateBiometricRegistration);
router.post('/biometric/register-verify', protect, verifyBiometricRegistration);
router.post('/biometric/auth-options', protect, generateBiometricAuthentication);
router.post('/biometric/auth-verify', protect, verifyBiometricAuthentication);
router.get('/re-register-options', protect, generateReregisterOptions);
router.post('/update-biometrics', protect, updateBiometrics);

router.post('/face/capture', protect, captureFaceData);
router.post('/face/verify', protect, verifyFaceData);
router.post('/fingerprint/capture', protect, captureFingerprintData);
router.post('/fingerprint/verify', protect, verifyFingerprintData);

router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/admin/forgot-password', authLimiter, forgotPasswordAdmin);
router.post('/admin/reset-password', authLimiter, resetPasswordAdmin);
router.post('/recovery/send-otp', authLimiter, sendRecoveryOtp);
router.post('/recovery/verify', authLimiter, verifyRecoveryLogin);

router.get('/registration-status', protect, getRegistrationStatus);
router.get('/me', protect, requireMfa, getMe);
router.post('/halqa-request', protect, requireMfa, requestHalqaAssignment);
router.delete('/delete-account', protect, requireMfa, deleteAccount);
router.get('/activity', protect, requireMfa, getUserActivity);

module.exports = router;
