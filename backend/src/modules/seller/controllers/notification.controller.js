const Notification = require("../../../models/Notification");
const mongoose = require("mongoose");
const { success, error } = require("../../../utils/apiResponse");

const safeInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Seller: My Notifications (seller-specific + global broadcasts)
exports.getMyNotifications = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    const page = Math.max(1, safeInt(req.query.page, 1));
    const limit = Math.min(Math.max(1, safeInt(req.query.limit, 20)), 100);
    const { type, isRead, search } = req.query;

    const query = {
      $or: [{ sellerId }, { isBroadcast: true }],
      type: { $ne: "SELLER_REQUEST" },
      hiddenBy: { $ne: sellerId }
    };

    if (type && typeof type === "string" && String(type).trim()) {
      query.type = String(type).trim().toUpperCase();
    }

    if (typeof isRead !== "undefined") {
      if (String(isRead) === "true") query.isRead = true;
      if (String(isRead) === "false") query.isRead = false;
    }

    if (search && String(search).trim()) {
      const escaped = escapeRegex(String(search));
      query.$or = [
        ...query.$or,
        { title: { $regex: escaped, $options: "i" } },
        { message: { $regex: escaped, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
    ]);

    return success(res, {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, "Invalid notification id", 400);
    }

    const notification = await Notification.findById(id);
    if (!notification) return error(res, "Notification not found", 404);

    const canAccess =
      notification.isBroadcast ||
      String(notification.sellerId || "") === String(sellerId);

    if (!canAccess) return error(res, "Notification not found", 404);

    notification.isRead = true;
    await notification.save();

    return success(res, {}, "Marked as read");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const sellerId = req.user.userId;

    await Notification.updateMany(
      {
        $or: [{ sellerId }, { isBroadcast: true }],
        type: { $ne: "SELLER_REQUEST" },
        hiddenBy: { $ne: sellerId },
        isRead: false,
      },
      { isRead: true }
    );

    return success(res, {}, "All notifications marked as read");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.hideNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.userId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, "Invalid notification id", 400);
    }
    const notification = await Notification.findById(id);
    if (!notification) return error(res, "Notification not found", 404);

    const canAccess =
      notification.isBroadcast ||
      String(notification.sellerId || "") === String(sellerId);

    if (!canAccess) return error(res, "Notification not found", 404);

    await Notification.findByIdAndUpdate(id, { $addToSet: { hiddenBy: sellerId } });

    return success(res, {}, "Notification hidden/deleted successfully");
  } catch (err) {
    return error(res, err.message);
  }
};
