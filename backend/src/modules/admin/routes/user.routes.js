const router = require("express").Router();
const userController = require("../controllers/user.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));

router.get("/", userController.getUsers);
router.get("/:id", userController.getUserDetail);
router.patch("/:id/block", userController.blockUser);

module.exports = router;
