const router = require("express").Router();
const productController = require("../controllers/product.controller");

router.get("/",           productController.getProducts);
router.get("/by-ids",     productController.getProductsByIds);
router.get("/search",     productController.searchProducts);
router.get("/:slug",      productController.getProductDetail);

module.exports = router;
