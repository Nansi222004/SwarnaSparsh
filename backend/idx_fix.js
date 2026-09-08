const mongoose = require("mongoose");
const path = require("path");
const Product = require("./src/models/Product.js"); // Relative to backend/
require("dotenv").config();

async function fix() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB:", mongoUri);
    
    console.log("Dropping problematic indexes...");
    try { await Product.collection.dropIndex("productCode_1"); console.log("Dropped productCode_1"); } catch(e) { console.log("productCode_1 not found or dropped"); }
    try { await Product.collection.dropIndex("sku_1"); console.log("Dropped sku_1"); } catch(e) { console.log("sku_1 not found or dropped"); }
    try { await Product.collection.dropIndex("huid_1"); console.log("Dropped huid_1"); } catch(e) { console.log("huid_1 not found or dropped"); }
    
    console.log("Syncing indexes...");
    await Product.syncIndexes();
    console.log("Indexes synced.");
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

fix();
