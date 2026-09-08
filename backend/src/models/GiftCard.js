/**
 * 🎁 GiftCard Model — Sands Jewels
 *
 * Design decisions:
 *  - code is cryptographically unique (SANDS-XXXX-XXXX-XXXX)
 *  - balance supports partial use (multiple redemptions possible)
 *  - expiresAt defaults to null (lifetime validity — matches UI copy)
 *  - redemptions[] is an append-only audit log
 *  - status machine: pending → active → partially_used → used
 */
"use strict";

const mongoose = require("mongoose");

const redemptionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    amountUsed: { type: Number, required: true, min: 0 },
    redeemedAt: { type: Date, default: Date.now },
    redeemedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { _id: false },
);

const giftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // Face value and remaining balance
    value: { type: Number, required: true, min: 1 },
    balance: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "partially_used",
        "used",
        "expired",
        "disabled",
      ],
      default: "active",
      index: true,
    },

    // Who bought this card
    purchasedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    purchasedByName: { type: String, default: "" },
    purchasedOrderId: { type: String, default: null }, // order that funded this card

    // Recipient personalization
    recipientName: { type: String, required: true, trim: true },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    senderName: { type: String, required: true, trim: true },
    personalMessage: { type: String, default: "" },

    // Email delivery
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date, default: null },

    // Expiry — null means lifetime validity (no expiry)
    expiresAt: { type: Date, default: null },

    // Full redemption audit trail
    redemptions: [redemptionSchema],
  },
  { timestamps: true },
);

// Indexes for common query patterns
giftCardSchema.index({ purchasedByUserId: 1, createdAt: -1 });
giftCardSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("GiftCard", giftCardSchema);
