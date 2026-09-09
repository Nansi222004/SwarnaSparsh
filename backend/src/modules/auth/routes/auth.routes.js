const router = require("express").Router();
const {
  otpLimiter,
  verifyOtpLimiter,
} = require("../../../middlewares/rateLimiter");
const userAuth   = require("../controllers/userAuth.controller");
const adminAuth  = require("../controllers/adminAuth.controller");
const validate = require("../../../middlewares/validate");
const {
  sendOtpSchema,
  verifyOtpSchema,
  adminLoginSchema,
  adminSendResetOtpSchema,
  adminResetPasswordSchema,
  adminSendResetMobileOtpSchema,
  adminResetPasswordMobileSchema,
} = require("../validators/auth.validator");

// User auth
router.post("/send-otp",    otpLimiter, validate(sendOtpSchema), userAuth.sendOtp);
router.post("/verify-otp",  verifyOtpLimiter, validate(verifyOtpSchema), userAuth.verifyOtp);
router.get("/me",           require("../../../middlewares/authenticate"), userAuth.getMe);
router.post("/logout",      userAuth.logout);

// Admin auth
router.post("/admin/login",  validate(adminLoginSchema), adminAuth.login);
router.post("/admin/logout", adminAuth.logout);
router.post("/admin/send-reset-otp", validate(adminSendResetOtpSchema), adminAuth.sendResetOtp);
router.post("/admin/reset-password", validate(adminResetPasswordSchema), adminAuth.resetPassword);
router.post("/admin/send-reset-mobile-otp", validate(adminSendResetMobileOtpSchema), adminAuth.sendResetMobileOtp);
router.post("/admin/reset-password-mobile", validate(adminResetPasswordMobileSchema), adminAuth.resetPasswordViaMobile);

module.exports = router;

