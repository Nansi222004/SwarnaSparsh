const mongoose = require("mongoose");

const analyticsSessionSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in seconds
  isActive: { type: Boolean, default: true, index: true },
  entryPage: String,
  exitPage: String,
  pageViews: { type: Number, default: 0 },
  metadata: {
    browser: String,
    os: String,
    device: String
  }
}, { timestamps: true });

// TTL Index: Auto-delete session data after 1 year (sessions are useful for cohorts)
analyticsSessionSchema.index({ startTime: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model("AnalyticsSession", analyticsSessionSchema);
