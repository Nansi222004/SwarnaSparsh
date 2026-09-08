/**
 * WalletTransaction — Sands Jewels Wallet Ledger
 *
 * Immutable, append-only record of every balance change on a seller wallet.
 * The wallet balance on the Seller document is the running total; this
 * collection provides the full audit trail.
 *
 * Reason values:
 *   commission_confirmed → order delivered, commission earned → CREDIT
 *   commission_reversed  → return/cancel, commission reversed → DEBIT
 *   payout_requested     → seller creates payout request → DEBIT
 *   payout_rejected      → admin rejects request → CREDIT (refund)
 *   payout_approved      → informational only; amount already debited at request time
 */
"use strict";

const mongoose = require("mongoose");
const crypto = require("crypto");

const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const genTxnId = () => {
  const seg = Array.from(crypto.randomBytes(8))
    .map((b) => SAFE_CHARS[b % SAFE_CHARS.length])
    .join("");
  return `TXN-${seg}-${Date.now()}`;
};

const walletTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: genTxnId,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    // ── Money movement ───────────────────────────────────────────────────
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    reason: {
      type: String,
      enum: [
        "commission_confirmed",
        "commission_reversed",
        "payout_requested",
        "payout_rejected",
        "payout_cancelled",
        "payout_approved",
      ],
      required: true,
    },

    amount: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },

    // ── Linked documents ──────────────────────────────────────────────────
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    commissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commission",
      default: null,
    },
    payoutRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PayoutRequest",
      default: null,
    },

    description: { type: String, default: "" },
  },
  { timestamps: true },
);

// ── Indexes ───────────────────────────────────────────────────────────────
walletTransactionSchema.index({ sellerId: 1, createdAt: -1 });
walletTransactionSchema.index({ orderId: 1 });
walletTransactionSchema.index({ payoutRequestId: 1 });

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
