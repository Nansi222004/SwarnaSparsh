const mongoose = require("mongoose");

const sellerProductSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
  name: String,
  quantity: Number,
  availableStock: Number,
  soldItems: Number,
  barcodes: [{
    number: String,
    status: { type: String, enum: ["AVAILABLE", "SOLD ONLINE", "SOLD OFFLINE"], default: "AVAILABLE" }
  }],
}, { timestamps: true });

module.exports = mongoose.model("SellerProduct", sellerProductSchema);
