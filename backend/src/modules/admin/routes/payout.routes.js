const router     = require("express").Router();
const payoutCtrl = require("../controllers/payout.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole  = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));

// ── Admin earnings overview ───────────────────────────────────────────────
router.get("/earnings",                      payoutCtrl.getAdminEarnings);

// ── Payout request management ────────────────────────────────────────────
router.get("/requests",                      payoutCtrl.getRequests);
router.get("/requests/:id",                  payoutCtrl.getRequest);
router.patch("/requests/:id/process",        payoutCtrl.processRequest);
router.patch("/requests/:id/approve",        payoutCtrl.approveRequest);
router.patch("/requests/:id/reject",         payoutCtrl.rejectRequest);

module.exports = router;
