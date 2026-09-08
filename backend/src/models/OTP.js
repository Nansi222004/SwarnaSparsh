const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  phone:     { type: String, required: true, index: true },
  otp:       { type: String, required: true },  // stored as plain for dev; hash in prod
  attempts:  { type: Number, default: 0 },
  purpose:   { type: String, default: "user_login", index: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },  // TTL: 5 minutes
});

module.exports = mongoose.model("OTP", otpSchema);
