const router = require("express").Router();
const couponController = require("../controllers/coupon.controller");
const validate = require("../../../middlewares/validate");
const { couponSchema } = require("../validators/coupon.validator");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));

router.get("/", couponController.getCoupons);
router.get("/:id", couponController.getCouponById);
router.post("/", validate(couponSchema), couponController.createCoupon);
router.put("/:id", validate(couponSchema), couponController.updateCoupon);
router.patch("/:id/toggle", couponController.toggleCoupon);
router.delete("/:id", couponController.deleteCoupon);

module.exports = router;
