const router = require("express").Router();
const couponController = require("../controllers/coupon.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");
const requireActiveUser = require("../../../middlewares/requireActiveUser");

router.get("/", couponController.getPublicCoupons);
router.post("/validate", authenticate, requireRole("user", "seller", "admin"), requireActiveUser, couponController.validateCoupon);

module.exports = router;
