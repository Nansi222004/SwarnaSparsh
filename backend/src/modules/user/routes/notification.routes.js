const router = require("express").Router();
const notificationController = require("../controllers/notification.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");
const requireActiveUser = require("../../../middlewares/requireActiveUser");

router.use(authenticate, requireRole("user", "seller", "admin"), requireActiveUser);
router.get("/", notificationController.getMyNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.hideNotification);
router.post("/fcm-token", notificationController.saveFCMToken);
router.delete("/fcm-token", notificationController.removeFCMToken);

module.exports = router;
