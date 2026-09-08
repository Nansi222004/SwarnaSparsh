const router = require("express").Router();
const blogController = require("../controllers/blog.controller");

router.get("/", blogController.getBlogs);
router.get("/:slug", blogController.getBlogDetail);

module.exports = router;
