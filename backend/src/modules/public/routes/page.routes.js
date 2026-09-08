const router = require("express").Router();
const pageController = require("../controllers/page.controller");

router.get("/:slug", pageController.getPageBySlug);

module.exports = router;
