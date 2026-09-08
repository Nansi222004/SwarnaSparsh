const Notification = require("../../../models/Notification");
const mongoose = require("mongoose");
const { success, error } = require("../../../utils/apiResponse");
const socketEmitter = require("../../../services/socketEmitter");

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 100, search, type, isRead } = req.query;
    const query = { isBroadcast: true };

    if (type && typeof type === "string") {
      query.type = String(type).trim().toUpperCase();
    }

    if (typeof isRead !== "undefined") {
      if (String(isRead) === "true") query.isRead = true;
      if (String(isRead) === "false") query.isRead = false;
    }

    if (search && String(search).trim()) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { message: { $regex: escaped, $options: "i" } }
      ];
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit),
      Notification.countDocuments(query)
    ]);

    return success(res, {
      notifications,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        pages: Math.ceil(total / safeLimit)
      }
    });
  } catch (err) { return error(res, err.message); }
};

exports.markNotificationRead = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return error(res, "Invalid notification id", 400);
    }
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return error(res, "Notification not found", 404);
    return success(res, { notification }, "Notification marked as read");
  } catch (err) { return error(res, err.message); }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ isBroadcast: true, isRead: false }, { isRead: true });
    return success(res, {}, "All notifications marked as read");
  } catch (err) { return error(res, err.message); }
};

exports.deleteNotification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return error(res, "Invalid notification id", 400);
    }
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return error(res, "Notification not found", 404);
    return success(res, {}, "Notification deleted");
  } catch (err) { return error(res, err.message); }
};

exports.broadcastNotification = async (req, res) => {
  try {
    const { title, message, type, link, priority } = req.body;
    const safeTitle = String(title || "").trim();
    const safeMessage = String(message || "").trim();
    const safeType = String(type || "GENERAL").trim().toUpperCase();
    const safePriority = String(priority || "Medium").trim();
    const safeLink = String(link || "").trim();

    if (!safeTitle) return error(res, "Notification title is required", 400);
    if (!safeMessage) return error(res, "Notification message is required", 400);

    const allowedTypes = ["ORDER", "RETURN", "REPLACEMENT", "COUPON", "GENERAL", "SELLER_REQUEST"];
    if (!allowedTypes.includes(safeType)) {
      return error(res, "Invalid notification type", 400);
    }

    const allowedPriorities = ["Low", "Medium", "High", "Urgent"];
    if (!allowedPriorities.includes(safePriority)) {
      return error(res, "Invalid notification priority", 400);
    }

    const notification = await Notification.create({
      title: safeTitle,
      message: safeMessage,
      type: safeType,
      priority: safePriority,
      link: safeLink,
      isBroadcast: true
    });

    socketEmitter.emitBroadcastNotification(notification);

    return success(res, { notification }, "Notification broadcasted successfully", 201);
  } catch (err) { return error(res, err.message); }
};
