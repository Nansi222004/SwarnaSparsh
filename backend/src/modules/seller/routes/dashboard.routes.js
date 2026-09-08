const router = require("express").Router();
const dashboardController = require("../controllers/dashboard.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.get("/stats", authenticate, requireRole("seller"), dashboardController.getSellerStats);
router.get("/recent-orders", authenticate, requireRole("seller"), dashboardController.getRecentOrders);

module.exports = router;
