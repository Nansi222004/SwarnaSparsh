const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // Disabled OTP limit as requested
  message: { success: false, message: "Too many OTP requests. Please try again after 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// BUG-11 FIX: Separate tighter limiter on the verify-otp endpoint
// Provides transport-layer brute force protection (defense-in-depth with in-controller lockout)
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many OTP verification attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: "Too many requests. Please slow down." },
});

module.exports = {
  otpLimiter,
  apiLimiter,
  verifyOtpLimiter,
};
