const mongoose = require("mongoose");

const guestLeadSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, unique: true, index: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  name: { type: String, trim: true },
  capturedAt: { type: Date, default: Date.now },
  source: { type: String, enum: ["abandoned_cart", "newsletter", "save_cart", "exit_intent", "manual"], default: "manual" },
  converted: { type: Boolean, default: false },
  lastCart: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      variantId: String,
      quantity: Number,
      addedAt: Date
    }
  ],
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model("GuestLead", guestLeadSchema);
