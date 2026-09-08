const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

const optimizeDb = async () => {
  console.log("Starting database optimization...");
  await connectDB();

  try {
    // 1. Product Indexes
    const Product = require("../src/models/Product");
    console.log("Creating Product indexes...");
    await Product.collection.createIndex({ status: 1, active: 1, categories: 1 }, { background: true });
    await Product.collection.createIndex({ sellerId: 1, status: 1 }, { background: true });
    await Product.collection.createIndex({ "variants.stock": 1 }, { background: true });
    
    // 2. Order Indexes
    const Order = require("../src/models/Order");
    console.log("Creating Order indexes...");
    await Order.collection.createIndex({ userId: 1, createdAt: -1 }, { background: true });
    await Order.collection.createIndex({ status: 1, createdAt: -1 }, { background: true });
    await Order.collection.createIndex({ "items.sellerId": 1 }, { background: true });
    
    // 3. Notification Indexes
    const Notification = require("../src/models/Notification");
    console.log("Creating Notification indexes...");
    await Notification.collection.createIndex({ userId: 1, isRead: 1, createdAt: -1 }, { background: true });
    await Notification.collection.createIndex({ createdAt: -1 }, { background: true });
    
    // 4. GiftCard Indexes
    const GiftCard = require("../src/models/GiftCard");
    console.log("Creating GiftCard indexes...");
    await GiftCard.collection.createIndex({ recipientEmail: 1 }, { background: true });
    
    // 5. Review Indexes
    const Review = require("../src/models/Review");
    console.log("Creating Review indexes...");
    await Review.collection.createIndex({ status: 1, createdAt: -1 }, { background: true });
    
    // 6. AnalyticsSession TTL Index
    const AnalyticsSession = require("../src/models/AnalyticsSession");
    console.log("Creating AnalyticsSession TTL index...");
    // Drop existing index if it exists and has different options, then recreate
    try {
        await AnalyticsSession.collection.dropIndex("createdAt_1");
    } catch (e) {
        // Ignore if index does not exist
    }
    // Delete documents older than 30 days (2592000 seconds)
    await AnalyticsSession.collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000, background: true });

    console.log("Database optimization complete! All indexes requested successfully (building in background).");
  } catch (error) {
    console.error(`Error during optimization: ${error.message}`);
  } finally {
    process.exit(0);
  }
};

optimizeDb();
