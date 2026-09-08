const router = require("express").Router();
const cmsController = require("../controllers/cms.controller");

router.get("/homepage", cmsController.getHomepageData);
router.get("/pages/:pageKey", cmsController.getPageData);
router.get("/banners",  cmsController.getBanners);
router.get("/blogs",    cmsController.getBlogs);
router.get("/blogs/:slug", cmsController.getBlogDetail);
router.get("/faqs",     cmsController.getFAQs);

module.exports = router;
