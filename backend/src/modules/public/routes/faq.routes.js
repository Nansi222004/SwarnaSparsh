const router = require("express").Router();
const faqController = require("../controllers/faq.controller");

router.get("/", faqController.getFAQs);

module.exports = router;
