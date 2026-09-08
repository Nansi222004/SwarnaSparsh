const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const Seller = require("./src/models/Seller");

const resetPassword = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error("MONGO_URI is not defined in environment variables");
      process.exit(1);
    }
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const email = "mohammedfurqan2108@gmail.com";
    const seller = await Seller.findOne({ email });

    if (!seller) {
      console.log(`Seller with email ${email} not found.`);
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    seller.password = await bcrypt.hash("seller123", salt);
    await seller.save();

    console.log(`Password reset successful for ${email} to 'seller123'`);
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

resetPassword();
