const mongoose = require("mongoose");

const stockLogSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  changeType: { type: String, enum: ["adjustment", "sale", "return", "purchase"], required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  change: { type: Number, required: true },
  reason: String,
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }
}, { timestamps: true });

module.exports = mongoose.model("StockLog", stockLogSchema);
