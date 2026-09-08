const router = require("express").Router();
const notificationController = require("../controllers/notification.controller");
const authenticate = require("../../../middlewares/authenticate");
const requireRole = require("../../../middlewares/requireRole");

router.use(authenticate, requireRole("admin"));
router.get("/", notificationController.getNotifications);
router.post("/broadcast", notificationController.broadcastNotification);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markNotificationRead);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;
