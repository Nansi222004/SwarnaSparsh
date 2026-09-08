const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Seller = require("./src/models/Seller");

const checkSellers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const sellers = await Seller.find({}, "email mobileNumber status fullName");
    console.log("--- SELLERS LIST ---");
    if (sellers.length === 0) {
      console.log("No sellers found in the database.");
    } else {
      sellers.forEach(s => {
        console.log(`- ${s.fullName} (${s.email}) | Mobile: ${s.mobileNumber} | Status: ${s.status}`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

checkSellers();
