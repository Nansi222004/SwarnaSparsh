const mongoose = require("mongoose");

const sellerMetalRateLogSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    previousRates: { type: Object, default: {} },
    newRates: { type: Object, default: {} },
    gstRate: { type: Number, default: 0 },
    summary: {
      updatedProducts: { type: Number, default: 0 },
      updatedVariants: { type: Number, default: 0 },
      failedProducts: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellerMetalRateLog", sellerMetalRateLogSchema);

