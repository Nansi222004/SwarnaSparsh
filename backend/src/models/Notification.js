const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  // Optional seller recipient support (seller panel notifications)
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  // NOTE: keep this list broad enough for both user + seller panels.
  type: { type: String, enum: ["ORDER", "CANCEL", "RETURN", "REPLACEMENT", "STOCK", "COUPON", "GENERAL", "SELLER_REQUEST"], default: "GENERAL" },
  priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
  link: String,
  isBroadcast: { type: Boolean, default: false, index: true },
  isRead: { type: Boolean, default: false, index: true },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
  hiddenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }],
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);
