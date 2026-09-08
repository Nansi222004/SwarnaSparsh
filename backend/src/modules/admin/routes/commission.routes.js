const router = require("express").Router();
const commissionController = require("../controllers/commission.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));

// ── Tier configuration ─────────────────────────────────────────────────
router.get   ("/tiers",                   commissionController.getTiers);
router.put   ("/tiers",                   commissionController.updateTiers);
router.post  ("/tiers/restore-defaults",  commissionController.restoreDefaults);
router.patch ("/toggle",                  commissionController.toggleEnabled);

// ── Reports ────────────────────────────────────────────────────────────
router.get   ("/summary",                 commissionController.getSummary);
router.get   ("/ledger",                  commissionController.getLedger);

// ── Per-entity detail ──────────────────────────────────────────────────
router.get   ("/orders/:id",              commissionController.getForOrder);
router.get   ("/sellers/:id",             commissionController.getForSeller);

module.exports = router;
