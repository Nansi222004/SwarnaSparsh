require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const Seller = require("../models/Seller");

const SEED_MOBILE = "9111966732";
const SEED_PASSWORD = "1234";
const SEED_EMAIL = "seller9111966732@example.com";

const seedSeller = async () => {
  await connectDB();

  const existing = await Seller.findOne({
    $or: [{ mobileNumber: SEED_MOBILE }, { email: SEED_EMAIL }],
  });

  if (existing) {
    // Ensure the account is approved and password matches seed if already present.
    const hashed = await bcrypt.hash(SEED_PASSWORD, 12);
    existing.password = hashed;
    existing.status = "APPROVED";
    await existing.save();
    console.log("Seller already exists. Updated password/status for:", existing.mobileNumber);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(SEED_PASSWORD, 12);
  await Seller.create({
    fullName: "Seed Seller",
    shopName: "Seed Seller Shop",
    email: SEED_EMAIL,
    mobileNumber: SEED_MOBILE,
    password: hashed,
    status: "APPROVED",
    city: "Indore",
    state: "MP",
  });

  console.log("✅  Seller seeded:", SEED_MOBILE);
  process.exit(0);
};

seedSeller().catch((err) => {
  console.error(err);
  process.exit(1);
});
