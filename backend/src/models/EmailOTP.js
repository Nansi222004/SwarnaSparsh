const mongoose = require("mongoose");

// Email OTPs used for flows like seller password reset.
// Short-lived via TTL index on createdAt.
const emailOtpSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true }, // stored as plain for dev; hash in prod if needed
  purpose: { type: String, default: "seller_password_reset", index: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // TTL: 10 minutes
});

module.exports = mongoose.model("EmailOTP", emailOtpSchema);

