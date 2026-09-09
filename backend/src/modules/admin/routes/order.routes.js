const router = require("express").Router();
const orderController = require("../controllers/order.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

const invoiceController = require("../controllers/invoice.controller");

router.use(authenticate, requireRole("admin"));

router.get("/summary", orderController.getOrderSummary);
router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderDetail);
router.get("/:id/invoice", invoiceController.getOrderInvoice);
router.patch("/:id/status", orderController.updateOrderStatus);
router.post("/:id/refund", orderController.processRefund);

module.exports = router;
