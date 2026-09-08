const router = require("express").Router();
const dashboardController = require("../controllers/dashboard.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.get("/stats", authenticate, requireRole("admin"), dashboardController.getStats);

module.exports = router;
