const router = require("express").Router();
const settingsController = require("../controllers/settings.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));

router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);
router.get("/metal-pricing", settingsController.getMetalPricing);
router.patch("/metal-pricing", settingsController.updateMetalPricing);
router.get("/tax", settingsController.getTaxSettings);
router.patch("/tax", settingsController.updateTaxSettings);

module.exports = router;
