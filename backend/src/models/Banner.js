const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema({
  title: String,
  subtitle: String,
  image: { type: String, required: true },
  mobileImage: String,
  link: String,
  placement: { type: String, enum: ["hero", "promo"], default: "hero", index: true },
  isActive: { type: Boolean, default: true, index: true },
  sortOrder: { type: Number, default: 0 },
  validFrom: Date,
  validUntil: Date,
}, { timestamps: true });

module.exports = mongoose.model("Banner", bannerSchema);
