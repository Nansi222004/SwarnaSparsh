const router = require("express").Router();
const analyticsController = require("../controllers/analytics.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

// Public tracking route (called by visitors)
router.post("/track", analyticsController.trackEvent);
router.post("/leads/capture", analyticsController.captureLead);

// Protected Admin Analytics Routes
router.get("/dashboard", authenticate, requireRole("admin"), analyticsController.getDashboardStats);

module.exports = router;
