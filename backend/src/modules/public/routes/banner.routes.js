const router = require("express").Router();
const bannerController = require("../controllers/banner.controller");

router.get("/", bannerController.getActiveBanners);

module.exports = router;
