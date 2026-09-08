const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  excerpt: { type: String },
  coverImage: { type: String },
  author: { type: String, default: "Swarna Sparsh Editorial" },
  tags: [String],
  isPublished: { type: Boolean, default: true, index: true },
  publishedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Blog", blogSchema);
