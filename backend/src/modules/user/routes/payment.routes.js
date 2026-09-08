const router = require("express").Router();
const paymentController = require("../controllers/payment.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");
const requireActiveUser = require("../../../middlewares/requireActiveUser");

router.use(authenticate, requireRole("user", "seller", "admin"), requireActiveUser);

router.post("/initiate",   paymentController.initiatePayment);
router.post("/verify",     paymentController.verifyPayment);

module.exports = router;
