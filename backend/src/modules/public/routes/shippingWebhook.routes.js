const router = require("express").Router();
const webhookController = require("../controllers/shippingWebhook.controller");

// Public webhook endpoints – no auth middleware (couriers call these)
router.post("/webhook/delhivery", webhookController.delhiveryWebhook);
router.post("/webhook/bluedart", webhookController.bluedartWebhook);

module.exports = router;
