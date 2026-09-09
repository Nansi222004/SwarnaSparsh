const router = require("express").Router();
const orderController = require("../controllers/order.controller");
const validate = require("../../../middlewares/validate");
const { placeOrderSchema } = require("../validators/order.validator");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");
const requireActiveUser = require("../../../middlewares/requireActiveUser");

const invoiceController = require("../../admin/controllers/invoice.controller");

router.use(authenticate, requireRole("user", "admin"), requireActiveUser);

router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrderDetail);
router.get("/:id/invoice", invoiceController.getOrderInvoice);
router.post("/place", validate(placeOrderSchema), orderController.placeOrder);
router.patch("/:id/cancel", orderController.cancelOrder);

module.exports = router;
