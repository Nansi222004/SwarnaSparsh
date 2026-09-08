const crypto = require("crypto");
const razorpay = require("../config/razorpay");

/**
 * Create a new Razorpay order
 * @param {Number} amount - Amount in basic unit (e.g. INR)
 * @param {String} currency - Currency code (default INR)
 * @param {String} receipt - Unique identifier for the transaction
 */
const createOrder = async (amount, currency = "INR", receipt) => {
  try {
    const options = {
      amount: Math.round(amount * 100), // convert to paisa
      currency,
      receipt,
      payment_capture: 1 // auto-capture
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (err) {
    console.error("[Razorpay] Order creation failed:", err.message);
    throw new Error("Failed to create payment order. " + err.message);
  }
};

/**
 * Verify Razorpay signature
 */
const verifySignature = (razorpayOrderId, razorpayPaymentId, signature) => {
  try {
    const body = razorpayOrderId + "|" + razorpayPaymentId;
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");
    return expected === signature;
  } catch (err) {
    return false;
  }
};

/**
 * Process a full or partial refund via Razorpay
 * @param {String} paymentId  - razorpay payment ID (pay_XXXX)
 * @param {Number} amount     - Refund amount in INR (will be converted to paisa)
 * @param {Object} notes      - Optional notes/metadata for Razorpay dashboard
 */
const processRefund = async (paymentId, amount, notes = {}) => {
  if (!razorpay) {
    throw new Error("Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // convert INR → paisa
      notes
    });
    return refund;
  } catch (err) {
    console.error("[Razorpay] Refund failed:", err.message);
    throw new Error("Razorpay refund failed: " + (err.error?.description || err.message));
  }
};

module.exports = { createOrder, verifySignature, processRefund };
