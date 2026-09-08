require("dotenv").config();

const mongoose = require("mongoose");
const path = require("path");
const assert = require("assert");

const User = require("../src/models/User");
const Address = require("../src/models/Address");
const Notification = require("../src/models/Notification");
const OTP = require("../src/models/OTP");
const SupportTicket = require("../src/models/SupportTicket");
const Review = require("../src/models/Review");

const userController = require("../src/modules/user/controllers/user.controller");

async function run() {
  console.log("Connecting to MongoDB...");
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not set in environment.");
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  // 1. Create a dummy user
  const phone = "9999999999";
  console.log(`Creating dummy user with phone: ${phone}`);
  await User.deleteOne({ phone }); // clean up any old dummy
  
  const dummyUser = await User.create({
    name: "Temporary Test User",
    phone,
    email: "temp.user@example.com",
    role: "user"
  });
  const userId = dummyUser._id;
  console.log(`User created with ID: ${userId}`);

  // 2. Create associated data
  console.log("Creating associated records...");
  const dummyAddress = await Address.create({
    userId,
    name: "Temporary Address",
    phone,
    flatNo: "123",
    area: "Test Area",
    city: "Test City",
    district: "Test District",
    state: "Test State",
    pincode: "111111",
    isDefault: true
  });

  const dummyNotification = await Notification.create({
    userId,
    title: "Test Notification",
    message: "This is a test notification",
    type: "GENERAL"
  });

  const dummyOTP = await OTP.create({
    phone,
    otp: "9999",
    attempts: 0
  });

  const dummyTicket = await SupportTicket.create({
    userId,
    subject: "Test Subject",
    message: "Test message",
    category: "Other",
    status: "Open"
  });

  const dummyReview = await Review.create({
    userId,
    productId: new mongoose.Types.ObjectId(),
    rating: 5,
    body: "Excellent product!"
  });

  // Verify records exist
  assert(await User.findById(userId), "User should exist before deletion");
  assert(await Address.findOne({ userId }), "Address should exist before deletion");
  assert(await Notification.findOne({ userId }), "Notification should exist before deletion");
  assert(await OTP.findOne({ phone }), "OTP should exist before deletion");
  assert(await SupportTicket.findOne({ userId }), "SupportTicket should exist before deletion");
  assert(await Review.findOne({ userId }), "Review should exist before deletion");
  console.log("All dummy records successfully verified in database.");

  // 3. Mock request/response objects to run deleteAccount
  const req = {
    user: {
      userId: userId.toString(),
      role: "user"
    }
  };

  let responseStatus = null;
  let responseData = null;

  const res = {
    status: function(code) {
      responseStatus = code;
      return this;
    },
    json: function(data) {
      responseData = data;
      return this;
    }
  };

  console.log("Calling deleteAccount controller method...");
  await userController.deleteAccount(req, res);

  console.log("Controller call complete. Status:", responseStatus, "Data:", JSON.stringify(responseData));

  // 4. Assert response is successful
  assert.strictEqual(responseData?.success, true, "Controller should return success: true");
  
  // 5. Verify hard deletion - records should no longer exist
  console.log("Verifying hard delete in database...");
  const userAfter = await User.findById(userId);
  const addressAfter = await Address.findOne({ userId });
  const notificationAfter = await Notification.findOne({ userId });
  const otpAfter = await OTP.findOne({ phone });
  const ticketAfter = await SupportTicket.findOne({ userId });
  const reviewAfter = await Review.findOne({ userId });

  assert.strictEqual(userAfter, null, "User document must be completely deleted");
  assert.strictEqual(addressAfter, null, "Address document must be completely deleted");
  assert.strictEqual(notificationAfter, null, "Notification document must be completely deleted");
  assert.strictEqual(otpAfter, null, "OTP document must be completely deleted");
  assert.strictEqual(ticketAfter, null, "SupportTicket document must be completely deleted");
  assert.strictEqual(reviewAfter, null, "Review document must be completely deleted");

  console.log("🎉 SUCCESS: Hard delete is fully functional and cascades cleanly across all collections!");
}

run()
  .then(() => {
    console.log("Verification script finished successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  });
