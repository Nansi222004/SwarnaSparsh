const router = require("express").Router();
const notificationController = require("../controllers/notification.controller");

router.get("/", notificationController.getMyNotifications);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.hideNotification);

module.exports = router;

