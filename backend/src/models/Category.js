const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, index: true },
  description: { type: String },
  image: { type: String },
  // Optional hero/banner fields used on user Shop category view.
  bannerTitle: { type: String, default: "" },
  bannerSubtitle: { type: String, default: "" },
  bannerImage: { type: String, default: "" },
  showInNavbar: { type: Boolean, default: true },
  showInCollection: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
