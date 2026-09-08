const router = require("express").Router();
const controller = require("../controllers/directSale.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("seller"));

router.post("/preview", controller.preview);
router.post("/confirm", controller.confirm);
router.get("/", controller.list);
router.get("/:id", controller.detail);
router.patch("/:id/void", controller.void);

module.exports = router;
