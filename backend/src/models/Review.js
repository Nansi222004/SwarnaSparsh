const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: String,
  body: { type: String, required: true },
  images: [String],
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  isApproved: { type: Boolean, default: false, index: true },
}, { timestamps: true });

reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
