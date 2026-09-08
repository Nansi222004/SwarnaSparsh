const dotenv = require("dotenv");
dotenv.config();

const { sendOtpSms } = require("../src/services/smsService");

const runTest = async () => {
  const phone = process.argv[2];
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    console.error("❌ Error: Please provide a valid 10-digit Indian mobile number as an argument.");
    console.error("Example: node scratch/test-otp.js 9876543210");
    process.exit(1);
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  console.log(`📡 Attempting to send OTP [${otp}] to phone [${phone}]...`);
  console.log(`🔑 Using APIKey: ${process.env.SMS_INDIA_API_KEY ? "CONFIGURED (Ends with: " + process.env.SMS_INDIA_API_KEY.slice(-4) + ")" : "NOT CONFIGURED"}`);
  console.log(`🏷️ Using Sender ID: ${process.env.SMS_INDIA_SENDER_ID || "NOT CONFIGURED"}`);
  console.log(`📋 Using Template ID: ${process.env.SMS_INDIA_TEMPLATE_ID || "NOT CONFIGURED"}`);
  console.log(`⚙️ USE_REAL_OTP: ${process.env.USE_REAL_OTP}`);

  try {
    const result = await sendOtpSms(phone, otp);
    console.log("✅ Success! API Response:");
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("❌ Failed to send OTP:", err.message);
  }
};

runTest();
