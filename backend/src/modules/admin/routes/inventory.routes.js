const router = require("express").Router();
const inventoryController = require("../controllers/inventory.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));

router.get("/", inventoryController.getInventory);
router.post("/adjust", inventoryController.adjustStock);
router.get("/history", inventoryController.getStockHistory);
router.get("/alerts", inventoryController.getLowStockAlerts);

module.exports = router;
