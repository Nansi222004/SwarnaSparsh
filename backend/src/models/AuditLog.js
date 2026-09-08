const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    adminEmail: { type: String, default: "" },

    action: {
      type: String,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "APPROVE",
        "REJECT",
        "STATUS_CHANGE",
        "REFUND",
        "BLOCK",
        "UNBLOCK",
        "SETTINGS_UPDATE"
      ],
      required: true,
      index: true
    },

    entity: {
      type: String,
      enum: ["Product", "Seller", "Order", "Settings", "User"],
      required: true,
      index: true
    },

    entityId:    { type: String, default: null },
    entityLabel: { type: String, default: "" },   // e.g. product name, orderId, seller shopName

    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after:  { type: mongoose.Schema.Types.Mixed, default: null },

    ip:        { type: String, default: "" },
    userAgent: { type: String, default: "" },

    // Auto-expire after 365 days
    timestamp: { type: Date, default: Date.now, index: { expireAfterSeconds: 365 * 24 * 60 * 60 } }
  },
  { versionKey: false }
);

// Compound indexes for common query patterns
auditLogSchema.index({ entity: 1, timestamp: -1 });
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
