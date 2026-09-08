/**
 * 💰 Commission Model — Sands Jewels
 *
 * Immutable ledger of platform commission charged to sellers.
 *
 * Design decisions:
 *  - Append-only: every change inserts a new row (accrual → reversal),
 *    historical rows are never mutated except for the `status` flip
 *    (pending → confirmed | reversed).
 *  - One accrual per (orderId, sellerId) — enforced by a partial unique index.
 *  - `tierSnapshot` freezes the rate table at the moment of write so future
 *    rate changes never alter historical entries.
 *  - `commissionAmount` is always stored as a positive number; the `type`
 *    field tells you whether it adds to or subtracts from platform revenue.
 */
"use strict";

const mongoose = require("mongoose");

const tierSnapshotSchema = new mongoose.Schema(
  {
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, default: null }, // null = open-ended
    commission: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const commissionSchema = new mongoose.Schema(
  {
    // ── References ───────────────────────────────────────────────────────
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true, index: true },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    // ── Amounts (₹, all rounded to nearest rupee) ────────────────────────
    sellerSubtotal: { type: Number, required: true, min: 0 },
    sellerDiscountShare: { type: Number, default: 0, min: 0 },
    sellerGiftCardShare: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, required: true, min: 0 },

    // ── Tier metadata ────────────────────────────────────────────────────
    tierLabel: { type: String, default: "" }, // e.g. "1001-5000"
    tierSnapshot: { type: [tierSnapshotSchema], default: [] },

    // ── Lifecycle ────────────────────────────────────────────────────────
    type: {
      type: String,
      enum: ["accrual", "reversal", "backfill"],
      default: "accrual",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "reversed"],
      default: "pending",
      index: true,
    },
    triggeredBy: {
      type: String,
      enum: [
        "place_order",
        "payment_verified",
        "order_delivered",
        "order_cancelled",
        "return_refunded",
        "replacement",
        "backfill",
      ],
      required: true,
    },

    // ── Audit linkage ────────────────────────────────────────────────────
    reversesEntryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission",
      default: null,
    },
    reasonNote: { type: String, default: "" },
  },
  { timestamps: true },
);

// ── Indexes ────────────────────────────────────────────────────────────────
// Workhorse index for per-order lookups & per-seller reports.
commissionSchema.index({ orderId: 1, sellerId: 1, type: 1 });
commissionSchema.index({ sellerId: 1, createdAt: -1 });
commissionSchema.index({ status: 1, createdAt: -1 });
commissionSchema.index({ orderId: 1, type: 1 });

// Idempotency: only one OPEN accrual per (order, seller) can exist.
// Once it is reversed/confirmed it leaves the partial index, so a new
// row can be written if business logic ever calls for it.
commissionSchema.index(
  { orderId: 1, sellerId: 1 },
  {
    name: "unique_open_accrual_per_order_seller",
    unique: true,
    partialFilterExpression: {
      type: { $in: ["accrual", "backfill"] },
      status: { $in: ["pending", "confirmed"] },
    },
  },
);

module.exports = mongoose.model("Commission", commissionSchema);
