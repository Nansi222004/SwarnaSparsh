/**
 * OTP Service
 * -------------------------------------------------------------
 * DEV  (USE_REAL_OTP=false): always returns DEFAULT_OTP (1234)
 * PROD (USE_REAL_OTP=true) : returns random 4-digit string
 * -------------------------------------------------------------
 */

/** Generate the OTP value */
const generateOtp = () => {
  if (process.env.USE_REAL_OTP !== "true") {
    return process.env.DEFAULT_OTP || "1234";
  }
  return String(Math.floor(1000 + Math.random() * 9000));
};

/** Verify OTP — plain comparison (dev mode) */
const verifyOtp = (inputOtp, storedOtp) => String(inputOtp) === String(storedOtp);

module.exports = { generateOtp, verifyOtp };
