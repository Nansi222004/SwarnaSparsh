const router = require("express").Router();
const orderController = require("../controllers/order.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));

router.get("/summary", orderController.getOrderSummary);
router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderDetail);
router.patch("/:id/status", orderController.updateOrderStatus);
router.post("/:id/refund", orderController.processRefund);

module.exports = router;
