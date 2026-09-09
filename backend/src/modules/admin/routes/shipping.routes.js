const router = require("express").Router();
const shippingController = require("../controllers/shipping.controller");

// All routes are already behind authenticate + requireRole("admin") from the parent router.

// Reports must be before /:shipmentId to avoid route conflict
router.get("/reports", shippingController.getReports);

// Check route serviceability
router.post("/serviceability", shippingController.checkServiceability);

// Get shipments for a specific order
router.get("/orders/:orderId", shippingController.getOrderShipments);

// Create shipment for an order
router.post("/orders/:orderId/create", shippingController.createShipment);

// List all shipments
router.get("/", shippingController.getAllShipments);

// Get single shipment
router.get("/:shipmentId", shippingController.getShipmentDetail);

// Track shipment
router.post("/:shipmentId/track", shippingController.trackShipment);

// Request courier pickup
router.post("/:shipmentId/pickup", shippingController.requestPickup);

// Cancel shipment
router.post("/:shipmentId/cancel", shippingController.cancelShipment);

// Override status
router.patch("/:shipmentId/override-status", shippingController.overrideStatus);

// Generate Shiprocket manifest
router.post("/:shipmentId/manifest", shippingController.generateManifest);

// Re-generate shipping label
router.post("/:shipmentId/generate-label", shippingController.regenerateLabel);

module.exports = router;
