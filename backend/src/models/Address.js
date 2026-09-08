const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  type: { type: String, enum: ["Home", "Work", "Other"], default: "Home" },
  flatNo: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);
