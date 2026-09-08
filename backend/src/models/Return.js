const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
  returnId: { type: String, unique: true },
  returnNumber: { type: Number, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    productId: mongoose.Schema.Types.ObjectId,
    variantId: mongoose.Schema.Types.ObjectId,
    name: String,
    sku: String,
    voidTagId: String,
    qty: Number,
    price: Number,
    reason: String
  }],
  evidence: { reason: String, comment: String, images: [String], video: String, voidTagImages: [String] },
  pickupAddress: { line1: String, city: String, state: String, pincode: String },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Pickup Scheduled", "Pickup Completed", "Refund Initiated", "Refunded", "Closed"],
    default: "Pending"
  },
  pickup: { partner: String, awb: String, scheduledDate: Date, status: String },
  refund: { amount: Number, method: String, transactionId: String, initiatedAt: Date },
  inventory: {
    restockedAt: Date,
    restockedByStatus: String
  },
  adminComment: String,
  timeline: [{ status: String, date: { type: Date, default: Date.now }, note: String }],
  logs: [{ action: String, comment: String, by: String, date: { type: Date, default: Date.now } }],
  voidTagVerification: {
    status: { type: String, enum: ["Pending", "Intact", "Tampered", "Missing"], default: "Pending" },
    notes: String
  },
  requestDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Return", returnSchema);
