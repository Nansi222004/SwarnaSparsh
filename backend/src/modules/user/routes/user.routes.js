const router = require("express").Router();
const userController = require("../controllers/user.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");
const requireActiveUser = require("../../../middlewares/requireActiveUser");

router.use(authenticate, requireRole("user", "seller", "admin"), requireActiveUser);

router.get("/me", userController.getProfile);
router.put("/me", userController.updateProfile);
router.delete("/me", userController.deleteAccount);

module.exports = router;
