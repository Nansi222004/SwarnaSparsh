"use strict";

const router    = require("express").Router();
const ctrl      = require("../controllers/giftCard.controller");
const authenticate = require("../../../middlewares/authenticate");

router.get("/validate/:code",    ctrl.validateCode);

router.use(authenticate);

router.get("/my-cards",          ctrl.getMyGiftCards);
router.post("/purchase",         ctrl.fulfillGiftCardOrder);

module.exports = router;
