const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema({
  visitorId: { type: String, required: true, unique: true, index: true },
  fingerprint: { type: String }, // Anonymous browser fingerprint
  ip: { type: String }, // Hashed/Sanitized
  userAgent: { type: String },
  device: {
    type: { type: String, enum: ["mobile", "tablet", "desktop", "unknown"] },
    model: String,
    vendor: String
  },
  browser: { name: String, version: String },
  os: { name: String, version: String },
  resolution: { width: Number, height: Number },
  language: String,
  timezone: String,
  location: {
    country: String,
    city: String,
    region: String
  },
  referrer: String,
  landingPage: String,
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now },
  sessionCount: { type: Number, default: 1 }
}, { timestamps: true });

// Index for geo-analytics and device trends
visitorSchema.index({ "location.country": 1 });
visitorSchema.index({ "device.type": 1 });

module.exports = mongoose.model("Visitor", visitorSchema);
