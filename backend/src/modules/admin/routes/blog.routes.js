const router = require("express").Router();
const blogController = require("../controllers/blog.controller");
const { blogUpload } = require("../../../middlewares/uploadMiddleware");

router.get("/", blogController.getBlogs);
router.get("/:id", blogController.getBlogById);

router.post(
  "/",
  blogUpload.single("image"),
  blogController.createBlog
);

router.put(
  "/:id",
  blogUpload.single("image"),
  blogController.updateBlog
);

router.delete("/:id", blogController.deleteBlog);

module.exports = router;
