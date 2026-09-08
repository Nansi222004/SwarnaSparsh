const router = require("express").Router();
const cartController = require("../controllers/cart.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");
const requireActiveUser = require("../../../middlewares/requireActiveUser");

router.use(authenticate, requireRole("user", "seller", "admin"), requireActiveUser);

router.get("/", cartController.getCart);
router.post("/", cartController.addToCart);
router.put("/", cartController.updateCart);
router.post("/sync", cartController.syncCart);

module.exports = router;
