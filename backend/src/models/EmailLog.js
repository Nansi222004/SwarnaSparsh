/**
 * 📧 Email Log Model — Sands Jewels
 *    Provides an audit trail for every email attempted by the system.
 *    Admin can query logs at /api/admin/email-logs (future route).
 */
"use strict";

const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    to: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true },
    type: {
      type: String,
      enum: [
        "order_confirmation",
        "payment_success",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "return_requested",
        "return_status_update",
        "replacement_requested",
        "replacement_status_update",
        "seller_new_order",
        "seller_payment_confirmed",
        "seller_return_requested",
        "welcome",
        "otp",
        "support_ticket",
        "general",
      ],
      default: "general",
    },
    status: {
      type: String,
      enum: ["sent", "failed", "skipped"],
      default: "sent",
    },
    messageId: { type: String, default: null }, // SMTP message ID
    errorMessage: { type: String, default: null },
  },
  { timestamps: true },
);

// TTL: auto-delete logs older than 90 days to prevent DB bloat
emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });
emailLogSchema.index({ to: 1, type: 1 });
emailLogSchema.index({ status: 1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);
