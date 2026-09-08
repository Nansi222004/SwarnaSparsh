const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    password: { type: String, default: null }, // admin only - bcrypt hashed

    points: { type: Number, default: 0 },
    usedCoupons: [{ type: String }],
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    notificationsEnabled: { type: Boolean, default: true },
    fcmTokens: { type: [String], default: [] },
    fcmTokenMobile: { type: [String], default: [] },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cart: [{
      productId: { type: mongoose.Schema.Types.Mixed, ref: "Product" },
      variantId: { type: mongoose.Schema.Types.Mixed },
      quantity: { type: Number, default: 1 },
      isGiftCard: { type: Boolean, default: false },
      price: { type: Number, default: 0 },
      name: { type: String, default: "" },
      image: { type: String, default: "" },
      personalization: { type: mongoose.Schema.Types.Mixed, default: null }
    }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
