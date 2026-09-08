const router = require("express").Router();
const productController = require("../controllers/product.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");
const validate = require("../../../middlewares/validate");
const { productMediaUpload } = require("../../../middlewares/uploadMiddleware");
const parseFormData = require("../../../middlewares/parseFormData");
const { productSchema } = require("../validators/product.validator");

const SELLER_COMPLEX_FIELDS = [
  "categories",
  "tags",
  "variants",
  "sizes",
  "faqs",
  "deletedImages",
  "audience",
  "seo",
  "logistics",
  "relatedProducts"
];

router.use(authenticate, requireRole("seller"));

router.get("/", productController.getMyProducts);
router.post("/scan", productController.scanProduct);
router.get("/:id", productController.getMyProduct);
router.post(
  "/", 
  productMediaUpload.any(), 
  parseFormData(SELLER_COMPLEX_FIELDS),
  validate(productSchema),
  productController.createProduct
);
router.put(
  "/:id", 
  productMediaUpload.any(), 
  parseFormData(SELLER_COMPLEX_FIELDS),
  validate(productSchema),
  productController.updateProduct
);
router.delete("/:id", productController.deleteProduct);

module.exports = router;
