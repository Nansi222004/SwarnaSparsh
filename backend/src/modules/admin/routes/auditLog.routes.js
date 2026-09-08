const router = require("express").Router();
const ctrl   = require("../controllers/auditLog.controller");

router.get("/",       ctrl.getAuditLogs);
router.get("/stats",  ctrl.getAuditStats);
router.get("/export", ctrl.exportAuditLogs);

module.exports = router;
