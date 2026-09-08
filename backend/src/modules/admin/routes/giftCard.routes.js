"use strict";

const router     = require("express").Router();
const ctrl       = require("../controllers/giftCard.controller");
const authenticate  = require("../../../middlewares/authenticate");
const requireRole   = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));

router.get("/",                       ctrl.getAllGiftCards);
router.get("/:id",                    ctrl.getGiftCardById);
router.post("/issue",                 ctrl.issueGiftCard);
router.patch("/:id/disable",          ctrl.toggleDisable);
router.patch("/:id/adjust-balance",   ctrl.adjustBalance);
router.post("/:id/resend-email",      ctrl.resendEmail);
router.delete("/:id",                 ctrl.deleteGiftCard);

module.exports = router;
