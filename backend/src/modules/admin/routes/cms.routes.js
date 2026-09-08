const router = require("express").Router();
const cmsController = require("../controllers/cms.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");
const { bannerUpload, blogUpload } = require("../../../middlewares/uploadMiddleware");

router.use(authenticate, requireRole("admin"));

// Banners
router.get("/banners", cmsController.getBanners);
router.get("/banners/:id", cmsController.getBannerDetail);
router.post("/banners", bannerUpload.single("image"), cmsController.createBanner);
router.put("/banners/:id", bannerUpload.single("image"), cmsController.updateBanner);
router.delete("/banners/:id", cmsController.deleteBanner);

// Blogs
router.get("/blogs", cmsController.getBlogs);
router.get("/blogs/:id", cmsController.getBlogDetail);
router.post("/blogs", blogUpload.single("image"), cmsController.createBlog);
router.put("/blogs/:id", blogUpload.single("image"), cmsController.updateBlog);
router.delete("/blogs/:id", cmsController.deleteBlog);

// FAQs
router.get("/faqs", cmsController.getFAQs);
router.post("/faqs", cmsController.createFAQ);
router.put("/faqs/:id", cmsController.updateFAQ);
router.delete("/faqs/:id", cmsController.deleteFAQ);

module.exports = router;
