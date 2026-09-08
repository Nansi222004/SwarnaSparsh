const router = require("express").Router();

router.use("/profile",       require("./user.routes"));
router.use("/addresses",     require("./address.routes"));
router.use("/wishlist",      require("./wishlist.routes"));
router.use("/cart",          require("./cart.routes"));
router.use("/orders",        require("./order.routes"));
router.use("/payments",      require("./payment.routes"));
router.use("/coupons",       require("./coupon.routes"));
router.use("/returns",       require("./return.routes"));
router.use("/replacements",  require("./replacement.routes"));
router.use("/support",       require("./support.routes"));
router.use("/notifications", require("./notification.routes"));
router.use("/gift-cards",    require("./giftCard.routes"));

module.exports = router;

