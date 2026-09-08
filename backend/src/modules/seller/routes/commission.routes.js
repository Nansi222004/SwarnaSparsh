const router = require("express").Router();
const commissionController = require("../controllers/commission.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("seller"));

router.get("/summary",     commissionController.getSummary);
router.get("/ledger",      commissionController.getLedger);
router.get("/orders/:id",  commissionController.getForOrder);

module.exports = router;
