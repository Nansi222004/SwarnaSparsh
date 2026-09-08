const router = require("express").Router();
const categoryController = require("../controllers/category.controller");

router.get("/",           categoryController.getCategories);
router.get("/:slug",      categoryController.getCategoryDetail);

module.exports = router;
