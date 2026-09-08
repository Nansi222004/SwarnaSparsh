const router = require("express").Router();
const returnController = require("../controllers/return.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("seller"));

router.get("/", returnController.getReturns);
router.get("/:id", returnController.getReturnDetail);
router.patch("/:id/process", returnController.processReturn);

module.exports = router;
