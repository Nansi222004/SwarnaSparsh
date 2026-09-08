const Notification = require("../../../models/Notification");
const User = require("../../../models/User");
const Seller = require("../../../models/Seller");
const mongoose = require("mongoose");
const { success, error } = require("../../../utils/apiResponse");

// ── User: My Notifications ───────────────────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Fetch user-specific + global broadcasts, excluding those hidden by this user or admin-only requests
    const notifications = await Notification.find({
      $or: [
        { userId },
        { isBroadcast: true }
      ],
      type: { $ne: "SELLER_REQUEST" },
      hiddenBy: { $ne: userId }
    }).sort({ createdAt: -1 }).limit(50).lean();

    // Map notification to include isReadByMe computed field
    const mappedNotifications = notifications.map(n => ({
      ...n,
      isReadByMe: n.readBy?.some(id => String(id) === String(userId)) ?? n.isRead
    }));

    return success(res, { notifications: mappedNotifications });
  } catch (err) { return error(res, err.message); }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, "Invalid notification id", 400);
    }
    const notification = await Notification.findById(id);
    if (!notification) return error(res, "Notification not found", 404);

    const canAccess =
      notification.isBroadcast ||
      String(notification.userId || "") === String(userId);

    if (!canAccess) return error(res, "Notification not found", 404);

    await Notification.findByIdAndUpdate(id, { $addToSet: { readBy: userId } });

    return success(res, {}, "Marked as read");
  } catch (err) { return error(res, err.message); }
};

exports.hideNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, "Invalid notification id", 400);
    }
    const notification = await Notification.findById(id);
    if (!notification) return error(res, "Notification not found", 404);

    const canAccess =
      notification.isBroadcast ||
      String(notification.userId || "") === String(userId);

    if (!canAccess) return error(res, "Notification not found", 404);

    await Notification.findByIdAndUpdate(id, { $addToSet: { hiddenBy: userId } });

    return success(res, {}, "Notification hidden/deleted successfully");
  } catch (err) { return error(res, err.message); }
};

// ── FCM Token Management ─────────────────────────────────────────────────────

exports.saveFCMToken = async (req, res) => {
  try {
    const { token, platform = "web" } = req.body;
    if (!token) return error(res, "Token is required", 400);

    const { userId, role } = req.user;
    let user;

    if (role === "seller") {
      user = await Seller.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user) return error(res, "User not found", 404);

    const tokenField = platform === "mobile" ? "fcmTokenMobile" : "fcmTokens";
    
    if (!user[tokenField]) user[tokenField] = [];
    if (!user[tokenField].includes(token)) {
      user[tokenField].push(token);
      // Keep only last 5 tokens
      if (user[tokenField].length > 5) {
        user[tokenField] = user[tokenField].slice(-5);
      }
      await user.save();
    }

    return success(res, {}, "FCM token saved successfully");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.removeFCMToken = async (req, res) => {
  try {
    const { token, platform = "web" } = req.body;
    if (!token) return error(res, "Token is required", 400);

    const { userId, role } = req.user;
    let user;

    if (role === "seller") {
      user = await Seller.findById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user) return error(res, "User not found", 404);

    const tokenField = platform === "mobile" ? "fcmTokenMobile" : "fcmTokens";

    if (user[tokenField]) {
      user[tokenField] = user[tokenField].filter((t) => t !== token);
      await user.save();
    }

    return success(res, {}, "FCM token removed successfully");
  } catch (err) {
    return error(res, err.message);
  }
};
