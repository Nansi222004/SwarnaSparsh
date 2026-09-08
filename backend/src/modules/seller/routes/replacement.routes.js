const router = require("express").Router();
const replacementController = require("../controllers/replacement.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("seller"));

router.get("/", replacementController.getReplacements);
router.get("/:id", replacementController.getReplacementDetail);
router.patch("/:id/process", replacementController.processReplacement);

module.exports = router;
