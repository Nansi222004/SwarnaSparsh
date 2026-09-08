const mongoose = require("mongoose");
const dns = require("node:dns");

// Set custom DNS resolvers to Google's public DNS to bypass local SRV/DNS issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async (retryCount = 5) => {
  const options = {
    serverSelectionTimeoutMS: 30000, // Increased to 30s
    socketTimeoutMS: 45000,
    family: 4, // Force IPv4
  };

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, options);
    console.log(`\u2705  MongoDB Connected: ${conn.connection.host}`);
    
    // Drop unique email index if it exists, to support silent guest checkout registration
    try {
      await conn.connection.db.collection("users").dropIndex("email_1");
      console.log("✅ Dropped unique email_1 index from users collection");
    } catch (indexError) {
      // Ignore if index doesn't exist
    }
  } catch (error) {
    console.error(`\u274c  MongoDB Connection Error: ${error.message}`);
    
    if (retryCount > 0) {
      console.log(`\ud83d\udd04  Retrying connection in 5 seconds... (${retryCount} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount - 1);
    } else {
      console.error("\ud83d\udea8  Maximum retry attempts reached. Please check your network or MongoDB Atlas IP Whitelist.");
      process.exit(1);
    }
  }
};

module.exports = connectDB;
