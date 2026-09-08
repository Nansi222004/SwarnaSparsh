/**
 * 📦 PickupLocation Model
 *    Stores seller warehouse/pickup addresses.
 *    Supports multi-courier sync (Shiprocket, future providers).
 *    Each seller can have multiple pickup locations; one is default.
 */

const mongoose = require("mongoose");

const pickupLocationSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
    index: true,
  },

  // ── Address Details ───────────────────────────────────────────────────────
  warehouseName: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, default: "", trim: true },
  addressLine1: { type: String, required: true, trim: true },
  addressLine2: { type: String, default: "", trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  country: { type: String, default: "India" },

  // ── Default flag ─────────────────────────────────────────────────────────
  isDefault: { type: Boolean, default: false, index: true },

  // ── Shiprocket Sync ───────────────────────────────────────────────────────
  shiprocket: {
    pickupName: { type: String, default: null },   // The "pickup_location" name sent to SR
    pickupId: { type: Number, default: null },      // Shiprocket pickup location ID
    synced: { type: Boolean, default: false },
    syncedAt: { type: Date, default: null },
    syncError: { type: String, default: null },
  },

  // ── Future courier sync slots ──────────────────────────────────────────────
  // delhivery: { pickupName: String, synced: Boolean },
  // bluedart:  { pickupCode: String, synced: Boolean },

  isActive: { type: Boolean, default: true },

}, { timestamps: true });

// Compound: each seller's warehouse name must be unique
pickupLocationSchema.index({ sellerId: 1, warehouseName: 1 }, { unique: true });
pickupLocationSchema.index({ sellerId: 1, isDefault: 1 });

module.exports = mongoose.model("PickupLocation", pickupLocationSchema);
