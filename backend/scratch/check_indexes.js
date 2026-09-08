const mongoose = require("mongoose");
require("dotenv").config();

async function check() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/test";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB:", mongoUri);
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log("Collections:");
    for (const coll of collections) {
      if (coll.name === "users") {
        const indexes = await db.collection(coll.name).indexes();
        console.log(`Indexes for ${coll.name}:`, JSON.stringify(indexes, null, 2));
      }
    }
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

check();
