const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // Optional: link to user if logged in
  type: { 
    type: String, 
    required: true, 
    enum: [
      "page_view", 
      "product_view", 
      "category_view", 
      "search", 
      "add_to_cart", 
      "remove_from_cart", 
      "wishlist_add", 
      "checkout_start", 
      "checkout_step",
      "lead_capture",
      "error"
    ],
    index: true 
  },
  path: { type: String },
  metadata: {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    query: String,
    variantId: String,
    quantity: Number,
    step: String,
    label: String,
    value: mongoose.Schema.Types.Mixed
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// TTL Index: Auto-delete raw events after 90 days to keep DB healthy
analyticsEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Compound indexes for common aggregation patterns
analyticsEventSchema.index({ type: 1, timestamp: 1 });
analyticsEventSchema.index({ "metadata.productId": 1, type: 1 });

module.exports = mongoose.model("AnalyticsEvent", analyticsEventSchema);
