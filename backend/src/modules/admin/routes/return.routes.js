const router = require("express").Router();
const returnController = require("../controllers/return.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));
router.get("/", returnController.getAllReturns);
router.get("/:id", returnController.getReturnDetail);
router.patch("/:id/status", returnController.updateReturnStatus);

module.exports = router;
