const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, index: true },
  type: { type: String, enum: ["flat", "percentage", "free_shipping"], required: true },
  value: { type: Number, required: true },
  minOrderValue: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  usageLimit: { type: Number, default: null },
  usageCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  applicabilityType: { type: String, enum: ["all", "category", "product", "new_user"], default: "all" },
  applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  userEligibility: { type: String, enum: ["all", "new"], default: "all" },
  active: { type: Boolean, default: true },
  description: String,
  usedBy: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, 
    usedAt: { type: Date, default: Date.now } 
  }],
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);
