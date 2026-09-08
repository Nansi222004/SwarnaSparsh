const router = require("express").Router();
const couponController = require("../controllers/coupon.controller");

router.get("/", couponController.getPublicCoupons);

module.exports = router;
