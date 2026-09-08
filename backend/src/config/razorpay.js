const Razorpay = require("razorpay");

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpay = null;

if (keyId && keySecret) {
  razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
} else {
  console.warn("[Razorpay] Credentials missing. Payment endpoints will be unavailable until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.");
}

module.exports = razorpay;
