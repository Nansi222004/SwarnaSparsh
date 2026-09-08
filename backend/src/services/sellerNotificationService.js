const Notification = require("../models/Notification");
const { sendNotificationToRecipient } = require("../utils/pushNotificationHelper");

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

const safeString = (value) => String(value || "").trim();

const createSellerNotification = async ({
  sellerId,
  title,
  message,
  type = "GENERAL",
  priority = "Medium",
  link = ""
}) => {
  try {
    const sid = safeString(sellerId);
    if (!sid) return null;

    const safeTitle = safeString(title);
    const safeMessage = safeString(message);
    if (!safeTitle || !safeMessage) return null;

    const notification = await Notification.create({
      sellerId: sid,
      title: safeTitle,
      message: safeMessage,
      type,
      priority,
      link: safeString(link),
      isBroadcast: false,
      isRead: false
    });

    // Send push notification to seller
    await sendNotificationToRecipient(sid, "seller", {
      title: safeTitle,
      body: safeMessage,
      data: { type, link }
    });

    return notification;
  } catch (_err) {
    // Best-effort: notification failures must not break core flows.
    return null;
  }
};

const notifySellerLowStock = async ({
  sellerId,
  productId,
  variantId,
  productName,
  variantName,
  currentStock,
  threshold = DEFAULT_LOW_STOCK_THRESHOLD
}) => {
  try {
    const sid = safeString(sellerId);
    const pid = safeString(productId);
    const vid = safeString(variantId);
    const stock = Number(currentStock);
    const th = Number(threshold) || DEFAULT_LOW_STOCK_THRESHOLD;

    if (!sid || !pid || !vid) return null;
    if (!Number.isFinite(stock)) return null;
    if (stock > th) return null;

    const link = `/seller/inventory/alerts?productId=${encodeURIComponent(pid)}&variantId=${encodeURIComponent(vid)}`;
    const since = new Date(Date.now() - ONE_DAY_MS);

    // Dedupe: don't spam the same low-stock alert more than once per day.
    const existing = await Notification.findOne({
      sellerId: sid,
      type: "STOCK",
      link,
      createdAt: { $gte: since }
    }).select("_id");
    if (existing) return existing;

    const safeProductName = safeString(productName) || "Product";
    const safeVariantName = safeString(variantName) || "Variant";

    return await createSellerNotification({
      sellerId: sid,
      title: "Low stock alert",
      message: `${safeProductName} (${safeVariantName}) is low on stock: ${stock} left (threshold ${th}).`,
      type: "STOCK",
      priority: "High",
      link
    });
  } catch (_err) {
    return null;
  }
};

module.exports = {
  createSellerNotification,
  notifySellerLowStock,
  DEFAULT_LOW_STOCK_THRESHOLD
};

