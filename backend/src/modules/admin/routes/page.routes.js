const router = require("express").Router();
const pageController = require("../controllers/page.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.get("/", authenticate, requireRole("admin"), pageController.getAllPages);
router.get("/:slug", authenticate, requireRole("admin"), pageController.getPageBySlug);
router.post("/", authenticate, requireRole("admin"), pageController.upsertPage);
router.delete("/:slug", authenticate, requireRole("admin"), pageController.deletePage);

module.exports = router;
