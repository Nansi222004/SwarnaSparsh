const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const contactController = require("../controllers/contact.controller");

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many contact requests. Please try again after some time.",
    error: "RATE_LIMIT_EXCEEDED",
  },
});

router.post("/", contactLimiter, contactController.submitContactForm);

module.exports = router;
