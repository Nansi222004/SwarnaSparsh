require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

const seed = async () => {
  await connectDB();
  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (existing) {
    console.log("Admin already exists. Skipping.");
    process.exit(0);
  }
  const hashed = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  await User.create({
    name:     process.env.ADMIN_NAME || "Super Admin",
    phone:    "0000000000",
    email:    process.env.ADMIN_EMAIL,
    password: hashed,
    role:     "admin",
  });
  console.log("\u2705  Admin seeded:", process.env.ADMIN_EMAIL);
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
