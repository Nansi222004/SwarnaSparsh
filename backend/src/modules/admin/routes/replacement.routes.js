const router = require("express").Router();
const replacementController = require("../controllers/replacement.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));
router.get("/", replacementController.getAllReplacements);
router.get("/:id", replacementController.getReplacementDetail);
router.patch("/:id/status", replacementController.updateReplacementStatus);

module.exports = router;
