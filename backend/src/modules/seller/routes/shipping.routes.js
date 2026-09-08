const router = require("express").Router();
const shippingController = require("../controllers/shipping.controller");

// All routes are already behind authenticate + requireRole("seller") from the parent router.

// Check serviceability
router.post("/serviceability", shippingController.checkServiceability);

// Create shipment for an order
router.post("/orders/:orderId/create", shippingController.createShipment);

// Get shipment(s) for an order
router.get("/orders/:orderId", shippingController.getOrderShipment);

// Track shipment for an order
router.post("/orders/:orderId/track", shippingController.trackOrderShipment);

// Cancel shipment for an order
router.post("/orders/:orderId/cancel", shippingController.cancelOrderShipment);

// List all seller's shipments
router.get("/", shippingController.getMyShipments);

module.exports = router;
