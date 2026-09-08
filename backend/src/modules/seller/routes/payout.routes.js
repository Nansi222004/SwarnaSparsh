const router     = require("express").Router();
const payoutCtrl = require("../controllers/payout.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole  = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("seller"));

// ── Wallet overview ──────────────────────────────────────────────────────
router.get("/wallet",       payoutCtrl.getWallet);
router.get("/transactions", payoutCtrl.getTransactions);

// ── Payout requests ──────────────────────────────────────────────────────
router.get("/requests",         payoutCtrl.getMyRequests);
router.post("/request",         payoutCtrl.createRequest);
router.delete("/request/:id",   payoutCtrl.cancelRequest);

module.exports = router;
